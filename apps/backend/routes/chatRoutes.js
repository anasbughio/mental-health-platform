const express = require('express');
const router = express.Router();
const {sendMessage } = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth'); 

// When a POST request hits /api/chat, verify the user, then run the AI chat!
router.post('/', authMiddleware, sendMessage);

module.exports = router;