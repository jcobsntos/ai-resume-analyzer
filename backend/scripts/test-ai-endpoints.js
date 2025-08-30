#!/usr/bin/env node

/**
 * Manual Testing Script for Enhanced AI Features
 * 
 * This script provides a comprehensive way to manually test all the new AI endpoints.
 * Run this script to test the AI features with sample data.
 * 
 * Prerequisites:
 * 1. Backend server must be running
 * 2. Valid user account and JWT token
 * 3. Sample job and application data in database
 * 
 * Usage:
 * node scripts/test-ai-endpoints.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let authToken = null;
let testJobId = null;
let testApplicationId = null;
let testCandidateId = null;

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test helper function
async function testEndpoint(name, testFunction) {
  log(`\n${colors.bright}Testing: ${name}${colors.reset}`, colors.cyan);
  try {
    const result = await testFunction();
    logSuccess(`${name} - PASSED`);
    return result;
  } catch (error) {
    logError(`${name} - FAILED: ${error.message}`);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Authentication
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    logSuccess('Authentication successful');
    return authToken;
  } catch (error) {
    logError('Authentication failed. Please ensure user exists and backend is running.');
    throw error;
  }
}

// Setup test data
async function setupTestData() {
  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    // Create a test job if it doesn't exist
    const jobResponse = await axios.post(`${BASE_URL}/jobs`, {
      title: 'Senior Software Engineer',
      company: 'Globe Telecom',
      description: 'We are looking for a Senior Software Engineer with expertise in React, Node.js, and mobile technologies for our digital transformation initiatives.',
      requirements: 'React, Node.js, TypeScript, Mobile development, English proficiency, 5+ years experience',
      location: 'Makati City, Metro Manila',
      salaryRange: { min: 80000, max: 120000 },
      type: 'full-time'
    }, { headers });
    
    testJobId = jobResponse.data.job._id;
    logSuccess(`Test job created: ${testJobId}`);

    // Get current user info for testing
    const userResponse = await axios.get(`${BASE_URL}/auth/me`, { headers });
    testCandidateId = userResponse.data.user._id;
    logSuccess(`Test candidate ID: ${testCandidateId}`);

  } catch (error) {
    logWarning('Could not create test data. Some tests may fail.');
  }
}

// Test functions for each AI feature
async function testInterviewQuestions() {
  if (!testApplicationId) {
    logWarning('No test application ID available, skipping interview questions test');
    return;
  }

  const response = await axios.get(`${BASE_URL}/ai/interview-questions/${testApplicationId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Generated ${Object.keys(response.data.data.questions).length} question categories`);
  return response.data.data.questions;
}

async function testResumeImprovements() {
  const response = await axios.post(`${BASE_URL}/ai/resume-improvements`, {
    targetRole: 'Senior Software Engineer',
    experienceLevel: 'senior'
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Generated improvements in ${Object.keys(response.data.data.improvements).length} categories`);
  return response.data.data.improvements;
}

async function testCareerGuidance() {
  const response = await axios.get(`${BASE_URL}/ai/career-guidance`, {
    params: {
      careerGoals: 'Become a senior technical leader',
      targetRoles: 'Senior Software Engineer,Tech Lead'
    },
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Career guidance provided with ${Object.keys(response.data.data.guidance).length} sections`);
  return response.data.data.guidance;
}

async function testAdvancedSkills() {
  const response = await axios.get(`${BASE_URL}/ai/advanced-skills`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Extracted ${response.data.data.skills?.length || 0} advanced skills`);
  return response.data.data.skills;
}

async function testJobMatchAnalysis() {
  if (!testJobId || !testCandidateId) {
    logWarning('Missing test job or candidate ID, skipping job match analysis');
    return;
  }

  const response = await axios.post(`${BASE_URL}/ai/job-match-analysis`, {
    jobId: testJobId,
    candidateId: testCandidateId
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Job match score: ${response.data.data.matchAnalysis?.overallScore || 'N/A'}%`);
  return response.data.data.matchAnalysis;
}

async function testJobHiringInsights() {
  if (!testJobId) {
    logWarning('No test job ID available, skipping job hiring insights');
    return;
  }

  const response = await axios.get(`${BASE_URL}/ai/hiring-insights/${testJobId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Job hiring insights generated`);
  return response.data.data.insights;
}

async function testHiringInsights() {
  const response = await axios.get(`${BASE_URL}/ai/hiring-insights`, {
    params: { timeRange: 30 },
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`General hiring insights for last 30 days`);
  return response.data.data.insights;
}

async function testSuccessPrediction() {
  if (!testApplicationId) {
    logWarning('No test application ID available, skipping success prediction');
    return;
  }

  const response = await axios.get(`${BASE_URL}/ai/success-prediction/${testApplicationId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  logInfo(`Success prediction confidence: ${response.data.data.prediction?.confidence || 'N/A'}`);
  return response.data.data.prediction;
}

async function testResumeAnalysis() {
  // Create a simple test resume file
  const testResumeContent = `
Maria Santos
Senior Software Engineer

CONTACT:
Email: maria.santos@gmail.com
Phone: +63 917 123 4567
Location: Makati City, Metro Manila
LinkedIn: linkedin.com/in/mariasantos

PROFESSIONAL SUMMARY:
Experienced Software Engineer with 6+ years in full-stack development, specializing in React and Node.js. 
Strong English communication skills with experience in client-facing roles and international team collaboration.
Proven track record in BPO environment and startup ecosystem in Philippines.

EXPERIENCE:
Senior Software Engineer at Accenture Philippines (2021-2024)
- Led development of React applications for international clients
- Built scalable REST APIs using Node.js and Express
- Collaborated with offshore teams across different time zones
- Mentored 3 junior developers and conducted code reviews
- Improved application performance by 40% through optimization

Software Developer at PayMaya Philippines (2019-2021)
- Developed fintech applications using React and Node.js
- Implemented secure payment processing systems
- Worked directly with international stakeholders
- Participated in agile development processes

Junior Developer at Convergys (2018-2019)
- Maintained legacy systems using Java and Spring Framework
- Gained experience in BPO environment and client communication
- Developed strong English communication skills

EDUCATION:
Bachelor of Science in Computer Science
University of the Philippines Diliman (2014-2018)
Magna Cum Laude

CERTIFICATIONS:
- AWS Certified Developer Associate (2023)
- Microsoft Azure Fundamentals (2022)
- IELTS Score: 8.5 (2020)

SKILLS:
Programming: JavaScript, TypeScript, Java, Python, C#
Frontend: React, Angular, Vue.js, HTML5, CSS3, Bootstrap
Backend: Node.js, Express.js, Spring Boot, Laravel
Databases: MySQL, PostgreSQL, MongoDB, Redis
Cloud: AWS, Microsoft Azure, Google Cloud Platform
Tools: Git, Docker, Jenkins, Jira, Confluence
Soft Skills: English Communication, Client Management, Team Leadership, Cross-cultural Communication
  `.trim();

  const testResumeFile = path.join(__dirname, 'temp-test-resume.txt');
  fs.writeFileSync(testResumeFile, testResumeContent);

  try {
    const form = new FormData();
    form.append('resume', fs.createReadStream(testResumeFile));
    form.append('jobId', testJobId);

    const response = await axios.post(`${BASE_URL}/ai/analyze-resume`, form, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        ...form.getHeaders()
      }
    });

    logInfo(`Resume analysis score: ${response.data.data.analysis?.overallScore || 'N/A'}%`);
    return response.data.data.analysis;
  } finally {
    // Clean up test file
    if (fs.existsSync(testResumeFile)) {
      fs.unlinkSync(testResumeFile);
    }
  }
}

// Main test runner
async function runAllTests() {
  log(`${colors.bright}🚀 Starting AI Features Test Suite${colors.reset}`, colors.cyan);
  
  try {
    // Step 1: Authenticate
    await testEndpoint('Authentication', authenticate);
    
    // Step 2: Setup test data
    await testEndpoint('Test Data Setup', setupTestData);
    
    // Step 3: Test resume analysis (this may create an application)
    const analysisResult = await testEndpoint('Resume Analysis', testResumeAnalysis);
    
    // Step 4: Test all AI features
    await testEndpoint('Resume Improvements', testResumeImprovements);
    await testEndpoint('Career Guidance', testCareerGuidance);
    await testEndpoint('Advanced Skills Extraction', testAdvancedSkills);
    await testEndpoint('Job Match Analysis', testJobMatchAnalysis);
    await testEndpoint('Job Hiring Insights', testJobHiringInsights);
    await testEndpoint('General Hiring Insights', testHiringInsights);
    await testEndpoint('Interview Questions', testInterviewQuestions);
    await testEndpoint('Success Prediction', testSuccessPrediction);
    
    log(`\n${colors.bright}🎉 Test Suite Completed!${colors.reset}`, colors.green);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testEndpoint,
  authenticate,
  setupTestData
};
