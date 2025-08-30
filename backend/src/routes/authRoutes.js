const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const validation = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['candidate', 'recruiter', 'admin'])
    .withMessage('Role must be candidate, recruiter, or admin'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('company')
    .if(body('role').equals('recruiter'))
    .notEmpty()
    .withMessage('Company is required for recruiters'),
  body('department')
    .if(body('role').equals('recruiter'))
    .notEmpty()
    .withMessage('Department is required for recruiters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1-50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Public routes
router.post('/register', registerValidation, validation, authController.register);
router.post('/login', loginValidation, validation, authController.login);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.patch('/updatePassword', updatePasswordValidation, validation, authController.updatePassword);
router.patch('/updateMe', updateProfileValidation, validation, authController.updateMe);
router.delete('/deleteMe', authController.deleteMe);

// Admin only routes
router.use(restrictTo('admin')); // All routes after this middleware require admin role

router.get('/users', authController.getAllUsers);
router.get('/users/stats', authController.getUserStats);
router.get('/users/:id', authController.getUser);
router.patch('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;
