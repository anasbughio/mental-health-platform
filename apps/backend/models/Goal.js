const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
    date: {
        type: String, // stored as 'YYYY-MM-DD' for easy daily comparison
        required: true,
    },
    note: {
        type: String,
        maxlength: 200,
        default: '',
    }
}, { _id: false });

const GoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 300,
        default: '',
    },
    category: {
        type: String,
        enum: ['mindfulness', 'exercise', 'sleep', 'social', 'nutrition', 'self-care', 'other'],
        default: 'other',
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily',
    },
    targetDays: {
        type: Number,
        default: 30, // goal target in days
        min: 1,
        max: 365,
    },
    checkIns: [CheckInSchema],
    currentStreak: {
        type: Number,
        default: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    aiTip: {
        type: String,
        default: null,
    },

}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);