const db = require('../database/models');
const { Application, Project, User, UmkmProfile, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get my applications
// @route   GET /api/applications
// @access  Private
const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  const userType = req.user.user_type;
  
  let whereClause = {};
  
  if (userType === 'student') {
    whereClause.student_id = userId;
  } else if (userType === 'umkm') {
    // For UMKM, get applications to their projects
    whereClause['$project.umkm_id$'] = userId;
  }
  
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Application.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'category', 'budget_min', 'budget_max', 'deadline'],
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'avatar_url'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name', 'business_type']
              }
            ]
          }
        ]
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major', 'experience_level']
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

// @desc    Create new application
// @route   POST /api/applications
// @access  Private (Student only)
const createApplication = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { project_id, cover_letter, proposed_budget, proposed_duration, portfolio_links, student_notes } = req.body;
  
  // Check if project exists and is open
  const project = await Project.findOne({
    where: { id: project_id, status: 'open' }
  });
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or no longer accepting applications'
    });
  }
  
  // Check if student already applied
  const existingApplication = await Application.findOne({
    where: { project_id, student_id: studentId }
  });
  
  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied to this project'
    });
  }
  
  // Check if project has reached max applicants
  const currentApplicants = await Application.count({
    where: { project_id }
  });
  
  if (currentApplicants >= project.max_applicants) {
    return res.status(400).json({
      success: false,
      message: 'Project has reached maximum number of applicants'
    });
  }
  
  // Create application
  const application = await Application.create({
    project_id,
    student_id: studentId,
    cover_letter,
    proposed_budget,
    proposed_duration,
    portfolio_links,
    student_notes
  });
  
  // Update project applicant count
  await project.increment('total_applicants');
  
  // Get created application with relations
  const createdApplication = await Application.findByPk(application.id, {
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
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          }
        ]
      }
    ]
  });
  
  // TODO: Send notification to UMKM owner
  
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: createdApplication
  });
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private (Student owner only)
const updateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  
  const application = await Application.findOne({
    where: { id, student_id: studentId, status: 'pending' }
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or cannot be modified'
    });
  }
  
  await application.update(req.body);
  
  // Get updated application with relations
  const updatedApplication = await Application.findByPk(application.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'category']
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name']
      }
    ]
  });
  
  res.json({
    success: true,
    message: 'Application updated successfully',
    data: updatedApplication
  });
});

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (Student owner only)
const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  
  const application = await Application.findOne({
    where: { id, student_id: studentId, status: { [Op.in]: ['pending', 'reviewed'] } },
    include: [{ model: Project, as: 'project' }]
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or cannot be withdrawn'
    });
  }
  
  // Update status to withdrawn
  await application.update({ status: 'withdrawn' });
  
  // Decrement project applicant count
  await Project.decrement('total_applicants', {
    where: { id: application.project_id }
  });
  
  res.json({
    success: true,
    message: 'Application withdrawn successfully'
  });
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.user_type;
  
  let whereClause = { id };
  
  // Students can only see their own applications
  // UMKM can see applications to their projects
  if (userType === 'student') {
    whereClause.student_id = userId;
  }
  
  const application = await Application.findOne({
    where: whereClause,
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'description', 'category', 'budget_min', 'budget_max', 'umkm_id'],
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'avatar_url'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name', 'business_type']
              }
            ]
          }
        ]
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major', 'experience_level', 'skills', 'portfolio_url']
          }
        ]
      }
    ]
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }
  
  // Check if UMKM owns the project
  if (userType === 'umkm' && application.project.umkm_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  res.json({
    success: true,
    data: application
  });
});

// @desc    Upload application attachments
// @route   POST /api/applications/:id/attachments
// @access  Private (Student owner only)
const uploadApplicationAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No attachments uploaded'
    });
  }
  
  const application = await Application.findOne({
    where: { id, student_id: studentId }
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or unauthorized'
    });
  }
  
  const attachmentUrls = req.files.map(file => file.path);
  const currentAttachments = application.attachments || [];
  const updatedAttachments = [...currentAttachments, ...attachmentUrls];
  
  await application.update({ attachments: updatedAttachments });
  
  res.json({
    success: true,
    message: 'Attachments uploaded successfully',
    data: {
      attachments: updatedAttachments
    }
  });
});

// @desc    Review application
// @route   PATCH /api/applications/:id/review
// @access  Private (UMKM owner only)
const reviewApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { umkm_notes } = req.body;
  const umkmId = req.user.id;
  
  const application = await Application.findOne({
    where: { id },
    include: [{
      model: Project,
      as: 'project',
      where: { umkm_id: umkmId }
    }]
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or unauthorized'
    });
  }
  
  await application.update({
    status: 'reviewed',
    umkm_notes,
    reviewed_at: new Date()
  });
  
  res.json({
    success: true,
    message: 'Application reviewed successfully'
  });
});

// @desc    Accept application
// @route   PATCH /api/applications/:id/accept
// @access  Private (UMKM owner only)
const acceptApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { umkm_notes } = req.body;
  const umkmId = req.user.id;
  
  const application = await Application.findOne({
    where: { id },
    include: [{
      model: Project,
      as: 'project',
      where: { umkm_id: umkmId }
    }]
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or unauthorized'
    });
  }
  
  await application.update({
    status: 'accepted',
    umkm_notes,
    accepted_at: new Date()
  });
  
  // Update project with selected student
  await Project.update(
    { 
      selected_student_id: application.student_id,
      status: 'in_progress'
    },
    { where: { id: application.project_id } }
  );
  
  // TODO: Send notification to student
  
  res.json({
    success: true,
    message: 'Application accepted successfully'
  });
});

// @desc    Reject application
// @route   PATCH /api/applications/:id/reject
// @access  Private (UMKM owner only)
const rejectApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { umkm_notes } = req.body;
  const umkmId = req.user.id;
  
  const application = await Application.findOne({
    where: { id },
    include: [{
      model: Project,
      as: 'project',
      where: { umkm_id: umkmId }
    }]
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or unauthorized'
    });
  }
  
  await application.update({
    status: 'rejected',
    umkm_notes,
    rejected_at: new Date()
  });
  
  // TODO: Send notification to student
  
  res.json({
    success: true,
    message: 'Application rejected'
  });
});

module.exports = {
  getMyApplications,
  createApplication,
  updateApplication,
  withdrawApplication,
  getApplicationById,
  uploadApplicationAttachments,
  reviewApplication,
  acceptApplication,
  rejectApplication
};