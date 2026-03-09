const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const {createMood,getMyMoodLogs} = require('../controllers/moodController');


router.post('/',authMiddleware,createMood);
router.get('/',authMiddleware,getMyMoodLogs);


module.exports = router;