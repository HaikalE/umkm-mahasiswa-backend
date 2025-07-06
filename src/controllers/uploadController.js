const { asyncHandler } = require('../middleware/error');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Upload avatar
// @route   POST /api/uploads/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      url: req.file.path,
      public_id: req.file.public_id,
      original_name: req.file.originalname,
      size: req.file.size
    }
  });
});

// @desc    Upload product image
// @route   POST /api/uploads/product
// @access  Private
const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Product image uploaded successfully',
    data: {
      url: req.file.path,
      public_id: req.file.public_id,
      original_name: req.file.originalname,
      size: req.file.size
    }
  });
});

// @desc    Upload multiple product images
// @route   POST /api/uploads/products
// @access  Private
const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  const uploadedFiles = req.files.map(file => ({
    url: file.path,
    public_id: file.public_id,
    original_name: file.originalname,
    size: file.size
  }));
  
  res.json({
    success: true,
    message: `${req.files.length} product images uploaded successfully`,
    data: uploadedFiles
  });
});

// @desc    Upload portfolio file
// @route   POST /api/uploads/portfolio
// @access  Private
const uploadPortfolioFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Portfolio file uploaded successfully',
    data: {
      url: req.file.path,
      public_id: req.file.public_id,
      original_name: req.file.originalname,
      size: req.file.size,
      format: req.file.format
    }
  });
});

// @desc    Upload multiple portfolio files
// @route   POST /api/uploads/portfolios
// @access  Private
const uploadPortfolioFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  const uploadedFiles = req.files.map(file => ({
    url: file.path,
    public_id: file.public_id,
    original_name: file.originalname,
    size: file.size,
    format: file.format
  }));
  
  res.json({
    success: true,
    message: `${req.files.length} portfolio files uploaded successfully`,
    data: uploadedFiles
  });
});

// @desc    Upload chat file
// @route   POST /api/uploads/chat
// @access  Private
const uploadChatFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Chat file uploaded successfully',
    data: {
      url: req.file.path,
      public_id: req.file.public_id,
      original_name: req.file.originalname,
      size: req.file.size,
      format: req.file.format
    }
  });
});

// @desc    Upload review image
// @route   POST /api/uploads/review
// @access  Private
const uploadReviewImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Review image uploaded successfully',
    data: {
      url: req.file.path,
      public_id: req.file.public_id,
      original_name: req.file.originalname,
      size: req.file.size
    }
  });
});

// @desc    Upload multiple review images
// @route   POST /api/uploads/reviews
// @access  Private
const uploadReviewImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  const uploadedFiles = req.files.map(file => ({
    url: file.path,
    public_id: file.public_id,
    original_name: file.originalname,
    size: file.size
  }));
  
  res.json({
    success: true,
    message: `${req.files.length} review images uploaded successfully`,
    data: uploadedFiles
  });
});

// @desc    Delete file from Cloudinary
// @route   DELETE /api/uploads/file
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  const { url, public_id } = req.body;
  
  if (!url && !public_id) {
    return res.status(400).json({
      success: false,
      message: 'File URL or public_id is required'
    });
  }
  
  let publicIdToDelete = public_id;
  if (!publicIdToDelete && url) {
    publicIdToDelete = getPublicIdFromUrl(url);
  }
  
  if (!publicIdToDelete) {
    return res.status(400).json({
      success: false,
      message: 'Could not extract public_id from URL'
    });
  }
  
  try {
    const result = await deleteFromCloudinary(publicIdToDelete);
    
    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// @desc    Get upload information and limits
// @route   GET /api/uploads/info
// @access  Private
const getUploadInfo = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      limits: {
        avatar: {
          max_size: '5MB',
          formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        },
        product: {
          max_size: '10MB',
          max_files: 5,
          formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        },
        portfolio: {
          max_size: '20MB',
          max_files: 10,
          formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx']
        },
        chat: {
          max_size: '25MB',
          formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'mp3']
        },
        review: {
          max_size: '5MB',
          max_files: 3,
          formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        }
      },
      supported_formats: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        document: ['pdf', 'doc', 'docx'],
        video: ['mp4', 'mpeg'],
        audio: ['mp3', 'wav']
      }
    }
  });
});

module.exports = {
  uploadAvatar,
  uploadProductImage,
  uploadProductImages,
  uploadPortfolioFile,
  uploadPortfolioFiles,
  uploadChatFile,
  uploadReviewImage,
  uploadReviewImages,
  deleteFile,
  getUploadInfo
};