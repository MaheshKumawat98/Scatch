const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    handler: (req, res, next, options) => {
        req.flash('error', options.message);
        const redirectUrl = req.baseUrl.includes('owners') ? '/owners/login' : '/';
        res.status(options.statusCode).redirect(redirectUrl);
    },
});

module.exports = loginLimiter;
