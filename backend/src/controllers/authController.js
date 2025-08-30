const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createSendToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

// Register new user
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, company, department, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }

  // Create user data object
  const userData = {
    firstName,
    lastName,
    email,
    password,
    role: role || 'candidate',
    phone
  };

  // Add role-specific fields
  if (role === 'recruiter') {
    if (!company || !department) {
      return res.status(400).json({
        status: 'error',
        message: 'Company and department are required for recruiter registration'
      });
    }
    userData.company = company;
    userData.department = department;
  }

  // Create user
  const newUser = await User.create(userData);

  // Calculate initial profile completion
  newUser.calculateProfileCompletion();
  await newUser.save({ validateBeforeSave: false });

  createSendToken(newUser, 201, res, 'User registered successfully');
});

// Login user
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide email and password'
    });
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Incorrect email or password'
    });
  }

  // 3) Check if user account is active
  if (!user.isActive) {
    return res.status(401).json({
      status: 'error',
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // 4) Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // 5) If everything ok, send token to client
  createSendToken(user, 200, res, 'Logged in successfully');
});

// Logout user
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// Get current user profile
const getMe = asyncHandler(async (req, res, next) => {
  // Calculate and update profile completion
  req.user.calculateProfileCompletion();
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// Update current user password
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Current password is incorrect'
    });
  }

  // 3) Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'New password and confirm password do not match'
    });
  }

  // 4) If so, update password
  user.password = newPassword;
  await user.save();

  // 5) Log user in, send JWT
  createSendToken(user, 200, res, 'Password updated successfully');
});

// Update current user profile (excluding password)
const updateMe = asyncHandler(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).json({
      status: 'error',
      message: 'This route is not for password updates. Please use /updatePassword'
    });
  }

  // 2) Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email', 'phone', 'company', 'department');

  // 3) Prevent role changes through this endpoint
  if (req.body.role) {
    return res.status(400).json({
      status: 'error',
      message: 'Role cannot be updated through this endpoint'
    });
  }

  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // 5) Calculate and update profile completion
  updatedUser.calculateProfileCompletion();
  await updatedUser.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

// Deactivate current user account
const deleteMe = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(204).json({
    status: 'success',
    message: 'Account deactivated successfully'
  });
});

// Admin only: Get all users
const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  // Filter by active status
  if (req.query.active !== undefined) {
    query.isActive = req.query.active === 'true';
  }
  
  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { company: searchRegex }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    data: {
      users
    }
  });
});

// Admin only: Get user by ID
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'No user found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Admin only: Update user
const updateUser = asyncHandler(async (req, res, next) => {
  // Filter allowed fields for admin updates
  const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email', 'phone', 'company', 'department', 'role', 'isActive', 'isEmailVerified');

  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'No user found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

// Admin only: Delete user
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'No user found with that ID'
    });
  }

  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully'
  });
});

// Get user statistics (admin and recruiters)
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.getUserStats();
  
  // Additional stats
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
  
  // Recent registrations (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });

  res.status(200).json({
    status: 'success',
    data: {
      stats,
      summary: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        recentRegistrations
      }
    }
  });
});

// Utility function to filter object properties
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  updateMe,
  deleteMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats
};
