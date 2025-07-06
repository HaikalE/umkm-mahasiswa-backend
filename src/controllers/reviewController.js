const db = require('../database/models');
const { Review, User, Product, Project, UmkmProfile, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, review_type, rating } = req.query;
  const offset = (page - 1) * limit;
  
  const whereClause = {
    status: 'active'
  };
  
  if (review_type) {
    whereClause.review_type = review_type;
  }
  
  if (rating) {
    whereClause.rating = rating;
  }
  
  const { count, rows } = await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          },
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
          }
        ]
      },
      {
        model: User,
        as: 'reviewed',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          },
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
          }
        ]
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'category'],
        required: false
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'category'],
        required: false
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

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const review = await Review.findOne({
    where: { id, status: 'active' },
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          },
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
          }
        ]
      },
      {
        model: User,
        as: 'reviewed',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          },
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
          }
        ]
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'category'],
        required: false
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'category'],
        required: false
      }
    ]
  });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  res.json({
    success: true,
    data: review
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const reviewerId = req.user.id;
  const { 
    reviewed_id, 
    product_id, 
    project_id, 
    rating, 
    comment, 
    review_type,
    criteria_ratings,
    is_anonymous = false
  } = req.body;
  
  // Verify reviewed user exists
  const reviewedUser = await User.findByPk(reviewed_id);
  if (!reviewedUser) {
    return res.status(404).json({
      success: false,
      message: 'Reviewed user not found'
    });
  }
  
  // Check if product or project exists (if specified)
  if (product_id) {
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
  }
  
  if (project_id) {
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
  }
  
  // Check if user already reviewed this product/project
  const existingReview = await Review.findOne({
    where: {
      reviewer_id: reviewerId,
      reviewed_id,
      ...(product_id && { product_id }),
      ...(project_id && { project_id })
    }
  });
  
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this item'
    });
  }
  
  // Create review
  const review = await Review.create({
    reviewer_id: reviewerId,
    reviewed_id,
    product_id,
    project_id,
    rating,
    comment,
    review_type,
    criteria_ratings,
    is_anonymous,
    is_verified: true // Assume verified for now
  });
  
  // Update ratings
  await updateUserRating(reviewed_id);
  if (product_id) {
    await updateProductRating(product_id);
  }
  
  // Get created review with relations
  const createdReview = await Review.findByPk(review.id, {
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'reviewed',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ]
  });
  
  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: createdReview
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Reviewer only)
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.user.id;
  
  const review = await Review.findOne({
    where: { id, reviewer_id: reviewerId }
  });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized'
    });
  }
  
  const oldRating = review.rating;
  await review.update(req.body);
  
  // Update ratings if rating changed
  if (req.body.rating && req.body.rating !== oldRating) {
    await updateUserRating(review.reviewed_id);
    if (review.product_id) {
      await updateProductRating(review.product_id);
    }
  }
  
  res.json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Reviewer only)
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.user.id;
  
  const review = await Review.findOne({
    where: { id, reviewer_id: reviewerId }
  });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized'
    });
  }
  
  // Delete review images from cloudinary
  if (review.images && review.images.length > 0) {
    for (const imageUrl of review.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
  
  await review.destroy();
  
  // Update ratings
  await updateUserRating(review.reviewed_id);
  if (review.product_id) {
    await updateProductRating(review.product_id);
  }
  
  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Upload review images
// @route   POST /api/reviews/:id/images
// @access  Private (Reviewer only)
const uploadReviewImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }
  
  const review = await Review.findOne({
    where: { id, reviewer_id: reviewerId }
  });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized'
    });
  }
  
  const imageUrls = req.files.map(file => file.path);
  const currentImages = review.images || [];
  const updatedImages = [...currentImages, ...imageUrls];
  
  await review.update({ images: updatedImages });
  
  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: updatedImages
    }
  });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const review = await Review.findByPk(id);
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  await review.increment('helpful_count');
  
  res.json({
    success: true,
    message: 'Review marked as helpful'
  });
});

// @desc    Respond to review
// @route   POST /api/reviews/:id/response
// @access  Private (Reviewed user only)
const respondToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  const userId = req.user.id;
  
  const review = await Review.findOne({
    where: { id, reviewed_id: userId }
  });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized'
    });
  }
  
  await review.update({
    response,
    response_date: new Date()
  });
  
  res.json({
    success: true,
    message: 'Response added successfully'
  });
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const review = await Review.findByPk(id);
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  await review.update({ status: 'reported' });
  
  res.json({
    success: true,
    message: 'Review reported successfully'
  });
});

// @desc    Get reviews by user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, type = 'received' } = req.query;
  const offset = (page - 1) * limit;
  
  const whereClause = {
    status: 'active'
  };
  
  if (type === 'received') {
    whereClause.reviewed_id = userId;
  } else {
    whereClause.reviewer_id = userId;
  }
  
  const { count, rows } = await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'reviewed',
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

// @desc    Get reviews by product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Review.findAndCountAll({
    where: { product_id: productId, status: 'active' },
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

// @desc    Get reviews by project
// @route   GET /api/reviews/project/:projectId
// @access  Public
const getReviewsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Review.findAndCountAll({
    where: { project_id: projectId, status: 'active' },
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

// Helper function to update user rating
const updateUserRating = async (userId) => {
  const reviews = await Review.findAll({
    where: { reviewed_id: userId, status: 'active' },
    attributes: ['rating']
  });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(2);
    
    const user = await User.findByPk(userId);
    if (user.user_type === 'umkm') {
      await UmkmProfile.update(
        { rating: averageRating, total_reviews: reviews.length },
        { where: { user_id: userId } }
      );
    } else {
      await StudentProfile.update(
        { rating: averageRating, total_reviews: reviews.length },
        { where: { user_id: userId } }
      );
    }
  }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const reviews = await Review.findAll({
    where: { product_id: productId, status: 'active' },
    attributes: ['rating']
  });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(2);
    
    await Product.update(
      { rating: averageRating, total_reviews: reviews.length },
      { where: { id: productId } }
    );
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  uploadReviewImages,
  markHelpful,
  respondToReview,
  reportReview,
  getReviewsByUser,
  getReviewsByProduct,
  getReviewsByProject
};