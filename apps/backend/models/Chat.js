// models/ChatHistory.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { _id: false });

const ChatHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // one chat thread per user (or remove unique for multiple sessions)
    },
    messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);