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

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'UMKM Mahasiswa Platform API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
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
      uploads: '/api/uploads'
    },
    documentation: '/api/docs'
  });
});

module.exports = router;