const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generateReport, getReports, getLatestReport } = require('../controllers/weeklyReportController');

router.post('/generate', authMiddleware, generateReport);  // Generate this week's report
router.get('/', authMiddleware, getReports);               // All past reports
router.get('/latest', authMiddleware, getLatestReport);    // Most recent report

module.exports = router;