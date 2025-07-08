const db = require('../database/models');
const { Project, Application, User, UmkmProfile, StudentProfile, ProjectCheckpoint, Chat, Payment } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

// @desc    Get student's active project
// @route   GET /api/students/active-project
// @access  Private (Student only)
const getStudentActiveProject = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  
  // Find accepted application for this student
  const acceptedApplication = await Application.findOne({
    where: { 
      student_id: studentId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { 
          status: { [Op.in]: ['in_progress', 'completed'] },
          selected_student_id: studentId
        },
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name', 'business_type', 'city', 'rating']
              }
            ]
          }
        ]
      }
    ]
  });

  if (!acceptedApplication) {
    return res.json({
      success: true,
      data: {
        hasActiveProject: false,
        project: null,
        application: null
      }
    });
  }

  res.json({
    success: true,
    data: {
      hasActiveProject: true,
      project: acceptedApplication.project,
      application: acceptedApplication
    }
  });
});

// @desc    Get active project details with progress
// @route   GET /api/students/active-project/details
// @access  Private (Student only)
const getActiveProjectDetails = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  
  const acceptedApplication = await Application.findOne({
    where: { 
      student_id: studentId, 
      status: 'accepted' 
    },
    include: [
      {
        model: Project,
        as: 'project',
        where: { 
          status: { [Op.in]: ['in_progress', 'completed'] },
          selected_student_id: studentId
        },
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
            include: [
              {
                model: UmkmProfile,
                as: 'umkmProfile',
                attributes: ['business_name', 'business_type', 'city', 'rating', 'total_reviews']
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

  if (!acceptedApplication) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Calculate progress percentage
  const checkpoints = acceptedApplication.project.checkpoints || [];
  const completedCheckpoints = checkpoints.filter(cp => cp.status === 'completed').length;
  const progressPercentage = checkpoints.length > 0 
    ? Math.round((completedCheckpoints / checkpoints.length) * 100) 
    : 0;

  // Calculate days elapsed and remaining
  const startDate = new Date(acceptedApplication.accepted_at);
  const today = new Date();
  const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  const totalDuration = acceptedApplication.project.duration || 30;
  const daysRemaining = Math.max(0, totalDuration - daysElapsed);

  const progress = {
    progress_percentage: progressPercentage,
    completed_checkpoints: completedCheckpoints,
    total_checkpoints: checkpoints.length,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    is_overdue: daysRemaining === 0 && acceptedApplication.project.status !== 'completed'
  };

  res.json({
    success: true,
    data: {
      activeProject: true,
      project: acceptedApplication.project,
      application: acceptedApplication,
      progress
    }
  });
});

// @desc    Get active project checkpoints
// @route   GET /api/students/active-project/checkpoints
// @access  Private (Student only)
const getActiveProjectCheckpoints = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  
  // Find the active project
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  const checkpoints = await ProjectCheckpoint.findAll({
    where: { project_id: project.id },
    order: [['order', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      checkpoints
    }
  });
});

// @desc    Submit checkpoint deliverable
// @route   POST /api/students/active-project/checkpoint/:id/submit
// @access  Private (Student only)
const submitCheckpoint = asyncHandler(async (req, res) => {
  const { id: checkpointId } = req.params;
  const { notes } = req.body;
  const studentId = req.user.id;

  // Verify student owns this checkpoint through active project
  const checkpoint = await ProjectCheckpoint.findOne({
    where: { id: checkpointId },
    include: [
      {
        model: Project,
        as: 'project',
        where: { 
          selected_student_id: studentId,
          status: 'in_progress'
        }
      }
    ]
  });

  if (!checkpoint) {
    return res.status(404).json({
      success: false,
      message: 'Checkpoint not found or unauthorized'
    });
  }

  if (checkpoint.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Checkpoint cannot be submitted in current status'
    });
  }

  // Handle file uploads
  let deliverableUrls = [];
  if (req.files && req.files.length > 0) {
    deliverableUrls = req.files.map(file => file.path);
  }

  // Update checkpoint
  await checkpoint.update({
    status: 'submitted',
    student_notes: notes,
    deliverables: deliverableUrls,
    submitted_at: new Date()
  });

  // TODO: Send notification to UMKM

  res.json({
    success: true,
    message: 'Checkpoint submitted successfully',
    data: checkpoint
  });
});

// @desc    Get active project chat messages
// @route   GET /api/students/active-project/chats
// @access  Private (Student only)
const getActiveProjectChats = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Find the active project and UMKM
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    },
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ]
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Get chat messages between student and UMKM
  const { count, rows } = await Chat.findAndCountAll({
    where: {
      [Op.or]: [
        { sender_id: studentId, receiver_id: project.umkm_id },
        { sender_id: project.umkm_id, receiver_id: studentId }
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

// @desc    Send message to UMKM for active project
// @route   POST /api/students/active-project/chat
// @access  Private (Student only)
const sendProjectMessage = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { message } = req.body;

  // Find the active project and UMKM
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Create chat message
  const chat = await Chat.create({
    sender_id: studentId,
    receiver_id: project.umkm_id,
    message,
    message_type: 'text'
  });

  // Get created message with relations
  const createdMessage = await Chat.findByPk(chat.id, {
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

  // TODO: Send real-time notification via Socket.io
  // TODO: Send push notification to UMKM

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: createdMessage
  });
});

// @desc    Upload project deliverables
// @route   POST /api/students/active-project/deliverables
// @access  Private (Student only)
const uploadProjectDeliverables = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { description } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Find the active project
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: 'in_progress'
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Process uploaded files
  const fileUrls = req.files.map(file => ({
    url: file.path,
    name: file.originalname,
    size: file.size,
    uploaded_at: new Date()
  }));

  // Store deliverables information
  const currentDeliverables = project.deliverables || [];
  const updatedDeliverables = [
    ...currentDeliverables,
    {
      id: Date.now().toString(),
      description,
      files: fileUrls,
      uploaded_at: new Date(),
      uploaded_by: studentId
    }
  ];

  await project.update({ deliverables: updatedDeliverables });

  // TODO: Send notification to UMKM

  res.json({
    success: true,
    message: 'Deliverables uploaded successfully',
    data: {
      deliverables: updatedDeliverables
    }
  });
});

// @desc    Request project completion
// @route   POST /api/students/active-project/request-completion
// @access  Private (Student only)
const requestProjectCompletion = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { completion_notes } = req.body;

  // Find the active project
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: 'in_progress'
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Check if all checkpoints are completed (if any exist)
  const checkpoints = await ProjectCheckpoint.findAll({
    where: { project_id: project.id }
  });

  const incompleteCheckpoints = checkpoints.filter(cp => cp.status !== 'completed');
  
  if (incompleteCheckpoints.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all checkpoints before requesting project completion',
      data: {
        incomplete_checkpoints: incompleteCheckpoints.length,
        total_checkpoints: checkpoints.length
      }
    });
  }

  // Update project status to completion_requested
  await project.update({
    status: 'completion_requested',
    completion_notes,
    completion_requested_at: new Date()
  });

  // TODO: Send notification to UMKM for review

  res.json({
    success: true,
    message: 'Project completion requested successfully. Waiting for UMKM approval.',
    data: {
      project_id: project.id,
      status: 'completion_requested'
    }
  });
});

// @desc    Get project payment information
// @route   GET /api/students/active-project/payment
// @access  Private (Student only)
const getProjectPaymentInfo = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Find the active project
  const project = await Project.findOne({
    where: { 
      selected_student_id: studentId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'No active project found'
    });
  }

  // Get payment information
  const payments = await Payment.findAll({
    where: { 
      project_id: project.id,
      to_user_id: studentId
    },
    order: [['created_at', 'DESC']]
  });

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const agreedBudget = project.budget_min; // Or from application
  const remainingPayment = agreedBudget - totalPaid;

  res.json({
    success: true,
    data: {
      agreed_budget: agreedBudget,
      total_paid: totalPaid,
      remaining_payment: remainingPayment,
      payment_history: payments,
      payment_status: remainingPayment <= 0 ? 'completed' : 'pending'
    }
  });
});

module.exports = {
  getStudentActiveProject,
  getActiveProjectDetails,
  getActiveProjectCheckpoints,
  submitCheckpoint,
  getActiveProjectChats,
  sendProjectMessage,
  uploadProjectDeliverables,
  requestProjectCompletion,
  getProjectPaymentInfo
};
