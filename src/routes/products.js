const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateJWT, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProduct, validatePagination, validateUUID } = require('../middleware/validation');
const { productUpload } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, optionalAuth, productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/featured', validatePagination, productController.getFeaturedProducts);
router.get('/:id', validateUUID('id'), optionalAuth, productController.getProductById);

// Protected routes (require authentication)
router.use(authenticateJWT);
router.use(requireRole('umkm'));

// UMKM product management
router.post('/', validateProduct, productController.createProduct);
router.put('/:id', validateUUID('id'), validateProduct, productController.updateProduct);
router.delete('/:id', validateUUID('id'), productController.deleteProduct);

// Product image management
router.post('/:id/images', validateUUID('id'), productUpload.array('images', 5), productController.uploadProductImages);

module.exports = router;