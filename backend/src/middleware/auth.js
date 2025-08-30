const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.query.token) {
      // Support token in query parameter for download links
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+role');
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token does no longer exist.',
      });
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password! Please log in again.',
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again!',
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired! Please log in again.',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong during authentication',
    });
  }
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Middleware to check if user owns the resource or has admin/recruiter role
const checkResourceOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Recruiters can access resources in their company
    if (req.user.role === 'recruiter') {
      // For job-related resources, check if the job belongs to the recruiter's company
      if (resourceUserField === 'postedBy' && req.resource && req.resource.postedBy) {
        if (req.resource.postedBy.toString() === req.user._id.toString()) {
          return next();
        }
      }
      // For other resources, allow if the user created them
      if (req.resource && req.resource[resourceUserField]) {
        if (req.resource[resourceUserField].toString() === req.user._id.toString()) {
          return next();
        }
      }
    }

    // Candidates can only access their own resources
    if (req.user.role === 'candidate') {
      if (req.resource && req.resource[resourceUserField]) {
        if (req.resource[resourceUserField].toString() === req.user._id.toString()) {
          return next();
        }
      }
      // Also check direct user ID match
      if (req.params.id === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this resource',
    });
  };
};

// Middleware to check if user can apply for jobs (candidates only)
const canApplyForJobs = (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can apply for jobs',
    });
  }

  // Check if candidate has uploaded a resume
  if (!req.user.resume || !req.user.resume.filename) {
    return res.status(400).json({
      status: 'error',
      message: 'Please upload your resume before applying for jobs',
    });
  }

  next();
};

// Middleware to check if user can manage jobs (recruiters and admins only)
const canManageJobs = (req, res, next) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can manage jobs',
    });
  }
  next();
};

// Middleware to check if user can view analytics (recruiters and admins only)
const canViewAnalytics = (req, res, next) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can view analytics',
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      if (currentUser && currentUser.isActive && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }
  next();
};

// Middleware to update last login time
const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    req.user.lastLogin = new Date();
    await req.user.save({ validateBeforeSave: false });
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  checkResourceOwnership,
  canApplyForJobs,
  canManageJobs,
  canViewAnalytics,
  optionalAuth,
  updateLastLogin,
};
