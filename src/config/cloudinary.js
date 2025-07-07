const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Cloudinary configuration check
let isCloudinaryConfigured = false;

function initializeCloudinary() {
  try {
    // Check if Cloudinary config is properly set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET ||
        process.env.CLOUDINARY_CLOUD_NAME === 'your-cloudinary-name') {
      
      console.log('🔄 Cloudinary not configured - using local file storage');
      console.log('📝 To enable Cloudinary: Update .env with real Cloudinary credentials');
      return false;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    isCloudinaryConfigured = true;
    console.log('✅ Cloudinary configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error.message);
    console.log('🔄 Falling back to local file storage...');
    return false;
  }
}

// Initialize on module load
initializeCloudinary();

// Ensure uploads directory exists for local storage fallback
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory for local file storage');
}

// Create appropriate storage based on Cloudinary availability
const storage = isCloudinaryConfigured 
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'umkm-mahasiswa',
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
      },
    })
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  }
});

// Helper function to get file URL
function getFileUrl(file) {
  if (isCloudinaryConfigured && file.path) {
    return file.path; // Cloudinary URL
  } else if (file.filename) {
    return `/uploads/${file.filename}`; // Local file URL
  }
  return null;
}

// Delete file function
async function deleteFile(fileUrl) {
  try {
    if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const publicId = fileUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } else {
      // Delete local file
      const filename = fileUrl.split('/').pop();
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }
}

// Upload middleware with different configurations
const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 5);
const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 5 }
]);

module.exports = {
  cloudinary,
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  getFileUrl,
  deleteFile,
  isCloudinaryConfigured
};