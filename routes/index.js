const express = require('express');
const isLoggedIn = require('../middlewares/isLoggedIn');
const router = express.Router();
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const cookieparsar = require('cookie-parser');
const asyncHandler = require('../utils/asyncHandler');

router.use(cookieparsar());

// Show homepage
router.get('/', (req, res) => {
    let error = req.flash('error');
    res.render('index', { error, loggedin: false });
});

// Shop route
router.get(
    '/shop',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let products = await productModel.find({ isActive: { $ne: false } });
        let success = req.flash('success');
        res.render('shop', { products, success });
    })
);

// Add to cart
router.get(
    '/addtocart/:productid',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let user = req.user;
        let cartItem = user.cart.find(
            (item) => item.product && item.product.toString() === req.params.productid.toString()
        );

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            user.cart.push({ product: req.params.productid, quantity: 1 });
        }

        await user.save();
        req.flash('success', 'Added to cart');
        res.redirect('/shop');
    })
);

// Cart page
router.get(
    '/cart',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let user = await req.user.populate('cart.product');
        let bill = user.cart.reduce((sum, item) => {
            if (item.product) {
                return sum + (Number(item.product.price) - Number(item.product.discount || 0)) * item.quantity;
            }
            return sum;
        }, 0);
        res.render('cart', { user, bill });
    })
);

// Increase cart item quantity
router.post(
    '/cart/increase/:productid',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let cartItem = req.user.cart.find(
            (item) => item.product && item.product.toString() === req.params.productid.toString()
        );
        if (cartItem) {
            cartItem.quantity += 1;
            await req.user.save();
        }
        res.redirect('/cart');
    })
);

// Decrease cart item quantity
router.post(
    '/cart/decrease/:productid',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let cartItemIndex = req.user.cart.findIndex(
            (item) => item.product && item.product.toString() === req.params.productid.toString()
        );
        if (cartItemIndex !== -1) {
            if (req.user.cart[cartItemIndex].quantity > 1) {
                req.user.cart[cartItemIndex].quantity -= 1;
            } else {
                req.user.cart.splice(cartItemIndex, 1);
            }
            await req.user.save();
        }
        res.redirect('/cart');
    })
);

// Remove cart item
router.post(
    '/cart/remove/:productid',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        req.user.cart = req.user.cart.filter(
            (item) => item.product && item.product.toString() !== req.params.productid.toString()
        );
        await req.user.save();
        res.redirect('/cart');
    })
);

// My Account page
router.get(
    '/myaccount',
    isLoggedIn,
    asyncHandler(async (req, res) => {
        let user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'orders',
            populate: { path: 'products.product' },
            options: { sort: { createdAt: -1 } },
        });
        res.render('myaccount', { user });
    })
);

module.exports = router;