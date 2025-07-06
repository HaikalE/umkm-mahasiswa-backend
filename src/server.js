const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
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

// Initialize Firebase
initializeFirebase();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-firebase-token'],
  credentials: true
};
app.use(cors(corsOptions));

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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'UMKM Mahasiswa Backend API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'UMKM Mahasiswa Platform API Documentation',
    version: '1.0.0',
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
      }
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socketHandler(io, socket);
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (create tables if they don't exist)
    await db.sequelize.sync({ force: false });
    console.log('✅ Database synchronized successfully.');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
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