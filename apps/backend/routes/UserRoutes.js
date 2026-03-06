const express = require('express');
const router = express.Router();
const { createUser } = require('../controllers/UserController');



// The route MUST have the leading slash: '/register'
router.post('/register', createUser);

module.exports = router;