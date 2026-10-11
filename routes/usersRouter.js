const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logout } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middlewares/validators');
const loginLimiter = require('../middlewares/rateLimiter');

router.get('/', (req, res) => {
    res.send('hey its working');
});

router.post('/register', registerValidator, registerUser);
router.post('/login', loginLimiter, loginValidator, loginUser);
router.get('/logout', logout);

module.exports = router;