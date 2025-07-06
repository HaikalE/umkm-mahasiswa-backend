const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create transports
const transports = [
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'umkm-mahasiswa-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Create request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logger
const errorLogger = (error, req, res, next) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(error);
};

// Database logger
const dbLogger = {
  query: (sql, timing) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database query', {
        sql: sql.replace(/\s+/g, ' ').trim(),
        duration: timing
      });
    }
  },
  
  error: (error, sql) => {
    logger.error('Database error', {
      error: error.message,
      sql: sql?.replace(/\s+/g, ' ').trim()
    });
  }
};

// Auth logger
const authLogger = {
  login: (userId, userType, ip) => {
    logger.info('User login', {
      userId,
      userType,
      ip,
      event: 'login'
    });
  },
  
  logout: (userId, ip) => {
    logger.info('User logout', {
      userId,
      ip,
      event: 'logout'
    });
  },
  
  register: (userId, userType, email, ip) => {
    logger.info('User registration', {
      userId,
      userType,
      email,
      ip,
      event: 'register'
    });
  },
  
  authFailure: (email, reason, ip) => {
    logger.warn('Authentication failure', {
      email,
      reason,
      ip,
      event: 'auth_failure'
    });
  }
};

// Security logger
const securityLogger = {
  rateLimitExceeded: (ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      event: 'rate_limit_exceeded'
    });
  },
  
  suspiciousActivity: (userId, activity, ip) => {
    logger.warn('Suspicious activity detected', {
      userId,
      activity,
      ip,
      event: 'suspicious_activity'
    });
  },
  
  invalidToken: (token, ip) => {
    logger.warn('Invalid token attempt', {
      token: token?.substring(0, 10) + '...',
      ip,
      event: 'invalid_token'
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  dbLogger,
  authLogger,
  securityLogger
};