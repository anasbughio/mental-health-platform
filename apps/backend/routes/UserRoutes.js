const express = require('express');
const router = express.Router();
const { createUser, loginUser, logout } = require('../controllers/UserController');



// The route MUST have the leading slash: '/register'
router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/logout', logout);

module.exports = router;