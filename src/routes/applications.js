const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateApplication, validatePagination, validateUUID } = require('../middleware/validation');
const { portfolioUpload } = require('../config/cloudinary');

// Protected routes (require authentication)
router.use(authenticateJWT);

// Student application routes
router.get('/', applicationController.getMyApplications);
router.post('/', requireRole('student'), validateApplication, applicationController.createApplication);
router.put('/:id', requireRole('student'), validateUUID('id'), validateApplication, applicationController.updateApplication);
router.delete('/:id', requireRole('student'), validateUUID('id'), applicationController.withdrawApplication);

// Application attachment management
router.post('/:id/attachments', requireRole('student'), validateUUID('id'), portfolioUpload.array('attachments', 3), applicationController.uploadApplicationAttachments);

// UMKM application management
router.patch('/:id/review', requireRole('umkm'), validateUUID('id'), applicationController.reviewApplication);
router.patch('/:id/accept', requireRole('umkm'), validateUUID('id'), applicationController.acceptApplication);
router.patch('/:id/reject', requireRole('umkm'), validateUUID('id'), applicationController.rejectApplication);

// Get application details
router.get('/:id', validateUUID('id'), applicationController.getApplicationById);

module.exports = router;