const db = require('../database/models');
const { User, UmkmProfile, Product, Project, Application, Review } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all UMKM
// @route   GET /api/umkm
// @access  Public
const getAllUmkm = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    business_type, 
    city, 
    sort = 'created_at', 
    order = 'DESC',
    search
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Build where clause for UMKM profile
  const umkmWhere = {};
  
  if (business_type) {
    umkmWhere.business_type = business_type;
  }
  
  if (city) {
    umkmWhere.city = { [Op.iLike]: `%${city}%` };
  }
  
  if (search) {
    umkmWhere[Op.or] = [
      { business_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  const { count, rows } = await User.findAndCountAll({
    where: {
      user_type: 'umkm',
      is_active: true
    },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile',
        where: umkmWhere,
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[{ model: UmkmProfile, as: 'umkmProfile' }, sort, order.toUpperCase()]],
    distinct: true
  });
  
  res.json({
    success: true,
    data: {
      umkm: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get UMKM by ID
// @route   GET /api/umkm/:id
// @access  Public
const getUmkmById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const umkm = await User.findOne({
    where: { 
      id, 
      user_type: 'umkm',
      is_active: true 
    },
    attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url', 'created_at'],
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile',
        required: true
      },
      {
        model: Product,
        as: 'products',
        where: { status: 'active' },
        required: false,
        limit: 6,
        order: [['created_at', 'DESC']]
      },
      {
        model: Project,
        as: 'projects',
        where: { status: 'open' },
        required: false,
        limit: 6,
        order: [['created_at', 'DESC']]
      },
      {
        model: Review,
        as: 'receivedReviews',
        where: { status: 'active' },
        required: false,
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'full_name', 'avatar_url']
          }
        ]
      }
    ]
  });
  
  if (!umkm) {
    return res.status(404).json({
      success: false,
      message: 'UMKM not found'
    });
  }
  
  res.json({
    success: true,
    data: umkm
  });
});

// @desc    Get featured UMKM
// @route   GET /api/umkm/featured
// @access  Public
const getFeaturedUmkm = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const umkm = await User.findAll({
    where: {
      user_type: 'umkm',
      is_active: true
    },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile',
        where: { is_premium: true },
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    order: [[{ model: UmkmProfile, as: 'umkmProfile' }, 'rating', 'DESC']]
  });
  
  res.json({
    success: true,
    data: umkm
  });
});

// @desc    Search UMKM
// @route   GET /api/umkm/search
// @access  Public
const searchUmkm = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }
  
  const { count, rows } = await User.findAndCountAll({
    where: {
      user_type: 'umkm',
      is_active: true,
      [Op.or]: [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { '$umkmProfile.business_name$': { [Op.iLike]: `%${q}%` } },
        { '$umkmProfile.description$': { [Op.iLike]: `%${q}%` } }
      ]
    },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile',
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[{ model: UmkmProfile, as: 'umkmProfile' }, 'rating', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      umkm: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get UMKM categories
// @route   GET /api/umkm/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = [
    { value: 'kuliner', label: 'Kuliner & Makanan' },
    { value: 'fashion', label: 'Fashion & Pakaian' },
    { value: 'teknologi', label: 'Teknologi' },
    { value: 'kerajinan', label: 'Kerajinan Tangan' },
    { value: 'jasa', label: 'Jasa & Layanan' },
    { value: 'perdagangan', label: 'Perdagangan' },
    { value: 'pertanian', label: 'Pertanian' },
    { value: 'lainnya', label: 'Lainnya' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// @desc    Get UMKM products
// @route   GET /api/umkm/:id/products
// @access  Public
const getUmkmProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Product.findAndCountAll({
    where: {
      umkm_id: id,
      status: 'active'
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get UMKM projects
// @route   GET /api/umkm/:id/projects
// @access  Public
const getUmkmProjects = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Project.findAndCountAll({
    where: {
      umkm_id: id,
      status: 'open'
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      projects: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get UMKM reviews
// @route   GET /api/umkm/:id/reviews
// @access  Public
const getUmkmReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Review.findAndCountAll({
    where: {
      reviewed_id: id,
      status: 'active'
    },
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Update UMKM profile
// @route   PUT /api/umkm/profile
// @access  Private (UMKM only)
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;
  
  // Update user basic info
  const { full_name, phone, ...umkmData } = profileData;
  
  if (full_name || phone) {
    await User.update(
      { full_name, phone },
      { where: { id: userId } }
    );
  }
  
  // Update UMKM profile
  let umkmProfile = await UmkmProfile.findOne({ where: { user_id: userId } });
  
  if (umkmProfile) {
    await umkmProfile.update(umkmData);
  } else {
    umkmProfile = await UmkmProfile.create({
      user_id: userId,
      ...umkmData
    });
  }
  
  // Get updated profile
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password', 'refresh_token'] },
    include: [
      {
        model: UmkmProfile,
        as: 'umkmProfile'
      }
    ]
  });
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// @desc    Upload UMKM logo
// @route   POST /api/umkm/upload-logo
// @access  Private (UMKM only)
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No logo uploaded'
    });
  }
  
  const userId = req.user.id;
  const umkmProfile = await UmkmProfile.findOne({ where: { user_id: userId } });
  
  if (!umkmProfile) {
    return res.status(404).json({
      success: false,
      message: 'UMKM profile not found'
    });
  }
  
  // Delete old logo if exists
  if (umkmProfile.logo_url) {
    const publicId = getPublicIdFromUrl(umkmProfile.logo_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
  
  // Update with new logo
  await umkmProfile.update({ logo_url: req.file.path });
  
  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      logo_url: req.file.path
    }
  });
});

// @desc    Upload UMKM banner
// @route   POST /api/umkm/upload-banner
// @access  Private (UMKM only)
const uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No banner uploaded'
    });
  }
  
  const userId = req.user.id;
  const umkmProfile = await UmkmProfile.findOne({ where: { user_id: userId } });
  
  if (!umkmProfile) {
    return res.status(404).json({
      success: false,
      message: 'UMKM profile not found'
    });
  }
  
  // Delete old banner if exists
  if (umkmProfile.banner_url) {
    const publicId = getPublicIdFromUrl(umkmProfile.banner_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
  
  // Update with new banner
  await umkmProfile.update({ banner_url: req.file.path });
  
  res.json({
    success: true,
    message: 'Banner uploaded successfully',
    data: {
      banner_url: req.file.path
    }
  });
});

// @desc    Get UMKM dashboard stats
// @route   GET /api/umkm/dashboard/stats
// @access  Private (UMKM only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [productCount, projectCount, applicationCount, reviewCount] = await Promise.all([
    Product.count({ where: { umkm_id: userId } }),
    Project.count({ where: { umkm_id: userId } }),
    Application.count({
      include: [{
        model: Project,
        as: 'project',
        where: { umkm_id: userId }
      }]
    }),
    Review.count({ where: { reviewed_id: userId, status: 'active' } })
  ]);
  
  res.json({
    success: true,
    data: {
      total_products: productCount,
      total_projects: projectCount,
      total_applications: applicationCount,
      total_reviews: reviewCount,
      average_rating: req.user.umkmProfile?.rating || 0
    }
  });
});

// @desc    Get UMKM analytics
// @route   GET /api/umkm/dashboard/analytics
// @access  Private (UMKM only)
const getAnalytics = asyncHandler(async (req, res) => {
  // TODO: Implement detailed analytics
  res.json({
    success: true,
    message: 'Analytics will be implemented soon',
    data: {
      views: {
        products: 0,
        projects: 0,
        profile: 0
      },
      engagement: {
        messages: 0,
        applications: 0,
        reviews: 0
      }
    }
  });
});

// @desc    Get recent activities
// @route   GET /api/umkm/dashboard/recent-activities
// @access  Private (UMKM only)
const getRecentActivities = asyncHandler(async (req, res) => {
  // TODO: Implement recent activities
  res.json({
    success: true,
    message: 'Recent activities will be implemented soon',
    data: { activities: [] }
  });
});

// @desc    Get my products
// @route   GET /api/umkm/my-products
// @access  Private (UMKM only)
const getMyProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const whereClause = { umkm_id: userId };
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Product.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get my projects
// @route   GET /api/umkm/my-projects
// @access  Private (UMKM only)
const getMyProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const whereClause = { umkm_id: userId };
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Project.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      projects: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get applicants for my projects
// @route   GET /api/umkm/applicants
// @access  Private (UMKM only)
const getApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Application.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Project,
        as: 'project',
        where: { umkm_id: userId },
        attributes: ['id', 'title', 'category']
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: db.StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major', 'experience_level', 'rating']
          }
        ]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      applications: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

module.exports = {
  getAllUmkm,
  getUmkmById,
  getFeaturedUmkm,
  searchUmkm,
  getCategories,
  getUmkmProducts,
  getUmkmProjects,
  getUmkmReviews,
  updateProfile,
  uploadLogo,
  uploadBanner,
  getDashboardStats,
  getAnalytics,
  getRecentActivities,
  getMyProducts,
  getMyProjects,
  getApplicants
};