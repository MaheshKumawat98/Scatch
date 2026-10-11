const express = require('express');
const router = express.Router();
const upload = require('../config/multer-config');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isOwner = require('../middlewares/isOwner');
const productController = require('../controllers/productController');

const { productValidator } = require('../middlewares/validators');

// All routes require authentication and admin privileges
router.use(isLoggedIn, isOwner);

// List all active products
router.get('/', productController.getAllProducts);

// Product creation page and submission
router.get('/create', (req, res) => {
    let success = req.flash('success');
    let error = req.flash('error');
    res.render('createproducts', { success, error });
});
router.post('/', upload.single('image'), productValidator, productController.createProduct);
router.post('/create', upload.single('image'), productValidator, productController.createProduct);

// Edit product page and submission
router.get('/:id/edit', productController.getEditProductPage);
router.post('/:id', upload.single('image'), productValidator, productController.updateProduct);

// Soft delete product
router.post('/:id/delete', productController.deleteProduct);

module.exports = router;