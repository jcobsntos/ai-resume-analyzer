const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const asyncHandler = require('../utils/asyncHandler');

// Get all jobs with filtering, sorting, and pagination
const getAllJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};

  // Status filter - default to active for public view
  if (req.query.status) {
    query.status = req.query.status;
  } else if (!req.user || req.user.role === 'candidate') {
    query.status = 'active';
  }

  // Role-based filtering
  if (req.user && req.user.role === 'recruiter') {
    // Recruiters only see jobs from their company
    query.postedBy = req.user._id;
  }

  // Location filters
  if (req.query.city) {
    query['location.city'] = new RegExp(req.query.city, 'i');
  }
  if (req.query.state) {
    query['location.state'] = new RegExp(req.query.state, 'i');
  }
  if (req.query.remote === 'true') {
    query['location.remote'] = true;
  }

  // Job type and experience level filters
  if (req.query.jobType) {
    query.jobType = req.query.jobType;
  }
  if (req.query.experienceLevel) {
    query.experienceLevel = req.query.experienceLevel;
  }
  if (req.query.department) {
    query.department = req.query.department;
  }

  // Salary range filter
  if (req.query.minSalary || req.query.maxSalary) {
    query.$or = [];
    if (req.query.minSalary) {
      query.$or.push({ 'salary.min': { $gte: parseInt(req.query.minSalary) } });
    }
    if (req.query.maxSalary) {
      query.$or.push({ 'salary.max': { $lte: parseInt(req.query.maxSalary) } });
    }
  }

  // Skills filter
  if (req.query.skills) {
    const skills = req.query.skills.split(',').map(skill => skill.trim());
    query.requiredSkills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
  }

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { company: searchRegex },
      { requiredSkills: { $in: [searchRegex] } },
      { preferredSkills: { $in: [searchRegex] } }
    ];
  }

  // Exclude expired jobs for candidates
  if (!req.user || req.user.role === 'candidate') {
    query.$or = [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ];
  }

  // Build sort options
  let sortOptions = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    // Default sort: featured first, then urgent, then newest
    sortOptions = { featured: -1, urgent: -1, createdAt: -1 };
  }

  const jobs = await Job.find(query)
    .populate('postedBy', 'firstName lastName company')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const totalJobs = await Job.countDocuments(query);
  const totalPages = Math.ceil(totalJobs / limit);

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    pagination: {
      currentPage: page,
      totalPages,
      totalJobs,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    data: {
      jobs
    }
  });
});

// Get single job by ID
const getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'firstName lastName company');

  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that ID'
    });
  }

  // Check permissions for non-public jobs
  if (job.status !== 'active' && req.user) {
    if (req.user.role === 'candidate') {
      return res.status(403).json({
        status: 'error',
        message: 'This job is not available for applications'
      });
    }
    if (req.user.role === 'recruiter' && job.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only view jobs posted by your company'
      });
    }
  }

  // Increment view count (but not for the job poster)
  if (!req.user || req.user._id.toString() !== job.postedBy._id.toString()) {
    await job.incrementViews();
  }

  res.status(200).json({
    status: 'success',
    data: {
      job
    }
  });
});

// Create new job (recruiters and admins only)
const createJob = asyncHandler(async (req, res, next) => {
  // Add the user who created the job
  req.body.postedBy = req.user._id;
  
  // Set company from user's profile for recruiters if not provided
  if (req.user.role === 'recruiter') {
    if (!req.body.company && req.user.company) {
      req.body.company = req.user.company;
    }
    // If recruiter doesn't have company set, require it in the request
    if (!req.body.company) {
      return res.status(400).json({
        status: 'error',
        message: 'Company name is required. Please update your profile or provide a company name.',
        errors: [{ field: 'company', message: 'Company name is required' }]
      });
    }
  }

  try {
    const job = await Job.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Job created successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Job creation error:', error);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = [];
      for (let field in error.errors) {
        errors.push({
          field: field,
          message: error.errors[field].message
        });
      }
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create job',
      error: error.message
    });
  }
});

// Update job (only by creator or admin)
const updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that ID'
    });
  }

  // Check permissions
  if (req.user.role === 'recruiter' && job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only update jobs posted by you'
    });
  }

  // Prevent changing certain fields
  const restrictedFields = ['postedBy', 'applicationCount', 'viewCount'];
  restrictedFields.forEach(field => delete req.body[field]);

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Job updated successfully',
    data: {
      job
    }
  });
});

// Delete job (only by creator or admin)
const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that ID'
    });
  }

  // Check permissions
  if (req.user.role === 'recruiter' && job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only delete jobs posted by you'
    });
  }

  // Check if there are any applications
  const applicationCount = await Application.countDocuments({ job: job._id });
  if (applicationCount > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Cannot delete job with ${applicationCount} applications. Please close the job instead.`
    });
  }

  await Job.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Job deleted successfully'
  });
});

// Get jobs by slug (SEO-friendly URLs)
const getJobBySlug = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({ slug: req.params.slug }).populate('postedBy', 'firstName lastName company');

  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that URL'
    });
  }

  // Same permission checks as getJob
  if (job.status !== 'active' && req.user) {
    if (req.user.role === 'candidate') {
      return res.status(403).json({
        status: 'error',
        message: 'This job is not available for applications'
      });
    }
    if (req.user.role === 'recruiter' && job.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only view jobs posted by your company'
      });
    }
  }

  // Increment view count
  if (!req.user || req.user._id.toString() !== job.postedBy._id.toString()) {
    await job.incrementViews();
  }

  res.status(200).json({
    status: 'success',
    data: {
      job
    }
  });
});

// Get applications for a specific job (recruiters and admins only)
const getJobApplications = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that ID'
    });
  }

  // Check permissions
  if (req.user.role === 'recruiter' && job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only view applications for jobs posted by you'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query for applications
  let query = { job: req.params.id };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by AI score range
  if (req.query.minScore) {
    query['aiAnalysis.overallScore'] = { $gte: parseInt(req.query.minScore) };
  }
  if (req.query.maxScore) {
    query['aiAnalysis.overallScore'] = { 
      ...query['aiAnalysis.overallScore'],
      $lte: parseInt(req.query.maxScore) 
    };
  }

  // Sort options
  let sortOptions = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    // Default sort by AI score descending
    sortOptions = { 'aiAnalysis.overallScore': -1, createdAt: -1 };
  }

  const applications = await Application.find(query)
    .populate('candidate', 'firstName lastName email phone profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const totalApplications = await Application.countDocuments(query);
  const totalPages = Math.ceil(totalApplications / limit);

  // Get application statistics
  const stats = await Application.aggregate([
    { $match: { job: job._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: applications.length,
    pagination: {
      currentPage: page,
      totalPages,
      totalApplications,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    stats,
    data: {
      job,
      applications
    }
  });
});

// Get job statistics (recruiters and admins)
const getJobStats = asyncHandler(async (req, res, next) => {
  let matchQuery = {};
  
  // Role-based filtering
  if (req.user.role === 'recruiter') {
    matchQuery.postedBy = req.user._id;
  }

  const stats = await Job.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalApplications: { $sum: '$applicationCount' },
        avgApplicationsPerJob: { $avg: '$applicationCount' }
      }
    }
  ]);

  // Additional statistics
  const totalJobs = await Job.countDocuments(matchQuery);
  const activeJobs = await Job.countDocuments({ ...matchQuery, status: 'active' });
  const totalViews = await Job.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, total: { $sum: '$viewCount' } } }
  ]);

  // Most popular skills
  const popularSkills = await Job.aggregate([
    { $match: matchQuery },
    { $unwind: '$requiredSkills' },
    { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
      summary: {
        totalJobs,
        activeJobs,
        totalViews: totalViews[0]?.total || 0,
        popularSkills
      }
    }
  });
});

// Search jobs with advanced filtering
const searchJobs = asyncHandler(async (req, res, next) => {
  const { query, filters } = req.body;
  
  const jobs = await Job.searchJobs(query, filters);
  
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs
    }
  });
});

// Get similar jobs based on skills and department
const getSimilarJobs = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'No job found with that ID'
    });
  }

  const similarJobs = await Job.find({
    _id: { $ne: job._id },
    status: 'active',
    $or: [
      { department: job.department },
      { requiredSkills: { $in: job.requiredSkills } },
      { experienceLevel: job.experienceLevel }
    ]
  })
  .populate('postedBy', 'firstName lastName company')
  .limit(5)
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: similarJobs.length,
    data: {
      similarJobs
    }
  });
});

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobBySlug,
  getJobApplications,
  getJobStats,
  searchJobs,
  getSimilarJobs
};
