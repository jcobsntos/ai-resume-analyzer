const EnhancedAIService = require('../services/enhancedAIService');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Enhanced AI Service Tests', () => {
  let aiService;

  beforeEach(() => {
    aiService = new EnhancedAIService();
    jest.clearAllMocks();
  });

  describe('AI API Communication', () => {
    it('should make successful API calls to Hugging Face', async () => {
      const mockResponse = {
        data: [{ generated_text: 'Mock AI response for testing' }]
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await aiService.callHuggingFaceAPI('Test prompt', 'test-model');
      
      expect(result).toBe('Mock AI response for testing');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/test-model',
        expect.objectContaining({
          inputs: 'Test prompt'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors and retry', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValue({ data: [{ generated_text: 'Success on retry' }] });

      const result = await aiService.callHuggingFaceAPI('Test prompt');
      
      expect(result).toBe('Success on retry');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should fallback to basic analysis when API fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API completely down'));

      const resumeText = 'React developer with 5 years experience in JavaScript and Node.js';
      const jobData = { 
        requirements: 'React, JavaScript, Node.js experience required',
        title: 'Frontend Developer'
      };

      const result = await aiService.analyzeResume(resumeText, jobData);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.skillsMatch).toBeDefined();
    });
  });

  describe('Resume Analysis', () => {
    it('should analyze resume with AI-powered insights', async () => {
      const mockAIResponse = `
OVERALL_SCORE: 82

SKILLS_MATCH:
- Matched: React, JavaScript, Node.js
- Missing: Python, Docker
- Score: 75

EXPERIENCE_MATCH:
- Score: 80
- Gap: Needs more backend experience

EDUCATION_MATCH:
- Score: 90
- Level: Bachelor's Degree

INSIGHTS:
- Strengths: Strong frontend skills, good React experience
- Weaknesses: Limited backend experience, missing DevOps skills
- Recommendations: Learn Python and Docker, gain backend experience
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockAIResponse }]
      });

      const resumeText = 'React developer with JavaScript and Node.js experience';
      const jobData = { requirements: 'React, JavaScript, Node.js, Python, Docker' };

      const result = await aiService.analyzeResume(resumeText, jobData);

      expect(result.overallScore).toBe(82);
      expect(result.skillsMatch.matchedSkills).toContain('React');
      expect(result.skillsMatch.missingSkills).toContain('Python');
      expect(result.insights.strengths).toContain('Strong frontend skills');
    });

    it('should handle malformed AI responses gracefully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: 'Invalid response format' }]
      });

      const result = await aiService.analyzeResume('test resume', { requirements: 'test' });

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Interview Questions Generation', () => {
    it('should generate structured interview questions', async () => {
      const mockQuestionResponse = `
TECHNICAL_QUESTIONS:
- Question: Explain React hooks and their benefits
  Category: Frontend
  Difficulty: Medium
  Expected: Hooks provide state management in functional components

BEHAVIORAL_QUESTIONS:  
- Question: Tell me about a challenging project you led
  Category: Leadership
  Skill: Project management

SITUATIONAL_QUESTIONS:
- Question: How would you handle a production bug?
  Category: Problem Solving
  Scenario: Critical system failure

CULTURE_QUESTIONS:
- Question: How do you handle remote work challenges?
  Category: Work Style
  Purpose: Assess remote work fit
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockQuestionResponse }]
      });

      const candidateData = { skills: ['React', 'Node.js'] };
      const jobData = { title: 'Senior Developer', requirements: 'React, leadership' };

      const result = await aiService.generateInterviewQuestions(candidateData, jobData);

      expect(result.technicalQuestions).toBeDefined();
      expect(result.behavioralQuestions).toBeDefined();
      expect(result.situationalQuestions).toBeDefined();
      expect(result.cultureQuestions).toBeDefined();
    });
  });

  describe('Resume Improvements', () => {
    it('should generate actionable resume improvements', async () => {
      const mockImprovementResponse = `
CONTENT_OPTIMIZATION:
- Use stronger action verbs (achieved, implemented, delivered)
- Add quantifiable results and metrics
- Include relevant industry keywords

STRUCTURE_FORMATTING:
- Use consistent bullet point formatting
- Add clear section headers
- Improve visual hierarchy

KEYWORD_OPTIMIZATION:
- Include React, TypeScript, Node.js
- Add soft skills like leadership, communication
- Use industry-specific terminology

ACHIEVEMENT_ENHANCEMENT:
- Quantify impact (increased efficiency by 30%)
- Use STAR method for describing accomplishments
- Include specific technologies used

PRIORITY: High
ESTIMATED_IMPACT: Significant improvement in ATS ranking and recruiter attention
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockImprovementResponse }]
      });

      const resumeText = 'Basic resume text';
      const targetRole = 'Senior Developer';

      const result = await aiService.generateResumeImprovements(resumeText, targetRole);

      expect(result.contentOptimization).toContain('Use stronger action verbs');
      expect(result.keywordOptimization).toContain('Include React, TypeScript, Node.js');
      expect(result.priority).toBe('High');
    });
  });

  describe('Career Guidance', () => {
    it('should provide comprehensive career guidance', async () => {
      const mockGuidanceResponse = `
CAREER_TRAJECTORY:
- Current: Mid-level Developer
- Next Steps: Learn system design, Take leadership roles, Mentor junior developers
- Timeframe: 12-18 months

MARKET_OPPORTUNITIES:
- High demand for React developers
- Growing need for AI/ML skills
- Remote work opportunities increasing

SKILL_DEVELOPMENT:
- Priority: System Design, Leadership, DevOps
- Resources: Online courses, Technical books, Mentorship programs
- Timeline: 6-8 months for core skills

NETWORKING:
- Join tech meetups and conferences
- Contribute to open source projects
- Build professional LinkedIn presence

PERSONAL_BRANDING:
- Create technical blog
- Share project showcases
- Develop thought leadership in React/AI
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockGuidanceResponse }]
      });

      const resumeText = 'React developer with 3 years experience';
      const careerGoals = 'Become a tech lead';

      const result = await aiService.generateCareerGuidance(resumeText, careerGoals);

      expect(result.careerTrajectory.currentStage).toBe('Mid-level Developer');
      expect(result.skillDevelopment.prioritySkills).toContain('System Design');
      expect(result.marketOpportunities).toContain('High demand for React developers');
    });
  });

  describe('Fallback Methods', () => {
    it('should provide fallback resume analysis when AI fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API down'));

      const resumeText = 'React developer with JavaScript, Node.js, and Python experience. 5 years of software development.';
      const jobData = { 
        requirements: 'React, JavaScript, Node.js required. Python preferred.',
        title: 'Frontend Developer'
      };

      const result = await aiService.analyzeResume(resumeText, jobData);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.skillsMatch.matchedSkills).toContain('React');
      expect(result.skillsMatch.matchedSkills).toContain('JavaScript');
      expect(result.skillsMatch.score).toBeGreaterThan(0);
    });

    it('should provide fallback interview questions when AI fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API down'));

      const candidateData = { skills: ['React', 'Node.js'] };
      const jobData = { title: 'Software Engineer' };

      const result = await aiService.generateInterviewQuestions(candidateData, jobData);

      expect(result.technicalQuestions).toBeDefined();
      expect(result.behavioralQuestions).toBeDefined();
      expect(result.technicalQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('Skills Extraction', () => {
    it('should extract skills with confidence and context', async () => {
      const mockSkillsResponse = `
EXTRACTED_SKILLS:
- React: Confidence 0.95, Proficiency Expert, Context Frontend frameworks
- Node.js: Confidence 0.88, Proficiency Advanced, Context Backend development  
- TypeScript: Confidence 0.82, Proficiency Intermediate, Context Type-safe JavaScript
- Docker: Confidence 0.75, Proficiency Beginner, Context Containerization
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockSkillsResponse }]
      });

      const resumeText = 'Expert React developer with Node.js and TypeScript. Some Docker experience.';

      const result = await aiService.extractAdvancedSkills(resumeText);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        skill: 'React',
        confidence: 0.95,
        proficiency: 'Expert',
        context: 'Frontend frameworks'
      });
    });
  });

  describe('Success Prediction', () => {
    it('should predict hiring success with detailed analysis', async () => {
      const mockPredictionResponse = `
CONFIDENCE: 0.78
FACTORS: Strong technical background, Relevant industry experience, Good cultural fit indicators
RECOMMENDATIONS: Focus on leadership experience during interview, Ask about specific project examples
RISK_FACTORS: Limited team management experience, Salary expectations may be high
      `;

      mockedAxios.post.mockResolvedValue({
        data: [{ generated_text: mockPredictionResponse }]
      });

      const candidateData = { skills: ['React', 'Node.js'], experience: '5 years' };
      const jobData = { title: 'Senior Developer', requirements: 'React, leadership' };

      const result = await aiService.predictHiringSuccess(candidateData, jobData);

      expect(result.confidence).toBe(0.78);
      expect(result.factors).toContain('Strong technical background');
      expect(result.riskFactors).toContain('Limited team management experience');
    });
  });
});
