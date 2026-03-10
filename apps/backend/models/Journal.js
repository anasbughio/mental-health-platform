const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    entry: {
        type: String,
        required: true,
        maxlength: 3000,
    },
    aiReflection: {
        type: String,
        default: null,
    },
    moodAtTime: {
        type: Number,
        min: 1,
        max: 10,
        default: null,
    },
    tags: [String],

}, { timestamps: true });

module.exports = mongoose.model('Journal', JournalSchema);