const express = require('express');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isOwner = require('../middlewares/isOwner');
const router = express.Router();
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const cookieparsar = require('cookie-parser');
const bcrypt = require('bcrypt');
const { generateToken } = require('../util/generateToken');

router.use(cookieparsar());

// Show homepage
router.get('/', (req, res) => {
    let error = req.flash('error');
    res.render('index', { error, loggedin: false });
});

// Show owner login page
router.get('/owner/login', (req, res) => {
    let error = req.flash('error');
    res.render('owner-login', { error });
});

// Handle owner login
router.post('/owner/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await userModel.findOne({ email });

        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/owner/login');
        }

        // Check if user is an admin
        if (user.admin !== true) {
            req.flash('error', 'You are not authorized as admin');
            return res.redirect('/owner/login');
        }

        // Verify password
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = generateToken(user);
                res.cookie('token', token);
                req.flash('success', 'Welcome Admin');
                return res.redirect('/owners/admin');
            } else {
                req.flash('error', 'Invalid password');
                return res.redirect('/owner/login');
            }
        });
    } catch (err) {
        console.log(err);
        res.redirect('/owner/login');
    }
});

// Shop route
router.get('/shop', isLoggedIn, async (req, res) => {
    let products = await productModel.find();
    let success = req.flash('success');
    res.render('shop', { products, success });
});

// Add to cart
router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid);
    await user.save();
    req.flash('success', 'Added to cart');
    res.redirect('/shop');
});

// Cart page
router.get('/cart', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('cart');
    let bill = user.cart.reduce((sum, item) => sum + (Number(item.price) - Number(item.discount || 0)), 0);
    res.render('cart', { user, bill });
});

module.exports = router;