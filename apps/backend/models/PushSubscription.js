const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // one subscription per user
    },
    subscription: {
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth:   { type: String, required: true },
        },
    },
    // Reminder settings
    reminderTime: {
        type: String,
        default: '09:00', // HH:MM format
    },
    reminderEnabled: {
        type: Boolean,
        default: true,
    },
    timezone: {
        type: String,
        default: 'UTC',
    },
    lastSentAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);