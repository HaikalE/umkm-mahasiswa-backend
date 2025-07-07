const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database/models');
const routes = require('./routes');
const { initializeFirebase } = require('./config/firebase');
const { errorHandler, notFound } = require('./middleware/error');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Enhanced error handling for initialization
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('📍 Stack:', error.stack);
  console.error('💡 Check your code for syntax errors or missing dependencies');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('📍 Reason:', reason);
  console.error('💡 Check your async/await code and promise handling');
  process.exit(1);
});

// Initialize Firebase with error handling
try {
  initializeFirebase();
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('🔄 Continuing without Firebase - using JWT authentication only');
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving static files
}));
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-firebase-token'],
  credentials: true
};
app.use(cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Socket.io integration
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    
    res.status(200).json({
      status: 'OK',
      message: 'UMKM Mahasiswa Backend API is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      services: {
        firebase: process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id' ? 'enabled' : 'disabled',
        cloudinary: process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-name' ? 'enabled' : 'disabled'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api', routes);

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'UMKM Mahasiswa Platform API Documentation',
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh token',
        'POST /api/auth/logout': 'Logout user',
        'POST /api/auth/verify-firebase': 'Verify Firebase token'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PUT /api/users/profile': 'Update user profile',
        'POST /api/users/upload-avatar': 'Upload avatar'
      },
      umkm: {
        'GET /api/umkm': 'Get all UMKM',
        'GET /api/umkm/:id': 'Get UMKM by ID',
        'PUT /api/umkm/profile': 'Update UMKM profile'
      },
      products: {
        'GET /api/products': 'Get all products',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create new product',
        'PUT /api/products/:id': 'Update product',
        'DELETE /api/products/:id': 'Delete product'
      },
      projects: {
        'GET /api/projects': 'Get all projects',
        'GET /api/projects/:id': 'Get project by ID',
        'POST /api/projects': 'Create new project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project'
      },
      applications: {
        'GET /api/applications': 'Get applications',
        'POST /api/applications': 'Create application',
        'PUT /api/applications/:id': 'Update application status'
      },
      chats: {
        'GET /api/chats': 'Get chat list',
        'GET /api/chats/:id/messages': 'Get chat messages',
        'POST /api/chats/:id/messages': 'Send message'
      },
      reviews: {
        'GET /api/reviews': 'Get reviews',
        'POST /api/reviews': 'Create review'
      },
      uploads: {
        'GET /uploads/:filename': 'Access uploaded files (local storage)',
        'POST /api/uploads': 'Upload files'
      }
    },
    notes: {
      authentication: 'Include Authorization: Bearer <token> header for protected endpoints',
      fileUploads: 'Files are stored locally in uploads/ directory if Cloudinary is not configured',
      realtime: 'Socket.io connection available at same host for real-time features'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  try {
    socketHandler(io, socket);
  } catch (error) {
    console.error('❌ Socket handler error:', error.message);
    socket.disconnect(true);
  }
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔍 Checking database models...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Test model loading
    console.log('📋 Available models:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));
    
    // Sync database (create tables if they don't exist)
    await db.sequelize.sync({ force: false });
    console.log('✅ Database synchronized successfully.');
    
    // Start server
    server.listen(PORT, () => {
      console.log('🎉 =================================');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`📁 Static Files: http://localhost:${PORT}/uploads/`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id' ? 'Enabled' : 'Disabled (dev mode)'}`);
      console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-name' ? 'Enabled' : 'Disabled (local storage)'}`);
      console.log('🎉 =================================');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    console.error('📍 Stack trace:', error.stack);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Database connection failed. Possible solutions:');
      console.error('   - Check if PostgreSQL is running');
      console.error('   - Verify database credentials in .env file');
      console.error('   - Ensure database exists');
      console.error('   - Check network connectivity');
    } else if (error.code === 'MODULE_NOT_FOUND') {
      console.error('💡 Missing dependency. Run: npm install');
    } else {
      console.error('💡 Check your configuration and try again');
    }
    
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    db.sequelize.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    db.sequelize.close();
    process.exit(0);
  });
});

module.exports = { app, server, io };