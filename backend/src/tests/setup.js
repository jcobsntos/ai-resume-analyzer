// Jest setup file for backend tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/resume-ai-test';
process.env.HUGGING_FACE_API_KEY = 'test-hf-key';

// Mock console to reduce test output noise
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Only show console output for actual test failures
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console for debugging if needed
  if (process.env.DEBUG_TESTS) {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  }
});

// Global test helpers
global.testHelpers = {
  createMockUser: () => ({
    _id: 'test-user-id',
    email: 'test@example.com',
    role: 'candidate',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    }
  }),

  createMockJob: () => ({
    _id: 'test-job-id',
    title: 'Software Engineer',
    company: 'Test Company',
    description: 'Test job description',
    requirements: 'React, Node.js, TypeScript',
    location: 'Remote',
    salaryRange: { min: 80000, max: 120000 },
    type: 'full-time'
  }),

  createMockApplication: () => ({
    _id: 'test-application-id',
    candidate: 'test-user-id',
    job: 'test-job-id',
    status: 'pending',
    resumeText: 'Mock resume content with React and Node.js experience'
  }),

  createMockResumeAnalysis: () => ({
    overallScore: 85,
    skillsMatch: {
      matchedSkills: ['React', 'Node.js'],
      missingSkills: ['Python'],
      score: 75
    },
    experienceMatch: {
      score: 80,
      experienceGap: 'Good match for senior level'
    },
    educationMatch: {
      score: 90,
      educationLevel: 'Bachelor\'s Degree'
    },
    insights: {
      strengths: ['Strong technical skills', 'Relevant experience'],
      weaknesses: ['Missing some preferred skills'],
      recommendations: ['Consider learning Python', 'Highlight leadership experience']
    },
    semanticSimilarity: { score: 78 }
  })
};

// Silence deprecation warnings during tests
process.env.NODE_NO_WARNINGS = '1';
