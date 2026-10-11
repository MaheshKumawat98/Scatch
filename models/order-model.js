const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
            },
            quantity: {
                type: Number,
                required: true,
            },
            priceAtPurchase: {
                type: Number,
                required: true,
            },
        },
    ],
    subtotal: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    platformFee: {
        type: Number,
        default: 20,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        fullname: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true },
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'placed',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('order', orderSchema);
