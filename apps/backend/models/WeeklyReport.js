const mongoose = require('mongoose');

const WeeklyReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Week this report covers
    weekStart: { type: Date, required: true },
    weekEnd:   { type: Date, required: true },

    // Raw stats gathered for the week
    stats: {
        avgMoodScore:     { type: Number, default: null },
        totalMoodLogs:    { type: Number, default: 0 },
        totalJournalEntries: { type: Number, default: 0 },
        avgSentimentScore:{ type: Number, default: null },
        topEmotions:      [String],
        moodTrend:        { type: String, enum: ['improving', 'declining', 'stable', 'insufficient_data'], default: 'insufficient_data' },
        crisisFlags:      { type: Number, default: 0 },
        bestDay:          { type: String, default: null },
        worstDay:         { type: String, default: null },
    },

    // AI generated sections
    report: {
        summary:       { type: String, default: '' }, // 2-3 sentence overall summary
        highlights:    { type: String, default: '' }, // what went well
        challenges:    { type: String, default: '' }, // what was difficult
        patterns:      { type: String, default: '' }, // emotional patterns noticed
        recommendations: { type: String, default: '' }, // 3 specific action items
        affirmation:   { type: String, default: '' }, // closing encouragement
    },

    // Overall wellness score for the week (1-10)
    wellnessScore: { type: Number, min: 1, max: 10, default: null },

}, { timestamps: true });

module.exports = mongoose.model('WeeklyReport', WeeklyReportSchema);