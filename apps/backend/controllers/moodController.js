const { GoogleGenerativeAI } = require('@google/generative-ai');
const Mood = require('../models/MoodLog');
const { analyzeSentiment } = require('./sentimentController');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.createMood = async (req, res) => {
    try {
        const { moodScore, notes, emotions } = req.body;
        let generatedAdvice = null;

        if (notes && notes.trim() !== '') {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `You are an empathetic, non-judgmental mental health assistant. 
A user just logged their daily mood with a score of ${moodScore} out of 10. 
${emotions && emotions.length ? `Emotions: ${emotions.join(', ')}.` : ''}
They wrote this journal entry: "${notes}"

Provide a short, highly supportive response (maximum 3 sentences). 
Validate their exact feelings and offer one small, actionable piece of advice or a cognitive reframe.`;

            const result = await model.generateContent(prompt);
            generatedAdvice = result.response.text();
        }

        const newMood = await Mood.create({
            user: req.user.id,
            moodScore,
            notes,
            emotions,
            aiAdvice: generatedAdvice
        });

        // ── Run sentiment analysis in background (don't await — never block response) ──
        if (notes && notes.trim().length > 5) {
            analyzeSentiment({
                userId: req.user.id,
                text: notes,
                source: 'mood',
                sourceId: newMood._id,
            }).catch(err => console.error('Background sentiment error (mood):', err.message));
        }

        res.status(201).json({ status: 'success', data: newMood });

    } catch (error) {
        console.error('Error in createMood:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process mood log.' });
    }
};

exports.getMyMoodLogs = async (req, res) => {
    try {
        const logs = await Mood.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: logs.length, data: logs });
    } catch (error) {
        console.error('[DEBUG] Error fetching mood logs:', error.message);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};