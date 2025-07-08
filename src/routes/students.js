const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateJWT, requireRole, optionalAuth } = require('../middleware/auth');
const { validateStudentProfile, validatePagination, validateUUID } = require('../middleware/validation');
const { portfolioUpload } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, optionalAuth, studentController.getAllStudents);
router.get('/featured', validatePagination, studentController.getFeaturedStudents);
router.get('/skills', studentController.getSkills);
router.get('/universities', studentController.getUniversities);
router.get('/search', validatePagination, studentController.searchStudents);
router.get('/:id', validateUUID('id'), optionalAuth, studentController.getStudentById);
router.get('/:id/portfolio', validateUUID('id'), studentController.getStudentPortfolio);
router.get('/:id/reviews', validatePagination, validateUUID('id'), studentController.getStudentReviews);

// Protected routes (require Student authentication)
router.use(authenticateJWT);
router.use(requireRole('student'));

// Student profile management
router.put('/profile', validateStudentProfile, studentController.updateProfile);
router.post('/upload-portfolio', portfolioUpload.array('portfolio', 10), studentController.uploadPortfolio);
router.delete('/portfolio/:fileId', studentController.deletePortfolioFile);
router.post('/upload-cv', portfolioUpload.single('cv'), studentController.uploadCV);

// Student dashboard
router.get('/dashboard/stats', studentController.getDashboardStats);
router.get('/dashboard/opportunities', validatePagination, studentController.getOpportunities);
router.get('/dashboard/recent-activities', studentController.getRecentActivities);

// Student applications and projects
router.get('/my-applications', validatePagination, studentController.getMyApplications);
router.get('/my-projects', validatePagination, studentController.getMyProjects);
router.get('/recommendations', validatePagination, studentController.getRecommendations);

// ENHANCED: Active Project Management
router.get('/active-project', studentController.getActiveProject);
router.get('/active-project/details', studentController.getActiveProjectDetails);
router.get('/active-project/checkpoints', studentController.getActiveProjectCheckpoints);
router.post('/active-project/checkpoint/:checkpointId/submit', portfolioUpload.array('deliverables', 5), studentController.submitCheckpoint);
router.get('/active-project/chats', studentController.getActiveProjectChats);
router.post('/active-project/chat', studentController.sendProjectMessage);
router.post('/active-project/deliverables', portfolioUpload.array('files', 10), studentController.uploadProjectDeliverables);
router.put('/active-project/status', studentController.updateProjectStatus);

// Project completion
router.post('/active-project/complete', studentController.completeProject);
router.post('/active-project/request-completion', studentController.requestProjectCompletion);

// Availability management
router.put('/availability', studentController.updateAvailability);

module.exports = router;