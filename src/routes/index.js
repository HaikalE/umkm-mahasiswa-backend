const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const umkmRoutes = require('./umkm');
const studentRoutes = require('./students');
const productRoutes = require('./products');
const projectRoutes = require('./projects');
const applicationRoutes = require('./applications');
const chatRoutes = require('./chats');
const reviewRoutes = require('./reviews');
const notificationRoutes = require('./notifications');
const uploadRoutes = require('./uploads');

// New route modules for enhanced features
const paymentRoutes = require('./payments');
const checkpointRoutes = require('./checkpoints');
const matchingRoutes = require('./matching');
const pricingRoutes = require('./pricing');

// ENHANCED: Active Project Management Routes
const activeProjectRoutes = require('./activeProject');

// API version prefix
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/umkm', umkmRoutes);
router.use('/students', studentRoutes);
router.use('/products', productRoutes);
router.use('/projects', projectRoutes);
router.use('/applications', applicationRoutes);
router.use('/chats', chatRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);

// Enhanced features routes
router.use('/payments', paymentRoutes);
router.use('/checkpoints', checkpointRoutes);
router.use('/matching', matchingRoutes);
router.use('/pricing', pricingRoutes);

// ENHANCED: Active Project Management
router.use('/students/active-project', activeProjectRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'UMKM Mahasiswa Platform API',
    version: '1.2.0',
    status: 'active',
    endpoints: {
      // Core endpoints
      auth: '/api/auth',
      users: '/api/users',
      umkm: '/api/umkm',
      students: '/api/students',
      products: '/api/products',
      projects: '/api/projects',
      applications: '/api/applications',
      chats: '/api/chats',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      uploads: '/api/uploads',
      // Enhanced features
      payments: '/api/payments',
      checkpoints: '/api/checkpoints',
      matching: '/api/matching',
      pricing: '/api/pricing',
      // NEW: Active Project Management
      activeProject: '/api/students/active-project'
    },
    features: {
      payment_system: '50-50 split payment with escrow',
      checkpoint_tracking: 'Project progress monitoring with approvals',
      ai_matching: 'Smart student-project matching algorithm',
      pricing_intelligence: 'Market-based price suggestions',
      real_time_chat: 'Socket.io powered messaging',
      file_uploads: 'Cloudinary integration for media',
      notifications: 'Real-time push notifications',
      // NEW FEATURES
      active_project_management: 'Comprehensive project tracking for ongoing work',
      deliverable_submission: 'File upload and progress tracking system',
      milestone_management: 'Checkpoint-based project progress'
    },
    documentation: '/api/docs'
  });
});

module.exports = router;
