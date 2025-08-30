const request = require('supertest');
const express = require('express');
const aiController = require('../controllers/aiController');
const AIService = require('../services/aiService');
const EnhancedAIService = require('../services/enhancedAIService');

// Mock the AI services
jest.mock('../services/aiService');
jest.mock('../services/enhancedAIService');

// Mock file upload middleware
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        buffer: Buffer.from('mock resume content'),
        originalname: 'test-resume.pdf',
        mimetype: 'application/pdf'
      };
      next();
    }
  });
  return multer;
});

// Setup express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    _id: 'test-user-id',
    email: 'test@example.com',
    role: 'candidate'
  };
  next();
});

// Add routes
app.post('/analyze-resume', aiController.analyzeResume);
app.post('/resume-improvements', aiController.generateResumeImprovements);
app.get('/career-guidance', aiController.getCareerGuidance);
app.get('/advanced-skills', aiController.extractAdvancedSkills);
app.post('/job-match-analysis', aiController.analyzeJobMatch);
app.get('/hiring-insights/:jobId', aiController.getJobHiringInsights);
app.get('/hiring-insights', aiController.getHiringInsights);
app.get('/interview-questions/:applicationId', aiController.generateInterviewQuestions);
app.get('/success-prediction/:applicationId', aiController.predictHiringSuccess);

describe('AI Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Resume Analysis', () => {
    it('should analyze resume successfully', async () => {
      // Mock the AI service response
      const mockAnalysis = {
        overallScore: 85,
        skillsMatch: {
          matchedSkills: ['React', 'Node.js'],
          missingSkills: ['Python'],
          score: 75
        },
        insights: {
          strengths: ['Strong frontend experience'],
          weaknesses: ['Lacks backend experience'],
          recommendations: ['Learn Python']
        }
      };

      AIService.prototype.analyzeResumeText = jest.fn().mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/analyze-resume')
        .field('jobId', 'test-job-id')
        .attach('resume', Buffer.from('mock resume'), 'test-resume.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toBeDefined();
      expect(AIService.prototype.analyzeResumeText).toHaveBeenCalledWith(
        expect.any(String), // resume text
        expect.objectContaining({ _id: 'test-job-id' }) // job object
      );
    });

    it('should handle analysis errors gracefully', async () => {
      AIService.prototype.analyzeResumeText = jest.fn().mockRejectedValue(new Error('AI service error'));

      const response = await request(app)
        .post('/analyze-resume')
        .field('jobId', 'test-job-id')
        .attach('resume', Buffer.from('mock resume'), 'test-resume.pdf')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('AI service error');
    });
  });

  describe('Enhanced AI Features', () => {
    it('should generate resume improvements', async () => {
      const mockImprovements = {
        contentOptimization: ['Use more action verbs'],
        structureFormatting: ['Add contact information'],
        keywordOptimization: ['Include relevant tech keywords'],
        achievementEnhancement: ['Quantify achievements'],
        priority: 'High',
        estimatedImpact: 'Significant improvement in ATS parsing'
      };

      EnhancedAIService.prototype.generateResumeImprovements = jest.fn().mockResolvedValue(mockImprovements);

      const response = await request(app)
        .post('/resume-improvements')
        .send({ 
          targetRole: 'Software Engineer', 
          experienceLevel: 'senior' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.improvements).toEqual(mockImprovements);
    });

    it('should generate career guidance', async () => {
      const mockGuidance = {
        careerTrajectory: {
          currentStage: 'Mid-level Developer',
          nextSteps: ['Learn leadership skills', 'Take on larger projects'],
          timeframe: '12-18 months'
        },
        marketOpportunities: ['High demand for React developers'],
        skillDevelopment: {
          prioritySkills: ['Leadership', 'System Design'],
          learningResources: ['Online courses', 'Books'],
          timeline: '6 months'
        }
      };

      EnhancedAIService.prototype.generateCareerGuidance = jest.fn().mockResolvedValue(mockGuidance);

      const response = await request(app)
        .get('/career-guidance')
        .query({ 
          careerGoals: 'Become team lead',
          targetRoles: 'Senior Engineer,Tech Lead'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guidance).toEqual(mockGuidance);
    });

    it('should extract advanced skills', async () => {
      const mockSkills = [
        { skill: 'React', confidence: 0.95, proficiency: 'Expert', context: 'Frontend development' },
        { skill: 'Node.js', confidence: 0.88, proficiency: 'Advanced', context: 'Backend development' }
      ];

      EnhancedAIService.prototype.extractAdvancedSkills = jest.fn().mockResolvedValue(mockSkills);

      const response = await request(app)
        .get('/advanced-skills')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skills).toEqual(mockSkills);
    });

    it('should analyze job match', async () => {
      const mockJobMatch = {
        overallScore: 78,
        skillsAlignment: {
          score: 80,
          explanation: 'Good technical skill match'
        },
        experienceAlignment: {
          score: 75,
          explanation: 'Relevant experience'
        },
        recommendations: ['Focus on leadership experience']
      };

      EnhancedAIService.prototype.analyzeJobMatch = jest.fn().mockResolvedValue(mockJobMatch);

      const response = await request(app)
        .post('/job-match-analysis')
        .send({ 
          jobId: 'test-job-id',
          candidateId: 'test-candidate-id'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.matchAnalysis).toEqual(mockJobMatch);
    });

    it('should generate hiring insights for specific job', async () => {
      const mockInsights = {
        candidatePool: {
          total: 150,
          qualified: 45,
          topCandidates: 10
        },
        recommendations: ['Expand search criteria', 'Consider remote candidates'],
        trends: ['Increasing interest in remote work']
      };

      EnhancedAIService.prototype.generateJobHiringInsights = jest.fn().mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/hiring-insights/test-job-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.insights).toEqual(mockInsights);
    });

    it('should generate general hiring insights', async () => {
      const mockInsights = {
        industryTrends: ['Remote work increasing', 'AI skills in demand'],
        skillDemands: ['React', 'Python', 'AI/ML'],
        salaryTrends: 'Average salaries up 8%',
        marketAnalysis: 'Competitive market for tech talent'
      };

      EnhancedAIService.prototype.generateHiringInsights = jest.fn().mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/hiring-insights')
        .query({ timeRange: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.insights).toEqual(mockInsights);
    });

    it('should generate interview questions', async () => {
      const mockQuestions = {
        technicalQuestions: [
          {
            question: 'Explain React hooks',
            category: 'Frontend',
            difficulty: 'Medium',
            expectedAnswer: 'Hooks allow state management in functional components'
          }
        ],
        behavioralQuestions: [
          {
            question: 'Tell me about a challenging project',
            category: 'Problem Solving',
            skillTested: 'Critical thinking'
          }
        ]
      };

      EnhancedAIService.prototype.generateInterviewQuestions = jest.fn().mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get('/interview-questions/test-application-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toEqual(mockQuestions);
    });

    it('should predict hiring success', async () => {
      const mockPrediction = {
        confidence: 0.78,
        factors: ['Strong technical skills', 'Relevant experience'],
        recommendations: ['Focus on cultural fit questions'],
        riskFactors: ['Limited leadership experience']
      };

      EnhancedAIService.prototype.predictHiringSuccess = jest.fn().mockResolvedValue(mockPrediction);

      const response = await request(app)
        .get('/success-prediction/test-application-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction).toEqual(mockPrediction);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/job-match-analysis')
        .send({ jobId: 'test-job-id' }) // Missing candidateId
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should handle AI service failures gracefully', async () => {
      EnhancedAIService.prototype.generateCareerGuidance = jest.fn()
        .mockRejectedValue(new Error('AI API timeout'));

      const response = await request(app)
        .get('/career-guidance')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('timeout');
    });
  });

  describe('Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // Test with no auth token
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.post('/analyze-resume', aiController.analyzeResume);

      const response = await request(appWithoutAuth)
        .post('/analyze-resume')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
