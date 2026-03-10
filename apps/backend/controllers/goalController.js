const { GoogleGenerativeAI } = require('@google/generative-ai');
const Goal = require('../models/Goal');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: recalculate streak from checkIns ─────────────────────────────────
const recalculateStreak = (checkIns) => {
    if (!checkIns || checkIns.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort dates ascending
    const dates = checkIns
        .map(c => c.date)
        .sort((a, b) => new Date(a) - new Date(b));

    // Remove duplicates
    const unique = [...new Set(dates)];

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < unique.length; i++) {
        const prev = new Date(unique[i - 1]);
        const curr = new Date(unique[i]);
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
            tempStreak = 1;
        }
    }

    // Check if the streak is still active (last check-in was today or yesterday)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastDate = unique[unique.length - 1];

    if (lastDate === today || lastDate === yesterday) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0; // streak broken
    }

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};

// ── POST /api/goals ──────────────────────────────────────────────────────────
exports.createGoal = async (req, res) => {
    try {
        const { title, description, category, frequency, targetDays } = req.body;

        // Generate an AI motivational tip for this specific goal
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const tipPrompt = `You are a warm mental wellness coach. A user just set this wellness goal: "${title}" (category: ${category}, frequency: ${frequency}).
Write ONE short, specific, encouraging tip to help them succeed (max 2 sentences). Be practical, not generic.`;

        const result = await model.generateContent(tipPrompt);
        const aiTip = result.response.text().trim();

        const newGoal = await Goal.create({
            user: req.user.id,
            title,
            description,
            category,
            frequency,
            targetDays: targetDays || 30,
            aiTip,
        });

        res.status(201).json({ status: 'success', data: newGoal });

    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create goal.' });
    }
};

// ── GET /api/goals ───────────────────────────────────────────────────────────
exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id, isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: goals });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch goals.' });
    }
};

// ── POST /api/goals/:id/checkin ──────────────────────────────────────────────
exports.checkIn = async (req, res) => {
    try {
        const { note } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
        if (!goal) return res.status(404).json({ status: 'error', message: 'Goal not found.' });

        // Prevent duplicate check-in on same day
        const alreadyCheckedIn = goal.checkIns.some(c => c.date === today);
        if (alreadyCheckedIn) {
            return res.status(400).json({ status: 'fail', message: 'Already checked in today!' });
        }

        goal.checkIns.push({ date: today, note: note || '' });

        // Recalculate streaks
        const { currentStreak, longestStreak } = recalculateStreak(goal.checkIns);
        goal.currentStreak = currentStreak;
        goal.longestStreak = longestStreak;

        await goal.save();

        res.status(200).json({
            status: 'success',
            data: goal,
            message: currentStreak > 1 ? `🔥 ${currentStreak} day streak!` : '✅ Checked in!'
        });

    } catch (error) {
        console.error('Error checking in:', error);
        res.status(500).json({ status: 'error', message: 'Failed to check in.' });
    }
};

// ── DELETE /api/goals/:id ────────────────────────────────────────────────────
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isActive: false },
            { new: true }
        );
        if (!goal) return res.status(404).json({ status: 'error', message: 'Goal not found.' });
        res.status(200).json({ status: 'success', message: 'Goal removed.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete goal.' });
    }
};