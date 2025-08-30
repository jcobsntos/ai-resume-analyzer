/**
 * Integration Tests for AI Features
 * 
 * These tests simulate the complete user workflow for AI features
 * including authentication, job creation, resume analysis, and AI insights.
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import the actual app or create a test app
const app = express();

// Basic middleware setup for testing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user for testing
const mockUser = {
  _id: 'test-user-id',
  email: 'test@example.com',
  role: 'candidate',
  profile: {
    firstName: 'Test',
    lastName: 'User'
  }
};

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = mockUser;
  next();
});

// Add AI routes (you may need to adjust based on your route structure)
const aiRoutes = require('../routes/aiRoutes');
app.use('/api/ai', aiRoutes);

describe('AI Features Integration Tests', () => {
  let testJobId;
  let testApplicationId;
  let authToken;

  beforeAll(async () => {
    // Setup test data that will be used across tests
    console.log('Setting up integration test data...');
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up integration test data...');
  });

  describe('Complete AI Workflow', () => {
    it('should complete full resume analysis workflow', async () => {
      // Create a temporary test resume file
      const testResumeContent = `
John Doe
Senior Software Engineer

EXPERIENCE:
Senior Software Engineer at Tech Corp (2020-2024)
- Developed React applications with TypeScript
- Built REST APIs with Node.js and Express
- Implemented AI/ML features using TensorFlow
- Led team of 5 developers
- Improved application performance by 40%

EDUCATION:
Bachelor's in Computer Science - University of Technology (2016-2020)

SKILLS:
React, Node.js, TypeScript, JavaScript, Python, AI/ML, TensorFlow, AWS, Docker, Leadership

CERTIFICATIONS:
- AWS Solutions Architect Associate
- React Developer Certification
      `.trim();

      const testResumeFile = path.join(__dirname, 'temp-test-resume.txt');
      fs.writeFileSync(testResumeFile, testResumeContent);

      try {
        // Step 1: Analyze resume (this should create an application)
        const analysisResponse = await request(app)
          .post('/api/ai/analyze-resume')
          .field('jobId', 'test-job-id')
          .attach('resume', testResumeFile)
          .expect(200);

        expect(analysisResponse.body.success).toBe(true);
        expect(analysisResponse.body.data.analysis).toBeDefined();
        expect(analysisResponse.body.data.analysis.overallScore).toBeGreaterThanOrEqual(0);

        // Step 2: Generate interview questions for the application
        if (analysisResponse.body.data.applicationId) {
          const questionsResponse = await request(app)
            .get(`/api/ai/interview-questions/${analysisResponse.body.data.applicationId}`)
            .expect(200);

          expect(questionsResponse.body.success).toBe(true);
          expect(questionsResponse.body.data.questions).toBeDefined();
        }

        // Step 3: Get resume improvements
        const improvementsResponse = await request(app)
          .post('/api/ai/resume-improvements')
          .send({
            targetRole: 'Senior Software Engineer',
            experienceLevel: 'senior'
          })
          .expect(200);

        expect(improvementsResponse.body.success).toBe(true);
        expect(improvementsResponse.body.data.improvements).toBeDefined();

        // Step 4: Get career guidance
        const guidanceResponse = await request(app)
          .get('/api/ai/career-guidance')
          .query({
            careerGoals: 'Become a technical leader',
            targetRoles: 'Senior Engineer,Tech Lead'
          })
          .expect(200);

        expect(guidanceResponse.body.success).toBe(true);
        expect(guidanceResponse.body.data.guidance).toBeDefined();

      } finally {
        // Clean up test file
        if (fs.existsSync(testResumeFile)) {
          fs.unlinkSync(testResumeFile);
        }
      }
    }, 60000); // Longer timeout for AI processing

    it('should handle AI service failures gracefully', async () => {
      // Mock AI service to fail
      const originalHfKey = process.env.HUGGING_FACE_API_KEY;
      process.env.HUGGING_FACE_API_KEY = 'invalid-key';

      try {
        const response = await request(app)
          .post('/api/ai/resume-improvements')
          .send({
            targetRole: 'Developer',
            experienceLevel: 'junior'
          })
          .expect(200); // Should still work with fallbacks

        expect(response.body.success).toBe(true);
        expect(response.body.data.improvements).toBeDefined();

      } finally {
        // Restore original API key
        process.env.HUGGING_FACE_API_KEY = originalHfKey;
      }
    });

    it('should validate input parameters correctly', async () => {
      // Test missing required parameters
      const response = await request(app)
        .post('/api/ai/job-match-analysis')
        .send({ jobId: 'test-job-id' }) // Missing candidateId
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('candidateId');
    });

    it('should handle concurrent AI requests', async () => {
      // Test multiple AI requests simultaneously
      const promises = [
        request(app).post('/api/ai/resume-improvements').send({ targetRole: 'Developer' }),
        request(app).get('/api/ai/career-guidance'),
        request(app).get('/api/ai/advanced-skills'),
        request(app).get('/api/ai/hiring-insights').query({ timeRange: 7 })
      ];

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should return proper error responses for invalid requests', async () => {
      // Test with malformed JSON
      const response = await request(app)
        .post('/api/ai/resume-improvements')
        .send('invalid-json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle file upload errors', async () => {
      // Test with oversized file (simulate)
      const largeContent = 'x'.repeat(50 * 1024 * 1024); // 50MB
      const largeFile = path.join(__dirname, 'large-test-file.txt');
      
      try {
        fs.writeFileSync(largeFile, largeContent);
        
        const response = await request(app)
          .post('/api/ai/analyze-resume')
          .field('jobId', 'test-job-id')
          .attach('resume', largeFile)
          .expect(413); // Payload too large

        expect(response.body.success).toBe(false);
      } finally {
        if (fs.existsSync(largeFile)) {
          fs.unlinkSync(largeFile);
        }
      }
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/ai/resume-improvements')
        .send({ targetRole: 'Developer' })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(30000); // Should respond within 30 seconds
    });

    it('should handle multiple simultaneous requests efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array(5).fill().map(() =>
        request(app)
          .get('/api/ai/hiring-insights')
          .query({ timeRange: 30 })
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should handle 5 concurrent requests in reasonable time
      expect(totalTime).toBeLessThan(60000); // 60 seconds for all 5 requests
    }, 70000);
  });
});
