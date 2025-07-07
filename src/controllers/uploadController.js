const { asyncHandler } = require('../middleware/error');
const { getFileUrl, deleteFile } = require('../config/cloudinary');
const path = require('path');

// Helper function to get file info for local storage
function getLocalFileInfo(file) {
  return {
    url: getFileUrl(file) || `/uploads/${file.filename}`,
    filename: file.filename,
    original_name: file.originalname,
    size: file.size,
    format: path.extname(file.originalname).slice(1)
  };
}

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
    data: getLocalFileInfo(req.file)
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
    data: getLocalFileInfo(req.file)
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
  
  const uploadedFiles = req.files.map(file => getLocalFileInfo(file));
  
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
    data: getLocalFileInfo(req.file)
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
  
  const uploadedFiles = req.files.map(file => getLocalFileInfo(file));
  
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
    data: getLocalFileInfo(req.file)
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
    data: getLocalFileInfo(req.file)
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
  
  const uploadedFiles = req.files.map(file => getLocalFileInfo(file));
  
  res.json({
    success: true,
    message: `${req.files.length} review images uploaded successfully`,
    data: uploadedFiles
  });
});

// @desc    Delete file from local storage
// @route   DELETE /api/uploads/file
// @access  Private
const deleteFileEndpoint = asyncHandler(async (req, res) => {
  const { url, filename } = req.body;
  
  if (!url && !filename) {
    return res.status(400).json({
      success: false,
      message: 'File URL or filename is required'
    });
  }
  
  let fileToDelete = filename || url;
  
  try {
    const result = await deleteFile(fileToDelete);
    
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
      storage_type: 'local',
      upload_directory: '/uploads',
      base_url: 'http://localhost:3000/uploads',
      limits: {
        avatar: {
          max_size: '5MB',
          formats: ['jpg', 'jpeg', 'png', 'gif']
        },
        product: {
          max_size: '5MB',
          max_files: 5,
          formats: ['jpg', 'jpeg', 'png', 'gif']
        },
        portfolio: {
          max_size: '5MB',
          max_files: 10,
          formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
        },
        chat: {
          max_size: '5MB',
          formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
        },
        review: {
          max_size: '5MB',
          max_files: 3,
          formats: ['jpg', 'jpeg', 'png', 'gif']
        }
      },
      supported_formats: {
        image: ['jpg', 'jpeg', 'png', 'gif'],
        document: ['pdf', 'doc', 'docx']
      },
      notes: {
        cloudinary: 'Disabled - using local file storage only',
        access: 'Files accessible at http://localhost:3000/uploads/<filename>',
        storage_location: './uploads/ directory'
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
  deleteFile: deleteFileEndpoint,
  getUploadInfo
};