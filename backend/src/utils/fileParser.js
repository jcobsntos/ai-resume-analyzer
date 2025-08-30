const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    return {
      text: data.text,
      pages: data.numpages,
      metadata: data.metadata,
      version: data.version,
      success: true
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return {
      text: '',
      error: error.message,
      success: false
    };
  }
};

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    return {
      text: result.value,
      messages: result.messages,
      success: true
    };
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return {
      text: '',
      error: error.message,
      success: false
    };
  }
};

/**
 * Extract text from DOC file (legacy Word format)
 * @param {string} filePath - Path to the DOC file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromDOC = async (filePath) => {
  try {
    // mammoth can handle both DOC and DOCX files
    const result = await mammoth.extractRawText({ path: filePath });
    
    return {
      text: result.value,
      messages: result.messages,
      success: true
    };
  } catch (error) {
    console.error('Error extracting text from DOC:', error);
    return {
      text: '',
      error: error.message,
      success: false
    };
  }
};

/**
 * Generic file text extraction based on file extension
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromFile = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return await extractTextFromPDF(filePath);
    case '.docx':
      return await extractTextFromDOCX(filePath);
    case '.doc':
      return await extractTextFromDOC(filePath);
    default:
      return {
        text: '',
        error: `Unsupported file type: ${extension}`,
        success: false
      };
  }
};

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
const cleanExtractedText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might interfere with analysis
    .replace(/[^\w\s.,;:!?@#$%&*()\-+=\[\]{}|\\/<>]/g, ' ')
    // Remove multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Trim whitespace
    .trim();
};

/**
 * Extract basic information from resume text using regex patterns
 * @param {string} text - Cleaned resume text
 * @returns {Object} - Extracted information
 */
const extractBasicInfo = (text) => {
  const extractedInfo = {
    emails: [],
    phones: [],
    skills: [],
    education: [],
    experience: []
  };

  if (!text) return extractedInfo;

  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  extractedInfo.emails = text.match(emailRegex) || [];

  // Phone number extraction (US format)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex) || [];
  extractedInfo.phones = phones.map(phone => phone.replace(/\D/g, ''));

  // Common skills extraction (basic pattern matching)
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
    'Machine Learning', 'Data Science', 'Artificial Intelligence', 'Deep Learning',
    'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
  ];

  const textLower = text.toLowerCase();
  extractedInfo.skills = commonSkills.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );

  // Education extraction (basic pattern)
  const educationRegex = /(bachelor|master|phd|doctorate|associate|diploma|degree|university|college|school)/gi;
  const educationMatches = text.match(educationRegex) || [];
  extractedInfo.education = [...new Set(educationMatches.map(match => match.toLowerCase()))];

  // Experience extraction (basic pattern - looking for job titles and companies)
  const experienceRegex = /(developer|engineer|manager|analyst|consultant|specialist|coordinator|director|senior|junior|lead)/gi;
  const experienceMatches = text.match(experienceRegex) || [];
  extractedInfo.experience = [...new Set(experienceMatches.map(match => match.toLowerCase()))];

  return extractedInfo;
};

/**
 * Calculate file processing statistics
 * @param {string} text - Extracted text
 * @returns {Object} - Processing statistics
 */
const getProcessingStats = (text) => {
  if (!text) return { wordCount: 0, charCount: 0, lineCount: 0 };
  
  return {
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    charCount: text.length,
    lineCount: text.split('\n').length
  };
};

/**
 * Main function to process uploaded resume file
 * @param {string} filePath - Path to uploaded file
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} - Complete processing results
 */
const processResumeFile = async (filePath, originalName) => {
  const startTime = Date.now();
  
  try {
    // Extract text from file
    const extractionResult = await extractTextFromFile(filePath);
    
    if (!extractionResult.success) {
      return {
        success: false,
        error: extractionResult.error,
        processingTime: Date.now() - startTime
      };
    }

    // Clean the extracted text
    const cleanedText = cleanExtractedText(extractionResult.text);
    
    // Extract basic information
    const basicInfo = extractBasicInfo(cleanedText);
    
    // Get processing statistics
    const stats = getProcessingStats(cleanedText);
    
    return {
      success: true,
      originalName,
      extractedText: cleanedText,
      rawText: extractionResult.text,
      basicInfo,
      stats,
      processingTime: Date.now() - startTime,
      metadata: extractionResult.metadata || {}
    };
    
  } catch (error) {
    console.error('Error processing resume file:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
};

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromDOC,
  extractTextFromFile,
  cleanExtractedText,
  extractBasicInfo,
  getProcessingStats,
  processResumeFile
};
