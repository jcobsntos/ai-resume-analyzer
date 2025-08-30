const express = require('express');
const { body } = require('express-validator');
const { 
  analyzeResume, 
  analyzeProfileResume, 
  getJobRecommendations, 
  extractSkills,
  generateInterviewQuestions,
  generateResumeImprovements,
  generateCareerGuidance,
  extractAdvancedSkills,
  analyzeJobMatch,
  generateHiringInsights,
  predictHiringSuccess
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { uploadResume, handleUploadError } = require('../middleware/upload');
const validation = require('../middleware/validation');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// Analyze a resume against a job (preview analysis before submit)
router.post(
  '/analyze-resume',
  uploadResume,
  handleUploadError,
  [
    body('jobId')
      .isMongoId()
      .withMessage('Valid jobId is required'),
  ],
  validation,
  analyzeResume
);

// Job recommendations
router.get('/job-recommendations', validation, getJobRecommendations);

// Analyze stored profile resume vs job
router.post('/analyze-profile-resume', [
  body('jobId').isMongoId().withMessage('Valid jobId is required'),
], validation, analyzeProfileResume);

// Extract skills from uploaded resume
router.post('/extract-skills', uploadResume, handleUploadError, extractSkills);

// Enhanced AI endpoints

// Generate interview questions for an application
router.get('/interview-questions/:applicationId', generateInterviewQuestions);

// Generate resume improvement suggestions
router.post('/resume-improvements', [
  body('targetRole').optional().isString().withMessage('Target role must be a string'),
  body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level')
], validation, generateResumeImprovements);

// Get career guidance and development recommendations
router.get('/career-guidance', generateCareerGuidance);

// Extract advanced skills with context
router.get('/advanced-skills', extractAdvancedSkills);

// Analyze job match for specific candidate
router.post('/job-match-analysis', [
  body('jobId').isMongoId().withMessage('Valid jobId is required'),
  body('candidateId').isMongoId().withMessage('Valid candidateId is required')
], validation, analyzeJobMatch);

// Generate hiring insights for a job
router.get('/hiring-insights/:jobId', generateHiringInsights);

// Predict hiring success for an application
router.get('/success-prediction/:applicationId', predictHiringSuccess);

module.exports = router;

