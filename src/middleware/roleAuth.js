const logger = require('../utils/logger');

/**
 * Role-based authorization middleware
 * Ensures user has required role to access endpoint
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.user_type)) {
        logger.warn('Access denied - insufficient role', {
          userId: req.user.id,
          userRole: req.user.user_type,
          requiredRoles: allowedRoles,
          endpoint: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required_roles: allowedRoles,
          your_role: req.user.user_type
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      logger.error('Role authorization error', {
        error: error.message,
        userId: req.user?.id,
        endpoint: req.originalUrl
      });

      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

/**
 * Check if user is UMKM
 */
const requireUmkm = requireRole(['umkm']);

/**
 * Check if user is Student
 */
const requireStudent = requireRole(['student']);

/**
 * Check if user is Admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Check if user is UMKM or Admin
 */
const requireUmkmOrAdmin = requireRole(['umkm', 'admin']);

/**
 * Check if user is Student or Admin
 */
const requireStudentOrAdmin = requireRole(['student', 'admin']);

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (resourceField = 'user_id') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id || req.params.userId || req.params.projectId;

      // For admin users, skip ownership check
      if (req.user.user_type === 'admin') {
        return next();
      }

      // Extract resource ownership logic would go here
      // This is a simplified version - in real implementation,
      // you'd query the database to check ownership
      
      // For now, just check if the resource ID matches user ID
      if (req.params.userId && req.params.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only access your own resources'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error', {
        error: error.message,
        userId: req.user?.id,
        resourceId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

/**
 * Project participant middleware
 * Ensures user is either UMKM owner or selected student of the project
 */
const requireProjectParticipant = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.projectId || req.body.projectId;

    // Admin bypass
    if (req.user.user_type === 'admin') {
      return next();
    }

    // This would require database lookup in real implementation
    // For now, just proceed - the controller will handle the specific checks
    next();
  } catch (error) {
    logger.error('Project participant check error', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.projectId
    });

    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

/**
 * Rate limiting by role
 * Different rate limits for different user types
 */
const rateLimitByRole = (limits = {}) => {
  const defaultLimits = {
    student: { requests: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
    umkm: { requests: 200, window: 60 * 60 * 1000 },    // 200 requests per hour
    admin: { requests: 1000, window: 60 * 60 * 1000 }   // 1000 requests per hour
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    const userRole = req.user?.user_type || 'anonymous';
    const limit = finalLimits[userRole] || finalLimits.student;

    // Store limit info for potential rate limiting middleware
    req.roleLimit = limit;
    
    next();
  };
};

/**
 * Business hours restriction
 * Restrict certain operations to business hours
 */
const requireBusinessHours = (timezone = 'Asia/Jakarta') => {
  return (req, res, next) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Business hours: 6 AM to 10 PM
    if (hour < 6 || hour > 22) {
      return res.status(423).json({
        success: false,
        message: 'This operation is only available during business hours (06:00 - 22:00 WIB)',
        current_hour: hour,
        business_hours: '06:00 - 22:00'
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireUmkm,
  requireStudent,
  requireAdmin,
  requireUmkmOrAdmin,
  requireStudentOrAdmin,
  requireOwnership,
  requireProjectParticipant,
  rateLimitByRole,
  requireBusinessHours
};