const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const {createMoodLog, getMyMoodLogs} = require('../controllers/MoodLogController');
const {createMood} = require('../controllers/moodController');


router.post('/',authMiddleware,createMood);
router.get('/',authMiddleware,getMyMoodLogs);


module.exports = router;