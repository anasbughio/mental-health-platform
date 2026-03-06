const express = require('express');
const router = express.Router();
const { createUser, seeUser } = require('../controllers/UserController');



// The route MUST have the leading slash: '/register'
router.post('/register', createUser);
router.get('/seeusers', seeUser);

module.exports = router;