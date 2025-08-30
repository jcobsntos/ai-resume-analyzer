const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const aiAnalysisService = require('../services/aiAnalysisService');
const asyncHandler = require('../utils/asyncHandler');

// Apply for a job (candidates only)
const applyForJob = asyncHandler(async (req, res, next) => {
  const { jobId, coverLetter, questionsResponses } = req.body;

  // Check if user is a candidate
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can apply for jobs'
    });
  }

  // Check if candidate has uploaded a resume
  if (!req.user.resume || !req.user.resume.extractedText) {
    return res.status(400).json({
      status: 'error',
      message: 'Please upload your resume before applying for jobs'
    });
  }

  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      status: 'error',
      message: 'Job not found'
    });
  }

  if (job.status !== 'active') {
    return res.status(400).json({
      status: 'error',
      message: 'This job is no longer accepting applications'
    });
  }

  // Check if application deadline has passed
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.status(400).json({
      status: 'error',
      message: 'Application deadline has passed'
    });
  }

  // Check if user has already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    candidate: req.user._id
  });

  if (existingApplication) {
    return res.status(400).json({
      status: 'error',
      message: 'You have already applied for this job'
    });
  }

  try {
    // Perform AI analysis
    const aiAnalysis = await aiAnalysisService.analyzeResume(req.user.resume.extractedText, {
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      experienceLevel: job.experienceLevel,
      qualifications: job.qualifications
    });

    // Create application
    const applicationData = {
      job: jobId,
      candidate: req.user._id,
      coverLetter,
      questionsResponses: questionsResponses || [],
      resumeAtApplication: {
        filename: req.user.resume.filename,
        originalName: req.user.resume.originalName,
        path: req.user.resume.path,
        extractedText: req.user.resume.extractedText,
        skills: req.user.resume.skills,
        uploadDate: req.user.resume.uploadDate
      },
      aiAnalysis,
      status: 'applied'
    };

    const application = await Application.create(applicationData);

    // Increment job application count
    await job.incrementApplications();

    // Populate application with job and candidate details
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company location')
      .populate('candidate', 'firstName lastName email');

    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: {
        application: populatedApplication
      }
    });

  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing your application. Please try again.'
    });
  }
});

// Get all applications (role-based filtering)
const getAllApplications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = {};

  // Role-based filtering
  if (req.user.role === 'candidate') {
    query.candidate = req.user._id;
  } else if (req.user.role === 'recruiter') {
    // Recruiters see applications for jobs posted by recruiters in their company
    let posterIds = [req.user._id];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      posterIds = teammates.map(t => t._id);
    }
    const recruiterJobs = await Job.find({ postedBy: { $in: posterIds } }).select('_id');
    query.job = { $in: recruiterJobs.map(job => job._id) };
  }
  // Admins can see all applications (no filter)

  // Status filter
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Score range filter
  if (req.query.minScore) {
    query['aiAnalysis.overallScore'] = { $gte: parseInt(req.query.minScore) };
  }
  if (req.query.maxScore) {
    query['aiAnalysis.overallScore'] = { 
      ...query['aiAnalysis.overallScore'],
      $lte: parseInt(req.query.maxScore) 
    };
  }

  // Job filter
  if (req.query.jobId) {
    query.job = req.query.jobId;
  }

  // Sort options
  let sortOptions = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    sortOptions = { 'aiAnalysis.overallScore': -1, createdAt: -1 };
  }

  const applications = await Application.find(query)
    .populate('job', 'title company location status')
    .populate('candidate', 'firstName lastName email phone profilePicture')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const totalApplications = await Application.countDocuments(query);
  const totalPages = Math.ceil(totalApplications / limit);

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
    data: {
      applications
    }
  });
});

// Get single application
const getApplication = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role === 'candidate') {
    query.candidate = req.user._id;
  } else if (req.user.role === 'recruiter') {
    // Verify recruiter has access to this application (company-wide)
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(application.job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this application'
      });
    }
  }

  const application = await Application.findOne(query)
    .populate('job', 'title company location description requiredSkills')
    .populate('candidate', 'firstName lastName email phone profilePicture')
    .populate('interviews.interviewer', 'firstName lastName')
    .populate('statusHistory.updatedBy', 'firstName lastName')
    .populate('recruiterNotes.addedBy', 'firstName lastName');

  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      application
    }
  });
});

// Update application status (recruiters and admins only)
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;
  
  // Verify permissions
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can update application status'
    });
  }

  const application = await Application.findById(req.params.id).populate('job candidate');
  
  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  // Check if recruiter has permission for this application
  if (req.user.role === 'recruiter') {
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(application.job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update applications for jobs posted by your company'
      });
    }
  }

  // Update application status
  application.status = status;
  application.statusHistory.push({
    status,
    date: new Date(),
    updatedBy: req.user._id,
    notes
  });

  await application.save();

  // Send notification email (implement later)
  // await emailService.sendStatusUpdateNotification(application);

  res.status(200).json({
    status: 'success',
    message: 'Application status updated successfully',
    data: {
      application
    }
  });
});

// Add recruiter note to application
const addRecruiterNote = asyncHandler(async (req, res, next) => {
  const { note, isPrivate } = req.body;
  
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can add notes'
    });
  }

  const application = await Application.findById(req.params.id).populate('job');
  
  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  // Check permissions
  if (req.user.role === 'recruiter') {
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(application.job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only add notes to applications for jobs posted by your company'
      });
    }
  }

  await application.addRecruiterNote(note, req.user._id, isPrivate || false);

  res.status(200).json({
    status: 'success',
    message: 'Note added successfully',
    data: {
      note: {
        note,
        addedBy: req.user._id,
        addedAt: new Date(),
        isPrivate: isPrivate || false
      }
    }
  });
});

// Schedule interview
const scheduleInterview = asyncHandler(async (req, res, next) => {
  const { type, scheduledDate, duration, notes } = req.body;
  
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can schedule interviews'
    });
  }

  const application = await Application.findById(req.params.id).populate('job candidate');
  
  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  // Check permissions
  if (req.user.role === 'recruiter') {
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(application.job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only schedule interviews for applications posted by your company'
      });
    }
  }

  const interviewData = {
    type,
    scheduledDate: new Date(scheduledDate),
    duration: duration || 60,
    interviewer: req.user._id,
    notes
  };

  await application.scheduleInterview(interviewData);

  // Update application status to interview if not already there
  if (!['interview', 'offer', 'hired'].includes(application.status)) {
    application.status = 'interview';
    await application.save();
  }

  // Send notification email (implement later)
  // await emailService.sendInterviewNotification(application, interviewData);

  res.status(200).json({
    status: 'success',
    message: 'Interview scheduled successfully',
    data: {
      interview: interviewData
    }
  });
});

// Get candidate's applications
const getMyApplications = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can view their applications'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { candidate: req.user._id };

  // Status filter
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by jobId if provided
  if (req.query.jobId) {
    query.job = req.query.jobId;
  }

  const applications = await Application.find(query)
    .populate('job', 'title company location status applicationDeadline')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalApplications = await Application.countDocuments(query);
  const totalPages = Math.ceil(totalApplications / limit);

  // Get application statistics
  const stats = await Application.aggregate([
    { $match: { candidate: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
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
      applications
    }
  });
});

// Withdraw application (candidates only)
const withdrawApplication = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      status: 'error',
      message: 'Only candidates can withdraw their applications'
    });
  }

  const application = await Application.findOne({
    _id: req.params.id,
    candidate: req.user._id
  }).populate('job');

  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  // Check if application can be withdrawn
  if (['hired', 'rejected'].includes(application.status)) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot withdraw application that has been finalized'
    });
  }

  await application.updateStatus('withdrawn', req.user._id, 'Application withdrawn by candidate');

  res.status(200).json({
    status: 'success',
    message: 'Application withdrawn successfully',
    data: {
      application
    }
  });
});

// Re-analyze application with updated AI
const reAnalyzeApplication = asyncHandler(async (req, res, next) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can re-analyze applications'
    });
  }

  const application = await Application.findById(req.params.id).populate('job candidate');
  
  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  // Check permissions for recruiters
  if (req.user.role === 'recruiter' && application.job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only re-analyze applications for jobs you posted'
    });
  }

  try {
    // Perform fresh AI analysis
    const aiAnalysis = await aiAnalysisService.analyzeResume(application.resumeAtApplication.extractedText, {
      description: application.job.description,
      requiredSkills: application.job.requiredSkills,
      preferredSkills: application.job.preferredSkills,
      experienceLevel: application.job.experienceLevel,
      qualifications: application.job.qualifications
    });

    // Update application with new analysis
    application.aiAnalysis = aiAnalysis;
    await application.save();

    res.status(200).json({
      status: 'success',
      message: 'Application re-analyzed successfully',
      data: {
        aiAnalysis: application.aiAnalysis
      }
    });

  } catch (error) {
    console.error('Error re-analyzing application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error re-analyzing application'
    });
  }
});

// Get application statistics
const getApplicationStats = asyncHandler(async (req, res, next) => {
  let matchQuery = {};

  // Role-based filtering
  if (req.user.role === 'recruiter') {
    let posterIds = [req.user._id];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      posterIds = teammates.map(t => t._id);
    }
    const recruiterJobs = await Job.find({ postedBy: { $in: posterIds } }).select('_id');
    matchQuery.job = { $in: recruiterJobs.map(job => job._id) };
  } else if (req.user.role === 'candidate') {
    matchQuery.candidate = req.user._id;
  }

  // Get role-filtered stats by status
  const statsAggregation = await Application.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Convert to object format
  const statsByStatus = {};
  statsAggregation.forEach(stat => {
    statsByStatus[stat._id] = stat.count;
  });
  
  // Additional role-specific stats
  const totalApplications = await Application.countDocuments(matchQuery);
  const averageScore = await Application.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);

  // Top performing candidates (for recruiters/admins)
  let topCandidates = [];
  if (['recruiter', 'admin'].includes(req.user.role)) {
    topCandidates = await Application.find(matchQuery)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title company')
      .sort({ 'aiAnalysis.overallScore': -1 })
      .limit(5);
  }

  res.status(200).json({
    status: 'success',
    data: {
      stats: statsByStatus,
      summary: {
        total: totalApplications,
        averageScore: averageScore[0]?.avgScore || 0
      },
      ...(topCandidates.length > 0 && { topCandidates })
    }
  });
});

// Bulk update application status
const bulkUpdateStatus = asyncHandler(async (req, res, next) => {
  const { applicationIds, status, notes } = req.body;

  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only recruiters and admins can bulk update applications'
    });
  }

  let query = { _id: { $in: applicationIds } };

  // For recruiters, ensure they only update their own job applications
  if (req.user.role === 'recruiter') {
    let posterIds = [req.user._id];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      posterIds = teammates.map(t => t._id);
    }
    const recruiterJobs = await Job.find({ postedBy: { $in: posterIds } }).select('_id');
    query.job = { $in: recruiterJobs.map(job => job._id) };
  }

  const applications = await Application.find(query);

  if (applications.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'No applications found or you do not have permission to update them'
    });
  }

  // Update all applications
  const updatePromises = applications.map(application => 
    application.updateStatus(status, req.user._id, notes)
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    status: 'success',
    message: `${applications.length} applications updated successfully`,
    data: {
      updatedCount: applications.length,
      newStatus: status
    }
  });
});

// Delete single application (admin only)
const deleteApplication = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can delete applications'
    });
  }

  const application = await Application.findById(req.params.id);
  
  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  await Application.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Application deleted successfully'
  });
});

// Bulk delete applications (admin only)
const bulkDeleteApplications = asyncHandler(async (req, res, next) => {
  const { applicationIds } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can delete applications'
    });
  }

  const result = await Application.deleteMany({
    _id: { $in: applicationIds }
  });

  res.status(200).json({
    status: 'success',
    message: `${result.deletedCount} applications deleted successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

module.exports = {
  applyForJob,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  addRecruiterNote,
  scheduleInterview,
  getMyApplications,
  withdrawApplication,
  reAnalyzeApplication,
  getApplicationStats,
  bulkUpdateStatus,
  deleteApplication,
  bulkDeleteApplications
};
