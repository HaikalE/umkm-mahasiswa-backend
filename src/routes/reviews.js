const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT, optionalAuth } = require('../middleware/auth');
const { validateReview, validatePagination, validateUUID } = require('../middleware/validation');
const { reviewUpload } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, optionalAuth, reviewController.getAllReviews);
router.get('/:id', validateUUID('id'), reviewController.getReviewById);

// Protected routes (require authentication)
router.use(authenticateJWT);

// Review management
router.post('/', validateReview, reviewController.createReview);
router.put('/:id', validateUUID('id'), validateReview, reviewController.updateReview);
router.delete('/:id', validateUUID('id'), reviewController.deleteReview);

// Review images
router.post('/:id/images', validateUUID('id'), reviewUpload.array('images', 3), reviewController.uploadReviewImages);

// Review interactions
router.post('/:id/helpful', validateUUID('id'), reviewController.markHelpful);
router.post('/:id/response', validateUUID('id'), reviewController.respondToReview);
router.post('/:id/report', validateUUID('id'), reviewController.reportReview);

// Get reviews by user/product/project
router.get('/user/:userId', validatePagination, validateUUID('userId'), reviewController.getReviewsByUser);
router.get('/product/:productId', validatePagination, validateUUID('productId'), reviewController.getReviewsByProduct);
router.get('/project/:projectId', validatePagination, validateUUID('projectId'), reviewController.getReviewsByProject);

module.exports = router;