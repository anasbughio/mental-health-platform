const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getOverview, getAiSummary } = require('../controllers/analyticsController');

router.get('/overview',    authMiddleware, getOverview);
router.get('/ai-summary',  authMiddleware, getAiSummary);

module.exports = router;