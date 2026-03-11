const mongoose = require('mongoose');

const SleepSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // 'YYYY-MM-DD' — the night being logged
        required: true,
    },
    bedtime: {
        type: String, // 'HH:MM' 24hr format
        default: null,
    },
    wakeTime: {
        type: String, // 'HH:MM' 24hr format
        default: null,
    },
    durationHours: {
        type: Number, // calculated from bedtime/wakeTime or entered manually
        min: 0,
        max: 24,
        default: null,
    },
    quality: {
        type: Number, // 1-5 star rating
        min: 1,
        max: 5,
        required: true,
    },
    factors: {
        type: [String], // e.g. ['stress', 'caffeine', 'exercise', 'screen time']
        default: [],
    },
    notes: {
        type: String,
        maxlength: 300,
        default: '',
    },
    // AI generated insight for this sleep entry
    aiInsight: {
        type: String,
        default: null,
    },
    // Mood score logged closest to this date (populated server-side)
    correlatedMoodScore: {
        type: Number,
        default: null,
    },

}, { timestamps: true });

// One sleep log per date per user
SleepSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Sleep', SleepSchema);