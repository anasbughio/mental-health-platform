const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getPrompt, createEntry, getEntries, deleteEntry } = require('../controllers/JournalController');

router.get('/prompt', authMiddleware, getPrompt);   // GET a fresh AI prompt
router.get('/', authMiddleware, getEntries);         // GET all entries
router.post('/', authMiddleware, createEntry);       // POST new entry
router.delete('/:id', authMiddleware, deleteEntry); // DELETE entry

module.exports = router;