const mongoose = require('mongoose');

const ExerciseLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exerciseId: {
        type: String,
        required: true,
    },
    exerciseName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['breathing', 'meditation', 'cbt', 'grounding', 'movement'],
        required: true,
    },
    moodBefore: { type: Number, min: 1, max: 10, default: null },
    moodAfter:  { type: Number, min: 1, max: 10, default: null },
    durationMinutes: { type: Number, default: null },
    notes: { type: String, maxlength: 300, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('ExerciseLog', ExerciseLogSchema);