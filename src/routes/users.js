const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const { avatarUpload } = require('../config/cloudinary');
const { validatePagination } = require('../middleware/validation');

// Protected routes (require authentication)
router.use(authenticateJWT);

// User profile management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);

// Avatar upload
router.post('/upload-avatar', avatarUpload.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', userController.deleteAvatar);

// User preferences and settings
router.get('/settings', userController.getSettings);
router.put('/settings', userController.updateSettings);

// User statistics
router.get('/stats', userController.getUserStats);

// Search users (for chat/collaboration)
router.get('/search', validatePagination, userController.searchUsers);

// Follow/Unfollow (for future social features)
router.post('/follow/:userId', userController.followUser);
router.delete('/follow/:userId', userController.unfollowUser);
router.get('/followers', validatePagination, userController.getFollowers);
router.get('/following', validatePagination, userController.getFollowing);

module.exports = router;