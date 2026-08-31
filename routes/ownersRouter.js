const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const isOwner = require('../middlewares/isOwner');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../util/generateToken');

// ============= OWNER LOGIN ROUTES =============

// Show owner login form
router.get('/login', (req, res) => {
    let error = req.flash('error');
    res.render('owner-login', { error });
});

// Handle owner login
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await userModel.findOne({ email });

        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/owners/login');
        }

        // Check if user is an admin
        if (user.admin !== true) {
            req.flash('error', 'You are not authorized as admin');
            return res.redirect('/owners/login');
        }

        // Verify password
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = generateToken(user);
                res.cookie('token', token);
                req.flash('success', 'Welcome Admin!');
                return res.redirect('/owners/admin');
            } else {
                req.flash('error', 'Invalid password');
                return res.redirect('/owners/login');
            }
        });
    } catch (err) {
        console.log(err);
        req.flash('error', 'Something went wrong');
        res.redirect('/owners/login');
    }
});

// ============= OWNER LOGOUT =============
router.get('/logout', (req, res) => {
    res.cookie('token', '');
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
});

// ============= ADMIN DASHBOARD =============
router.get('/admin', isLoggedIn, isOwner, async (req, res) => {
    try {
        let success = req.flash('success');
        let products = await productModel.find();
        res.render('admin', { success, products, user: req.user });
    } catch (err) {
        console.log(err);
        res.send('Error loading dashboard');
    }
});

// ============= PRODUCT CREATION =============
// Show product creation form
router.get('/create', isLoggedIn, isOwner, (req, res) => {
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('createproducts', { success, error });
});

// Handle product creation
router.post('/create', isLoggedIn, isOwner, async (req, res) => {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        let product = await productModel.create({
            name,
            price,
            discount: discount || 0,
            bgcolor,
            panelcolor,
            textcolor
        });
        req.flash('success', 'Product created successfully!');
        res.redirect('/owners/admin');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Failed to create product');
        res.redirect('/owners/create');
    }
});

module.exports = router;