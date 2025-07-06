const db = require('../database/models');
const { User, UmkmProfile, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');
const { Op } = require('sequelize');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
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

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone } = req.body;
  
  const user = await User.findByPk(req.user.id);
  
  // Update basic user info
  await user.update({
    full_name: full_name || user.full_name,
    phone: phone || user.phone
  });

  // Get updated user with profile
  const updatedUser = await User.findByPk(user.id, {
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

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
const deleteProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  // Delete avatar from cloudinary if exists
  if (user.avatar_url) {
    const publicId = getPublicIdFromUrl(user.avatar_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
  
  // Soft delete - deactivate account
  await user.update({ is_active: false });
  
  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// @desc    Upload avatar
// @route   POST /api/users/upload-avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const user = await User.findByPk(req.user.id);
  
  // Delete old avatar if exists
  if (user.avatar_url) {
    const publicId = getPublicIdFromUrl(user.avatar_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
  
  // Update user with new avatar URL
  await user.update({ avatar_url: req.file.path });
  
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar_url: req.file.path
    }
  });
});

// @desc    Delete avatar
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  if (user.avatar_url) {
    const publicId = getPublicIdFromUrl(user.avatar_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
    
    await user.update({ avatar_url: null });
  }
  
  res.json({
    success: true,
    message: 'Avatar deleted successfully'
  });
});

// @desc    Get user settings
// @route   GET /api/users/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  // TODO: Implement user settings
  res.json({
    success: true,
    message: 'User settings will be implemented soon',
    data: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profile_visibility: 'public',
        show_contact: true
      }
    }
  });
});

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
  // TODO: Implement user settings update
  res.json({
    success: true,
    message: 'Settings updated successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.user_type;
  
  let stats = {};
  
  if (userType === 'umkm') {
    // UMKM stats
    const [productCount, projectCount, reviewCount] = await Promise.all([
      db.Product.count({ where: { umkm_id: userId } }),
      db.Project.count({ where: { umkm_id: userId } }),
      db.Review.count({ where: { reviewed_id: userId } })
    ]);
    
    stats = {
      total_products: productCount,
      total_projects: projectCount,
      total_reviews: reviewCount,
      average_rating: req.user.umkmProfile?.rating || 0
    };
  } else {
    // Student stats
    const [applicationCount, completedProjectCount, reviewCount] = await Promise.all([
      db.Application.count({ where: { student_id: userId } }),
      db.Application.count({ 
        where: { 
          student_id: userId,
          status: 'accepted'
        }
      }),
      db.Review.count({ where: { reviewed_id: userId } })
    ]);
    
    stats = {
      total_applications: applicationCount,
      completed_projects: completedProjectCount,
      total_reviews: reviewCount,
      average_rating: req.user.studentProfile?.rating || 0
    };
  }
  
  res.json({
    success: true,
    data: stats
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { q, type, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const whereClause = {
    is_active: true,
    id: { [Op.ne]: req.user.id } // Exclude current user
  };
  
  if (q) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } }
    ];
  }
  
  if (type) {
    whereClause.user_type = type;
  }
  
  const { count, rows } = await User.findAndCountAll({
    where: whereClause,
    attributes: ['id', 'full_name', 'email', 'user_type', 'avatar_url', 'created_at'],
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile',
        attributes: ['business_name', 'business_type', 'city', 'rating']
      },
      {
        model: StudentProfile,
        as: 'studentProfile',
        attributes: ['university', 'major', 'experience_level', 'rating']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Follow user
// @route   POST /api/users/follow/:userId
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  // TODO: Implement follow functionality
  res.json({
    success: true,
    message: 'Follow functionality will be implemented soon'
  });
});

// @desc    Unfollow user
// @route   DELETE /api/users/follow/:userId
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  // TODO: Implement unfollow functionality
  res.json({
    success: true,
    message: 'Unfollow functionality will be implemented soon'
  });
});

// @desc    Get followers
// @route   GET /api/users/followers
// @access  Private
const getFollowers = asyncHandler(async (req, res) => {
  // TODO: Implement get followers
  res.json({
    success: true,
    message: 'Followers functionality will be implemented soon',
    data: { followers: [] }
  });
});

// @desc    Get following
// @route   GET /api/users/following
// @access  Private
const getFollowing = asyncHandler(async (req, res) => {
  // TODO: Implement get following
  res.json({
    success: true,
    message: 'Following functionality will be implemented soon',
    data: { following: [] }
  });
});

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  uploadAvatar,
  deleteAvatar,
  getSettings,
  updateSettings,
  getUserStats,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
};