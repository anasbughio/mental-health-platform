const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    subscribe, unsubscribe, updateSettings,
    getSettings, getVapidKey, sendTest
} = require('../controllers/notificationController');

router.get('/vapid-public-key', getVapidKey);                    // public — no auth needed
router.post('/subscribe',   authMiddleware, subscribe);
router.delete('/unsubscribe', authMiddleware, unsubscribe);
router.patch('/settings',   authMiddleware, updateSettings);
router.get('/settings',     authMiddleware, getSettings);
router.post('/send-test',   authMiddleware, sendTest);

module.exports = router;