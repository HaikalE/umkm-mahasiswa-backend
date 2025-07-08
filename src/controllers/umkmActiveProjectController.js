const db = require('../database/models');
const { Project, Application, User, UmkmProfile, StudentProfile, ProjectCheckpoint, Chat, Payment } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

// @desc    Get UMKM's active projects (projects being worked on by students)
// @route   GET /api/umkm/active-projects
// @access  Private (UMKM only)
const getUmkmActiveProjects = asyncHandler(async (req, res) => {
  const umkmId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = {
    umkm_id: umkmId,
    status: { [Op.in]: ['in_progress', 'completion_requested', 'completed'] },
    selected_student_id: { [Op.ne]: null }
  };
  
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await Project.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'selectedStudent',
        foreignKey: 'selected_student_id',
        attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major', 'experience_level', 'rating']
          }
        ]
      },
      {
        model: Application,
        as: 'applications',
        where: { status: 'accepted' },
        required: false,
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'full_name', 'avatar_url']
          }
        ]
      },
      {
        model: ProjectCheckpoint,
        as: 'checkpoints',
        required: false
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['updated_at', 'DESC']]
  });

  // Calculate progress for each project
  const projectsWithProgress = rows.map(project => {
    const checkpoints = project.checkpoints || [];
    const completedCheckpoints = checkpoints.filter(cp => cp.status === 'completed').length;
    const progressPercentage = checkpoints.length > 0 
      ? Math.round((completedCheckpoints / checkpoints.length) * 100) 
      : 0;

    return {
      ...project.toJSON(),
      progress: {
        percentage: progressPercentage,
        completed_checkpoints: completedCheckpoints,
        total_checkpoints: checkpoints.length
      }
    };
  });
  
  res.json({
    success: true,
    data: {
      projects: projectsWithProgress,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get specific active project details for UMKM
// @route   GET /api/umkm/active-projects/:id
// @access  Private (UMKM only)
const getActiveProjectDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  const project = await Project.findOne({
    where: { 
      id, 
      umkm_id: umkmId,
      status: { [Op.in]: ['in_progress', 'completion_requested', 'completed'] },
      selected_student_id: { [Op.ne]: null }
    },
    include: [
      {
        model: User,
        as: 'selectedStudent',
        foreignKey: 'selected_student_id',
        attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major', 'experience_level', 'skills', 'rating', 'portfolio_url']
          }
        ]
      },
      {
        model: Application,
        as: 'applications',
        where: { status: 'accepted' },
        required: false,
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'full_name', 'avatar_url']
          }
        ]
      },
      {
        model: ProjectCheckpoint,
        as: 'checkpoints',
        order: [['order', 'ASC']]
      }
    ]
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Active project not found'
    });
  }

  // Calculate detailed progress
  const checkpoints = project.checkpoints || [];
  const completedCheckpoints = checkpoints.filter(cp => cp.status === 'completed').length;
  const submittedCheckpoints = checkpoints.filter(cp => cp.status === 'submitted').length;
  const progressPercentage = checkpoints.length > 0 
    ? Math.round((completedCheckpoints / checkpoints.length) * 100) 
    : 0;

  // Calculate timeline information
  const acceptedApplication = project.applications?.[0];
  const startDate = acceptedApplication ? new Date(acceptedApplication.accepted_at) : new Date(project.created_at);
  const today = new Date();
  const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  const totalDuration = project.duration || 30;
  const daysRemaining = Math.max(0, totalDuration - daysElapsed);

  const progress = {
    percentage: progressPercentage,
    completed_checkpoints: completedCheckpoints,
    submitted_checkpoints: submittedCheckpoints,
    total_checkpoints: checkpoints.length,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    is_overdue: daysRemaining === 0 && project.status !== 'completed',
    timeline: {
      start_date: startDate,
      estimated_completion: new Date(startDate.getTime() + totalDuration * 24 * 60 * 60 * 1000),
      actual_progress: progressPercentage
    }
  };

  res.json({
    success: true,
    data: {
      project: {
        ...project.toJSON(),
        progress
      }
    }
  });
});

// @desc    Get active project chat messages for UMKM
// @route   GET /api/umkm/active-projects/:id/chats
// @access  Private (UMKM only)
const getActiveProjectChats = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const umkmId = req.user.id;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Verify project ownership
  const project = await Project.findOne({
    where: { 
      id: projectId, 
      umkm_id: umkmId,
      selected_student_id: { [Op.ne]: null }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Active project not found'
    });
  }

  // Get chat messages between UMKM and selected student
  const { count, rows } = await Chat.findAndCountAll({
    where: {
      [Op.or]: [
        { sender_id: umkmId, receiver_id: project.selected_student_id },
        { sender_id: project.selected_student_id, receiver_id: umkmId }
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
      chats: rows.reverse(), // Show oldest first
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Send message to student for active project
// @route   POST /api/umkm/active-projects/:id/chat
// @access  Private (UMKM only)
const sendProjectMessage = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const umkmId = req.user.id;
  const { message } = req.body;

  // Verify project ownership
  const project = await Project.findOne({
    where: { 
      id: projectId, 
      umkm_id: umkmId,
      selected_student_id: { [Op.ne]: null }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Active project not found'
    });
  }

  // Create chat message
  const chat = await Chat.create({
    sender_id: umkmId,
    receiver_id: project.selected_student_id,
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
  // TODO: Send push notification to student

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: createdMessage
  });
});

// @desc    Review checkpoint submission
// @route   POST /api/umkm/active-projects/:projectId/checkpoint/:checkpointId/review
// @access  Private (UMKM only)
const reviewCheckpoint = asyncHandler(async (req, res) => {
  const { projectId, checkpointId } = req.params;
  const { action, umkm_notes } = req.body; // action: 'approve' or 'reject'
  const umkmId = req.user.id;

  // Verify project ownership and checkpoint existence
  const checkpoint = await ProjectCheckpoint.findOne({
    where: { id: checkpointId },
    include: [
      {
        model: Project,
        as: 'project',
        where: { 
          id: projectId,
          umkm_id: umkmId 
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

  if (checkpoint.status !== 'submitted') {
    return res.status(400).json({
      success: false,
      message: 'Checkpoint is not in submitted status'
    });
  }

  // Update checkpoint based on action
  const updateData = {
    umkm_notes,
    reviewed_at: new Date()
  };

  if (action === 'approve') {
    updateData.status = 'completed';
    updateData.completed_at = new Date();
  } else if (action === 'reject') {
    updateData.status = 'pending'; // Reset to pending for revision
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use "approve" or "reject"'
    });
  }

  await checkpoint.update(updateData);

  // TODO: Send notification to student

  res.json({
    success: true,
    message: `Checkpoint ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    data: {
      checkpoint_id: checkpoint.id,
      status: updateData.status,
      action
    }
  });
});

// @desc    Approve project completion
// @route   POST /api/umkm/active-projects/:id/complete
// @access  Private (UMKM only)
const approveProjectCompletion = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const { completion_notes, rating } = req.body;
  const umkmId = req.user.id;

  // Find the project
  const project = await Project.findOne({
    where: { 
      id: projectId, 
      umkm_id: umkmId,
      status: 'completion_requested'
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or not in completion requested status'
    });
  }

  // Update project status to completed
  await project.update({
    status: 'completed',
    completed_at: new Date(),
    umkm_completion_notes: completion_notes
  });

  // TODO: Trigger payment release
  // TODO: Create automatic review if rating provided
  // TODO: Send completion notification to student

  res.json({
    success: true,
    message: 'Project completed successfully',
    data: {
      project_id: project.id,
      status: 'completed',
      completed_at: project.completed_at
    }
  });
});

// @desc    Get UMKM dashboard stats for active projects
// @route   GET /api/umkm/active-projects/stats
// @access  Private (UMKM only)
const getActiveProjectStats = asyncHandler(async (req, res) => {
  const umkmId = req.user.id;

  // Get various stats
  const [
    totalActiveProjects,
    inProgressProjects,
    completionRequestedProjects,
    completedProjectsThisMonth,
    overdueProjects
  ] = await Promise.all([
    // Total active projects
    Project.count({
      where: {
        umkm_id: umkmId,
        status: { [Op.in]: ['in_progress', 'completion_requested'] },
        selected_student_id: { [Op.ne]: null }
      }
    }),
    
    // In progress projects
    Project.count({
      where: {
        umkm_id: umkmId,
        status: 'in_progress',
        selected_student_id: { [Op.ne]: null }
      }
    }),
    
    // Completion requested projects
    Project.count({
      where: {
        umkm_id: umkmId,
        status: 'completion_requested'
      }
    }),
    
    // Completed projects this month
    Project.count({
      where: {
        umkm_id: umkmId,
        status: 'completed',
        completed_at: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    
    // Overdue projects (simplified check)
    Project.count({
      where: {
        umkm_id: umkmId,
        status: 'in_progress',
        deadline: {
          [Op.lt]: new Date()
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      total_active_projects: totalActiveProjects,
      in_progress_projects: inProgressProjects,
      completion_requested_projects: completionRequestedProjects,
      completed_projects_this_month: completedProjectsThisMonth,
      overdue_projects: overdueProjects,
      completion_rate: totalActiveProjects > 0 
        ? Math.round((completedProjectsThisMonth / totalActiveProjects) * 100) 
        : 0
    }
  });
});

module.exports = {
  getUmkmActiveProjects,
  getActiveProjectDetails,
  getActiveProjectChats,
  sendProjectMessage,
  reviewCheckpoint,
  approveProjectCompletion,
  getActiveProjectStats
};
