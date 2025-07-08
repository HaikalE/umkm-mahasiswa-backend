const express = require('express');
const router = express.Router();
const umkmActiveProjectController = require('../controllers/umkmActiveProjectController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');

// All routes require authentication and UMKM role
router.use(authenticateJWT);
router.use(requireRole('umkm'));

// @route   GET /api/umkm/active-projects
// @desc    Get UMKM's active projects (projects being worked on by students)
// @access  Private (UMKM only)
router.get('/', umkmActiveProjectController.getUmkmActiveProjects);

// @route   GET /api/umkm/active-projects/stats
// @desc    Get UMKM dashboard stats for active projects
// @access  Private (UMKM only)
router.get('/stats', umkmActiveProjectController.getActiveProjectStats);

// @route   GET /api/umkm/active-projects/:id
// @desc    Get specific active project details for UMKM
// @access  Private (UMKM only)
router.get('/:id', validateUUID('id'), umkmActiveProjectController.getActiveProjectDetails);

// @route   GET /api/umkm/active-projects/:id/chats
// @desc    Get active project chat messages for UMKM
// @access  Private (UMKM only)
router.get('/:id/chats', validateUUID('id'), umkmActiveProjectController.getActiveProjectChats);

// @route   POST /api/umkm/active-projects/:id/chat
// @desc    Send message to student for active project
// @access  Private (UMKM only)
router.post('/:id/chat', validateUUID('id'), umkmActiveProjectController.sendProjectMessage);

// @route   POST /api/umkm/active-projects/:projectId/checkpoint/:checkpointId/review
// @desc    Review checkpoint submission (approve/reject)
// @access  Private (UMKM only)
router.post('/:projectId/checkpoint/:checkpointId/review', 
  validateUUID('projectId'),
  validateUUID('checkpointId'),
  umkmActiveProjectController.reviewCheckpoint
);

// @route   POST /api/umkm/active-projects/:id/complete
// @desc    Approve project completion
// @access  Private (UMKM only)
router.post('/:id/complete', validateUUID('id'), umkmActiveProjectController.approveProjectCompletion);

module.exports = router;
