const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createGoal, getGoals, checkIn, deleteGoal } = require('../controllers/goalController');

router.get('/', authMiddleware, getGoals);
router.post('/', authMiddleware, createGoal);
router.post('/:id/checkin', authMiddleware, checkIn);
router.delete('/:id', authMiddleware, deleteGoal);

module.exports = router;