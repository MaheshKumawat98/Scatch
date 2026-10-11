const { validationResult } = require('express-validator');
const productModel = require('../models/product-model');
const asyncHandler = require('../utils/asyncHandler');

// Fetch all active products and render admin inventory view
module.exports.getAllProducts = asyncHandler(async (req, res) => {
    let products = await productModel.find({ isActive: { $ne: false } });
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('admin', { products, success, error, user: req.user });
});

// Create a new product with optional/uploaded image buffer
module.exports.createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((e) => e.msg).join(', '));
        return res.redirect('/owners/products/create');
    }

    let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
    let productData = {
        name,
        price,
        discount: discount ? Number(discount) : 0,
        bgcolor,
        panelcolor,
        textcolor,
    };

    if (req.file) {
        productData.image = req.file.buffer;
    }

    await productModel.create(productData);
    req.flash('success', 'Product created successfully');
    res.redirect('/owners/products');
});

// Render edit product form with pre-filled product data
module.exports.getEditProductPage = asyncHandler(async (req, res) => {
    let product = await productModel.findById(req.params.id);
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/owners/products');
    }
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('edit-product', { product, success, error, user: req.user });
});

// Update an existing product
module.exports.updateProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((e) => e.msg).join(', '));
        return res.redirect(`/owners/products/${req.params.id}/edit`);
    }

    let product = await productModel.findById(req.params.id);
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/owners/products');
    }

    let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
    product.name = name;
    product.price = price;
    product.discount = discount ? Number(discount) : 0;
    product.bgcolor = bgcolor;
    product.panelcolor = panelcolor;
    product.textcolor = textcolor;

    if (req.file) {
        product.image = req.file.buffer;
    }

    await product.save();
    req.flash('success', 'Product updated successfully');
    res.redirect('/owners/products');
});

// Soft delete a product by setting isActive = false
module.exports.deleteProduct = asyncHandler(async (req, res) => {
    let product = await productModel.findById(req.params.id);
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/owners/products');
    }

    product.isActive = false;
    await product.save();

    req.flash('success', 'Product deleted successfully');
    res.redirect('/owners/products');
});
