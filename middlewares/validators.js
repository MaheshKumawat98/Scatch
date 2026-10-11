const { body } = require('express-validator');

// User Registration Validator
const registerValidator = [
    body('fullname')
        .trim()
        .notEmpty()
        .withMessage('Full name is required'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('A valid email address is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];

// User Login Validator
const loginValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

// Product Creation and Update Validator
const productValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    body('price')
        .isFloat({ gt: 0 })
        .withMessage('Price must be a number greater than 0'),
    body('discount')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount must be between 0 and 100'),
    body('bgcolor')
        .trim()
        .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
        .withMessage('Background color must be a valid hex color code (e.g. #ffffff)'),
    body('panelcolor')
        .trim()
        .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
        .withMessage('Panel color must be a valid hex color code (e.g. #ffffff)'),
    body('textcolor')
        .trim()
        .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
        .withMessage('Text color must be a valid hex color code (e.g. #ffffff)'),
];

// Checkout / Shipping Validator
const checkoutValidator = [
    body('fullname')
        .trim()
        .notEmpty()
        .withMessage('Full name is required'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('pincode')
        .trim()
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be exactly 6 digits'),
    body('phone')
        .trim()
        .matches(/^\d{10}$/)
        .withMessage('Phone number must be exactly 10 digits'),
];

module.exports = {
    registerValidator,
    loginValidator,
    productValidator,
    checkoutValidator,
};
