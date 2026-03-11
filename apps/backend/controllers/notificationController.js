const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const MoodLog = require('../models/MoodLog');

// Configure VAPID keys (set these in your .env)
webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@mentalhealth.app'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ── POST /api/notifications/subscribe ────────────────────────────────────────
exports.subscribe = async (req, res) => {
    try {
        const { subscription, reminderTime, timezone } = req.body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription object.' });
        }

        const doc = await PushSubscription.findOneAndUpdate(
            { user: req.user.id },
            {
                user: req.user.id,
                subscription,
                reminderTime: reminderTime || '09:00',
                reminderEnabled: true,
                timezone: timezone || 'UTC',
            },
            { upsert: true, new: true }
        );

        // Send a welcome notification immediately
        const welcomePayload = JSON.stringify({
            title: '🧠 Reminders Enabled!',
            body: `You'll receive a daily check-in reminder at ${reminderTime || '09:00'}. We're rooting for you!`,
            icon: '/icon-192.png',
            badge: '/badge.png',
            url: '/dashboard',
        });

        try {
            await webpush.sendNotification(subscription, welcomePayload);
        } catch {
            // Welcome notification failure is non-critical
        }

        res.status(200).json({ status: 'success', data: { reminderTime: doc.reminderTime, enabled: doc.reminderEnabled } });

    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save subscription.' });
    }
};

// ── DELETE /api/notifications/unsubscribe ─────────────────────────────────────
exports.unsubscribe = async (req, res) => {
    try {
        await PushSubscription.findOneAndDelete({ user: req.user.id });
        res.status(200).json({ status: 'success', message: 'Unsubscribed successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to unsubscribe.' });
    }
};

// ── PATCH /api/notifications/settings ────────────────────────────────────────
exports.updateSettings = async (req, res) => {
    try {
        const { reminderTime, reminderEnabled, timezone } = req.body;
        const doc = await PushSubscription.findOneAndUpdate(
            { user: req.user.id },
            { reminderTime, reminderEnabled, timezone },
            { new: true }
        );
        if (!doc) return res.status(404).json({ status: 'fail', message: 'No subscription found.' });
        res.status(200).json({ status: 'success', data: doc });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update settings.' });
    }
};

// ── GET /api/notifications/settings ──────────────────────────────────────────
exports.getSettings = async (req, res) => {
    try {
        const doc = await PushSubscription.findOne({ user: req.user.id }).select('-subscription');
        res.status(200).json({ status: 'success', data: doc || null });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings.' });
    }
};

// ── GET /api/notifications/vapid-public-key ───────────────────────────────────
exports.getVapidKey = (req, res) => {
    res.status(200).json({ status: 'success', data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
};

// ── POST /api/notifications/send-test ────────────────────────────────────────
exports.sendTest = async (req, res) => {
    try {
        const doc = await PushSubscription.findOne({ user: req.user.id });
        if (!doc) return res.status(404).json({ status: 'fail', message: 'No subscription found. Enable notifications first.' });

        const payload = JSON.stringify({
            title: '🧠 Test Reminder',
            body: 'This is a test notification from your Mental Health Platform!',
            icon: '/icon-192.png',
            url: '/dashboard',
        });

        await webpush.sendNotification(doc.subscription, payload);
        res.status(200).json({ status: 'success', message: 'Test notification sent!' });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send test notification.' });
    }
};

// ── CRON JOB FUNCTION: Send daily reminders ───────────────────────────────────
// Call this every minute from a cron job in index.js
exports.sendDailyReminders = async () => {
    try {
        const now = new Date();
        const currentHour   = now.getUTCHours().toString().padStart(2, '0');
        const currentMinute = now.getUTCMinutes().toString().padStart(2, '0');
        const currentTime   = `${currentHour}:${currentMinute}`;

        // Find all subscriptions where reminder time matches now and is enabled
        const subscriptions = await PushSubscription.find({
            reminderEnabled: true,
            reminderTime: currentTime,
        }).populate('user', 'name');

        if (subscriptions.length === 0) return;

        console.log(`[Reminders] Sending to ${subscriptions.length} users at ${currentTime}`);

        for (const doc of subscriptions) {
            try {
                // Check if user already logged mood today
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                const alreadyLogged = await MoodLog.findOne({
                    user: doc.user._id,
                    createdAt: { $gte: today }
                });

                const payload = JSON.stringify({
                    title: alreadyLogged
                        ? `✅ Great job, ${doc.user.name?.split(' ')[0] || 'there'}!`
                        : `🧠 Daily Check-in, ${doc.user.name?.split(' ')[0] || 'there'}!`,
                    body: alreadyLogged
                        ? "You've already logged your mood today. Keep up the great work! 🌟"
                        : "How are you feeling today? Take 30 seconds to log your mood.",
                    icon: '/icon-192.png',
                    badge: '/badge.png',
                    url: alreadyLogged ? '/dashboard' : '/dashboard',
                    tag: 'daily-checkin', // replaces previous notification of same tag
                });

                await webpush.sendNotification(doc.subscription, payload);

                // Update lastSentAt
                await PushSubscription.findByIdAndUpdate(doc._id, { lastSentAt: new Date() });

            } catch (err) {
                // If subscription is expired/invalid, remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.findByIdAndDelete(doc._id);
                    console.log(`[Reminders] Removed expired subscription for user ${doc.user._id}`);
                } else {
                    console.error(`[Reminders] Failed for user ${doc.user._id}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('[Reminders] Cron job error:', err.message);
    }
};