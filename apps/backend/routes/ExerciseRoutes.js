const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getExercises, getRecommendations, logExercise, getHistory } = require('../controllers/exerciseController');

router.get('/', authMiddleware, getExercises);              // all exercises
router.get('/recommend', authMiddleware, getRecommendations); // AI recommendations
router.post('/log', authMiddleware, logExercise);           // log completion
router.get('/history', authMiddleware, getHistory);         // past completions

module.exports = router;