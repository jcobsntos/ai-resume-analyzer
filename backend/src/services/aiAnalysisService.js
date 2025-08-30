const axios = require('axios');

class AIAnalysisService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_API_KEY;
    this.modelUrl = process.env.HUGGINGFACE_MODEL_URL || 'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Make API call to Hugging Face with retry logic
   * @param {Object} payload - Request payload
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} - API response
   */
  async makeApiCall(payload, retryCount = 0) {
    try {
      const response = await axios.post(this.modelUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      return response.data;
    } catch (error) {
      console.error(`Hugging Face API call failed (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeApiCall(payload, retryCount + 1);
      }
      
      throw new Error(`Hugging Face API failed after ${this.maxRetries + 1} attempts: ${error.message}`);
    }
  }

  /**
   * Delay function for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate semantic similarity between resume text and job description
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Job description text
   * @returns {Promise<number>} - Similarity score (0-100)
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    let t = text;
    // remove emails
    t = t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '');
    // remove phone numbers (simple patterns)
    t = t.replace(/(\+?\d[\d\s\-()]{7,})/g, '');
    // collapse whitespace
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  async calculateSemanticSimilarity(resumeText, jobDescription) {
    try {
      if (!resumeText || !jobDescription) {
        return 0;
      }

      const cleanResume = this.sanitizeText(resumeText).substring(0, 512);
      const cleanJob = jobDescription?.substring(0, 512) || '';
      const payload = {
        inputs: {
          source_sentence: cleanResume,
          sentences: [cleanJob]
        }
      };

      const response = await this.makeApiCall(payload);
      
      // Extract similarity score and convert to percentage
      const similarityScore = Array.isArray(response) ? response[0] : response;
      return Math.round((similarityScore || 0) * 100);
      
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 0; // Return 0 if API fails
    }
  }

  /**
   * Extract and score skills match between resume and job requirements
   * @param {string[]} resumeSkills - Skills extracted from resume
   * @param {string[]} requiredSkills - Required skills from job posting
   * @param {string[]} preferredSkills - Preferred skills from job posting
   * @returns {Object} - Skills analysis result
   */
  analyzeSkillsMatch(resumeSkills, requiredSkills, preferredSkills = []) {
    const resumeSkillsLower = resumeSkills.map(skill => skill.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());
    const preferredSkillsLower = preferredSkills.map(skill => skill.toLowerCase());

    // Find matched skills
    const matchedRequired = requiredSkillsLower.filter(skill => 
      resumeSkillsLower.some(resumeSkill => 
        resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    );

    const matchedPreferred = preferredSkillsLower.filter(skill => 
      resumeSkillsLower.some(resumeSkill => 
        resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    );

    // Find missing skills
    const missingRequired = requiredSkillsLower.filter(skill => !matchedRequired.includes(skill));
    const missingPreferred = preferredSkillsLower.filter(skill => !matchedPreferred.includes(skill));

    // Find additional skills (in resume but not in job requirements)
    const additionalSkills = resumeSkillsLower.filter(skill => 
      !requiredSkillsLower.some(reqSkill => reqSkill.includes(skill) || skill.includes(reqSkill)) &&
      !preferredSkillsLower.some(prefSkill => prefSkill.includes(skill) || skill.includes(prefSkill))
    );

    // Calculate score
    const requiredWeight = 0.8;
    const preferredWeight = 0.2;
    
    const requiredScore = requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 100 : 100;
    const preferredScore = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 100 : 100;
    
    const overallScore = Math.round((requiredScore * requiredWeight) + (preferredScore * preferredWeight));

    return {
      score: overallScore,
      matchedSkills: [...matchedRequired, ...matchedPreferred],
      missingSkills: [...missingRequired, ...missingPreferred],
      additionalSkills,
      details: {
        requiredMatched: matchedRequired.length,
        requiredTotal: requiredSkills.length,
        preferredMatched: matchedPreferred.length,
        preferredTotal: preferredSkills.length
      }
    };
  }

  /**
   * Analyze experience relevance based on job requirements
   * @param {string} resumeText - Resume text
   * @param {string} jobDescription - Job description
   * @param {string} experienceLevel - Required experience level
   * @returns {Object} - Experience analysis result
   */
  analyzeExperienceMatch(resumeText, jobDescription, experienceLevel) {
    const text = resumeText.toLowerCase();
    const jobDesc = jobDescription.toLowerCase();

    // Experience indicators
    const experienceIndicators = [
      'years', 'experience', 'worked', 'developed', 'managed', 'led', 'created',
      'built', 'designed', 'implemented', 'delivered', 'achieved', 'responsible'
    ];

    // Senior level indicators
    const seniorIndicators = [
      'senior', 'lead', 'principal', 'architect', 'manager', 'director',
      'team lead', 'technical lead', 'project manager'
    ];

    // Count experience indicators
    const experienceCount = experienceIndicators.reduce((count, indicator) => {
      return count + (text.split(indicator).length - 1);
    }, 0);

    // Check for senior level indicators
    const seniorCount = seniorIndicators.reduce((count, indicator) => {
      return count + (text.split(indicator).length - 1);
    }, 0);

    // Extract years of experience (basic pattern matching)
    const yearMatches = text.match(/(\d+)[\+\s]*years?/g) || [];
    const maxYears = yearMatches.reduce((max, match) => {
      const years = parseInt(match.match(/\d+/)[0]);
      return Math.max(max, years);
    }, 0);

    // Score based on experience level requirement
    let score = 0;
    let experienceGap = '';

    switch (experienceLevel) {
      case 'entry':
        score = Math.min(100, experienceCount * 10 + maxYears * 20);
        if (score < 40) experienceGap = 'Lacks sufficient entry-level experience indicators';
        break;
      case 'mid':
        score = Math.min(100, experienceCount * 8 + maxYears * 15 + (maxYears >= 3 ? 30 : 0));
        if (score < 50) experienceGap = 'Needs more mid-level experience (3+ years)';
        break;
      case 'senior':
        score = Math.min(100, experienceCount * 6 + maxYears * 12 + seniorCount * 20 + (maxYears >= 5 ? 40 : 0));
        if (score < 60) experienceGap = 'Lacks senior-level experience (5+ years) or leadership indicators';
        break;
      case 'lead':
        score = Math.min(100, experienceCount * 5 + maxYears * 10 + seniorCount * 25 + (maxYears >= 7 ? 50 : 0));
        if (score < 70) experienceGap = 'Needs lead-level experience (7+ years) and leadership roles';
        break;
      case 'executive':
        score = Math.min(100, experienceCount * 4 + maxYears * 8 + seniorCount * 30 + (maxYears >= 10 ? 60 : 0));
        if (score < 80) experienceGap = 'Requires executive-level experience (10+ years) and management background';
        break;
      default:
        score = Math.min(100, experienceCount * 10 + maxYears * 15);
    }

    return {
      score: Math.round(score),
      estimatedYears: maxYears,
      seniorityIndicators: seniorCount,
      experienceGap: score >= 60 ? '' : experienceGap,
      relevantExperience: [] // This could be enhanced with NLP to extract specific experiences
    };
  }

  /**
   * Analyze education match based on job requirements
   * @param {string} resumeText - Resume text
   * @param {string[]} jobQualifications - Job qualification requirements
   * @returns {Object} - Education analysis result
   */
  analyzeEducationMatch(resumeText, jobQualifications) {
    const text = resumeText.toLowerCase();
    
    // Education level indicators
    const educationLevels = {
      'phd': 100,
      'doctorate': 100,
      'ph.d': 100,
      'master': 80,
      'mba': 80,
      'bachelor': 60,
      'associate': 40,
      'diploma': 30,
      'certificate': 20,
      'high school': 10,
      'ged': 10
    };

    // Technical fields
    const technicalFields = [
      'computer science', 'software engineering', 'information technology',
      'engineering', 'mathematics', 'statistics', 'data science',
      'business', 'finance', 'marketing', 'design'
    ];

    // Find education level
    let maxEducationScore = 0;
    let foundEducation = '';

    Object.entries(educationLevels).forEach(([level, score]) => {
      if (text.includes(level) && score > maxEducationScore) {
        maxEducationScore = score;
        foundEducation = level;
      }
    });

    // Check for relevant field
    const relevantField = technicalFields.find(field => text.includes(field));
    const fieldBonus = relevantField ? 20 : 0;

    // Check against job qualifications
    const qualText = jobQualifications.join(' ').toLowerCase();
    let qualificationMatch = 50; // Base score

    if (qualText.includes('degree') || qualText.includes('bachelor') || qualText.includes('university')) {
      qualificationMatch = maxEducationScore >= 60 ? 100 : 30;
    }
    if (qualText.includes('master')) {
      qualificationMatch = maxEducationScore >= 80 ? 100 : 40;
    }
    if (qualText.includes('phd') || qualText.includes('doctorate')) {
      qualificationMatch = maxEducationScore >= 100 ? 100 : 20;
    }

    const finalScore = Math.min(100, qualificationMatch + fieldBonus);

    return {
      score: Math.round(finalScore),
      educationLevel: foundEducation,
      relevantField: relevantField || '',
      relevantEducation: [{
        degree: foundEducation,
        field: relevantField || 'Not specified',
        relevanceScore: finalScore
      }].filter(edu => edu.degree)
    };
  }

  /**
   * Generate AI insights and recommendations
   * @param {Object} analysisResults - Combined analysis results
   * @returns {Object} - Insights and recommendations
   */
  generateInsights(analysisResults) {
    const { skillsMatch, experienceMatch, educationMatch, overallScore } = analysisResults;
    
    const insights = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      interviewQuestions: [],
      // richer optional fields
      missingSkills: skillsMatch?.missingSkills || [],
      keywordSuggestions: [],
      recommendedRoles: [],
      learningPaths: [],
      summary: '',
      careerLevelFit: '',
      boostScoreActions: [],
    };

    // Analyze strengths
    if (skillsMatch.score >= 80) {
      insights.strengths.push('Excellent technical skill match');
    }
    if (experienceMatch.score >= 80) {
      insights.strengths.push('Strong relevant experience');
    }
    if (educationMatch.score >= 80) {
      insights.strengths.push('Appropriate educational background');
    }
    if (skillsMatch.additionalSkills.length > 2) {
      insights.strengths.push(`Brings additional valuable skills: ${skillsMatch.additionalSkills.slice(0, 3).join(', ')}`);
    }

    // Analyze weaknesses
    if (skillsMatch.score < 60) {
      insights.weaknesses.push(`Missing key technical skills: ${skillsMatch.missingSkills.slice(0, 3).join(', ')}`);
    }
    if (experienceMatch.score < 60) {
      insights.weaknesses.push(experienceMatch.experienceGap || 'Limited relevant experience');
    }
    if (educationMatch.score < 60) {
      insights.weaknesses.push('Educational background may not fully align with requirements');
    }

    // Generate recommendations
    if (overallScore >= 85) {
      insights.recommendations.push('Highly recommended candidate - proceed to interview');
      insights.recommendations.push('Consider for fast-track hiring process');
    } else if (overallScore >= 70) {
      insights.recommendations.push('Good candidate - recommend phone screening');
      insights.recommendations.push('Assess cultural fit and communication skills');
    } else if (overallScore >= 50) {
      insights.recommendations.push('Moderate fit - conduct thorough skills assessment');
      insights.recommendations.push('Consider for junior positions if experience is lacking');
    } else {
      insights.recommendations.push('Below threshold - may not be suitable for this role');
      insights.recommendations.push('Consider for different positions that better match skills');
    }

    // Generate interview questions
    if (skillsMatch.missingSkills.length > 0) {
      insights.interviewQuestions.push(`How would you handle projects requiring ${skillsMatch.missingSkills[0]}?`);
    }
    if (experienceMatch.estimatedYears < 3) {
      insights.interviewQuestions.push('Can you describe a challenging project you completed and how you overcame obstacles?');
    }
    if (skillsMatch.additionalSkills.length > 0) {
      insights.interviewQuestions.push(`Tell us about your experience with ${skillsMatch.additionalSkills[0]}`);
    }
    insights.interviewQuestions.push('What interests you most about this role and our company?');

    // Keyword suggestions derived from missing and matched skills
    const keywords = new Set([
      ...skillsMatch.missingSkills.slice(0, 5),
      ...skillsMatch.matchedSkills.slice(0, 5),
    ]);
    insights.keywordSuggestions = Array.from(keywords);

    // Recommended roles based on scores
    const rolePool = ['Junior', 'Mid', 'Senior', 'Lead'];
    if (overallScore >= 85 && experienceMatch.score >= 75) {
      insights.recommendedRoles.push('Senior', 'Lead');
      insights.careerLevelFit = 'Strong fit for senior-level opportunities';
    } else if (overallScore >= 70) {
      insights.recommendedRoles.push('Mid', 'Senior');
      insights.careerLevelFit = 'Good fit for mid-level roles with potential for senior growth';
    } else if (overallScore >= 55) {
      insights.recommendedRoles.push('Junior', 'Mid');
      insights.careerLevelFit = 'Developing profile; junior to mid-level roles recommended';
    } else {
      insights.recommendedRoles.push('Junior');
      insights.careerLevelFit = 'Entry-level roles recommended; build core skills';
    }

    // Learning paths and boost actions
    insights.learningPaths = (skillsMatch.missingSkills || []).slice(0, 5).map(skill => ({
      title: `Learn ${skill}`,
      url: `https://www.google.com/search?q=best+course+for+${encodeURIComponent(skill)}`,
    }));

    insights.boostScoreActions = [
      ...(skillsMatch.missingSkills.slice(0, 3).map(s => ({ action: `Complete a project using ${s}`, impact: 8 }))),
      ...(skillsMatch.additionalSkills.slice(0, 2).map(s => ({ action: `Highlight ${s} in your resume summary`, impact: 5 }))),
    ];

    // Summary
    insights.summary = `Overall fit ${overallScore}%. Skills ${skillsMatch.score}%, Experience ${experienceMatch.score}%, Education ${educationMatch.score}%.`;

    return insights;
  }

  /**
   * Main function to perform comprehensive resume analysis
   * @param {string} resumeText - Extracted resume text
   * @param {Object} jobData - Job posting data
   * @returns {Promise<Object>} - Complete AI analysis results
   */
  async analyzeResume(resumeText, jobData) {
    const startTime = Date.now();

    try {
      const {
        description,
        requiredSkills,
        preferredSkills = [],
        experienceLevel,
        qualifications
      } = jobData;

      // Perform semantic similarity analysis
      const semanticSimilarity = await this.calculateSemanticSimilarity(resumeText, description);

      // Extract basic skills from resume (this is a simplified version)
      const resumeSkills = this.extractSkillsFromText(resumeText);

      // Analyze different aspects
      const skillsMatch = this.analyzeSkillsMatch(resumeSkills, requiredSkills, preferredSkills);
      const experienceMatch = this.analyzeExperienceMatch(resumeText, description, experienceLevel);
      const educationMatch = this.analyzeEducationMatch(resumeText, qualifications);

      // Calculate overall score
      const weights = {
        skills: 0.4,
        experience: 0.3,
        education: 0.2,
        semantic: 0.1
      };

      const overallScore = Math.round(
        skillsMatch.score * weights.skills +
        experienceMatch.score * weights.experience +
        educationMatch.score * weights.education +
        semanticSimilarity * weights.semantic
      );

      // Generate insights
      const analysisResults = {
        overallScore,
        skillsMatch,
        experienceMatch,
        educationMatch,
        semanticSimilarity: {
          score: semanticSimilarity,
          similarityMetrics: {
            resumeJobDescription: semanticSimilarity,
            skillsAlignment: skillsMatch.score,
            industryRelevance: Math.min(100, (experienceMatch.score + educationMatch.score) / 2)
          }
        }
      };

      const insights = this.generateInsights(analysisResults);

      return {
        overallScore,
        skillsMatch,
        experienceMatch,
        educationMatch,
        semanticSimilarity: analysisResults.semanticSimilarity,
        insights,
        analysisDate: new Date(),
        processingTime: Date.now() - startTime,
        modelVersion: '1.0'
      };

    } catch (error) {
      console.error('Error in AI resume analysis:', error);
      
      // Return a basic analysis if AI fails
      return this.getFallbackAnalysis(resumeText, jobData, Date.now() - startTime);
    }
  }

  /**
   * Extract skills from resume text using pattern matching
   * @param {string} text - Resume text
   * @returns {string[]} - Extracted skills
   */
  extractSkillsFromText(text) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
      'Machine Learning', 'Data Science', 'Artificial Intelligence', 'Deep Learning',
      'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
    ];

    const textLower = text.toLowerCase();
    return commonSkills.filter(skill => textLower.includes(skill.toLowerCase()));
  }

  /**
   * Provide fallback analysis when AI service fails
   * @param {string} resumeText - Resume text
   * @param {Object} jobData - Job data
   * @param {number} processingTime - Processing time
   * @returns {Object} - Basic analysis results
   */
  getFallbackAnalysis(resumeText, jobData, processingTime) {
    const resumeSkills = this.extractSkillsFromText(resumeText);
    const skillsMatch = this.analyzeSkillsMatch(resumeSkills, jobData.requiredSkills, jobData.preferredSkills);
    const experienceMatch = this.analyzeExperienceMatch(resumeText, jobData.description, jobData.experienceLevel);
    const educationMatch = this.analyzeEducationMatch(resumeText, jobData.qualifications);

    const overallScore = Math.round(
      (skillsMatch.score * 0.5) + 
      (experienceMatch.score * 0.3) + 
      (educationMatch.score * 0.2)
    );

    return {
      overallScore,
      skillsMatch,
      experienceMatch,
      educationMatch,
      semanticSimilarity: {
        score: 50, // Default score when AI is unavailable
        similarityMetrics: {
          resumeJobDescription: 50,
          skillsAlignment: skillsMatch.score,
          industryRelevance: Math.min(100, (experienceMatch.score + educationMatch.score) / 2)
        }
      },
      insights: {
        strengths: ['Analysis completed using basic pattern matching'],
        weaknesses: ['AI analysis temporarily unavailable'],
        recommendations: ['Manual review recommended'],
        interviewQuestions: ['Standard interview questions apply']
      },
      analysisDate: new Date(),
      processingTime,
      modelVersion: '1.0-fallback'
    };
  }
}

module.exports = new AIAnalysisService();
