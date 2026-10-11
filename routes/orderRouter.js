const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const orderController = require('../controllers/orderController');

const { checkoutValidator } = require('../middlewares/validators');

// All order routes are protected by isLoggedIn
router.use(isLoggedIn);

// Checkout
router.get('/checkout', orderController.getCheckoutPage);
router.post('/checkout', checkoutValidator, orderController.placeOrder);

// Order history
router.get('/', orderController.getMyOrders);

// Order confirmation page (before /:id to prevent route clash)
router.get('/:id/confirmation', (req, res) => {
    res.render('order-confirmation', { orderId: req.params.id });
});

// Order detail & cancel
router.get('/:id', orderController.getOrderDetail);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
