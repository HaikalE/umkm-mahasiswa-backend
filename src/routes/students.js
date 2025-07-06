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

// Availability management
router.put('/availability', studentController.updateAvailability);

module.exports = router;