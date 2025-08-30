const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo, canViewAnalytics } = require('../middleware/auth');
const validation = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and analytics permission
router.use(protect);
router.use(canViewAnalytics);

// Validation rules
const timeRangeValidation = [
  query('timeRange')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Time range must be between 1 and 365 days')
];

const candidateQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('minScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum score must be between 0 and 100')
];

// Analytics routes
router.get('/dashboard', timeRangeValidation, validation, analyticsController.getDashboardAnalytics);
router.get('/funnel', analyticsController.getRecruitmentFunnel);
router.get('/top-candidates', candidateQueryValidation, validation, analyticsController.getTopCandidates);

module.exports = router;
