const express = require('express');
const { param } = require('express-validator');
const uploadController = require('../controllers/uploadController');
const { protect, restrictTo } = require('../middleware/auth');
const { 
  uploadResume, 
  uploadProfilePicture, 
  handleUploadError 
} = require('../middleware/upload');
const validation = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Resume management routes (candidates only)
router.post('/resume', uploadResume, handleUploadError, uploadController.uploadResume);
router.get('/resume/info', uploadController.getResumeInfo);
router.get('/resume/download', uploadController.downloadResume);
router.get('/resume/base64', uploadController.getResumeBase64);
router.delete('/resume', uploadController.deleteResume);

// Profile picture management routes
router.post('/profile-picture', uploadProfilePicture, handleUploadError, uploadController.uploadProfilePicture);
router.delete('/profile-picture', uploadController.deleteProfilePicture);

// Admin/Recruiter routes
const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

router.get('/:userId/resume/download', 
  userIdValidation, 
  validation, 
  restrictTo('admin', 'recruiter'), 
  uploadController.downloadCandidateResume
);

router.get('/:userId/resume/base64', 
  userIdValidation, 
  validation, 
  restrictTo('admin', 'recruiter'), 
  uploadController.getCandidateResumeBase64
);

module.exports = router;
