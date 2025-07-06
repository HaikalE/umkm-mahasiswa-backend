const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateJWT, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProject, validatePagination, validateUUID } = require('../middleware/validation');
const { portfolioUpload } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, optionalAuth, projectController.getAllProjects);
router.get('/categories', projectController.getCategories);
router.get('/featured', validatePagination, projectController.getFeaturedProjects);
router.get('/:id', validateUUID('id'), optionalAuth, projectController.getProjectById);
router.get('/:id/applications', validatePagination, validateUUID('id'), projectController.getProjectApplications);

// Protected routes (require authentication)
router.use(authenticateJWT);

// UMKM project management
router.post('/', requireRole('umkm'), validateProject, projectController.createProject);
router.put('/:id', requireRole('umkm'), validateUUID('id'), validateProject, projectController.updateProject);
router.delete('/:id', requireRole('umkm'), validateUUID('id'), projectController.deleteProject);

// Project attachment management
router.post('/:id/attachments', requireRole('umkm'), validateUUID('id'), portfolioUpload.array('attachments', 3), projectController.uploadProjectAttachments);

// Project status management
router.patch('/:id/status', requireRole('umkm'), validateUUID('id'), projectController.updateProjectStatus);
router.patch('/:id/select-student', requireRole('umkm'), validateUUID('id'), projectController.selectStudent);

module.exports = router;