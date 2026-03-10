const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getSentimentHistory, getSentimentSummary } = require('../controllers/sentimentController');

router.get('/', authMiddleware, getSentimentHistory);
router.get('/summary', authMiddleware, getSentimentSummary);

module.exports = router;