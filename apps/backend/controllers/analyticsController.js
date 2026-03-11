const MoodLog    = require('../models/MoodLog');
const Sleep      = require('../models/Sleep');
const Journal    = require('../models/Journal');
const Sentiment  = require('../models/Sentiment');
const Goal       = require('../models/Goal');
const ExerciseLog = require('../models/ExerciseLog');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── helpers ───────────────────────────────────────────────────────────────────
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };
const dateKey  = (d) => new Date(d).toISOString().split('T')[0];
const pearson  = (xs, ys) => {
    const n = xs.length; if (n < 3) return null;
    const xm = xs.reduce((a,b) => a+b,0)/n, ym = ys.reduce((a,b) => a+b,0)/n;
    const num = xs.reduce((s,x,i) => s+(x-xm)*(ys[i]-ym),0);
    const den = Math.sqrt(xs.reduce((s,x)=>s+(x-xm)**2,0)*ys.reduce((s,y)=>s+(y-ym)**2,0));
    return den===0 ? 0 : parseFloat((num/den).toFixed(2));
};

// ── GET /api/analytics/overview ──────────────────────────────────────────────
exports.getOverview = async (req, res) => {
    try {
        const uid   = req.user.id;
        const since30 = daysAgo(30);
        const since7  = daysAgo(7);

        // Parallel fetch everything
        const [moods, sleepLogs, journals, sentiments, goals, exercises] = await Promise.all([
            MoodLog.find({ user: uid, createdAt: { $gte: since30 } }).sort({ createdAt: 1 }),
            Sleep.find({ user: uid, date: { $gte: dateKey(since30) } }).sort({ date: 1 }),
            Journal.find({ user: uid, createdAt: { $gte: since30 } }).sort({ createdAt: 1 }),
            Sentiment.find({ user: uid, createdAt: { $gte: since30 } }).sort({ createdAt: 1 }),
            Goal.find({ user: uid, isActive: true }),
            ExerciseLog.find({ user: uid, createdAt: { $gte: since30 } }).sort({ createdAt: 1 }),
        ]);

        // ── MOOD stats ───────────────────────────────────────────────────────
        const moodThis7  = moods.filter(m => new Date(m.createdAt) >= since7);
        const moodPrev7  = moods.filter(m => new Date(m.createdAt) < since7);
        const avgMood30  = moods.length ? parseFloat((moods.reduce((s,m)=>s+m.moodScore,0)/moods.length).toFixed(1)) : null;
        const avgMoodThis7 = moodThis7.length ? parseFloat((moodThis7.reduce((s,m)=>s+m.moodScore,0)/moodThis7.length).toFixed(1)) : null;
        const avgMoodPrev7 = moodPrev7.length ? parseFloat((moodPrev7.reduce((s,m)=>s+m.moodScore,0)/moodPrev7.length).toFixed(1)) : null;
        const moodTrend  = avgMoodThis7 && avgMoodPrev7
            ? avgMoodThis7 > avgMoodPrev7 + 0.3 ? 'up' : avgMoodThis7 < avgMoodPrev7 - 0.3 ? 'down' : 'stable'
            : 'stable';

        // ── SLEEP stats ──────────────────────────────────────────────────────
        const sleepThis7 = sleepLogs.filter(l => l.date >= dateKey(since7));
        const avgSleepQuality = sleepLogs.length
            ? parseFloat((sleepLogs.reduce((s,l)=>s+l.quality,0)/sleepLogs.length).toFixed(1)) : null;
        const avgSleepDuration = sleepLogs.filter(l=>l.durationHours).length
            ? parseFloat((sleepLogs.filter(l=>l.durationHours).reduce((s,l)=>s+l.durationHours,0)/sleepLogs.filter(l=>l.durationHours).length).toFixed(1)) : null;

        // ── JOURNAL stats ────────────────────────────────────────────────────
        const journalCount30 = journals.length;
        const journalCount7  = journals.filter(j => new Date(j.createdAt) >= since7).length;

        // ── SENTIMENT stats ──────────────────────────────────────────────────
        const avgSentiment = sentiments.length
            ? parseFloat((sentiments.reduce((s,r)=>s+r.sentimentScore,0)/sentiments.length).toFixed(2)) : null;
        const emotionCounts = {};
        sentiments.forEach(r => { if(r.emotions?.primary) emotionCounts[r.emotions.primary] = (emotionCounts[r.emotions.primary]||0)+1; });
        const topEmotions = Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([e,c])=>({emotion:e,count:c}));

        // ── GOALS stats ──────────────────────────────────────────────────────
        const activeGoals   = goals.length;
        const goalsOnStreak = goals.filter(g => g.currentStreak > 0).length;
        const bestStreak    = goals.length ? Math.max(...goals.map(g=>g.longestStreak||0)) : 0;

        // ── EXERCISE stats ───────────────────────────────────────────────────
        const exerciseCount30 = exercises.length;
        const moodLifts = exercises.filter(e => e.moodBefore && e.moodAfter && e.moodAfter > e.moodBefore);
        const avgMoodLift = moodLifts.length
            ? parseFloat((moodLifts.reduce((s,e)=>s+(e.moodAfter-e.moodBefore),0)/moodLifts.length).toFixed(1)) : null;

        // ── BUILD DAY-BY-DAY TIMELINE (last 30 days) ─────────────────────────
        const timeline = [];
        for (let i = 29; i >= 0; i--) {
            const day   = daysAgo(i);
            const key   = dateKey(day);
            const label = day.toLocaleDateString('en-US', { month:'short', day:'numeric' });

            const dayMoods = moods.filter(m => dateKey(m.createdAt) === key);
            const daySleep = sleepLogs.find(l => l.date === key);
            const daySenti = sentiments.filter(s => dateKey(s.createdAt) === key);

            timeline.push({
                date:      key,
                label,
                mood:      dayMoods.length ? parseFloat((dayMoods.reduce((s,m)=>s+m.moodScore,0)/dayMoods.length).toFixed(1)) : null,
                sleepQuality:  daySleep?.quality || null,
                sleepHours:    daySleep?.durationHours || null,
                sentiment: daySenti.length ? parseFloat((daySenti.reduce((s,r)=>s+r.sentimentScore,0)/daySenti.length).toFixed(2)) : null,
                journaled: journals.some(j => dateKey(j.createdAt) === key),
                exercised: exercises.some(e => dateKey(e.createdAt) === key),
            });
        }

        // ── CORRELATIONS ─────────────────────────────────────────────────────
        const moodSleepPairs   = timeline.filter(d => d.mood && d.sleepQuality);
        const moodSleepCorr    = pearson(moodSleepPairs.map(d=>d.sleepQuality), moodSleepPairs.map(d=>d.mood));

        const moodSentiPairs   = timeline.filter(d => d.mood && d.sentiment);
        const moodSentiCorr    = pearson(moodSentiPairs.map(d=>d.sentiment), moodSentiPairs.map(d=>d.mood));

        // ── ACTIVITY STREAK ──────────────────────────────────────────────────
        let currentStreak = 0;
        for (let i = timeline.length-1; i >= 0; i--) {
            const d = timeline[i];
            if (d.mood || d.journaled || d.sleepQuality) currentStreak++;
            else break;
        }

        // ── WELLNESS SCORE (composite 1-10) ───────────────────────────────────
        let wellnessScore = null;
        const components = [];
        if (avgMood30)       components.push(avgMood30);
        if (avgSleepQuality) components.push(avgSleepQuality * 2);          // scale to /10
        if (avgSentiment !== null) components.push((avgSentiment + 1) * 5); // -1..1 → 0..10
        if (components.length) {
            wellnessScore = Math.round(components.reduce((a,b)=>a+b,0)/components.length);
            wellnessScore = Math.max(1, Math.min(10, wellnessScore));
        }

        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    avgMood30, avgMoodThis7, moodTrend,
                    avgSleepQuality, avgSleepDuration,
                    journalCount30, journalCount7,
                    avgSentiment, topEmotions,
                    activeGoals, goalsOnStreak, bestStreak,
                    exerciseCount30, avgMoodLift,
                    currentStreak, wellnessScore,
                    totalDataPoints: moods.length + sleepLogs.length + journals.length,
                },
                correlations: { moodSleep: moodSleepCorr, moodSentiment: moodSentiCorr },
                timeline,
            }
        });

    } catch (err) {
        console.error('Analytics overview error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load analytics.' });
    }
};

// ── GET /api/analytics/ai-summary ────────────────────────────────────────────
exports.getAiSummary = async (req, res) => {
    try {
        const uid = req.user.id;
        const since7 = daysAgo(7);

        const [moods, sleepLogs, journals] = await Promise.all([
            MoodLog.find({ user: uid, createdAt: { $gte: since7 } }),
            Sleep.find({ user: uid, date: { $gte: dateKey(since7) } }),
            Journal.find({ user: uid, createdAt: { $gte: since7 } }),
        ]);

        if (!moods.length && !sleepLogs.length && !journals.length) {
            return res.status(200).json({ status: 'success', data: { summary: null } });
        }

        const avgMood = moods.length ? (moods.reduce((s,m)=>s+m.moodScore,0)/moods.length).toFixed(1) : 'N/A';
        const avgSleep = sleepLogs.length ? (sleepLogs.reduce((s,l)=>s+l.quality,0)/sleepLogs.length).toFixed(1) : 'N/A';

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(
            `Mental health analytics for the past 7 days:
- Mood logs: ${moods.length}, average score: ${avgMood}/10
- Sleep logs: ${sleepLogs.length}, average quality: ${avgSleep}/5
- Journal entries: ${journals.length}

Write a 2-sentence warm, personal insight about what this data pattern suggests. 
Be specific — reference the actual numbers. Be encouraging, not clinical.`
        );

        res.status(200).json({ status: 'success', data: { summary: result.response.text().trim() } });

    } catch (err) {
        console.error('AI summary error:', err.message);
        res.status(200).json({ status: 'success', data: { summary: null } });
    }
};