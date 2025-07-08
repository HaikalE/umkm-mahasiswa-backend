const express = require('express');
const router = express.Router();
const activeProjectController = require('../controllers/activeProjectController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');
const { portfolioUpload } = require('../config/cloudinary');

// All routes require authentication and student role
router.use(authenticateJWT);
router.use(requireRole('student'));

// @route   GET /api/students/active-project
// @desc    Get student's active project basic info
// @access  Private (Student only)
router.get('/', activeProjectController.getStudentActiveProject);

// @route   GET /api/students/active-project/details
// @desc    Get detailed active project information with progress
// @access  Private (Student only)
router.get('/details', activeProjectController.getActiveProjectDetails);

// @route   GET /api/students/active-project/checkpoints
// @desc    Get active project checkpoints
// @access  Private (Student only)
router.get('/checkpoints', activeProjectController.getActiveProjectCheckpoints);

// @route   POST /api/students/active-project/checkpoint/:id/submit
// @desc    Submit checkpoint deliverable
// @access  Private (Student only)
router.post('/checkpoint/:id/submit', 
  validateUUID('id'), 
  portfolioUpload.array('deliverables', 5), 
  activeProjectController.submitCheckpoint
);

// @route   GET /api/students/active-project/chats
// @desc    Get chat messages for active project
// @access  Private (Student only)
router.get('/chats', activeProjectController.getActiveProjectChats);

// @route   POST /api/students/active-project/chat
// @desc    Send message to UMKM for active project
// @access  Private (Student only)
router.post('/chat', activeProjectController.sendProjectMessage);

// @route   POST /api/students/active-project/deliverables
// @desc    Upload project deliverables
// @access  Private (Student only)
router.post('/deliverables', 
  portfolioUpload.array('files', 10), 
  activeProjectController.uploadProjectDeliverables
);

// @route   POST /api/students/active-project/request-completion
// @desc    Request project completion
// @access  Private (Student only)
router.post('/request-completion', activeProjectController.requestProjectCompletion);

// @route   GET /api/students/active-project/payment
// @desc    Get project payment information
// @access  Private (Student only)
router.get('/payment', activeProjectController.getProjectPaymentInfo);

module.exports = router;
