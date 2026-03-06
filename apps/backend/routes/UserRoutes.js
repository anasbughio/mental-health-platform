const express = require('express');
const router = express.Router();
const {createUser} = require('../controllers/UserController')

router.post('register',createUser);


module.exports = router;