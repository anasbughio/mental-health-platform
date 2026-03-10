const mongoose = require('mongoose');

const SentimentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Where the text came from
    source: {
        type: String,
        enum: ['mood', 'journal', 'chat'],
        required: true,
    },
    // Reference to the original document
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    // The text that was analyzed
    text: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    // Overall sentiment
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'mixed'],
        required: true,
    },
    // Numeric score: -1.0 (very negative) to +1.0 (very positive)
    sentimentScore: {
        type: Number,
        min: -1,
        max: 1,
        required: true,
    },
    // Detected emotions
    emotions: {
        primary: { type: String, default: '' },     // e.g. "sadness", "joy", "anxiety"
        secondary: { type: String, default: '' },
    },
    // Crisis flag from sentiment context
    crisisFlag: {
        type: Boolean,
        default: false,
    },
    crisisSeverity: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe'],
        default: 'none',
    },
    // Short AI insight about this entry
    insight: {
        type: String,
        default: '',
    },

}, { timestamps: true });

module.exports = mongoose.model('Sentiment', SentimentSchema);