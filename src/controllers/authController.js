const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { admin } = require('../config/firebase');
const db = require('../database/models');
const { User, UmkmProfile, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, full_name, user_type, phone, firebase_uid } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    full_name,
    user_type,
    phone,
    firebase_uid
  });

  // Create user profile based on type
  if (user_type === 'umkm') {
    await UmkmProfile.create({
      user_id: user.id,
      business_name: full_name // Default business name
    });
  } else if (user_type === 'student') {
    await StudentProfile.create({
      user_id: user.id,
      university: '', // Will be updated in profile
      major: '' // Will be updated in profile
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Save refresh token
  await user.update({ refresh_token: refreshToken });

  // Get user with profile
  const userWithProfile = await User.findByPk(user.id, {
    attributes: { exclude: ['password', 'refresh_token'] },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile'
      },
      {
        model: StudentProfile,
        as: 'studentProfile'
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userWithProfile,
      token: accessToken, // FIXED: Changed from tokens to token for frontend compatibility
      refreshToken: refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile'
      },
      {
        model: StudentProfile,
        as: 'studentProfile'
      }
    ]
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Check password
  if (!user.password || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Update last login and refresh token
  await user.update({ 
    last_login: new Date(),
    refresh_token: refreshToken 
  });

  // Remove sensitive data
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.refresh_token;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token: accessToken, // FIXED: Changed from tokens to token for frontend compatibility
      refreshToken: refreshToken
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
  
  // Update refresh token
  await user.update({ refresh_token: newRefreshToken });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: accessToken, // FIXED: Changed from tokens to token for frontend compatibility
      refreshToken: newRefreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Clear refresh token
  await user.update({ refresh_token: null });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Verify Firebase token
// @route   POST /api/auth/verify-firebase
// @access  Public
const verifyFirebaseToken = asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({
      success: false,
      message: 'Firebase token is required'
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    res.json({
      success: true,
      message: 'Firebase token verified',
      data: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token'
    });
  }
});

// @desc    Login with Firebase
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = asyncHandler(async (req, res) => {
  const { firebaseToken, user_type, full_name } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({
      success: false,
      message: 'Firebase token is required'
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, email_verified } = decodedToken;

    // Find or create user
    let user = await User.findOne({
      where: { firebase_uid: uid },
      include: [
        {
          model: UmkmProfile,
          as: 'umkmProfile'
        },
        {
          model: StudentProfile,
          as: 'studentProfile'
        }
      ]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firebase_uid: uid,
        full_name: full_name || decodedToken.name || 'User',
        user_type: user_type || 'student',
        is_verified: email_verified
      });

      // Create profile
      if (user_type === 'umkm') {
        await UmkmProfile.create({
          user_id: user.id,
          business_name: full_name || 'Business'
        });
      } else {
        await StudentProfile.create({
          user_id: user.id,
          university: '',
          major: ''
        });
      }

      // Reload user with profile
      user = await User.findByPk(user.id, {
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile'
          },
          {
            model: StudentProfile,
            as: 'studentProfile'
          }
        ]
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Update last login and refresh token
    await user.update({ 
      last_login: new Date(),
      refresh_token: refreshToken 
    });

    // Remove sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refresh_token;

    res.json({
      success: true,
      message: 'Firebase login successful',
      data: {
        user: userResponse,
        token: accessToken, // FIXED: Changed from tokens to token for frontend compatibility
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  // TODO: Implement password reset functionality
  res.json({
    success: true,
    message: 'Password reset functionality will be implemented soon'
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // TODO: Implement password reset functionality
  res.json({
    success: true,
    message: 'Password reset functionality will be implemented soon'
  });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  // TODO: Implement email verification
  res.json({
    success: true,
    message: 'Email verification will be implemented soon'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  // TODO: Implement resend verification
  res.json({
    success: true,
    message: 'Resend verification will be implemented soon'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyFirebaseToken,
  firebaseLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};