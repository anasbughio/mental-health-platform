const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { detectDistress, getResources } = require('../controllers/crisisController');

router.post('/detect', authMiddleware, detectDistress);   // POST text to analyze
router.get('/resources', authMiddleware, getResources);   // GET all crisis resources

module.exports = router;