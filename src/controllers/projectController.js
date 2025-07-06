const db = require('../database/models');
const { Project, User, UmkmProfile, Application, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getAllProjects = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    category, 
    experience_level, 
    location_type,
    budget_min, 
    budget_max, 
    sort = 'created_at', 
    order = 'DESC',
    search
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Build where clause
  const whereClause = {
    status: 'open'
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (experience_level) {
    whereClause.experience_level = experience_level;
  }
  
  if (location_type) {
    whereClause.location_type = location_type;
  }
  
  if (budget_min || budget_max) {
    whereClause.budget_min = {};
    if (budget_min) whereClause.budget_min[Op.gte] = budget_min;
    if (budget_max) whereClause.budget_max[Op.lte] = budget_max;
  }
  
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { '$umkm.umkmProfile.business_name$': { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  const { count, rows } = await Project.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city', 'rating']
          }
        ]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sort, order.toUpperCase()]],
    distinct: true
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

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const project = await Project.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city', 'rating', 'total_reviews']
          }
        ]
      },
      {
        model: Application,
        as: 'applications',
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'full_name', 'avatar_url'],
            include: [
              {
                model: StudentProfile,
                as: 'studentProfile',
                attributes: ['university', 'major', 'experience_level', 'rating']
              }
            ]
          }
        ]
      }
    ]
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
  
  // Increment view count
  await project.increment('view_count');
  
  res.json({
    success: true,
    data: project
  });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (UMKM only)
const createProject = asyncHandler(async (req, res) => {
  const umkmId = req.user.id;
  const projectData = {
    ...req.body,
    umkm_id: umkmId
  };
  
  const project = await Project.create(projectData);
  
  // Update UMKM total projects count
  await UmkmProfile.increment('total_projects', {
    where: { user_id: umkmId }
  });
  
  // Get created project with relations
  const createdProject = await Project.findByPk(project.id, {
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
    ]
  });
  
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: createdProject
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (UMKM owner only)
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  const project = await Project.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or unauthorized'
    });
  }
  
  await project.update(req.body);
  
  // Get updated project with relations
  const updatedProject = await Project.findByPk(project.id, {
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
    ]
  });
  
  res.json({
    success: true,
    message: 'Project updated successfully',
    data: updatedProject
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (UMKM owner only)
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  const project = await Project.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or unauthorized'
    });
  }
  
  // Delete project attachments from cloudinary
  if (project.attachments && project.attachments.length > 0) {
    for (const attachmentUrl of project.attachments) {
      const publicId = getPublicIdFromUrl(attachmentUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
  
  await project.destroy();
  
  // Update UMKM total projects count
  await UmkmProfile.decrement('total_projects', {
    where: { user_id: umkmId }
  });
  
  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// @desc    Get project categories
// @route   GET /api/projects/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = [
    { value: 'web_development', label: 'Web Development' },
    { value: 'mobile_development', label: 'Mobile Development' },
    { value: 'ui_ux_design', label: 'UI/UX Design' },
    { value: 'graphic_design', label: 'Graphic Design' },
    { value: 'digital_marketing', label: 'Digital Marketing' },
    { value: 'content_writing', label: 'Content Writing' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'video_editing', label: 'Video Editing' },
    { value: 'photography', label: 'Photography' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'lainnya', label: 'Lainnya' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// @desc    Get featured projects
// @route   GET /api/projects/featured
// @access  Public
const getFeaturedProjects = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const projects = await Project.findAll({
    where: {
      status: 'open',
      is_featured: true
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
            attributes: ['business_name', 'business_type', 'city', 'rating']
          }
        ]
      }
    ],
    limit: parseInt(limit),
    order: [['view_count', 'DESC'], ['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: projects
  });
});

// @desc    Get project applications
// @route   GET /api/projects/:id/applications
// @access  Public
const getProjectApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Application.findAndCountAll({
    where: { project_id: id },
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
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

// @desc    Upload project attachments
// @route   POST /api/projects/:id/attachments
// @access  Private (UMKM owner only)
const uploadProjectAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No attachments uploaded'
    });
  }
  
  const project = await Project.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or unauthorized'
    });
  }
  
  const attachmentUrls = req.files.map(file => file.path);
  const currentAttachments = project.attachments || [];
  const updatedAttachments = [...currentAttachments, ...attachmentUrls];
  
  await project.update({ attachments: updatedAttachments });
  
  res.json({
    success: true,
    message: 'Attachments uploaded successfully',
    data: {
      attachments: updatedAttachments
    }
  });
});

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private (UMKM owner only)
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const umkmId = req.user.id;
  
  const project = await Project.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or unauthorized'
    });
  }
  
  await project.update({ status });
  
  res.json({
    success: true,
    message: 'Project status updated successfully',
    data: { status }
  });
});

// @desc    Select student for project
// @route   PATCH /api/projects/:id/select-student
// @access  Private (UMKM owner only)
const selectStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;
  const umkmId = req.user.id;
  
  const project = await Project.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or unauthorized'
    });
  }
  
  // Update project with selected student
  await project.update({ 
    selected_student_id: student_id,
    status: 'in_progress'
  });
  
  // Accept the selected student's application
  await Application.update(
    { status: 'accepted', accepted_at: new Date() },
    { where: { project_id: id, student_id: student_id } }
  );
  
  // Reject other applications
  await Application.update(
    { status: 'rejected', rejected_at: new Date() },
    { 
      where: { 
        project_id: id, 
        student_id: { [Op.ne]: student_id },
        status: 'pending'
      } 
    }
  );
  
  res.json({
    success: true,
    message: 'Student selected successfully'
  });
});

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCategories,
  getFeaturedProjects,
  getProjectApplications,
  uploadProjectAttachments,
  updateProjectStatus,
  selectStudent
};