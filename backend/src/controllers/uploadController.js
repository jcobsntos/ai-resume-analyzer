const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { processResumeFile } = require('../utils/fileParser');
const { cleanupOldFile } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Upload resume for candidate
const uploadResume = asyncHandler(async (req, res, next) => {
  // Check if user is a candidate
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can upload resumes'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No resume file uploaded'
    });
  }

  try {
    // Process the uploaded resume file
    const processingResult = await processResumeFile(req.file.path, req.file.originalname);
    
    if (!processingResult.success) {
      // Clean up the uploaded file if processing failed
      await cleanupOldFile(req.file.path);
      
      return res.status(400).json({
        status: 'error',
        message: 'Failed to process resume file',
        details: processingResult.error
      });
    }

    // Clean up old resume file if exists
    if (req.user.resume && req.user.resume.path) {
      await cleanupOldFile(req.user.resume.path);
    }

    // Update user's resume information
    const resumeData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date(),
      size: req.file.size,
      extractedText: processingResult.extractedText,
      skills: processingResult.basicInfo.skills
    };

    // Extract experience and education if available
    if (processingResult.basicInfo.emails.length > 0) {
      // Update user email if not set and found in resume
      if (!req.user.email && processingResult.basicInfo.emails[0]) {
        req.user.email = processingResult.basicInfo.emails[0];
      }
    }

    if (processingResult.basicInfo.phones.length > 0) {
      // Update user phone if not set and found in resume
      if (!req.user.phone && processingResult.basicInfo.phones[0]) {
        req.user.phone = processingResult.basicInfo.phones[0];
      }
    }

    req.user.resume = resumeData;

    // Calculate and update profile completion
    req.user.calculateProfileCompletion();
    
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Resume uploaded and processed successfully',
      data: {
        resumeInfo: {
          filename: resumeData.filename,
          originalName: resumeData.originalName,
          size: resumeData.size,
          uploadDate: resumeData.uploadDate,
          extractedSkills: resumeData.skills,
          processingTime: processingResult.processingTime,
          stats: processingResult.stats
        },
        profileCompletion: req.user.profileCompletion
      }
    });

  } catch (error) {
    // Clean up the uploaded file in case of error
    await cleanupOldFile(req.file.path);
    throw error;
  }
});

// Upload profile picture
const uploadProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No profile picture uploaded'
    });
  }

  try {
    // Clean up old profile picture if exists
    if (req.user.profilePicture) {
      const oldPicturePath = path.join('uploads', 'profiles', req.user._id.toString(), req.user.profilePicture);
      await cleanupOldFile(oldPicturePath);
    }

    // Update user's profile picture
    req.user.profilePicture = req.file.filename;
    
    // Calculate and update profile completion
    req.user.calculateProfileCompletion();
    
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: req.file.filename,
        profilePictureUrl: `/uploads/profiles/${req.user._id}/${req.file.filename}`,
        profileCompletion: req.user.profileCompletion
      }
    });

  } catch (error) {
    // Clean up the uploaded file in case of error
    await cleanupOldFile(req.file.path);
    throw error;
  }
});

// Delete user's resume
const deleteResume = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can delete resumes'
    });
  }

  if (!req.user.resume || !req.user.resume.path) {
    return res.status(404).json({
      status: 'error',
      message: 'No resume found to delete'
    });
  }

  try {
    // Clean up the resume file
    await cleanupOldFile(req.user.resume.path);

    // Remove resume data from user profile
    req.user.resume = undefined;
    
    // Recalculate profile completion
    req.user.calculateProfileCompletion();
    
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Resume deleted successfully',
      data: {
        profileCompletion: req.user.profileCompletion
      }
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(200).json({
      status: 'success',
      message: 'Resume data cleared (file cleanup may have failed)'
    });
  }
});

// Delete user's profile picture
const deleteProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.user.profilePicture) {
    return res.status(404).json({
      status: 'error',
      message: 'No profile picture found to delete'
    });
  }

  try {
    // Clean up the profile picture file
    const profilePicturePath = path.join('uploads', 'profiles', req.user._id.toString(), req.user.profilePicture);
    await cleanupOldFile(profilePicturePath);

    // Remove profile picture from user profile
    req.user.profilePicture = null;
    
    // Recalculate profile completion
    req.user.calculateProfileCompletion();
    
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Profile picture deleted successfully',
      data: {
        profileCompletion: req.user.profileCompletion
      }
    });

  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(200).json({
      status: 'success',
      message: 'Profile picture data cleared (file cleanup may have failed)'
    });
  }
});

// Get user's resume information (without file content)
const getResumeInfo = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates have resumes'
    });
  }

  if (!req.user.resume) {
    return res.status(404).json({
      status: 'error',
      message: 'No resume uploaded'
    });
  }

  const resumeInfo = {
    filename: req.user.resume.filename,
    originalName: req.user.resume.originalName,
    size: req.user.resume.size,
    uploadDate: req.user.resume.uploadDate,
    skills: req.user.resume.skills || [],
    hasExtractedText: !!(req.user.resume.extractedText && req.user.resume.extractedText.length > 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      resume: resumeInfo
    }
  });
});

// Download user's resume file
const downloadResume = asyncHandler(async (req, res, next) => {
  console.log('downloadResume called for user:', req.user._id);
  
  if (req.user.role !== 'candidate') {
    console.log('Download rejected: user is not a candidate, role:', req.user.role);
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates have resumes'
    });
  }

  if (!req.user.resume || !req.user.resume.path) {
    console.log('Download rejected: no resume found for user');
    return res.status(404).json({
      status: 'error',
      message: 'No resume file found'
    });
  }

  try {
    const filePath = req.user.resume.path;
    const originalName = req.user.resume.originalName;
    console.log('Attempting to download file:', filePath, 'original name:', originalName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist at path:', filePath);
      return res.status(404).json({
        status: 'error',
        message: 'Resume file not found on server'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File exists, size:', stats.size, 'bytes');

    // Get file extension to determine MIME type
    const ext = path.extname(originalName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    console.log('Setting MIME type:', mimeType, 'for extension:', ext);

    // Set headers for file download (with anti-IDM measures)
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    console.log('Creating file stream for path:', filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Error reading file'
        });
      }
    });
    
    fileStream.on('end', () => {
      console.log('File stream ended successfully');
    });
    
    fileStream.pipe(res);
    console.log('File stream piped to response');

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing resume download'
    });
  }
});

// Admin/Recruiter: Download candidate resume by user ID
const downloadCandidateResume = asyncHandler(async (req, res, next) => {
  console.log('downloadCandidateResume called by user:', req.user._id, 'for candidate:', req.params.userId);
  
  if (!['admin', 'recruiter'].includes(req.user.role)) {
    console.log('Download rejected: user is not admin/recruiter, role:', req.user.role);
    return res.status(403).json({
      status: 'error',
      message: 'Only admins and recruiters can download candidate resumes'
    });
  }

  const candidate = await User.findById(req.params.userId);
  
  if (!candidate) {
    console.log('Download rejected: candidate not found:', req.params.userId);
    return res.status(404).json({
      status: 'error',
      message: 'Candidate not found'
    });
  }

  if (candidate.role !== 'candidate') {
    console.log('Download rejected: user is not a candidate, role:', candidate.role);
    return res.status(400).json({
      status: 'error',
      message: 'User is not a candidate'
    });
  }

  if (!candidate.resume || !candidate.resume.path) {
    console.log('Download rejected: no resume found for candidate');
    return res.status(404).json({
      status: 'error',
      message: 'No resume found for this candidate'
    });
  }

  try {
    const filePath = candidate.resume.path;
    const originalName = candidate.resume.originalName;
    const downloadName = `${candidate.firstName}_${candidate.lastName}_Resume_${originalName}`;
    console.log('Attempting to download candidate file:', filePath, 'as:', downloadName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Candidate file does not exist at path:', filePath);
      return res.status(404).json({
        status: 'error',
        message: 'Resume file not found on server'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('Candidate file exists, size:', stats.size, 'bytes');

    // Get file extension to determine MIME type
    const ext = path.extname(originalName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    console.log('Setting candidate MIME type:', mimeType, 'for extension:', ext);

    // Set headers for file download (with anti-IDM measures)
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    console.log('Creating candidate file stream for path:', filePath);
    
    fileStream.on('error', (error) => {
      console.error('Candidate file stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Error reading file'
        });
      }
    });
    
    fileStream.on('end', () => {
      console.log('Candidate file stream ended successfully');
    });
    
    fileStream.pipe(res);
    console.log('Candidate file stream piped to response');

  } catch (error) {
    console.error('Error downloading candidate resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing resume download'
    });
  }
});

// Get user's resume as base64 (IDM bypass method)
const getResumeBase64 = asyncHandler(async (req, res, next) => {
  console.log('getResumeBase64 called for user:', req.user._id);
  
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates have resumes'
    });
  }

  if (!req.user.resume || !req.user.resume.path) {
    return res.status(404).json({
      status: 'error',
      message: 'No resume file found'
    });
  }

  try {
    const filePath = req.user.resume.path;
    const originalName = req.user.resume.originalName;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Resume file not found on server'
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const ext = path.extname(originalName).toLowerCase();
    
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.status(200).json({
      status: 'success',
      data: {
        filename: originalName,
        mimeType: mimeType,
        size: fileBuffer.length,
        base64Data: base64Data
      }
    });

  } catch (error) {
    console.error('Error getting resume base64:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing resume'
    });
  }
});

// Get candidate resume as base64 (IDM bypass method)
const getCandidateResumeBase64 = asyncHandler(async (req, res, next) => {
  console.log('getCandidateResumeBase64 called by user:', req.user._id, 'for candidate:', req.params.userId);
  
  if (!['admin', 'recruiter'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins and recruiters can download candidate resumes'
    });
  }

  const candidate = await User.findById(req.params.userId);
  
  if (!candidate) {
    return res.status(404).json({
      status: 'error',
      message: 'Candidate not found'
    });
  }

  if (candidate.role !== 'candidate') {
    return res.status(400).json({
      status: 'error',
      message: 'User is not a candidate'
    });
  }

  if (!candidate.resume || !candidate.resume.path) {
    return res.status(404).json({
      status: 'error',
      message: 'No resume found for this candidate'
    });
  }

  try {
    const filePath = candidate.resume.path;
    const originalName = candidate.resume.originalName;
    const downloadName = `${candidate.firstName}_${candidate.lastName}_Resume_${originalName}`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Resume file not found on server'
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const ext = path.extname(originalName).toLowerCase();
    
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.status(200).json({
      status: 'success',
      data: {
        filename: downloadName,
        mimeType: mimeType,
        size: fileBuffer.length,
        base64Data: base64Data
      }
    });

  } catch (error) {
    console.error('Error getting candidate resume base64:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing resume'
    });
  }
});

module.exports = {
  uploadResume,
  uploadProfilePicture,
  deleteResume,
  deleteProfilePicture,
  getResumeInfo,
  downloadResume,
  downloadCandidateResume,
  getResumeBase64,
  getCandidateResumeBase64
};
