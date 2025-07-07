const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateJWT } = require('../middleware/auth');
const { 
  avatarUpload, 
  productUpload, 
  portfolioUpload, 
  chatUpload, 
  reviewUpload 
} = require('../config/cloudinary');

// Protected routes (require authentication)
router.use(authenticateJWT);

// Single file uploads
router.post('/avatar', avatarUpload, uploadController.uploadAvatar);
router.post('/product', productUpload.single('file'), uploadController.uploadProductImage);
router.post('/portfolio', portfolioUpload.single('file'), uploadController.uploadPortfolioFile);
router.post('/chat', chatUpload.single('file'), uploadController.uploadChatFile);
router.post('/review', reviewUpload.single('file'), uploadController.uploadReviewImage);

// Multiple file uploads
router.post('/products', productUpload.array('files', 5), uploadController.uploadProductImages);
router.post('/portfolios', portfolioUpload.array('files', 10), uploadController.uploadPortfolioFiles);
router.post('/reviews', reviewUpload.array('files', 3), uploadController.uploadReviewImages);

// Delete file
router.delete('/file', uploadController.deleteFile);

// Get upload info
router.get('/info', uploadController.getUploadInfo);

module.exports = router;