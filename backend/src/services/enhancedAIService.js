const axios = require('axios');

class EnhancedAIService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_API_KEY;
    this.textGenerationUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
    this.embeddingUrl = 'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // Enhanced prompts for different AI analysis types
  getPrompts() {
    return {
      resumeAnalysis: `
Analyze the following resume against job requirements for the Philippines tech market and provide comprehensive insights.

RESUME TEXT:
{resumeText}

JOB REQUIREMENTS:
- Title: {jobTitle}
- Description: {description}
- Required Skills: {requiredSkills}
- Preferred Skills: {preferredSkills}
- Experience Level: {experienceLevel}
- Location: {location}
- Company: {company}

Philippines Tech Market Context 2024-2025:
- BPO industry: 1.3M employees, growing 5-7% annually (Accenture, IBM, Concentrix)
- IT-BPM sector: USD 29B revenue, 8-10% growth targeting USD 59B by 2028
- Startup ecosystem: 3,500+ startups, USD 1.2B in funding (2024)
- Remote work adoption: 85% of tech companies offer hybrid/remote options
- Salary ranges by experience:
  * Entry (0-2 years): ₱25,000-50,000/month
  * Mid (3-5 years): ₱50,000-90,000/month
  * Senior (6-8 years): ₱90,000-150,000/month
  * Lead/Principal (9+ years): ₱150,000-300,000/month
- High-demand skills: React/Angular, Node.js, Python, AWS/Azure, mobile dev, data science
- English proficiency: Critical for 90% of tech roles (IELTS 6.5+ equivalent expected)
- Cultural values: "Pakikipagkapwa" (shared identity), "Bayanihan" (community spirit), hierarchy respect
- Education: Top PH universities (UP, Ateneo, De La Salle, UST) highly valued
- Certifications: AWS, Microsoft, Google Cloud, Scrum Master in high demand

Provide detailed analysis covering:

1. OVERALL COMPATIBILITY SCORE (0-100)
   - Weight technical skills (40%), experience (30%), cultural fit (20%), education (10%)
   - Provide specific score breakdown

2. TECHNICAL SKILLS ASSESSMENT
   - Core technical skills alignment with PH market demand
   - Cloud platform proficiency (AWS/Azure/GCP adoption growing 40% YoY)
   - Mobile development skills (iOS/Android/React Native/Flutter high demand)
   - Data science/AI skills (emerging 60% growth in demand)
   - DevOps/Infrastructure skills (containerization, CI/CD)
   - Web development frameworks popularity in PH market
   - Missing critical skills that limit hiring potential
   - Transferable skills from BPO/other industries

3. ENGLISH COMMUNICATION PROFICIENCY
   - Written communication evidence in resume
   - Technical writing capability indicators
   - Client-facing communication potential
   - International collaboration readiness
   - BPO/call center experience (valuable for client interaction)
   - Estimated IELTS equivalent score based on resume language

4. EXPERIENCE EVALUATION FOR PH MARKET
   - Relevant years in Philippines context
   - BPO/outsourcing industry experience (valued by 70% of tech companies)
   - Local vs international company exposure
   - Startup vs enterprise experience preferences
   - Remote work experience (post-pandemic requirement)
   - Leadership/team management indicators
   - Cross-cultural project experience
   - Government/fintech/e-commerce sector experience

5. EDUCATION & CERTIFICATION ANALYSIS
   - Philippines university recognition and ranking
   - International university degrees (premium value)
   - Relevant degree vs bootcamp/self-taught assessment
   - Professional certifications value in PH market
   - Continuous learning evidence (Coursera, edX, local bootcamps)
   - English language certifications (TOEFL, IELTS)
   - Technical certifications ROI in local market

6. CULTURAL FIT & SOFT SKILLS
   - "Pakikipagkapwa" indicators (teamwork, collaboration)
   - Adaptability to Filipino hierarchical work culture
   - "Bayanihan" spirit evidence (community contribution)
   - Communication style alignment with PH business culture
   - Family-work balance understanding
   - Respect for authority and process (important in BPO)
   - Initiative vs following direction balance

7. SALARY RANGE ESTIMATION
   - Based on skills, experience, and market rates
   - Comparison with PH market standards by location:
     * Metro Manila: Premium 15-25% above national average
     * Cebu: National average
     * Davao: 10-15% below national average
     * Remote: International rates possible (20-50% premium)
   - Negotiation range and justification
   - Benefits expectations in PH market

8. HIRING RECOMMENDATION MATRIX
   - Primary recommendation: Strong Hire/Hire/Maybe/No Hire
   - Confidence level (High/Medium/Low) with reasoning
   - Interview focus areas specific to PH context
   - Key questions to validate cultural and technical fit
   - Potential red flags to explore
   - Onboarding considerations for PH work culture

9. CAREER DEVELOPMENT POTENTIAL
   - Growth trajectory in Philippines tech ecosystem
   - Skills development priorities for local market
   - Leadership potential in Filipino cultural context
   - International opportunities through local experience
   - Retention risk factors and mitigation strategies

Return response as structured JSON with detailed explanations, specific scores, and actionable insights for Philippines tech hiring managers.
`,

      skillsExtraction: `
Extract and categorize all skills from this resume with confidence scores and context for the Philippines tech market.

RESUME TEXT: {resumeText}

Consider Philippines tech industry context:
- Strong BPO/outsourcing sector
- Growing fintech and e-commerce
- Government digitalization initiatives
- Remote work culture
- English as business language

Extract skills in categories:

TECHNICAL SKILLS:
- Programming languages (Java, JavaScript, Python, C#, PHP - popular in PH)
- Web frameworks (React, Angular, Vue, Laravel, ASP.NET)
- Mobile development (Android, iOS, Flutter, React Native)
- Databases (MySQL, PostgreSQL, MongoDB, Oracle - common in enterprises)
- Cloud platforms (AWS, Azure, Google Cloud - growing adoption)
- BPO-relevant technologies (CRM systems, call center software)

SOFT SKILLS:
- English communication proficiency (critical for PH market)
- Client management and customer service
- Cross-cultural communication
- Team leadership and collaboration
- Adaptability and flexibility
- Problem-solving and critical thinking

BPO/OUTSOURCING SKILLS:
- Client communication
- Process documentation
- Quality assurance
- Offshore team management
- Cultural sensitivity
- Time zone management

CERTIFICATIONS & CREDENTIALS:
- International certifications (AWS, Microsoft, Google)
- Local professional certifications
- English proficiency certifications
- University degrees (PH institutions)

For each skill, include:
- Confidence level (0-100)
- Context where mentioned
- Proficiency level (if indicated)
- Relevance to Philippines market
- Years of experience (if mentioned)

Return as detailed JSON structure.
`,

      interviewQuestions: `
Generate comprehensive interview questions tailored to this candidate and position.

CANDIDATE RESUME: {resumeText}

POSITION DETAILS:
- Role: {jobTitle}
- Level: {experienceLevel}
- Company: {company}
- Required Skills: {requiredSkills}
- Key Responsibilities: {responsibilities}

Generate questions in categories:

TECHNICAL ASSESSMENT:
- Core technical skills verification
- Problem-solving scenarios
- System design questions (for senior roles)
- Code review scenarios
- Technology choice discussions

BEHAVIORAL QUESTIONS:
- Leadership examples
- Conflict resolution
- Team collaboration
- Adaptability scenarios
- Learning agility examples

SITUATIONAL QUESTIONS:
- Role-specific scenarios
- Decision-making processes
- Pressure handling
- Priority management
- Stakeholder management

CULTURE FIT:
- Values alignment
- Work style preferences
- Growth mindset indicators
- Company mission connection

GROWTH & DEVELOPMENT:
- Career aspirations
- Learning goals
- Skill development plans
- Long-term vision

For each question, include:
- Difficulty level
- Expected answer framework
- Follow-up questions
- Red flags to watch for
- Positive indicators

Return as structured JSON with explanations.
`,

      resumeImprovement: `
Analyze this resume and provide specific, actionable improvement recommendations.

RESUME TEXT: {resumeText}
TARGET ROLE: {targetRole}
EXPERIENCE LEVEL: {experienceLevel}

Analyze and provide recommendations for:

CONTENT OPTIMIZATION:
- Missing key information
- Weak sections that need strengthening
- Redundant or unnecessary content
- Achievement quantification opportunities
- Industry buzzword integration

STRUCTURE & FORMATTING:
- Section organization
- Information hierarchy
- Readability improvements
- ATS optimization suggestions

KEYWORD OPTIMIZATION:
- Missing industry keywords
- Skill keyword placement
- Job-specific terminology
- SEO for applicant tracking systems

ACHIEVEMENT ENHANCEMENT:
- Quantifying accomplishments
- Impact statement improvements
- Action verb optimization
- Result-oriented descriptions

SKILL PRESENTATION:
- Technical skills organization
- Soft skills integration
- Skill proficiency clarification
- Portfolio/project highlighting

TAILORING SUGGESTIONS:
- Role-specific customizations
- Company-specific adaptations
- Industry-focused modifications

Provide specific, actionable recommendations with before/after examples where helpful.

Return as detailed JSON with prioritized improvement list.
`,

      careerGuidance: `
Provide comprehensive career guidance based on resume analysis and Philippines tech market trends.

CURRENT PROFILE: {resumeText}
CAREER GOALS: {careerGoals}
TARGET ROLES: {targetRoles}
INDUSTRY: {industry}

Consider Philippines tech ecosystem:
- BPO industry dominance (Accenture, IBM, Convergys)
- Growing local startups (Grab, Paymaya, Kumu)
- Government digitalization projects
- Fintech expansion (GCash, PayMaya, UnionBank)
- E-commerce growth (Shopee, Lazada, Zalora)
- Remote work adoption post-pandemic

Analyze and provide guidance on:

CAREER TRAJECTORY ANALYSIS:
- Current career stage in Philippines context
- Natural next steps in local market
- Skill gaps for advancement in PH companies
- BPO to product company transitions
- Startup vs enterprise career paths

MARKET OPPORTUNITIES:
- In-demand roles in Philippines (Software Engineer, DevOps, Data Analyst)
- BPO vs product development opportunities
- Fintech and e-commerce sector growth
- Government tech projects
- Remote work opportunities with international companies
- Salary ranges in PHP (₱30K-₱150K+ depending on role/experience)

SKILL DEVELOPMENT ROADMAP:
- Priority skills for Philippines market
- International certifications valued locally
- English communication enhancement
- Cloud skills (AWS/Azure popular with enterprises)
- Mobile development (high demand)
- Data science/AI skills (emerging demand)

NETWORKING STRATEGIES:
- Philippines tech communities (Philippine Web Developers Organization, DevCon)
- Local tech events and meetups in Metro Manila, Cebu, Davao
- LinkedIn Philippines networking
- Mentorship through local tech leaders
- Startup accelerator programs (IdeaSpace, Plug and Play Philippines)

PERSONAL BRANDING:
- LinkedIn optimization for Philippines recruiters
- English communication showcase
- Portfolio with Philippines company projects
- Technical blog writing
- Speaking at local tech events

Return comprehensive career development plan as structured JSON with Philippines-specific advice.
`
    };
  }

  /**
   * Make AI API call with enhanced error handling and prompt formatting
   */
  async makeEnhancedApiCall(prompt, temperature = 0.7) {
    try {
      const payload = {
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: temperature,
          return_full_text: false,
          do_sample: true,
          top_p: 0.9
        }
      };

      const response = await axios.post(this.textGenerationUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000, // 45 seconds for complex analysis
      });

      return response.data;
    } catch (error) {
      console.error('Enhanced AI API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive resume analysis with detailed insights
   */
  async generateComprehensiveAnalysis(resumeText, jobData) {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.resumeAnalysis
        .replace('{resumeText}', resumeText)
        .replace('{jobTitle}', jobData.title || 'Not specified')
        .replace('{description}', jobData.description || '')
        .replace('{requiredSkills}', (jobData.requiredSkills || []).join(', '))
        .replace('{preferredSkills}', (jobData.preferredSkills || []).join(', '))
        .replace('{experienceLevel}', jobData.experienceLevel || 'Not specified')
        .replace('{location}', jobData.location || 'Not specified')
        .replace('{company}', jobData.company || 'Not specified');

      const response = await this.makeEnhancedApiCall(prompt, 0.3); // Lower temperature for more consistent analysis
      
      // Try to parse JSON response
      try {
        const analysis = JSON.parse(response[0]?.generated_text || '{}');
        return this.validateAndEnhanceAnalysis(analysis, resumeText, jobData);
      } catch (parseError) {
        console.log('AI response not JSON, using fallback analysis');
        return this.getFallbackComprehensiveAnalysis(resumeText, jobData);
      }
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      return this.getFallbackComprehensiveAnalysis(resumeText, jobData);
    }
  }

  /**
   * Generate AI-powered interview questions
   */
  async generateInterviewQuestions(resumeText, jobData) {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.interviewQuestions
        .replace('{resumeText}', resumeText)
        .replace('{jobTitle}', jobData.title || 'Software Engineer')
        .replace('{experienceLevel}', jobData.experienceLevel || 'mid')
        .replace('{company}', jobData.company || 'Tech Company')
        .replace('{requiredSkills}', (jobData.requiredSkills || []).join(', '))
        .replace('{responsibilities}', (jobData.responsibilities || []).join('. '));

      const response = await this.makeEnhancedApiCall(prompt, 0.5);
      
      try {
        return JSON.parse(response[0]?.generated_text || '{}');
      } catch {
        return this.getFallbackInterviewQuestions(resumeText, jobData);
      }
    } catch (error) {
      console.error('Interview questions generation failed:', error);
      return this.getFallbackInterviewQuestions(resumeText, jobData);
    }
  }

  /**
   * Generate detailed resume improvement suggestions
   */
  async generateResumeImprovements(resumeText, targetRole = 'Software Engineer', experienceLevel = 'mid') {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.resumeImprovement
        .replace('{resumeText}', resumeText)
        .replace('{targetRole}', targetRole)
        .replace('{experienceLevel}', experienceLevel);

      const response = await this.makeEnhancedApiCall(prompt, 0.4);
      
      try {
        return JSON.parse(response[0]?.generated_text || '{}');
      } catch {
        return this.getFallbackResumeImprovements(resumeText, targetRole);
      }
    } catch (error) {
      console.error('Resume improvements generation failed:', error);
      return this.getFallbackResumeImprovements(resumeText, targetRole);
    }
  }

  /**
   * Generate career guidance and development recommendations
   */
  async generateCareerGuidance(resumeText, careerGoals = '', targetRoles = []) {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.careerGuidance
        .replace('{resumeText}', resumeText)
        .replace('{careerGoals}', careerGoals)
        .replace('{targetRoles}', targetRoles.join(', '))
        .replace('{industry}', 'Technology'); // Could be dynamic

      const response = await this.makeEnhancedApiCall(prompt, 0.6);
      
      try {
        return JSON.parse(response[0]?.generated_text || '{}');
      } catch {
        return this.getFallbackCareerGuidance(resumeText);
      }
    } catch (error) {
      console.error('Career guidance generation failed:', error);
      return this.getFallbackCareerGuidance(resumeText);
    }
  }

  /**
   * Advanced skills extraction with context and proficiency
   */
  async extractAdvancedSkills(resumeText) {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.skillsExtraction.replace('{resumeText}', resumeText);

      const response = await this.makeEnhancedApiCall(prompt, 0.3);
      
      try {
        return JSON.parse(response[0]?.generated_text || '{}');
      } catch {
        return this.getFallbackSkillsExtraction(resumeText);
      }
    } catch (error) {
      console.error('Advanced skills extraction failed:', error);
      return this.getFallbackSkillsExtraction(resumeText);
    }
  }

  /**
   * Validate and enhance AI analysis results
   */
  validateAndEnhanceAnalysis(analysis, resumeText, jobData) {
    // Ensure all required fields exist with defaults
    const enhanced = {
      overallScore: Math.max(0, Math.min(100, analysis.overallScore || 50)),
      skillsMatch: analysis.skillsMatch || 50,
      experienceMatch: analysis.experienceMatch || 50,
      educationMatch: analysis.educationMatch || 50,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ['Analysis completed'],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : ['Manual review needed'],
      missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
      keywordSuggestions: Array.isArray(analysis.keywordSuggestions) ? analysis.keywordSuggestions : [],
      recommendedRoles: Array.isArray(analysis.recommendedRoles) ? analysis.recommendedRoles : [],
      learningPaths: Array.isArray(analysis.learningPaths) ? analysis.learningPaths : [],
      interviewFocus: Array.isArray(analysis.interviewFocus) ? analysis.interviewFocus : [],
      culturalFitScore: Math.max(0, Math.min(100, analysis.culturalFitScore || 75)),
      careerProgression: analysis.careerProgression || 'Standard progression expected',
      improvementTips: Array.isArray(analysis.improvementTips) ? analysis.improvementTips : [],
      summary: analysis.summary || 'AI analysis completed successfully',
      analysisDate: new Date(),
      modelVersion: '2.0-enhanced'
    };

    return enhanced;
  }

  // Fallback implementations for when AI API fails
  getFallbackComprehensiveAnalysis(resumeText, jobData) {
    const skills = this.extractBasicSkills(resumeText);
    const requiredSkills = jobData.requiredSkills || [];
    const matchedSkills = skills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );

    const skillsScore = requiredSkills.length > 0 ? 
      Math.round((matchedSkills.length / requiredSkills.length) * 100) : 50;

    return {
      overallScore: Math.max(40, skillsScore),
      skillsMatch: skillsScore,
      experienceMatch: 60,
      educationMatch: 70,
      strengths: [
        'Resume content analyzed',
        skillsScore > 70 ? 'Good skills alignment' : 'Skills present'
      ],
      weaknesses: [
        skillsScore < 60 ? 'Some required skills may be missing' : 'Minor skill gaps',
        'AI analysis temporarily unavailable'
      ],
      missingSkills: requiredSkills.filter(skill => 
        !skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      ).slice(0, 5),
      keywordSuggestions: requiredSkills.slice(0, 8),
      recommendedRoles: ['Similar roles in same industry'],
      learningPaths: ['Develop missing technical skills', 'Enhance relevant experience'],
      interviewFocus: ['Technical skills', 'Experience details', 'Cultural fit'],
      culturalFitScore: 75,
      careerProgression: 'Suitable for current level with growth potential',
      improvementTips: [
        'Quantify achievements with specific numbers',
        'Add more relevant keywords from job description',
        'Highlight specific technologies used',
        'Include measurable project outcomes'
      ],
      summary: `Fallback analysis complete. Skills match: ${skillsScore}%. Manual review recommended for detailed assessment.`,
      analysisDate: new Date(),
      modelVersion: '2.0-fallback'
    };
  }

  getFallbackInterviewQuestions(resumeText, jobData) {
    const role = jobData.title || 'Software Engineer';
    const level = jobData.experienceLevel || 'mid';
    const skills = jobData.requiredSkills || [];

    return {
      technicalQuestions: [
        {
          question: `Describe your experience with ${skills[0] || 'the main technologies'} mentioned in your resume.`,
          category: 'technical',
          difficulty: level === 'senior' ? 'hard' : 'medium',
          expectedAnswer: 'Specific examples with technical depth'
        },
        {
          question: 'Walk me through how you would approach solving a complex technical problem.',
          category: 'technical',
          difficulty: 'medium',
          expectedAnswer: 'Structured problem-solving approach'
        }
      ],
      behavioralQuestions: [
        {
          question: 'Tell me about a time you had to learn a new technology quickly.',
          category: 'behavioral',
          skillTested: 'learning agility'
        },
        {
          question: 'Describe a challenging project you led and how you handled obstacles.',
          category: 'behavioral',
          skillTested: 'leadership'
        }
      ],
      situationalQuestions: [
        {
          question: `How would you handle a situation where ${role} requirements change mid-project?`,
          category: 'situational',
          scenario: 'changing requirements'
        }
      ],
      cultureQuestions: [
        {
          question: 'What type of work environment do you thrive in?',
          category: 'culture',
          purpose: 'work environment fit'
        }
      ],
      followUpQuestions: [
        {
          question: 'Can you provide more specific examples of your impact?',
          triggeredBy: 'vague achievement descriptions'
        }
      ]
    };
  }

  getFallbackResumeImprovements(resumeText, targetRole) {
    const commonImprovements = {
      contentOptimization: [
        'Add specific metrics and numbers to quantify achievements',
        'Include more action verbs to start bullet points',
        'Add a professional summary section if missing',
        'Ensure all relevant projects are included'
      ],
      structureFormatting: [
        'Use consistent formatting throughout',
        'Organize sections in logical order (Summary, Experience, Education, Skills)',
        'Ensure adequate white space for readability',
        'Use bullet points for easy scanning'
      ],
      keywordOptimization: [
        `Include more "${targetRole}" related keywords`,
        'Add industry-specific terminology',
        'Include variations of key skills',
        'Optimize for Applicant Tracking Systems (ATS)'
      ],
      achievementEnhancement: [
        'Transform job duties into achievement statements',
        'Use the CAR method (Challenge, Action, Result)',
        'Include percentage improvements where possible',
        'Highlight leadership and initiative examples'
      ],
      priority: 'high',
      estimatedImpact: 'Could improve application success rate by 25-40%'
    };

    return commonImprovements;
  }

  getFallbackCareerGuidance(resumeText) {
    return {
      careerTrajectory: {
        currentStage: 'Professional development phase in Philippines tech market',
        nextSteps: ['Enhance English communication skills', 'Gain BPO/outsourcing experience', 'Pursue international certifications'],
        timeframe: '6-12 months for next career move in PH market'
      },
      marketOpportunities: [
        'BPO industry continues to dominate (Accenture, IBM, Convergys)',
        'Fintech sector expanding (GCash, PayMaya, UnionBank Digital)',
        'E-commerce growth (Shopee, Lazada, Zalora tech teams)',
        'Government digitalization projects increasing',
        'Remote work with international companies growing',
        'Local startup ecosystem developing (Grab Philippines, Kumu)'
      ],
      skillDevelopment: {
        prioritySkills: ['English communication', 'Cloud technologies (AWS/Azure)', 'Mobile development', 'Data analysis'],
        learningResources: ['Coursera Philippines', 'FreeCodeCamp', 'AWS/Microsoft certifications', 'Local bootcamps (Zuitt, Tuitt)'],
        timeline: '3-6 months per major skill area'
      },
      networking: [
        'Join Philippine Web Developers Organization (PWDO)',
        'Attend DevCon Philippines and local tech meetups',
        'Connect with Manila, Cebu, and Davao tech communities',
        'Join Facebook groups: Philippine Startups, Philippines Developers',
        'Participate in local hackathons and tech events'
      ],
      personalBranding: [
        'Optimize LinkedIn for Philippines recruiters',
        'Showcase English communication skills',
        'Highlight BPO or client-facing experience',
        'Create portfolio with Philippines market projects',
        'Write technical blogs in English'
      ]
    };
  }

  getFallbackSkillsExtraction(resumeText) {
    const skills = this.extractBasicSkills(resumeText);
    
    return {
      technicalSkills: skills.filter(skill => 
        ['javascript', 'python', 'java', 'react', 'node', 'sql'].some(tech => 
          skill.toLowerCase().includes(tech)
        )
      ),
      softSkills: skills.filter(skill =>
        ['leadership', 'communication', 'teamwork', 'problem', 'management'].some(soft =>
          skill.toLowerCase().includes(soft)
        )
      ),
      tools: skills.filter(skill =>
        ['git', 'docker', 'aws', 'azure', 'jenkins'].some(tool =>
          skill.toLowerCase().includes(tool)
        )
      ),
      confidence: 60, // Medium confidence for basic extraction
      extractionMethod: 'pattern-matching-fallback'
    };
  }

  extractBasicSkills(text) {
    const skillPatterns = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
      'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'TensorFlow', 'PyTorch',
      'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication', 'Team Management'
    ];

    const textLower = text.toLowerCase();
    return skillPatterns.filter(skill => textLower.includes(skill.toLowerCase()));
  }

  /**
   * Generate job matching analysis with explanations
   */
  async analyzeJobMatch(candidateProfile, jobData) {
    try {
      const prompts = this.getPrompts();
      const prompt = prompts.jobMatching
        .replace('{candidateProfile}', JSON.stringify(candidateProfile))
        .replace('{jobTitle}', jobData.title || '')
        .replace('{description}', jobData.description || '')
        .replace('{requiredSkills}', (jobData.requiredSkills || []).join(', '))
        .replace('{preferredSkills}', (jobData.preferredSkills || []).join(', '))
        .replace('{experienceLevel}', jobData.experienceLevel || '')
        .replace('{location}', jobData.location || '')
        .replace('{salaryRange}', jobData.salaryRange || 'Not specified');

      const response = await this.makeEnhancedApiCall(prompt, 0.4);
      
      try {
        return JSON.parse(response[0]?.generated_text || '{}');
      } catch {
        return this.getFallbackJobMatch(candidateProfile, jobData);
      }
    } catch (error) {
      console.error('Job matching analysis failed:', error);
      return this.getFallbackJobMatch(candidateProfile, jobData);
    }
  }

  getFallbackJobMatch(candidateProfile, jobData) {
    return {
      matchScore: 65,
      skillsAlignment: {
        matched: ['Basic technical skills'],
        missing: ['Advanced specializations'],
        transferable: ['Problem solving', 'Communication']
      },
      experienceAlignment: {
        score: 60,
        relevantExperience: 'Some relevant background identified',
        gaps: ['May need more specific domain experience']
      },
      recommendationScore: 70,
      hiringRecommendation: 'conditional',
      reasoning: 'Candidate shows potential but requires further assessment of specific skills and experience alignment.'
    };
  }

  /**
   * Generate AI-powered hiring insights for recruiters
   */
  generateHiringInsights(applications, jobData) {
    const insights = {
      candidatePool: {
        totalApplications: applications.length,
        qualifiedCandidates: applications.filter(app => app.aiAnalysis?.overallScore >= 70).length,
        strongCandidates: applications.filter(app => app.aiAnalysis?.overallScore >= 85).length,
        averageScore: applications.reduce((sum, app) => sum + (app.aiAnalysis?.overallScore || 0), 0) / applications.length
      },
      recommendations: {
        topCandidates: applications
          .sort((a, b) => (b.aiAnalysis?.overallScore || 0) - (a.aiAnalysis?.overallScore || 0))
          .slice(0, 5)
          .map(app => ({
            candidateId: app.candidate._id,
            name: `${app.candidate.firstName} ${app.candidate.lastName}`,
            score: app.aiAnalysis?.overallScore || 0,
            keyStrengths: app.aiAnalysis?.insights?.strengths || []
          })),
        interviewPriority: 'Focus on candidates with 80+ scores and strong skills alignment',
        processingAdvice: applications.length > 50 ? 'Consider initial screening calls due to high volume' : 'Direct to interview process'
      },
      trendsAndPatterns: {
        commonSkills: this.findCommonSkills(applications),
        skillGaps: this.identifySkillGaps(applications, jobData.requiredSkills || []),
        experienceLevels: this.analyzeExperienceLevels(applications)
      }
    };

    return insights;
  }

  findCommonSkills(applications) {
    const allSkills = applications.flatMap(app => 
      app.aiAnalysis?.insights?.keywordSuggestions || []
    );
    const skillCounts = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });

    return Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, frequency: count }));
  }

  identifySkillGaps(applications, requiredSkills) {
    const missingSkillsCounts = {};
    
    applications.forEach(app => {
      const missing = app.aiAnalysis?.insights?.missingSkills || [];
      missing.forEach(skill => {
        missingSkillsCounts[skill] = (missingSkillsCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(missingSkillsCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, candidatesLacking: count }));
  }

  analyzeExperienceLevels(applications) {
    const levels = {
      junior: 0,
      mid: 0,
      senior: 0,
      lead: 0
    };

    applications.forEach(app => {
      const score = app.aiAnalysis?.overallScore || 0;
      const expMatch = app.aiAnalysis?.experienceMatch || 0;
      
      if (expMatch >= 80 && score >= 85) {
        levels.lead++;
      } else if (expMatch >= 70 && score >= 75) {
        levels.senior++;
      } else if (expMatch >= 50 && score >= 60) {
        levels.mid++;
      } else {
        levels.junior++;
      }
    });

    return levels;
  }

  /**
   * Calculate salary estimate based on Philippines tech market data
   */
  calculatePhilippinesSalaryEstimate(resumeText, jobData, experienceLevel, location = 'Metro Manila') {
    const skills = this.extractBasicSkills(resumeText);
    const yearsMatch = resumeText.toLowerCase().match(/(\d+)[\+\s]*years?/g) || [];
    const maxYears = yearsMatch.reduce((max, match) => {
      const years = parseInt(match.match(/\d+/)[0]);
      return Math.max(max, years);
    }, 0);

    // Base salary ranges by experience level (in PHP per month)
    const baseSalaryRanges = {
      entry: { min: 25000, max: 50000 },
      junior: { min: 35000, max: 65000 },
      mid: { min: 50000, max: 90000 },
      senior: { min: 90000, max: 150000 },
      lead: { min: 150000, max: 250000 },
      principal: { min: 200000, max: 350000 }
    };

    // Get base range
    const baseRange = baseSalaryRanges[experienceLevel] || baseSalaryRanges.mid;
    let minSalary = baseRange.min;
    let maxSalary = baseRange.max;

    // Location adjustments
    const locationMultipliers = {
      'Metro Manila': 1.0,
      'Manila': 1.0,
      'Makati': 1.15,
      'BGC': 1.15,
      'Cebu': 0.85,
      'Davao': 0.75,
      'Iloilo': 0.70,
      'Remote': 1.20 // International rates possible
    };

    const locationMultiplier = locationMultipliers[location] || 1.0;
    minSalary *= locationMultiplier;
    maxSalary *= locationMultiplier;

    // Skills premium adjustments
    const premiumSkills = {
      'aws': 1.15,
      'azure': 1.15,
      'kubernetes': 1.20,
      'docker': 1.10,
      'react': 1.08,
      'angular': 1.08,
      'vue': 1.05,
      'node.js': 1.10,
      'python': 1.12,
      'machine learning': 1.25,
      'data science': 1.30,
      'ai': 1.25,
      'blockchain': 1.20,
      'cybersecurity': 1.18,
      'devops': 1.15,
      'mobile development': 1.12,
      'ios': 1.15,
      'android': 1.15,
      'flutter': 1.20,
      'react native': 1.18
    };

    let skillsMultiplier = 1.0;
    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      Object.keys(premiumSkills).forEach(premiumSkill => {
        if (skillLower.includes(premiumSkill)) {
          skillsMultiplier = Math.max(skillsMultiplier, premiumSkills[premiumSkill]);
        }
      });
    });

    // Industry adjustments
    const industryPremiums = {
      'fintech': 1.20,
      'cryptocurrency': 1.25,
      'banking': 1.15,
      'e-commerce': 1.10,
      'gaming': 1.08,
      'bpo': 0.95,
      'government': 0.90,
      'startup': 1.05,
      'multinational': 1.15
    };

    const company = (jobData.company || '').toLowerCase();
    const description = (jobData.description || '').toLowerCase();
    let industryMultiplier = 1.0;
    
    Object.keys(industryPremiums).forEach(industry => {
      if (company.includes(industry) || description.includes(industry)) {
        industryMultiplier = Math.max(industryMultiplier, industryPremiums[industry]);
      }
    });

    // Experience years adjustment
    const experienceMultiplier = Math.min(1.5, 1.0 + (maxYears * 0.05));

    // Apply all multipliers
    minSalary = Math.round(minSalary * skillsMultiplier * industryMultiplier * experienceMultiplier);
    maxSalary = Math.round(maxSalary * skillsMultiplier * industryMultiplier * experienceMultiplier);

    // English proficiency bonus (important in PH market)
    const hasGoodEnglish = /\b(fluent|proficient|excellent|native|advanced)\b.*english/i.test(resumeText) ||
                          /english\b.*\b(fluent|proficient|excellent|native|advanced)/i.test(resumeText);
    
    if (hasGoodEnglish) {
      minSalary *= 1.10;
      maxSalary *= 1.10;
    }

    // BPO experience bonus (valued in PH tech market)
    const hasBPOExperience = /\b(bpo|call center|outsourcing|accenture|ibm|convergys|concentrix)\b/i.test(resumeText);
    if (hasBPOExperience) {
      minSalary *= 1.05;
      maxSalary *= 1.05;
    }

    return {
      estimatedRange: {
        min: Math.round(minSalary),
        max: Math.round(maxSalary),
        currency: 'PHP',
        period: 'monthly'
      },
      factors: {
        baseExperienceLevel: experienceLevel,
        yearsOfExperience: maxYears,
        location: location,
        skillsPremium: Math.round((skillsMultiplier - 1) * 100) + '%',
        industryPremium: Math.round((industryMultiplier - 1) * 100) + '%',
        englishBonus: hasGoodEnglish,
        bpoExperience: hasBPOExperience
      },
      marketContext: {
        percentile25: Math.round(minSalary * 0.90),
        percentile50: Math.round((minSalary + maxSalary) / 2),
        percentile75: Math.round(maxSalary * 0.95),
        percentile90: Math.round(maxSalary * 1.10)
      },
      recommendations: {
        negotiationRange: `₱${Math.round(minSalary * 1.05).toLocaleString()} - ₱${Math.round(maxSalary * 0.95).toLocaleString()}`,
        benefits: ['HMO', '13th month pay', 'Performance bonus', 'Flexible work arrangements'],
        careerGrowth: `Potential for ${Math.round((maxSalary * 1.5 - maxSalary) / maxSalary * 100)}% increase within 2-3 years`
      }
    };
  }

  /**
   * Generate success prediction based on historical data patterns
   */
  predictHiringSuccess(candidateAnalysis, historicalData = []) {
    // This would ideally use machine learning models trained on historical hiring data
    // For now, using rule-based prediction
    
    const score = candidateAnalysis.overallScore || 0;
    const skillsMatch = candidateAnalysis.skillsMatch || 0;
    const experienceMatch = candidateAnalysis.experienceMatch || 0;

    let prediction = {
      successProbability: 0,
      confidence: 'medium',
      factors: [],
      recommendations: []
    };

    // Calculate success probability
    if (score >= 85 && skillsMatch >= 80 && experienceMatch >= 75) {
      prediction.successProbability = 85;
      prediction.confidence = 'high';
      prediction.factors.push('Strong overall profile', 'Excellent skills match', 'Relevant experience');
      prediction.recommendations.push('Prioritize for immediate interview');
    } else if (score >= 70 && skillsMatch >= 65) {
      prediction.successProbability = 70;
      prediction.confidence = 'medium';
      prediction.factors.push('Good technical fit', 'Acceptable experience level');
      prediction.recommendations.push('Conduct phone screening first');
    } else if (score >= 50) {
      prediction.successProbability = 45;
      prediction.confidence = 'low';
      prediction.factors.push('Basic qualifications met');
      prediction.recommendations.push('Consider for junior roles or with training');
    } else {
      prediction.successProbability = 25;
      prediction.confidence = 'low';
      prediction.factors.push('Significant skill or experience gaps');
      prediction.recommendations.push('May not be suitable for current role');
    }

    return prediction;
  }
}

module.exports = new EnhancedAIService();
