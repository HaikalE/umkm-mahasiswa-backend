const db = require('../database/models');
const { User, StudentProfile, UmkmProfile, Application, Project, Review } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all students
// @route   GET /api/students
// @access  Public
const getAllStudents = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    university, 
    major,
    experience_level,
    availability,
    sort = 'created_at', 
    order = 'DESC',
    search
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Build where clause for Student profile
  const studentWhere = {};
  
  if (university) {
    studentWhere.university = { [Op.iLike]: `%${university}%` };
  }
  
  if (major) {
    studentWhere.major = { [Op.iLike]: `%${major}%` };
  }
  
  if (experience_level) {
    studentWhere.experience_level = experience_level;
  }
  
  if (availability) {
    studentWhere.availability = availability;
  }
  
  if (search) {
    studentWhere[Op.or] = [
      { bio: { [Op.iLike]: `%${search}%` } },
      { skills: { [Op.contains]: [{ name: { [Op.iLike]: `%${search}%` } }] } }
    ];
  }
  
  const { count, rows } = await User.findAndCountAll({
    where: {
      user_type: 'student',
      is_active: true
    },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        where: studentWhere,
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[{ model: StudentProfile, as: 'studentProfile' }, sort, order.toUpperCase()]],
    distinct: true
  });
  
  res.json({
    success: true,
    data: {
      students: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Public
const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const student = await User.findOne({
    where: { 
      id, 
      user_type: 'student',
      is_active: true 
    },
    attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url', 'created_at'],
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        required: true
      },
      {
        model: Application,
        as: 'applications',
        where: { status: 'accepted' },
        required: false,
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'category'],
            include: [
              {
                model: User,
                as: 'umkm',
                attributes: ['id', 'full_name'],
                include: [
                  {
                    model: UmkmProfile,
                    as: 'umkmProfile',
                    attributes: ['business_name']
                  }
                ]
              }
            ]
          }
        ]
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
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  res.json({
    success: true,
    data: student
  });
});

// @desc    Get featured students
// @route   GET /api/students/featured
// @access  Public
const getFeaturedStudents = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const students = await User.findAll({
    where: {
      user_type: 'student',
      is_active: true
    },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        where: { 
          rating: { [Op.gte]: 4.0 },
          total_projects_completed: { [Op.gte]: 3 }
        },
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    order: [[{ model: StudentProfile, as: 'studentProfile' }, 'rating', 'DESC']]
  });
  
  res.json({
    success: true,
    data: students
  });
});

// @desc    Search students
// @route   GET /api/students/search
// @access  Public
const searchStudents = asyncHandler(async (req, res) => {
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
      user_type: 'student',
      is_active: true,
      [Op.or]: [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { '$studentProfile.university$': { [Op.iLike]: `%${q}%` } },
        { '$studentProfile.major$': { [Op.iLike]: `%${q}%` } },
        { '$studentProfile.bio$': { [Op.iLike]: `%${q}%` } }
      ]
    },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        required: true
      }
    ],
    attributes: ['id', 'full_name', 'avatar_url', 'created_at'],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[{ model: StudentProfile, as: 'studentProfile' }, 'rating', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      students: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get student skills list
// @route   GET /api/students/skills
// @access  Public
const getSkills = asyncHandler(async (req, res) => {
  const skills = [
    // Programming
    { category: 'Programming', skills: ['JavaScript', 'Python', 'PHP', 'Java', 'C++', 'Go', 'Rust'] },
    
    // Web Development
    { category: 'Web Development', skills: ['React', 'Vue.js', 'Angular', 'Node.js', 'Laravel', 'Django', 'Express.js'] },
    
    // Mobile Development
    { category: 'Mobile Development', skills: ['Flutter', 'React Native', 'Android', 'iOS', 'Kotlin', 'Swift'] },
    
    // Design
    { category: 'Design', skills: ['UI/UX Design', 'Graphic Design', 'Photoshop', 'Figma', 'Adobe Illustrator', 'Sketch'] },
    
    // Data & Analytics
    { category: 'Data & Analytics', skills: ['Data Analysis', 'Machine Learning', 'SQL', 'Excel', 'Tableau', 'Power BI'] },
    
    // Marketing
    { category: 'Marketing', skills: ['Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Marketing', 'Google Ads'] },
    
    // Other
    { category: 'Other', skills: ['Content Writing', 'Video Editing', 'Photography', 'Translation', 'Virtual Assistant'] }
  ];
  
  res.json({
    success: true,
    data: skills
  });
});

// @desc    Get universities list
// @route   GET /api/students/universities
// @access  Public
const getUniversities = asyncHandler(async (req, res) => {
  // Get unique universities from database
  const universities = await StudentProfile.findAll({
    attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('university')), 'university']],
    where: {
      university: { [Op.ne]: '' }
    },
    order: [['university', 'ASC']]
  });
  
  const universityList = universities.map(u => u.university);
  
  res.json({
    success: true,
    data: universityList
  });
});

// @desc    Get student portfolio
// @route   GET /api/students/:id/portfolio
// @access  Public
const getStudentPortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const student = await User.findOne({
    where: { 
      id, 
      user_type: 'student',
      is_active: true 
    },
    attributes: ['id', 'full_name', 'avatar_url'],
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        attributes: ['portfolio_url', 'portfolio_files', 'cv_url', 'skills', 'bio', 'github_url', 'linkedin_url'],
        required: true
      }
    ]
  });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  res.json({
    success: true,
    data: student
  });
});

// @desc    Get student reviews
// @route   GET /api/students/:id/reviews
// @access  Public
const getStudentReviews = asyncHandler(async (req, res) => {
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
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
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

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private (Student only)
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;
  
  // Update user basic info
  const { full_name, phone, ...studentData } = profileData;
  
  if (full_name || phone) {
    await User.update(
      { full_name, phone },
      { where: { id: userId } }
    );
  }
  
  // Update Student profile
  let studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  
  if (studentProfile) {
    await studentProfile.update(studentData);
  } else {
    studentProfile = await StudentProfile.create({
      user_id: userId,
      ...studentData
    });
  }
  
  // Get updated profile
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password', 'refresh_token'] },
    include: [
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

// @desc    Upload portfolio files
// @route   POST /api/students/upload-portfolio
// @access  Private (Student only)
const uploadPortfolio = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No portfolio files uploaded'
    });
  }
  
  const userId = req.user.id;
  const studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  
  if (!studentProfile) {
    return res.status(404).json({
      success: false,
      message: 'Student profile not found'
    });
  }
  
  const newFiles = req.files.map(file => ({
    id: file.public_id,
    name: file.originalname,
    url: file.path,
    size: file.size,
    type: file.mimetype,
    uploaded_at: new Date()
  }));
  
  const currentFiles = studentProfile.portfolio_files || [];
  const updatedFiles = [...currentFiles, ...newFiles];
  
  await studentProfile.update({ portfolio_files: updatedFiles });
  
  res.json({
    success: true,
    message: 'Portfolio files uploaded successfully',
    data: {
      portfolio_files: updatedFiles
    }
  });
});

// @desc    Delete portfolio file
// @route   DELETE /api/students/portfolio/:fileId
// @access  Private (Student only)
const deletePortfolioFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user.id;
  
  const studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  
  if (!studentProfile) {
    return res.status(404).json({
      success: false,
      message: 'Student profile not found'
    });
  }
  
  const currentFiles = studentProfile.portfolio_files || [];
  const fileToDelete = currentFiles.find(file => file.id === fileId);
  
  if (!fileToDelete) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio file not found'
    });
  }
  
  // Delete from cloudinary
  await deleteFromCloudinary(fileId);
  
  // Remove from database
  const updatedFiles = currentFiles.filter(file => file.id !== fileId);
  await studentProfile.update({ portfolio_files: updatedFiles });
  
  res.json({
    success: true,
    message: 'Portfolio file deleted successfully'
  });
});

// @desc    Upload CV
// @route   POST /api/students/upload-cv
// @access  Private (Student only)
const uploadCV = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No CV file uploaded'
    });
  }
  
  const userId = req.user.id;
  const studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  
  if (!studentProfile) {
    return res.status(404).json({
      success: false,
      message: 'Student profile not found'
    });
  }
  
  // Delete old CV if exists
  if (studentProfile.cv_url) {
    const publicId = getPublicIdFromUrl(studentProfile.cv_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
  
  // Update with new CV
  await studentProfile.update({ cv_url: req.file.path });
  
  res.json({
    success: true,
    message: 'CV uploaded successfully',
    data: {
      cv_url: req.file.path
    }
  });
});

// @desc    Get student dashboard stats
// @route   GET /api/students/dashboard/stats
// @access  Private (Student only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [applicationCount, acceptedCount, completedCount, reviewCount] = await Promise.all([
    Application.count({ where: { student_id: userId } }),
    Application.count({ where: { student_id: userId, status: 'accepted' } }),
    Application.count({ where: { student_id: userId, status: 'accepted' } }), // TODO: Add completed status
    Review.count({ where: { reviewed_id: userId, status: 'active' } })
  ]);
  
  res.json({
    success: true,
    data: {
      total_applications: applicationCount,
      accepted_applications: acceptedCount,
      completed_projects: completedCount,
      total_reviews: reviewCount,
      average_rating: req.user.studentProfile?.rating || 0
    }
  });
});

// @desc    Get opportunities for student
// @route   GET /api/students/dashboard/opportunities
// @access  Private (Student only)
const getOpportunities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  // Get student skills for matching
  const studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  const studentSkills = studentProfile?.skills || [];
  
  // Find projects that match student skills
  const { count, rows } = await Project.findAndCountAll({
    where: {
      status: 'open',
      experience_level: studentProfile?.experience_level || 'beginner'
    },
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city']
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
      opportunities: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get recent activities
// @route   GET /api/students/dashboard/recent-activities
// @access  Private (Student only)
const getRecentActivities = asyncHandler(async (req, res) => {
  // TODO: Implement recent activities
  res.json({
    success: true,
    message: 'Recent activities will be implemented soon',
    data: { activities: [] }
  });
});

// @desc    Get my applications
// @route   GET /api/students/my-applications
// @access  Private (Student only)
const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const whereClause = { student_id: userId };
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Application.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'category', 'budget_min', 'budget_max'],
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name']
              }
            ]
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

// @desc    Get my projects
// @route   GET /api/students/my-projects
// @access  Private (Student only)
const getMyProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  let whereClause = { student_id: userId };
  if (status === 'active') {
    whereClause.status = 'accepted';
  } else if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Application.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Project,
        as: 'project',
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name']
              }
            ]
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

// @desc    Get recommendations
// @route   GET /api/students/recommendations
// @access  Private (Student only)
const getRecommendations = asyncHandler(async (req, res) => {
  // TODO: Implement AI-based recommendations
  res.json({
    success: true,
    message: 'Recommendations will be implemented soon',
    data: { recommendations: [] }
  });
});

// @desc    Update availability
// @route   PUT /api/students/availability
// @access  Private (Student only)
const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const userId = req.user.id;
  
  if (!['available', 'busy', 'not_available'].includes(availability)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid availability status'
    });
  }
  
  const studentProfile = await StudentProfile.findOne({ where: { user_id: userId } });
  
  if (!studentProfile) {
    return res.status(404).json({
      success: false,
      message: 'Student profile not found'
    });
  }
  
  await studentProfile.update({ availability });
  
  res.json({
    success: true,
    message: 'Availability updated successfully',
    data: { availability }
  });
});

module.exports = {
  getAllStudents,
  getStudentById,
  getFeaturedStudents,
  searchStudents,
  getSkills,
  getUniversities,
  getStudentPortfolio,
  getStudentReviews,
  updateProfile,
  uploadPortfolio,
  deletePortfolioFile,
  uploadCV,
  getDashboardStats,
  getOpportunities,
  getRecentActivities,
  getMyApplications,
  getMyProjects,
  getRecommendations,
  updateAvailability
};