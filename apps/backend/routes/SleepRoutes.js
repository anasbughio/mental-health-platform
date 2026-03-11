const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { logSleep, getSleepLogs, getSleepStats, deleteSleep } = require('../controllers/sleepController');

router.post('/',        authMiddleware, logSleep);
router.get('/',         authMiddleware, getSleepLogs);
router.get('/stats',    authMiddleware, getSleepStats);
router.delete('/:id',   authMiddleware, deleteSleep);

module.exports = router;