const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { protect, restrictTo, canApplyForJobs } = require('../middleware/auth');
const validation = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const applyJobValidation = [
  body('jobId')
    .isMongoId()
    .withMessage('Invalid job ID'),
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
  body('questionsResponses')
    .optional()
    .isArray()
    .withMessage('Questions responses must be an array'),
  body('questionsResponses.*.question')
    .if(body('questionsResponses').exists())
    .notEmpty()
    .withMessage('Question is required'),
  body('questionsResponses.*.answer')
    .if(body('questionsResponses').exists())
    .notEmpty()
    .withMessage('Answer is required')
];

const updateStatusValidation = [
  body('status')
    .isIn(['applied', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
    .withMessage('Invalid application status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const addNoteValidation = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1-1000 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean')
];

const scheduleInterviewValidation = [
  body('type')
    .isIn(['phone', 'video', 'in-person', 'technical'])
    .withMessage('Interview type must be phone, video, in-person, or technical'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Interview must be scheduled for a future date');
      }
      return true;
    }),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const bulkUpdateValidation = [
  body('applicationIds')
    .isArray({ min: 1 })
    .withMessage('At least one application ID is required'),
  body('applicationIds.*')
    .isMongoId()
    .withMessage('Invalid application ID'),
  body('status')
    .isIn(['applied', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])
    .withMessage('Invalid application status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const bulkDeleteValidation = [
  body('applicationIds')
    .isArray({ min: 1 })
    .withMessage('At least one application ID is required'),
  body('applicationIds.*')
    .isMongoId()
    .withMessage('Invalid application ID')
];

const applicationIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid application ID')
];

// Public candidate routes
router.post('/apply', canApplyForJobs, applyJobValidation, validation, applicationController.applyForJob);
router.get('/my-applications', applicationController.getMyApplications);
router.patch('/:id/withdraw', applicationIdValidation, validation, applicationController.withdrawApplication);

// General application routes
router.get('/', applicationController.getAllApplications);
router.get('/stats', applicationController.getApplicationStats);
router.get('/:id', applicationIdValidation, validation, applicationController.getApplication);

// Recruiter and admin routes
router.patch('/:id/status', 
  applicationIdValidation, 
  restrictTo('recruiter', 'admin'), 
  updateStatusValidation, 
  validation, 
  applicationController.updateApplicationStatus
);

router.post('/:id/notes', 
  applicationIdValidation, 
  restrictTo('recruiter', 'admin'), 
  addNoteValidation, 
  validation, 
  applicationController.addRecruiterNote
);

router.post('/:id/interview', 
  applicationIdValidation, 
  restrictTo('recruiter', 'admin'), 
  scheduleInterviewValidation, 
  validation, 
  applicationController.scheduleInterview
);

router.post('/:id/re-analyze', 
  applicationIdValidation, 
  restrictTo('recruiter', 'admin'), 
  validation, 
  applicationController.reAnalyzeApplication
);

router.patch('/bulk/status', 
  restrictTo('recruiter', 'admin'), 
  bulkUpdateValidation, 
  validation, 
  applicationController.bulkUpdateStatus
);

// Admin-only delete routes - bulk route must come before /:id route
router.delete('/bulk', 
  restrictTo('admin'), 
  bulkDeleteValidation, 
  validation, 
  applicationController.bulkDeleteApplications
);

router.delete('/:id', 
  applicationIdValidation, 
  restrictTo('admin'), 
  validation, 
  applicationController.deleteApplication
);

module.exports = router;
