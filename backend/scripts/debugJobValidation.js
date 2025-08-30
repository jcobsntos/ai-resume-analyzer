const { body, validationResult } = require('express-validator');

// Simulate the validation rules from jobRoutes.js
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3-100 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50-5000 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country must be at least 2 characters'),
  body('department')
    .isIn(['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Customer Success', 'Data Science', 'Other'])
    .withMessage('Department must be a valid option'),
  body('jobType')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
    .withMessage('Job type must be full-time, part-time, contract, internship, or freelance'),
  body('experienceLevel')
    .isIn(['entry', 'mid', 'senior', 'lead', 'executive'])
    .withMessage('Experience level must be entry, mid, senior, lead, or executive'),
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('requiredSkills')
    .isArray({ min: 1 })
    .withMessage('At least one required skill must be specified'),
  body('requiredSkills.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1-50 characters'),
  body('preferredSkills')
    .optional()
    .isArray()
    .withMessage('Preferred skills must be an array'),
  body('responsibilities')
    .isArray({ min: 1 })
    .withMessage('At least one responsibility must be specified'),
  body('qualifications')
    .isArray({ min: 1 })
    .withMessage('At least one qualification must be specified'),
];

// Test different data formats that might come from the frontend
const testCases = [
  {
    name: 'Missing title',
    data: {
      description: 'This is a long enough description that meets the minimum requirement of fifty characters.',
      company: 'Test Company',
      location: { city: 'Manila', state: 'Metro Manila' },
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: ['JavaScript'],
      responsibilities: ['Code'],
      qualifications: ['Experience']
    }
  },
  {
    name: 'Short description',
    data: {
      title: 'Test Job',
      description: 'Too short',
      company: 'Test Company',
      location: { city: 'Manila', state: 'Metro Manila' },
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: ['JavaScript'],
      responsibilities: ['Code'],
      qualifications: ['Experience']
    }
  },
  {
    name: 'Invalid department',
    data: {
      title: 'Test Job',
      description: 'This is a long enough description that meets the minimum requirement of fifty characters.',
      company: 'Test Company',
      location: { city: 'Manila', state: 'Metro Manila' },
      department: 'InvalidDept',
      jobType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: ['JavaScript'],
      responsibilities: ['Code'],
      qualifications: ['Experience']
    }
  },
  {
    name: 'Empty required skills',
    data: {
      title: 'Test Job',
      description: 'This is a long enough description that meets the minimum requirement of fifty characters.',
      company: 'Test Company',
      location: { city: 'Manila', state: 'Metro Manila' },
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: [],
      responsibilities: ['Code'],
      qualifications: ['Experience']
    }
  }
];

console.log('='.repeat(60));
console.log('JOB VALIDATION DEBUG SCRIPT');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('-'.repeat(40));
  
  // Check each required field manually
  const issues = [];
  
  if (!testCase.data.title || testCase.data.title.length < 3) {
    issues.push('Title missing or too short');
  }
  
  if (!testCase.data.description || testCase.data.description.length < 50) {
    issues.push('Description missing or too short');
  }
  
  if (!testCase.data.location?.city) {
    issues.push('Location city missing');
  }
  
  if (!testCase.data.location?.state) {
    issues.push('Location state missing');
  }
  
  const validDepts = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Customer Success', 'Data Science', 'Other'];
  if (!validDepts.includes(testCase.data.department)) {
    issues.push('Invalid department');
  }
  
  const validJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
  if (!validJobTypes.includes(testCase.data.jobType)) {
    issues.push('Invalid job type');
  }
  
  const validExpLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
  if (!validExpLevels.includes(testCase.data.experienceLevel)) {
    issues.push('Invalid experience level');
  }
  
  if (!Array.isArray(testCase.data.requiredSkills) || testCase.data.requiredSkills.length === 0) {
    issues.push('Required skills missing or empty');
  }
  
  if (!Array.isArray(testCase.data.responsibilities) || testCase.data.responsibilities.length === 0) {
    issues.push('Responsibilities missing or empty');
  }
  
  if (!Array.isArray(testCase.data.qualifications) || testCase.data.qualifications.length === 0) {
    issues.push('Qualifications missing or empty');
  }
  
  if (issues.length === 0) {
    console.log('✅ All validations pass');
  } else {
    console.log('❌ Validation issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
});

console.log('\n' + '='.repeat(60));
console.log('COMMON ISSUES TO CHECK IN FRONTEND:');
console.log('='.repeat(60));
console.log('1. Description must be at least 50 characters');
console.log('2. Required skills must be a non-empty array');
console.log('3. Responsibilities must be a non-empty array');
console.log('4. Qualifications must be a non-empty array');
console.log('5. Department must be one of the valid options');
console.log('6. Job type must be one of the valid options');
console.log('7. Experience level must be one of the valid options');
console.log('8. Location city and state are required');
console.log('='.repeat(60));
