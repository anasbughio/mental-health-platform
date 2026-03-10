const { GoogleGenerativeAI } = require('@google/generative-ai');
const Journal = require('../models/Journal');
const MoodLog = require('../models/MoodLog');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── GET /api/journal/prompt ──────────────────────────────────────────────────
// Generates a fresh AI journal prompt based on the user's recent mood data
exports.getPrompt = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch last 5 mood logs to personalize the prompt
        const recentMoods = await MoodLog.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        let contextInfo = 'No mood data available yet.';
        if (recentMoods.length > 0) {
            const avgScore = (
                recentMoods.reduce((sum, m) => sum + m.moodScore, 0) / recentMoods.length
            ).toFixed(1);
            const recentEmotions = [...new Set(recentMoods.flatMap(m => m.emotions || []))];
            contextInfo = `Recent average mood score: ${avgScore}/10. Emotions felt recently: ${recentEmotions.join(', ') || 'none logged'}.`;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const promptRequest = `You are a compassionate mental health journaling coach.
Based on this user's recent mental health data: "${contextInfo}"

Generate ONE thoughtful, open-ended journaling prompt that:
- Is personalized to their recent emotional state
- Encourages self-reflection and growth
- Is warm, non-judgmental, and inviting
- Is 1-2 sentences maximum
- Does NOT start with "I" or "You"
- Feels fresh and specific, not generic

Return ONLY the prompt text, nothing else.`;

        const result = await model.generateContent(promptRequest);
        const prompt = result.response.text().trim();

        res.status(200).json({ status: 'success', data: { prompt } });

    } catch (error) {
        console.error('Error generating journal prompt:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate prompt.' });
    }
};

// ── POST /api/journal ────────────────────────────────────────────────────────
// Save a journal entry and generate an AI reflection
exports.createEntry = async (req, res) => {
    try {
        const { prompt, entry, moodAtTime, tags } = req.body;
        const userId = req.user.id;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const reflectionRequest = `You are an empathetic mental health journaling companion.
A user responded to this journal prompt: "${prompt}"
Their entry: "${entry}"
${moodAtTime ? `Their current mood score: ${moodAtTime}/10` : ''}

Write a warm, insightful reflection (2-3 sentences) that:
1. Validates what they shared
2. Highlights a pattern or strength you notice
3. Ends with one gentle question to deepen their self-awareness

Be human, not clinical.`;

        const result = await model.generateContent(reflectionRequest);
        const aiReflection = result.response.text().trim();

        const newEntry = await Journal.create({
            user: userId,
            prompt,
            entry,
            aiReflection,
            moodAtTime: moodAtTime || null,
            tags: tags || [],
        });

        res.status(201).json({ status: 'success', data: newEntry });

    } catch (error) {
        console.error('Error saving journal entry:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save journal entry.' });
    }
};

// ── GET /api/journal ─────────────────────────────────────────────────────────
// Get all journal entries for the logged-in user
exports.getEntries = async (req, res) => {
    try {
        const entries = await Journal.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: entries });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch entries.' });
    }
};

// ── DELETE /api/journal/:id ──────────────────────────────────────────────────
exports.deleteEntry = async (req, res) => {
    try {
        const entry = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!entry) return res.status(404).json({ status: 'error', message: 'Entry not found.' });
        res.status(200).json({ status: 'success', message: 'Entry deleted.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete entry.' });
    }
};