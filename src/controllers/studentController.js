const db = require('../database/models');
const { User, StudentProfile, UmkmProfile, Application, Project, Review, Chat, ProjectCheckpoint } = db;
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

// ====================================
// ENHANCED: ACTIVE PROJECT MANAGEMENT
// ====================================

// @desc    Get active project (currently accepted project)
// @route   GET /api/students/active-project
// @access  Private (Student only)
const getActiveProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] },
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'avatar_url', 'email', 'phone'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile'
              }
            ]
          }
        ]
      }
    ]
  });

  if (!activeApplication) {
    return res.json({
      success: true,
      data: { activeProject: null },
      message: 'No active project found'
    });
  }

  res.json({
    success: true,
    data: { 
      activeProject: activeApplication.project,
      application: activeApplication
    }
  });
});

// @desc    Get active project detailed information
// @route   GET /api/students/active-project/details
// @access  Private (Student only)
const getActiveProjectDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] },
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'avatar_url', 'email', 'phone'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile'
              }
            ]
          },
          {
            model: ProjectCheckpoint,
            as: 'checkpoints',
            order: [['order', 'ASC']]
          }
        ]
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Calculate project progress
  const checkpoints = activeApplication.project.checkpoints || [];
  const completedCheckpoints = checkpoints.filter(cp => cp.status === 'completed').length;
  const progressPercentage = checkpoints.length > 0 ? 
    Math.round((completedCheckpoints / checkpoints.length) * 100) : 0;

  res.json({
    success: true,
    data: {
      project: activeApplication.project,
      application: activeApplication,
      progress: {
        total_checkpoints: checkpoints.length,
        completed_checkpoints: completedCheckpoints,
        progress_percentage: progressPercentage
      }
    }
  });
});

// @desc    Get active project checkpoints
// @route   GET /api/students/active-project/checkpoints
// @access  Private (Student only)
const getActiveProjectCheckpoints = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const checkpoints = await ProjectCheckpoint.findAll({
    where: { project_id: activeApplication.project.id },
    order: [['order', 'ASC']]
  });

  res.json({
    success: true,
    data: { checkpoints }
  });
});

// @desc    Submit checkpoint deliverable
// @route   POST /api/students/active-project/checkpoint/:checkpointId/submit
// @access  Private (Student only)
const submitCheckpoint = asyncHandler(async (req, res) => {
  const { checkpointId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;

  // Verify this is student's active project
  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const checkpoint = await ProjectCheckpoint.findOne({
    where: { 
      id: checkpointId,
      project_id: activeApplication.project.id
    }
  });

  if (!checkpoint) {
    return res.status(404).json({
      success: false,
      message: 'Checkpoint not found'
    });
  }

  // Process uploaded files
  const deliverables = req.files ? req.files.map(file => ({
    id: file.public_id,
    name: file.originalname,
    url: file.path,
    size: file.size,
    type: file.mimetype,
    uploaded_at: new Date()
  })) : [];

  // Update checkpoint
  await checkpoint.update({
    status: 'submitted',
    student_notes: notes,
    deliverables: deliverables,
    submitted_at: new Date()
  });

  // Send notification to UMKM (implement notification system)
  // TODO: Add notification

  res.json({
    success: true,
    message: 'Checkpoint submitted successfully',
    data: { checkpoint }
  });
});

// @desc    Get active project chats
// @route   GET /api/students/active-project/chats
// @access  Private (Student only)
const getActiveProjectChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const umkmId = activeApplication.project.umkm_id;

  const { count, rows } = await Chat.findAndCountAll({
    where: {
      [Op.or]: [
        { sender_id: userId, receiver_id: umkmId },
        { sender_id: umkmId, receiver_id: userId }
      ]
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'receiver',
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
      chats: rows.reverse(), // Reverse to show oldest first
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Send message to UMKM
// @route   POST /api/students/active-project/chat
// @access  Private (Student only)
const sendProjectMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const newMessage = await Chat.create({
    sender_id: userId,
    receiver_id: activeApplication.project.umkm_id,
    message,
    type: 'text'
  });

  const messageWithSender = await Chat.findByPk(newMessage.id, {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ]
  });

  // Send real-time notification via socket
  req.io.to(`user_${activeApplication.project.umkm_id}`).emit('new_message', messageWithSender);

  res.json({
    success: true,
    message: 'Message sent successfully',
    data: { chat: messageWithSender }
  });
});

// @desc    Upload project deliverables
// @route   POST /api/students/active-project/deliverables
// @access  Private (Student only)
const uploadProjectDeliverables = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const deliverables = req.files.map(file => ({
    id: file.public_id,
    name: file.originalname,
    url: file.path,
    size: file.size,
    type: file.mimetype,
    description: description,
    uploaded_at: new Date()
  }));

  // Store deliverables in project (or create separate deliverables table)
  const project = activeApplication.project;
  const currentAttachments = project.attachments || [];
  const updatedAttachments = [...currentAttachments, ...deliverables];

  await Project.update(
    { attachments: updatedAttachments },
    { where: { id: project.id } }
  );

  res.json({
    success: true,
    message: 'Deliverables uploaded successfully',
    data: { deliverables }
  });
});

// @desc    Update project status (student side)
// @route   PUT /api/students/active-project/status
// @access  Private (Student only)
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const userId = req.user.id;

  const validStatuses = ['pause_request', 'help_needed', 'ready_for_review'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Update application with student notes
  await activeApplication.update({
    student_notes: notes
  });

  // TODO: Create notification for UMKM about status change

  res.json({
    success: true,
    message: 'Project status updated successfully',
    data: {
      status,
      notes
    }
  });
});

// @desc    Request project completion
// @route   POST /api/students/active-project/request-completion
// @access  Private (Student only)
const requestProjectCompletion = asyncHandler(async (req, res) => {
  const { completion_notes, final_deliverables } = req.body;
  const userId = req.user.id;

  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { status: ['in_progress', 'open'] }
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Update application status to completion requested
  await activeApplication.update({
    status: 'completion_requested',
    student_notes: completion_notes
  });

  // TODO: Send notification to UMKM for review

  res.json({
    success: true,
    message: 'Project completion requested successfully. Waiting for UMKM review.'
  });
});

// @desc    Complete project (after UMKM approval)
// @route   POST /api/students/active-project/complete
// @access  Private (Student only)
const completeProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activeApplication = await Application.findOne({
    where: { 
      student_id: userId, 
      status: 'completion_approved' // Only if UMKM approved
    },
    include: [
      {
        model: Project,
        as: 'project'
      }
    ]
  });

  if (!activeApplication) {
    return res.status(404).json({
      success: false,
      message: 'No project ready for completion found'
    });
  }

  // Update project and application status
  await Promise.all([
    Project.update(
      { status: 'completed' },
      { where: { id: activeApplication.project.id } }
    ),
    activeApplication.update({ status: 'completed' }),
    // Update student profile
    StudentProfile.increment(
      'total_projects_completed',
      { where: { user_id: userId } }
    )
  ]);

  res.json({
    success: true,
    message: 'Project completed successfully!'
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
  updateAvailability,
  // Enhanced: Active Project Management
  getActiveProject,
  getActiveProjectDetails,
  getActiveProjectCheckpoints,
  submitCheckpoint,
  getActiveProjectChats,
  sendProjectMessage,
  uploadProjectDeliverables,
  updateProjectStatus,
  requestProjectCompletion,
  completeProject
};