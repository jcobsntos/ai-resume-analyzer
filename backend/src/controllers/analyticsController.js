const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Get comprehensive dashboard analytics
const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  let matchQuery = {};

  // Role-based filtering
  if (req.user.role === 'recruiter') {
    const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
    matchQuery.job = { $in: recruiterJobs.map(job => job._id) };
  }

  // Get date range filter
  const timeRange = req.query.timeRange || '30'; // days
  const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

  const analytics = {
    overview: {},
    trends: {},
    topMetrics: {},
    charts: {}
  };

  // Overview Statistics
  if (req.user.role === 'admin') {
    analytics.overview = {
      totalUsers: await User.countDocuments(),
      totalCandidates: await User.countDocuments({ role: 'candidate' }),
      totalRecruiters: await User.countDocuments({ role: 'recruiter' }),
      totalJobs: await Job.countDocuments(),
      activeJobs: await Job.countDocuments({ status: 'active' }),
      totalApplications: await Application.countDocuments(),
      avgMatchScore: await getAverageMatchScore()
    };
  } else if (req.user.role === 'recruiter') {
    const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
    analytics.overview = {
      myJobs: recruiterJobs.length,
      activeJobs: await Job.countDocuments({ postedBy: req.user._id, status: 'active' }),
      totalApplications: await Application.countDocuments({ job: { $in: recruiterJobs.map(j => j._id) } }),
      avgMatchScore: await getAverageMatchScore(req.user._id)
    };
  }

  // Application trends over time
  analytics.trends.applicationsByDay = await getApplicationTrends(startDate, matchQuery);
  analytics.trends.jobsByDay = await getJobPostingTrends(startDate, req.user);

  // Top performing metrics
  analytics.topMetrics.topSkills = await getTopSkills(matchQuery);
  analytics.topMetrics.topCompanies = await getTopCompanies(req.user);
  analytics.topMetrics.applicationsByStatus = await getApplicationsByStatus(matchQuery);

  // Chart data
  analytics.charts.scoreDistribution = await getScoreDistribution(matchQuery);
  analytics.charts.departmentBreakdown = await getDepartmentBreakdown(req.user);
  analytics.charts.experienceLevelBreakdown = await getExperienceLevelBreakdown(req.user);

  res.status(200).json({
    status: 'success',
    data: {
      analytics,
      timeRange: parseInt(timeRange),
      generatedAt: new Date()
    }
  });
});

// Get recruitment funnel metrics
const getRecruitmentFunnel = asyncHandler(async (req, res, next) => {
  let matchQuery = {};

  if (req.user.role === 'recruiter') {
    const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
    matchQuery.job = { $in: recruiterJobs.map(job => job._id) };
  }

  const funnel = await Application.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Calculate conversion rates
  const totalApplications = funnel.reduce((sum, stage) => sum + stage.count, 0);
  const funnelWithRates = funnel.map(stage => ({
    ...stage,
    percentage: ((stage.count / totalApplications) * 100).toFixed(1),
    avgScore: Math.round(stage.avgScore || 0)
  }));

  res.status(200).json({
    status: 'success',
    data: {
      funnel: funnelWithRates,
      totalApplications
    }
  });
});

// Get top performing candidates
const getTopCandidates = asyncHandler(async (req, res, next) => {
  let matchQuery = {};

  if (req.user.role === 'recruiter') {
    const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
    matchQuery.job = { $in: recruiterJobs.map(job => job._id) };
  }

  const limit = parseInt(req.query.limit) || 10;
  const minScore = parseInt(req.query.minScore) || 70;

  const topCandidates = await Application.find({
    ...matchQuery,
    'aiAnalysis.overallScore': { $gte: minScore }
  })
    .populate('candidate', 'firstName lastName email profilePicture')
    .populate('job', 'title company')
    .sort({ 'aiAnalysis.overallScore': -1 })
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: topCandidates.length,
    data: {
      topCandidates: topCandidates.map(app => ({
        candidate: app.candidate,
        job: app.job,
        score: app.aiAnalysis.overallScore,
        status: app.status,
        appliedAt: app.createdAt,
        matchSummary: app.getMatchSummary()
      }))
    }
  });
});

// Helper functions

async function getAverageMatchScore(recruiterId = null) {
  let matchQuery = {};
  
  if (recruiterId) {
    const recruiterJobs = await Job.find({ postedBy: recruiterId }).select('_id');
    matchQuery.job = { $in: recruiterJobs.map(job => job._id) };
  }

  const result = await Application.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);

  return Math.round(result[0]?.avgScore || 0);
}

async function getApplicationTrends(startDate, matchQuery) {
  return await Application.aggregate([
    { 
      $match: { 
        ...matchQuery,
        createdAt: { $gte: startDate } 
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getJobPostingTrends(startDate, user) {
  let matchQuery = { createdAt: { $gte: startDate } };
  
  if (user.role === 'recruiter') {
    matchQuery.postedBy = user._id;
  }

  return await Job.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getTopSkills(matchQuery) {
  return await Application.aggregate([
    { $match: matchQuery },
    { $unwind: '$resumeAtApplication.skills' },
    { 
      $group: { 
        _id: '$resumeAtApplication.skills', 
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      } 
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
}

async function getTopCompanies(user) {
  let matchQuery = {};
  
  if (user.role === 'recruiter') {
    matchQuery.postedBy = user._id;
  }

  return await Job.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$company',
        jobCount: { $sum: 1 },
        totalApplications: { $sum: '$applicationCount' },
        avgViews: { $avg: '$viewCount' }
      }
    },
    { $sort: { totalApplications: -1 } },
    { $limit: 10 }
  ]);
}

async function getApplicationsByStatus(matchQuery) {
  return await Application.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

async function getScoreDistribution(matchQuery) {
  return await Application.aggregate([
    { $match: matchQuery },
    {
      $bucket: {
        groupBy: '$aiAnalysis.overallScore',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 'unknown',
        output: {
          count: { $sum: 1 },
          avgScore: { $avg: '$aiAnalysis.overallScore' }
        }
      }
    }
  ]);
}

async function getDepartmentBreakdown(user) {
  let matchQuery = {};
  
  if (user.role === 'recruiter') {
    matchQuery.postedBy = user._id;
  }

  return await Job.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$department',
        jobCount: { $sum: 1 },
        totalApplications: { $sum: '$applicationCount' }
      }
    },
    { $sort: { jobCount: -1 } }
  ]);
}

async function getExperienceLevelBreakdown(user) {
  let matchQuery = {};
  
  if (user.role === 'recruiter') {
    matchQuery.postedBy = user._id;
  }

  return await Job.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$experienceLevel',
        jobCount: { $sum: 1 },
        totalApplications: { $sum: '$applicationCount' },
        avgApplicationsPerJob: { $avg: '$applicationCount' }
      }
    },
    { $sort: { jobCount: -1 } }
  ]);
}

module.exports = {
  getDashboardAnalytics,
  getRecruitmentFunnel,
  getTopCandidates
};
