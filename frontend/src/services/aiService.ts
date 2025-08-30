import api from '@/services/api';
import { Job, Application } from '@/types';

export interface ResumeAnalysisResult {
  overallScore: number;
  skillMatch: {
    matched: string[];
    missing: string[];
    matchPercentage: number;
  };
  keyStrengths: string[];
  areasForImprovement: string[];
  experienceMatch: {
    score: number;
    feedback: string;
  };
  educationMatch: {
    score: number;
    feedback: string;
  };
  recommendations: string[];
  confidence: number;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  reasons: string[];
  skillsAlignment: number;
  experienceAlignment: number;
  locationPreference: boolean;
}

export interface InterviewQuestions {
  technicalQuestions: Array<{
    question: string;
    category: string;
    difficulty: string;
    expectedAnswer: string;
  }>;
  behavioralQuestions: Array<{
    question: string;
    category: string;
    skillTested: string;
  }>;
  situationalQuestions: Array<{
    question: string;
    category: string;
    scenario: string;
  }>;
  cultureQuestions: Array<{
    question: string;
    category: string;
    purpose: string;
  }>;
  followUpQuestions: Array<{
    question: string;
    triggeredBy: string;
  }>;
}

export interface ResumeImprovements {
  contentOptimization: string[];
  structureFormatting: string[];
  keywordOptimization: string[];
  achievementEnhancement: string[];
  priority: string;
  estimatedImpact: string;
}

export interface CareerGuidance {
  careerTrajectory: {
    currentStage: string;
    nextSteps: string[];
    timeframe: string;
  };
  marketOpportunities: string[];
  skillDevelopment: {
    prioritySkills: string[];
    learningResources: string[];
    timeline: string;
  };
  networking: string[];
  personalBranding: string[];
}

class AIService {
  private mapAnalysisToUI(analysis: any): ResumeAnalysisResult {
    const overallScore = analysis?.overallScore ?? 0;
    const matched = analysis?.skillsMatch?.matchedSkills ?? [];
    const missing = analysis?.skillsMatch?.missingSkills ?? [];
    const matchPercentage = analysis?.skillsMatch?.score ?? 0;

    const strengths = analysis?.insights?.strengths ?? [];
    const weaknesses = analysis?.insights?.weaknesses ?? [];
    const recommendations = analysis?.insights?.recommendations ?? [];

    const expScore = analysis?.experienceMatch?.score ?? 0;
    const expFeedback = analysis?.experienceMatch?.experienceGap || (expScore >= 70 ? 'Relevant experience' : 'Experience may be below requirements');

    const eduScore = analysis?.educationMatch?.score ?? 0;
    const eduFeedback = analysis?.educationMatch?.educationLevel
      ? `Detected education: ${analysis.educationMatch.educationLevel}`
      : (eduScore >= 70 ? 'Education aligns with requirements' : 'Education may not fully match requirements');

    const confidence = Math.round(
      (
        (analysis?.semanticSimilarity?.score ?? 50) * 0.4 +
        matchPercentage * 0.4 +
        overallScore * 0.2
      )
    );

    return {
      overallScore,
      skillMatch: { matched, missing, matchPercentage },
      keyStrengths: strengths,
      areasForImprovement: weaknesses,
      experienceMatch: { score: expScore, feedback: expFeedback },
      educationMatch: { score: eduScore, feedback: eduFeedback },
      recommendations,
      confidence,
    };
  }

  /**
   * Analyze a resume against a specific job posting
   */
  async analyzeResumeForJob(
    resumeFile: File, 
    jobId: string
  ): Promise<ResumeAnalysisResult> {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobId', jobId);

    try {
      const response = await api.post('/ai/analyze-resume', formData, {
        // Let the browser set multipart boundary automatically
        timeout: 60000, // 60 second timeout for AI processing
      });

      return this.mapAnalysisToUI(response.data.data.analysis);
    } catch (error: any) {
      console.error('Resume analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze resume');
    }
  }

  /** Analyze profile's stored resume against a job */
  async analyzeProfileResumeForJob(jobId: string): Promise<ResumeAnalysisResult> {
    try {
      const response = await api.post('/ai/analyze-profile-resume', { jobId }, { timeout: 60000 });
      return this.mapAnalysisToUI(response.data.data.analysis);
    } catch (error: any) {
      console.error('Profile resume analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze profile resume');
    }
  }

  /**
   * Re-analyze an existing application
   */
  async reAnalyzeApplication(applicationId: string): Promise<ResumeAnalysisResult> {
    try {
      const response = await api.post(`/ai/re-analyze/${applicationId}`, {
        timeout: 60000,
      });

      return response.data.data.analysis;
    } catch (error: any) {
      console.error('Re-analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to re-analyze application');
    }
  }

  /**
   * Get job recommendations for a candidate based on their profile
   */
  async getJobRecommendations(
    candidateId?: string,
    limit: number = 10
  ): Promise<JobMatchResult[]> {
    try {
      const params = candidateId ? { candidateId, limit } : { limit };
      const response = await api.get('/ai/job-recommendations', { params });

      return response.data.data.recommendations;
    } catch (error: any) {
      console.error('Job recommendations failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get job recommendations');
    }
  }

  /**
   * Analyze candidate fit for multiple jobs
   */
  async analyzeCandidateForJobs(
    candidateId: string,
    jobIds: string[]
  ): Promise<JobMatchResult[]> {
    try {
      const response = await api.post('/ai/candidate-job-match', {
        candidateId,
        jobIds,
      });

      return response.data.data.matches;
    } catch (error: any) {
      console.error('Candidate job matching failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze candidate job fit');
    }
  }

  /**
   * Extract skills from resume text
   */
  async extractSkillsFromResume(resumeFile: File): Promise<string[]> {
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const response = await api.post('/ai/extract-skills', formData);

      return response.data.data.skills;
    } catch (error: any) {
      console.error('Skill extraction failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to extract skills from resume');
    }
  }

  /**
   * Generate interview questions for an application
   */
  async generateInterviewQuestions(applicationId: string): Promise<InterviewQuestions> {
    try {
      const response = await api.get(`/ai/interview-questions/${applicationId}`);
      return response.data.data.questions;
    } catch (error: any) {
      console.error('Interview question generation failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate interview questions');
    }
  }

  /**
   * Generate resume improvement suggestions
   */
  async generateResumeImprovements(targetRole?: string, experienceLevel?: string): Promise<ResumeImprovements> {
    try {
      const response = await api.post('/ai/resume-improvements', {
        targetRole,
        experienceLevel
      });
      return response.data.data.improvements;
    } catch (error: any) {
      console.error('Resume improvements generation failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate resume improvements');
    }
  }

  /**
   * Get AI career guidance
   */
  async getCareerGuidance(careerGoals?: string, targetRoles?: string[]): Promise<CareerGuidance> {
    try {
      const params: any = {};
      if (careerGoals) params.careerGoals = careerGoals;
      if (targetRoles && targetRoles.length > 0) params.targetRoles = targetRoles.join(',');
      
      const response = await api.get('/ai/career-guidance', { params });
      return response.data.data.guidance;
    } catch (error: any) {
      console.error('Career guidance failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get career guidance');
    }
  }

  /**
   * Extract advanced skills with context
   */
  async extractAdvancedSkills(): Promise<any> {
    try {
      const response = await api.get('/ai/advanced-skills');
      return response.data.data.skills;
    } catch (error: any) {
      console.error('Advanced skills extraction failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to extract advanced skills');
    }
  }

  /**
   * Analyze job match for candidate
   */
  async analyzeJobMatch(jobId: string, candidateId: string): Promise<any> {
    try {
      const response = await api.post('/ai/job-match-analysis', {
        jobId,
        candidateId
      });
      return response.data.data.matchAnalysis;
    } catch (error: any) {
      console.error('Job match analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze job match');
    }
  }

  /**
   * Get hiring insights for a specific job
   */
  async getJobHiringInsights(jobId: string): Promise<any> {
    try {
      const response = await api.get(`/ai/hiring-insights/${jobId}`);
      return response.data.data.insights;
    } catch (error: any) {
      console.error('Job hiring insights failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get hiring insights');
    }
  }

  /**
   * Predict hiring success for an application
   */
  async predictHiringSuccess(applicationId: string): Promise<any> {
    try {
      const response = await api.get(`/ai/success-prediction/${applicationId}`);
      return response.data.data.prediction;
    } catch (error: any) {
      console.error('Hiring success prediction failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to predict hiring success');
    }
  }

  /**
   * Analyze hiring trends and patterns (general)
   */
  async getHiringInsights(timeRange: number = 30): Promise<any> {
    try {
      const response = await api.get('/ai/hiring-insights', {
        params: { timeRange },
      });

      return response.data.data.insights;
    } catch (error: any) {
      console.error('Hiring insights failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get hiring insights');
    }
  }

  /**
   * Get diversity and inclusion analytics
   */
  async getDiversityInsights(): Promise<any> {
    try {
      const response = await api.get('/ai/diversity-insights');

      return response.data.data.insights;
    } catch (error: any) {
      console.error('Diversity insights failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to get diversity insights');
    }
  }

  /**
   * Validate and improve job descriptions using AI
   */
  async optimizeJobDescription(jobData: Partial<Job>): Promise<{
    optimizedDescription: string;
    suggestions: string[];
    inclusivityScore: number;
    clarityScore: number;
  }> {
    try {
      const response = await api.post('/ai/optimize-job-description', {
        jobData,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Job description optimization failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to optimize job description');
    }
  }

  /**
   * Predict application success rate
   */
  async predictApplicationSuccess(
    applicationId: string
  ): Promise<{
    successProbability: number;
    factors: string[];
    recommendations: string[];
  }> {
    try {
      const response = await api.post('/ai/predict-success', {
        applicationId,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Success prediction failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to predict application success');
    }
  }
}

export const aiService = new AIService();
export default aiService;
