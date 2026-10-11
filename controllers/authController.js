const isDev = process.env.NODE_ENV === 'development';
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const userModel = require('../models/user-model');
const { generateToken } = require('../util/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
};

// Register user
module.exports.registerUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((err) => err.msg).join(', '));
        return res.redirect('/');
    }

    const { email, password, fullname, isAdmin } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        req.flash('error', 'You already have an account');
        return res.redirect('/');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
        email,
        fullname,
        password: hash,
        role: isDev && isAdmin === 'on' ? 'admin' : 'customer',
    });

    const token = generateToken(newUser);
    res.cookie('token', token, cookieOptions);
    req.flash('success', 'User created successfully');
    res.redirect('/shop');
});

// Login user
module.exports.loginUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((err) => err.msg).join(', '));
        return res.redirect('/');
    }

    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        const token = generateToken(user);
        res.cookie('token', token, cookieOptions);
        return res.redirect('/shop');
    }

    req.flash('error', 'Invalid email or password');
    res.redirect('/');
});

// Logout user
module.exports.logout = (req, res) => {
    res.cookie('token', '', cookieOptions);
    res.redirect('/');
};