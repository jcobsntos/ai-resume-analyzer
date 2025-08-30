const express = require('express');
const { body, param, query } = require('express-validator');
const jobController = require('../controllers/jobController');
const { protect, restrictTo, optionalAuth, canManageJobs } = require('../middleware/auth');
const validation = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3-100 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50-5000 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country must be at least 2 characters'),
  body('department')
    .isIn(['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Customer Success', 'Data Science', 'Other'])
    .withMessage('Department must be a valid option'),
  body('jobType')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
    .withMessage('Job type must be full-time, part-time, contract, internship, or freelance'),
  body('experienceLevel')
    .isIn(['entry', 'mid', 'senior', 'lead', 'executive'])
    .withMessage('Experience level must be entry, mid, senior, lead, or executive'),
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('requiredSkills')
    .isArray({ min: 1 })
    .withMessage('At least one required skill must be specified'),
  body('requiredSkills.*')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Skills cannot be empty'),
  body('preferredSkills')
    .optional()
    .isArray()
    .withMessage('Preferred skills must be an array'),
  body('preferredSkills.*')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Skills cannot be empty'),
  body('responsibilities')
    .isArray({ min: 1 })
    .withMessage('At least one responsibility must be specified'),
  body('responsibilities.*')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Responsibilities cannot be empty'),
  body('qualifications')
    .isArray({ min: 1 })
    .withMessage('At least one qualification must be specified'),
  body('qualifications.*')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Qualifications cannot be empty'),
  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),
  body('benefits.*')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Benefits cannot be empty'),
  body('applicationDeadline')
    .optional()
    .custom((value) => {
      // Allow empty values
      if (!value || value === '') {
        return true;
      }
      // Check if it's a valid date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Application deadline must be a valid date');
      }
      // Check if it's in the future
      if (date <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    })
];

const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50-5000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'closed', 'filled'])
    .withMessage('Status must be draft, active, paused, closed, or filled'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
];

const jobIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid job ID')
];

const slugValidation = [
  param('slug')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Invalid job slug')
];

// Public routes (no authentication required)
router.get('/', optionalAuth, jobController.getAllJobs);
router.get('/slug/:slug', slugValidation, validation, optionalAuth, jobController.getJobBySlug);
router.get('/:id', jobIdValidation, validation, optionalAuth, jobController.getJob);
router.get('/:id/similar', jobIdValidation, validation, optionalAuth, jobController.getSimilarJobs);

// Advanced search (POST for complex queries)
router.post('/search', optionalAuth, jobController.searchJobs);

// Protected routes (require authentication)
router.use(protect);

// Routes for recruiters and admins only
router.post('/', canManageJobs, createJobValidation, validation, jobController.createJob);
router.patch('/:id', jobIdValidation, canManageJobs, updateJobValidation, validation, jobController.updateJob);
router.delete('/:id', jobIdValidation, canManageJobs, validation, jobController.deleteJob);

// Get applications for a job (recruiters and admins only)
router.get('/:id/applications', jobIdValidation, validation, restrictTo('recruiter', 'admin'), jobController.getJobApplications);

// Statistics routes (recruiters and admins only)
router.get('/stats/overview', restrictTo('recruiter', 'admin'), jobController.getJobStats);

module.exports = router;
