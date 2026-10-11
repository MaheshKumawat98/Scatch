const { validationResult } = require('express-validator');
const orderModel = require('../models/order-model');
const userModel = require('../models/user-model');
const asyncHandler = require('../utils/asyncHandler');

// Render checkout page with cart products and bill summary
module.exports.getCheckoutPage = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id).populate('cart.product');

    if (!user || !user.cart || user.cart.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/cart');
    }

    let subtotal = 0;
    let discount = 0;
    const platformFee = 20;

    user.cart.forEach((item) => {
        if (item.product) {
            subtotal += Number(item.product.price) * item.quantity;
            discount += Number(item.product.discount || 0) * item.quantity;
        }
    });

    const totalAmount = subtotal - discount + platformFee;

    res.render('checkout', {
        user,
        subtotal,
        discount,
        platformFee,
        totalAmount,
        error: req.flash('error'),
    });
});

// Process checkout and place order
module.exports.placeOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((e) => e.msg).join(', '));
        return res.redirect('/orders/checkout');
    }

    const user = await userModel.findById(req.user._id).populate('cart.product');

    if (!user || !user.cart || user.cart.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/cart');
    }

    const { fullname, address, city, state, pincode, phone, paymentMethod } = req.body;

    let orderProducts = [];
    let subtotal = 0;
    let discount = 0;
    const platformFee = 20;

    for (const item of user.cart) {
        if (item.product) {
            orderProducts.push({
                product: item.product._id,
                quantity: item.quantity,
                priceAtPurchase: item.product.price,
            });
            subtotal += Number(item.product.price) * item.quantity;
            discount += Number(item.product.discount || 0) * item.quantity;
        }
    }

    if (orderProducts.length === 0) {
        req.flash('error', 'No valid products in cart');
        return res.redirect('/cart');
    }

    const totalAmount = subtotal - discount + platformFee;

    const newOrder = await orderModel.create({
        user: user._id,
        products: orderProducts,
        subtotal,
        discount,
        platformFee,
        totalAmount,
        shippingAddress: {
            fullname,
            address,
            city,
            state,
            pincode,
            phone,
        },
        paymentMethod: paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD',
        paymentStatus: 'pending',
        orderStatus: 'placed',
    });

    user.orders.push(newOrder._id);
    user.cart = [];
    await user.save();

    req.flash('success', 'Order placed successfully!');
    res.redirect(`/orders/${newOrder._id}/confirmation`);
});

// View user's order history
module.exports.getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderModel
        .find({ user: req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 });

    res.render('orders', {
        orders,
        user: req.user,
        success: req.flash('success'),
        error: req.flash('error'),
    });
});

// View specific order details
module.exports.getOrderDetail = asyncHandler(async (req, res) => {
    const order = await orderModel.findById(req.params.id).populate('products.product');

    if (!order) {
        req.flash('error', 'Order not found');
        return res.redirect('/orders');
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/orders');
    }

    res.render('order-detail', {
        order,
        user: req.user,
        success: req.flash('success'),
        error: req.flash('error'),
    });
});

// Cancel placed order
module.exports.cancelOrder = asyncHandler(async (req, res) => {
    const order = await orderModel.findById(req.params.id);

    if (!order) {
        req.flash('error', 'Order not found');
        return res.redirect('/orders');
    }

    if (order.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/orders');
    }

    if (order.orderStatus !== 'placed') {
        req.flash('error', 'Only orders in placed status can be cancelled');
        return res.redirect(`/orders/${order._id}`);
    }

    order.orderStatus = 'cancelled';
    await order.save();

    req.flash('success', 'Order cancelled successfully');
    res.redirect('/orders');
});
