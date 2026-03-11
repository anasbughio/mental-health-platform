const { GoogleGenerativeAI } = require('@google/generative-ai');
const WeeklyReport = require('../models/WeeklyReport');
const MoodLog      = require('../models/MoodLog');
const Journal      = require('../models/Journal');
const Sentiment    = require('../models/Sentiment');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: get start/end of a week ──────────────────────────────────────────
const getWeekRange = (offsetWeeks = 0) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek - offsetWeeks * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
};

// ── POST /api/weekly-report/generate ─────────────────────────────────────────
// Generates (or regenerates) a report for the current week
exports.generateReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { weekStart, weekEnd } = getWeekRange(0);

        // Gather all data for this week in parallel
        const [moodLogs, journalEntries, sentimentRecords] = await Promise.all([
            MoodLog.find({ user: userId, createdAt: { $gte: weekStart, $lte: weekEnd } }).sort({ createdAt: 1 }),
            Journal.find({ user: userId, createdAt: { $gte: weekStart, $lte: weekEnd } }).sort({ createdAt: 1 }),
            Sentiment.find({ user: userId, createdAt: { $gte: weekStart, $lte: weekEnd } }).sort({ createdAt: 1 }),
        ]);

        // ── Calculate stats ──────────────────────────────────────────────────
        const avgMoodScore = moodLogs.length
            ? parseFloat((moodLogs.reduce((s, m) => s + m.moodScore, 0) / moodLogs.length).toFixed(1))
            : null;

        const avgSentimentScore = sentimentRecords.length
            ? parseFloat((sentimentRecords.reduce((s, r) => s + r.sentimentScore, 0) / sentimentRecords.length).toFixed(2))
            : null;

        // Top emotions from sentiment records
        const emotionCounts = {};
        sentimentRecords.forEach(r => {
            if (r.emotions?.primary) emotionCounts[r.emotions.primary] = (emotionCounts[r.emotions.primary] || 0) + 1;
        });
        const topEmotions = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([e]) => e);

        // Best and worst mood days
        let bestDay = null, worstDay = null;
        if (moodLogs.length > 0) {
            const best  = moodLogs.reduce((a, b) => a.moodScore > b.moodScore ? a : b);
            const worst = moodLogs.reduce((a, b) => a.moodScore < b.moodScore ? a : b);
            bestDay  = new Date(best.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            worstDay = new Date(worst.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        }

        // Mood trend: compare first half vs second half of week
        let moodTrend = 'insufficient_data';
        if (moodLogs.length >= 3) {
            const half = Math.floor(moodLogs.length / 2);
            const firstHalf  = moodLogs.slice(0, half).reduce((s, m) => s + m.moodScore, 0) / half;
            const secondHalf = moodLogs.slice(half).reduce((s, m) => s + m.moodScore, 0) / (moodLogs.length - half);
            moodTrend = secondHalf > firstHalf + 0.5 ? 'improving' : secondHalf < firstHalf - 0.5 ? 'declining' : 'stable';
        }

        const crisisFlags = sentimentRecords.filter(r => r.crisisFlag).length;

        // Wellness score: blend mood + sentiment
        let wellnessScore = null;
        if (avgMoodScore !== null) {
            const moodNorm = avgMoodScore; // already 1-10
            const sentNorm = avgSentimentScore !== null ? (avgSentimentScore + 1) * 5 : moodNorm;
            wellnessScore = Math.round((moodNorm * 0.6 + sentNorm * 0.4));
            wellnessScore = Math.max(1, Math.min(10, wellnessScore));
        }

        // ── Build AI context ─────────────────────────────────────────────────
        const journalExcerpts = journalEntries
            .slice(0, 3)
            .map(j => `"${j.entry.substring(0, 150)}"`)
            .join('\n');

        const moodNotes = moodLogs
            .filter(m => m.notes)
            .slice(0, 3)
            .map(m => `Score ${m.moodScore}/10: "${m.notes.substring(0, 100)}"`)
            .join('\n');

        const hasData = moodLogs.length > 0 || journalEntries.length > 0;

        if (!hasData) {
            return res.status(200).json({
                status: 'success',
                data: { hasData: false, message: 'No activity logged this week yet.' }
            });
        }

        // ── Generate AI report via single Gemini call ─────────────────────────
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const aiPrompt = `You are a compassionate mental health analyst writing a weekly wellness report for a user.

WEEK DATA:
- Mood logs: ${moodLogs.length} entries, average score: ${avgMoodScore ?? 'N/A'}/10
- Journal entries: ${journalEntries.length} written
- Mood trend this week: ${moodTrend}
- Top emotions detected: ${topEmotions.join(', ') || 'none detected'}
- Best mood day: ${bestDay || 'N/A'}, Lowest mood day: ${worstDay || 'N/A'}
- Crisis flags: ${crisisFlags}
- Weekly wellness score: ${wellnessScore ?? 'N/A'}/10

JOURNAL EXCERPTS:
${journalExcerpts || 'No journal entries this week.'}

MOOD NOTES:
${moodNotes || 'No mood notes this week.'}

Write a weekly mental health report with EXACTLY these 6 sections.
Return ONLY valid JSON, no markdown, no backticks:
{
  "summary": "2-3 warm sentences giving an overall picture of this week",
  "highlights": "2 sentences about what went well or moments of strength",
  "challenges": "2 sentences about difficulties faced with empathy and validation",
  "patterns": "2 sentences about emotional patterns or triggers you notice",
  "recommendations": "3 specific, actionable wellness suggestions for next week formatted as a numbered list",
  "affirmation": "1 powerful, personalized closing sentence of encouragement"
}

Tone: warm, human, non-clinical. Write as if you genuinely care about this person.`;

        const result = await model.generateContent(aiPrompt);
        let raw = result.response.text().trim();
        raw = raw.replace(/```json|```/g, '').trim();

        let reportSections;
        try {
            reportSections = JSON.parse(raw);
        } catch {
            reportSections = {
                summary: 'We were unable to generate your full report this week. Keep logging your moods and journal entries for a richer analysis.',
                highlights: 'Your consistency in tracking your mental health is itself a highlight.',
                challenges: 'Every week has its difficulties — what matters is that you showed up.',
                patterns: 'More data will help us identify clearer patterns over time.',
                recommendations: '1. Continue daily mood logging\n2. Write at least one journal entry\n3. Practice one mindfulness exercise',
                affirmation: 'You are doing something important by paying attention to your mental health.',
            };
        }

        // ── Save/update report for this week ─────────────────────────────────
        const report = await WeeklyReport.findOneAndUpdate(
            { user: userId, weekStart },
            {
                user: userId,
                weekStart,
                weekEnd,
                stats: { avgMoodScore, totalMoodLogs: moodLogs.length, totalJournalEntries: journalEntries.length, avgSentimentScore, topEmotions, moodTrend, crisisFlags, bestDay, worstDay },
                report: reportSections,
                wellnessScore,
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ status: 'success', data: { hasData: true, report } });

    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate weekly report.' });
    }
};

// ── GET /api/weekly-report ────────────────────────────────────────────────────
// Get all past weekly reports for this user
exports.getReports = async (req, res) => {
    try {
        const reports = await WeeklyReport.find({ user: req.user.id })
            .sort({ weekStart: -1 })
            .limit(12); // last 12 weeks
        res.status(200).json({ status: 'success', data: reports });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch reports.' });
    }
};

// ── GET /api/weekly-report/latest ────────────────────────────────────────────
exports.getLatestReport = async (req, res) => {
    try {
        const report = await WeeklyReport.findOne({ user: req.user.id }).sort({ weekStart: -1 });
        if (!report) return res.status(200).json({ status: 'success', data: null });
        res.status(200).json({ status: 'success', data: report });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch latest report.' });
    }
};