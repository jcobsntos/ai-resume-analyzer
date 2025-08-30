const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath;
    
    // Organize uploads by file type and user
    if (file.fieldname === 'resume') {
      uploadPath = path.join('uploads', 'resumes', req.user._id.toString());
    } else if (file.fieldname === 'profilePicture') {
      uploadPath = path.join('uploads', 'profiles', req.user._id.toString());
    } else {
      uploadPath = path.join('uploads', 'misc');
    }
    
    await ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedBaseName}_${uniqueSuffix}${extension}`;
    
    cb(null, filename);
  }
});

// File filter for different types
const createFileFilter = (allowedTypes, allowedExtensions) => {
  return (req, file, cb) => {
    // Check MIME type
    const isValidType = allowedTypes.includes(file.mimetype);
    
    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    const isValidExtension = allowedExtensions.includes(extension);
    
    if (isValidType && isValidExtension) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  };
};

// Resume upload configuration
const resumeFileFilter = createFileFilter(
  [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ['.pdf', '.doc', '.docx']
);

// Profile picture upload configuration
const profilePictureFilter = createFileFilter(
  [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  ['.jpg', '.jpeg', '.png', '.gif', '.webp']
);

// Resume upload middleware
const uploadResume = multer({
  storage: storage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1
  }
}).single('resume');

// Profile picture upload middleware
const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
    files: 1
  }
}).single('profilePicture');

// General file upload middleware
const uploadGeneral = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: 5
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart request';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = error.message;
    }
    
    return res.status(400).json({
      status: 'error',
      message,
      code: error.code
    });
  } else if (error && error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      status: 'error',
      message: error.message,
      code: error.code
    });
  }
  
  next(error);
};

// Clean up old files (utility function)
const cleanupOldFile = async (filePath) => {
  try {
    if (filePath) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.warn('Could not delete old file:', error.message);
  }
};

// Validate file after upload
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }
  
  // Add file info to request for easy access
  req.uploadedFile = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype
  };
  
  next();
};

module.exports = {
  uploadResume,
  uploadProfilePicture,
  uploadGeneral,
  handleUploadError,
  cleanupOldFile,
  validateUploadedFile,
  ensureDirectoryExists
};
