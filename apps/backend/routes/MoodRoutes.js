const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const {createMoodLog, getMyMoodLogs} = require('../controllers/MoodLogController');


router.post('/',authMiddleware,createMoodLog);
router.get('/',authMiddleware,getMyMoodLogs);


module.exports = router;