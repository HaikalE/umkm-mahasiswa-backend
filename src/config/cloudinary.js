const multer = require('multer');
const path = require('path');
const fs = require('fs');

// SIMPLE LOCAL FILE STORAGE ONLY - NO CLOUDINARY AT ALL!
console.log('📁 Local file storage initialized - Cloudinary completely disabled');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Simple local storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Basic multer setup
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
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Simple upload middlewares
const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 5);
const avatarUpload = upload.single('avatar');

// Simple helper functions
function getFileUrl(file) {
  if (file && file.filename) {
    return `/uploads/${file.filename}`;
  }
  return null;
}

// Simple delete function for local files
async function deleteFile(fileUrl) {
  try {
    if (!fileUrl) return { result: 'ok' };
    
    let filename = fileUrl;
    if (fileUrl.includes('/uploads/')) {
      filename = fileUrl.split('/').pop();
    }
    
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted: ${filename}`);
    }
    return { result: 'ok' };
  } catch (error) {
    console.error('Delete error:', error.message);
    return { result: 'error' };
  }
}

// Export simple, clean interface
module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  avatarUpload,
  getFileUrl,
  deleteFile
};