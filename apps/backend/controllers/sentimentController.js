const { GoogleGenerativeAI } = require('@google/generative-ai');
const Sentiment = require('../models/Sentiment');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Core analysis function (used internally by other controllers) ─────────────
// Call this from moodController and journalController after saving
const analyzeSentiment = async ({ userId, text, source, sourceId }) => {
    try {
        if (!text || text.trim().length < 5) return null;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a clinical sentiment analysis engine for a mental health platform.
Analyze this text written by a user: "${text}"

Return ONLY a valid JSON object with NO markdown, NO backticks, NO extra text:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentimentScore": <number from -1.0 to 1.0>,
  "primaryEmotion": "<one word: joy/sadness/anxiety/anger/fear/shame/loneliness/hope/calm/overwhelm/numbness>",
  "secondaryEmotion": "<one word or empty string>",
  "crisisFlag": <true | false>,
  "crisisSeverity": "none" | "mild" | "moderate" | "severe",
  "insight": "<one warm sentence summarizing the emotional state>"
}

Rules:
- sentimentScore: 1.0 = very positive, 0 = neutral, -1.0 = very negative
- crisisFlag = true ONLY for genuine self-harm/suicidal/crisis signals, NOT general sadness
- insight must be empathetic, 1 sentence max`;

        const result = await model.generateContent(prompt);
        let raw = result.response.text().trim();
        raw = raw.replace(/```json|```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return null;
        }

        const sentimentDoc = await Sentiment.create({
            user: userId,
            source,
            sourceId,
            text: text.substring(0, 2000),
            sentiment: parsed.sentiment || 'neutral',
            sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore || 0)),
            emotions: {
                primary: parsed.primaryEmotion || '',
                secondary: parsed.secondaryEmotion || '',
            },
            crisisFlag: parsed.crisisFlag || false,
            crisisSeverity: parsed.crisisSeverity || 'none',
            insight: parsed.insight || '',
        });

        return sentimentDoc;

    } catch (err) {
        console.error('Sentiment analysis error:', err.message);
        return null; // Never crash the parent operation
    }
};

// ── GET /api/sentiment ────────────────────────────────────────────────────────
// Get all sentiment records for the user (for trend charts)
const getSentimentHistory = async (req, res) => {
    try {
        const records = await Sentiment.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ status: 'success', data: records });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch sentiment data.' });
    }
};

// ── GET /api/sentiment/summary ────────────────────────────────────────────────
// Returns aggregated stats + AI weekly insight
const getSentimentSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Last 30 days of records
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const records = await Sentiment.find({
            user: userId,
            createdAt: { $gte: since }
        }).sort({ createdAt: -1 });

        if (records.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: { hasData: false }
            });
        }

        // Calculate stats
        const avgScore = records.reduce((s, r) => s + r.sentimentScore, 0) / records.length;

        const sentimentCounts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
        const emotionCounts = {};
        let crisisCount = 0;

        records.forEach(r => {
            sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
            if (r.crisisFlag) crisisCount++;
            if (r.emotions?.primary) {
                emotionCounts[r.emotions.primary] = (emotionCounts[r.emotions.primary] || 0) + 1;
            }
        });

        // Top 3 emotions
        const topEmotions = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emotion, count]) => ({ emotion, count }));

        // Trend: compare last 7 days vs previous 7 days
        const last7 = records.filter(r => new Date(r.createdAt) > new Date(Date.now() - 7 * 86400000));
        const prev7 = records.filter(r => {
            const d = new Date(r.createdAt);
            return d <= new Date(Date.now() - 7 * 86400000) && d > new Date(Date.now() - 14 * 86400000);
        });

        const last7Avg = last7.length ? last7.reduce((s, r) => s + r.sentimentScore, 0) / last7.length : null;
        const prev7Avg = prev7.length ? prev7.reduce((s, r) => s + r.sentimentScore, 0) / prev7.length : null;
        const trend = last7Avg !== null && prev7Avg !== null
            ? last7Avg > prev7Avg ? 'improving' : last7Avg < prev7Avg ? 'declining' : 'stable'
            : 'stable';

        // AI weekly summary
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const recentInsights = records.slice(0, 5).map(r => r.insight).filter(Boolean).join(' | ');

        const summaryPrompt = `You are a compassionate mental health analyst.
Based on these recent user insights: "${recentInsights}"
Overall sentiment trend: ${trend}, average score: ${avgScore.toFixed(2)}/1.0
Top emotions: ${topEmotions.map(e => e.emotion).join(', ')}

Write a warm, personalized 2-sentence weekly mental health summary for this user.
Be encouraging, specific, and human. Do not be clinical.`;

        const summaryResult = await model.generateContent(summaryPrompt);
        const aiSummary = summaryResult.response.text().trim();

        res.status(200).json({
            status: 'success',
            data: {
                hasData: true,
                totalEntries: records.length,
                avgScore: parseFloat(avgScore.toFixed(2)),
                sentimentCounts,
                topEmotions,
                crisisCount,
                trend,
                last7Avg: last7Avg ? parseFloat(last7Avg.toFixed(2)) : null,
                prev7Avg: prev7Avg ? parseFloat(prev7Avg.toFixed(2)) : null,
                aiSummary,
                recentRecords: records.slice(0, 7),
            }
        });

    } catch (err) {
        console.error('Sentiment summary error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to generate summary.' });
    }
};

module.exports = { analyzeSentiment, getSentimentHistory, getSentimentSummary };