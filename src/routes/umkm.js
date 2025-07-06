const express = require('express');
const router = express.Router();
const umkmController = require('../controllers/umkmController');
const { authenticateJWT, requireRole, optionalAuth } = require('../middleware/auth');
const { validateUmkmProfile, validatePagination, validateUUID } = require('../middleware/validation');
const { productUpload } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, optionalAuth, umkmController.getAllUmkm);
router.get('/featured', validatePagination, umkmController.getFeaturedUmkm);
router.get('/categories', umkmController.getCategories);
router.get('/search', validatePagination, umkmController.searchUmkm);
router.get('/:id', validateUUID('id'), optionalAuth, umkmController.getUmkmById);
router.get('/:id/products', validatePagination, validateUUID('id'), umkmController.getUmkmProducts);
router.get('/:id/projects', validatePagination, validateUUID('id'), umkmController.getUmkmProjects);
router.get('/:id/reviews', validatePagination, validateUUID('id'), umkmController.getUmkmReviews);

// Protected routes (require UMKM authentication)
router.use(authenticateJWT);
router.use(requireRole('umkm'));

// UMKM profile management
router.put('/profile', validateUmkmProfile, umkmController.updateProfile);
router.post('/upload-logo', productUpload.single('logo'), umkmController.uploadLogo);
router.post('/upload-banner', productUpload.single('banner'), umkmController.uploadBanner);

// UMKM dashboard
router.get('/dashboard/stats', umkmController.getDashboardStats);
router.get('/dashboard/analytics', umkmController.getAnalytics);
router.get('/dashboard/recent-activities', umkmController.getRecentActivities);

// UMKM management
router.get('/my-products', validatePagination, umkmController.getMyProducts);
router.get('/my-projects', validatePagination, umkmController.getMyProjects);
router.get('/applicants', validatePagination, umkmController.getApplicants);

module.exports = router;