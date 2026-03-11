const { GoogleGenerativeAI } = require('@google/generative-ai');
const Sleep   = require('../models/Sleep');
const MoodLog = require('../models/MoodLog');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: calculate hours between bedtime and wake time ─────────────────────
const calcDuration = (bedtime, wakeTime) => {
    if (!bedtime || !wakeTime) return null;
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let minutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (minutes < 0) minutes += 24 * 60; // crossed midnight
    return parseFloat((minutes / 60).toFixed(1));
};

// ── POST /api/sleep ───────────────────────────────────────────────────────────
exports.logSleep = async (req, res) => {
    try {
        const { date, bedtime, wakeTime, quality, factors, notes, durationHours } = req.body;
        const userId = req.user.id;

        // Calculate duration if bedtime/wakeTime provided
        const duration = durationHours || calcDuration(bedtime, wakeTime);

        // Find correlated mood log for this date
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const moodLog = await MoodLog.findOne({
            user: userId,
            createdAt: { $gte: dayStart, $lte: dayEnd }
        }).sort({ createdAt: -1 });

        const correlatedMoodScore = moodLog?.moodScore || null;

        // Generate AI insight
        let aiInsight = null;
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `You are a sleep health coach. A user logged their sleep:
- Date: ${date}
- Duration: ${duration ? `${duration} hours` : 'not specified'}
- Quality: ${quality}/5 stars
- Factors affecting sleep: ${factors?.join(', ') || 'none specified'}
- Notes: "${notes || 'none'}"
${correlatedMoodScore ? `- Their mood score today: ${correlatedMoodScore}/10` : ''}

Write ONE warm, specific insight (2 sentences max) about their sleep. 
If quality is low, offer one practical tip. If good, validate it.
Be conversational, not clinical.`;

            const result = await model.generateContent(prompt);
            aiInsight = result.response.text().trim();
        } catch (err) {
            console.error('Sleep AI insight error:', err.message);
        }

        // Upsert — one log per date
        const sleepLog = await Sleep.findOneAndUpdate(
            { user: userId, date },
            { user: userId, date, bedtime, wakeTime, durationHours: duration, quality, factors, notes, aiInsight, correlatedMoodScore },
            { upsert: true, new: true }
        );

        res.status(201).json({ status: 'success', data: sleepLog });

    } catch (error) {
        console.error('Error logging sleep:', error);
        res.status(500).json({ status: 'error', message: 'Failed to log sleep.' });
    }
};

// ── GET /api/sleep ────────────────────────────────────────────────────────────
exports.getSleepLogs = async (req, res) => {
    try {
        const logs = await Sleep.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(30);
        res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch sleep logs.' });
    }
};

// ── GET /api/sleep/stats ──────────────────────────────────────────────────────
exports.getSleepStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const logs = await Sleep.find({ user: userId }).sort({ date: -1 }).limit(30);

        if (logs.length === 0) {
            return res.status(200).json({ status: 'success', data: { hasData: false } });
        }

        const withDuration = logs.filter(l => l.durationHours);
        const avgDuration  = withDuration.length
            ? parseFloat((withDuration.reduce((s, l) => s + l.durationHours, 0) / withDuration.length).toFixed(1))
            : null;

        const avgQuality = parseFloat((logs.reduce((s, l) => s + l.quality, 0) / logs.length).toFixed(1));

        // Correlation: sleep quality vs mood score
        const correlated = logs.filter(l => l.correlatedMoodScore !== null);
        let correlation = null;
        if (correlated.length >= 3) {
            // Simple Pearson correlation
            const n   = correlated.length;
            const xs  = correlated.map(l => l.quality);
            const ys  = correlated.map(l => l.correlatedMoodScore);
            const xm  = xs.reduce((a, b) => a + b, 0) / n;
            const ym  = ys.reduce((a, b) => a + b, 0) / n;
            const num = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0);
            const den = Math.sqrt(
                xs.reduce((s, x) => s + (x - xm) ** 2, 0) *
                ys.reduce((s, y) => s + (y - ym) ** 2, 0)
            );
            correlation = den === 0 ? 0 : parseFloat((num / den).toFixed(2));
        }

        // Most common factors
        const factorCounts = {};
        logs.forEach(l => l.factors?.forEach(f => {
            factorCounts[f] = (factorCounts[f] || 0) + 1;
        }));
        const topFactors = Object.entries(factorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([factor, count]) => ({ factor, count }));

        // Best and worst sleep
        const best  = [...logs].sort((a, b) => b.quality - a.quality)[0];
        const worst = [...logs].sort((a, b) => a.quality - b.quality)[0];

        // Sleep debt: how many nights < 7hrs
        const shortNights = withDuration.filter(l => l.durationHours < 7).length;

        res.status(200).json({
            status: 'success',
            data: {
                hasData: true,
                totalLogs: logs.length,
                avgDuration,
                avgQuality,
                correlation,
                topFactors,
                shortNights,
                bestDate: best?.date,
                worstDate: worst?.date,
                recentLogs: logs.slice(0, 14),
            }
        });

    } catch (error) {
        console.error('Sleep stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch sleep stats.' });
    }
};

// ── DELETE /api/sleep/:id ─────────────────────────────────────────────────────
exports.deleteSleep = async (req, res) => {
    try {
        const log = await Sleep.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!log) return res.status(404).json({ status: 'error', message: 'Log not found.' });
        res.status(200).json({ status: 'success', message: 'Deleted.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete log.' });
    }
};