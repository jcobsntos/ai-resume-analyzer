const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const { processResumeFile, extractBasicInfo } = require('../utils/fileParser');
const aiAnalysisService = require('../services/aiAnalysisService');
const enhancedAIService = require('../services/enhancedAIService');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs').promises;

// Helper function to clean up old files
const cleanupOldFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('Failed to cleanup file:', error.message);
  }
};

// POST /api/ai/analyze-resume
// Protected: candidate uploads a resume file and a jobId; returns AI analysis only (does not persist resume)
const analyzeResume = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  if (req.user.role !== 'candidate') {
    return res.status(403).json({ status: 'error', message: 'Only candidates can run resume analysis' });
  }

  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No resume file uploaded' });
  }

  try {
    // Validate job
    const job = await Job.findById(jobId);
    if (!job) {
      await cleanupOldFile(req.file.path);
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }

    // Process resume file (extract text + basic data)
    const processing = await processResumeFile(req.file.path, req.file.originalname);
    if (!processing.success) {
      await cleanupOldFile(req.file.path);
      return res.status(400).json({ status: 'error', message: 'Failed to process resume file', details: processing.error });
    }

    // Run AI analysis
    const analysis = await aiAnalysisService.analyzeResume(processing.extractedText, {
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      experienceLevel: job.experienceLevel,
      qualifications: job.qualifications || [],
    });

    // Clean up uploaded file (we do not persist for preview analysis)
    await cleanupOldFile(req.file.path);

    return res.status(200).json({
      status: 'success',
      message: 'Resume analyzed successfully',
      data: { analysis },
    });
  } catch (err) {
    // Try to clean up file if present
    if (req.file && req.file.path) {
      await cleanupOldFile(req.file.path);
    }
    throw err;
  }
});


// GET /api/ai/job-recommendations
// Returns simple recommendations based on candidate resume skills vs job required skills
const getJobRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || '10');
  const candidateId = req.query.candidateId || req.user._id;

  const user = await User.findById(candidateId);
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Candidate not found' });
  }

  // Collect skills from stored resume, or extract basics from extractedText
  let resumeSkills = Array.isArray(user.resume?.skills) ? user.resume.skills : [];
  if ((!resumeSkills || resumeSkills.length === 0) && user.resume?.extractedText) {
    const basic = extractBasicInfo(user.resume.extractedText);
    resumeSkills = basic.skills || [];
  }

  const jobs = await Job.find({ status: 'active' }).limit(200);

  const scored = jobs.map(job => {
    const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
    const candidateSkills = (resumeSkills || []).map(s => s.toLowerCase());

    const matched = jobSkills.filter(s => candidateSkills.some(cs => cs.includes(s) || s.includes(cs)));
    const skillsAlignment = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 50;

    // Experience alignment heuristic based on job.experienceLevel
    const levelWeight = { entry: 60, mid: 70, senior: 80, lead: 85, executive: 90 };
    const experienceAlignment = levelWeight[job.experienceLevel] || 70;

    // Treat remote/hybrid as small bonus for now
    const locationPreference = !!(job.location?.remote || job.location?.hybrid);

    // Overall score
    const matchScore = Math.min(100, Math.round((skillsAlignment * 0.7) + (experienceAlignment * 0.25) + (locationPreference ? 5 : 0)));

    const reasons = [];
    if (matched.length > 0) reasons.push(`Skills matched: ${matched.slice(0, 3).join(', ')}`);
    if (locationPreference) reasons.push('Remote/Hybrid friendly');
    if (reasons.length === 0) reasons.push('General fit based on profile');

    return {
      jobId: job._id.toString(),
      matchScore,
      reasons,
      skillsAlignment,
      experienceAlignment,
      locationPreference,
    };
  });

  // Sort by score desc and return top N
  scored.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    status: 'success',
    data: {
      recommendations: scored.slice(0, limit)
    }
  });
});

// POST /api/ai/analyze-profile-resume
// Uses the candidate's stored resume to analyze against a job (no file upload)
const analyzeProfileResume = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  if (req.user.role !== 'candidate') {
    return res.status(403).json({ status: 'error', message: 'Only candidates can run resume analysis' });
  }
  if (!jobId) {
    return res.status(400).json({ status: 'error', message: 'jobId is required' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ status: 'error', message: 'Job not found' });
  }

  if (!req.user.resume?.extractedText) {
    return res.status(400).json({ status: 'error', message: 'Please upload your resume first' });
  }

  const analysis = await aiAnalysisService.analyzeResume(req.user.resume.extractedText, {
    description: job.description,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    experienceLevel: job.experienceLevel,
    qualifications: job.qualifications || [],
  });

  return res.status(200).json({ status: 'success', data: { analysis } });
});

// POST /api/ai/extract-skills
// Returns basic extracted skills from an uploaded resume file
const extractSkills = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No resume file uploaded' });
  }

  try {
    const processing = await processResumeFile(req.file.path, req.file.originalname);
    await cleanupOldFile(req.file.path);

    if (!processing.success) {
      return res.status(400).json({ status: 'error', message: processing.error || 'Failed to process file' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        skills: processing.basicInfo?.skills || []
      }
    });
  } catch (err) {
    if (req.file?.path) {
      await cleanupOldFile(req.file.path);
    }
    throw err;
  }
});

// GET /api/ai/interview-questions/:applicationId
// Generate AI-powered interview questions for a specific application
const generateInterviewQuestions = asyncHandler(async (req, res) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only recruiters and admins can generate interview questions' 
    });
  }

  const application = await Application.findById(req.params.applicationId)
    .populate('job')
    .populate('candidate');

  if (!application) {
    return res.status(404).json({ status: 'error', message: 'Application not found' });
  }

  // Check recruiter permissions
  if (req.user.role === 'recruiter') {
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(application.job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only generate questions for applications in your company'
      });
    }
  }

  try {
    const questions = await enhancedAIService.generateInterviewQuestions(
      application.resumeAtApplication.extractedText,
      {
        title: application.job.title,
        experienceLevel: application.job.experienceLevel,
        company: application.job.company,
        requiredSkills: application.job.requiredSkills,
        responsibilities: application.job.responsibilities
      }
    );

    res.status(200).json({
      status: 'success',
      data: { 
        questions,
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        jobTitle: application.job.title
      }
    });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate interview questions'
    });
  }
});

// POST /api/ai/resume-improvements
// Generate AI-powered resume improvement suggestions
const generateResumeImprovements = asyncHandler(async (req, res) => {
  const { targetRole, experienceLevel } = req.body;

  if (req.user.role !== 'candidate') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only candidates can get resume improvement suggestions' 
    });
  }

  if (!req.user.resume?.extractedText) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload your resume first' 
    });
  }

  try {
    const improvements = await enhancedAIService.generateResumeImprovements(
      req.user.resume.extractedText,
      targetRole || 'Software Engineer',
      experienceLevel || 'mid'
    );

    res.status(200).json({
      status: 'success',
      data: { improvements }
    });
  } catch (error) {
    console.error('Error generating resume improvements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate resume improvements'
    });
  }
});

// GET /api/ai/career-guidance
// Generate AI-powered career guidance and development recommendations
const generateCareerGuidance = asyncHandler(async (req, res) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only candidates can get career guidance' 
    });
  }

  if (!req.user.resume?.extractedText) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload your resume first' 
    });
  }

  try {
    const guidance = await enhancedAIService.generateCareerGuidance(
      req.user.resume.extractedText,
      req.query.careerGoals || '',
      (req.query.targetRoles || '').split(',').filter(Boolean)
    );

    res.status(200).json({
      status: 'success',
      data: { guidance }
    });
  } catch (error) {
    console.error('Error generating career guidance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate career guidance'
    });
  }
});

// GET /api/ai/advanced-skills
// Extract advanced skills with context and proficiency levels
const extractAdvancedSkills = asyncHandler(async (req, res) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only candidates can extract advanced skills' 
    });
  }

  if (!req.user.resume?.extractedText) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Please upload your resume first' 
    });
  }

  try {
    const skills = await enhancedAIService.extractAdvancedSkills(
      req.user.resume.extractedText
    );

    res.status(200).json({
      status: 'success',
      data: { skills }
    });
  } catch (error) {
    console.error('Error extracting advanced skills:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract advanced skills'
    });
  }
});

// POST /api/ai/job-match-analysis
// Analyze how well a candidate matches a specific job
const analyzeJobMatch = asyncHandler(async (req, res) => {
  const { jobId, candidateId } = req.body;

  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only recruiters and admins can analyze job matches' 
    });
  }

  const job = await Job.findById(jobId);
  const candidate = await User.findById(candidateId);

  if (!job || !candidate) {
    return res.status(404).json({ 
      status: 'error', 
      message: 'Job or candidate not found' 
    });
  }

  if (!candidate.resume?.extractedText) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Candidate has not uploaded a resume' 
    });
  }

  try {
    const candidateProfile = {
      resumeText: candidate.resume.extractedText,
      skills: candidate.resume.skills || [],
      experience: candidate.experience || [],
      education: candidate.education || []
    };

    const matchAnalysis = await enhancedAIService.analyzeJobMatch(candidateProfile, {
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      experienceLevel: job.experienceLevel,
      location: job.location,
      salaryRange: job.salaryRange
    });

    res.status(200).json({
      status: 'success',
      data: { 
        matchAnalysis,
        candidate: {
          name: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email
        },
        job: {
          title: job.title,
          company: job.company
        }
      }
    });
  } catch (error) {
    console.error('Error analyzing job match:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze job match'
    });
  }
});

// GET /api/ai/hiring-insights/:jobId
// Generate comprehensive hiring insights for a job posting
const generateHiringInsights = asyncHandler(async (req, res) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only recruiters and admins can view hiring insights' 
    });
  }

  const job = await Job.findById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ status: 'error', message: 'Job not found' });
  }

  // Check recruiter permissions
  if (req.user.role === 'recruiter') {
    let allowedPosterIds = [req.user._id.toString()];
    if (req.user.company) {
      const teammates = await User.find({ role: 'recruiter', company: req.user.company }).select('_id');
      allowedPosterIds = teammates.map(t => t._id.toString());
    }
    if (!allowedPosterIds.includes(job.postedBy.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only view insights for jobs posted by your company'
      });
    }
  }

  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'firstName lastName email')
      .select('candidate aiAnalysis status createdAt');

    const insights = enhancedAIService.generateHiringInsights(applications, {
      title: job.title,
      requiredSkills: job.requiredSkills,
      experienceLevel: job.experienceLevel
    });

    res.status(200).json({
      status: 'success',
      data: { 
        insights,
        jobTitle: job.title,
        jobId: job._id
      }
    });
  } catch (error) {
    console.error('Error generating hiring insights:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate hiring insights'
    });
  }
});

// GET /api/ai/success-prediction/:applicationId
// Predict hiring success probability for an application
const predictHiringSuccess = asyncHandler(async (req, res) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Only recruiters and admins can view success predictions' 
    });
  }

  const application = await Application.findById(req.params.applicationId)
    .populate('job')
    .populate('candidate');

  if (!application) {
    return res.status(404).json({ status: 'error', message: 'Application not found' });
  }

  try {
    const prediction = enhancedAIService.predictHiringSuccess(
      application.aiAnalysis || {},
      [] // Historical data would go here
    );

    res.status(200).json({
      status: 'success',
      data: { 
        prediction,
        candidate: {
          name: `${application.candidate.firstName} ${application.candidate.lastName}`,
          email: application.candidate.email
        },
        job: {
          title: application.job.title,
          company: application.job.company
        }
      }
    });
  } catch (error) {
    console.error('Error predicting hiring success:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to predict hiring success'
    });
  }
});

module.exports = { 
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
};

