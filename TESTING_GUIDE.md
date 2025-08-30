# AI Features Testing Guide

This guide provides comprehensive instructions for testing all the new AI features in the resume analyzer application.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Manual Testing](#manual-testing)
3. [Automated Testing](#automated-testing)
4. [API Testing with cURL](#api-testing-with-curl)
5. [Frontend Testing](#frontend-testing)
6. [Performance Testing](#performance-testing)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
1. ✅ Backend server running on `http://localhost:5000`
2. ✅ Frontend development server running on `http://localhost:5173`
3. ✅ Valid user account in the system
4. ✅ At least one job posting in the database
5. ✅ Hugging Face API key configured in `.env` (optional - has fallbacks)

### Run Complete Test Suite
```bash
# Backend tests
cd backend
npm test

# Manual endpoint testing
node scripts/test-ai-endpoints.js

# Frontend tests (if configured)
cd ../frontend
npm test
```

## Manual Testing

### 1. Using the Test Script
The easiest way to test all AI features:

```bash
cd backend
node scripts/test-ai-endpoints.js
```

This script will:
- ✅ Authenticate with test user
- ✅ Create test job posting
- ✅ Test all AI endpoints with sample data
- ✅ Provide colored output showing pass/fail status

### 2. Testing Individual Features

#### Resume Analysis
1. Go to application dashboard
2. Upload a resume (PDF/DOCX/TXT)
3. Select a job to analyze against
4. Click "Analyze Resume"
5. Verify you get:
   - Overall score (0-100)
   - Skill matches and missing skills
   - Experience and education analysis
   - Strengths, weaknesses, recommendations

#### Interview Questions
1. Create an application by analyzing a resume
2. Navigate to the application details
3. Click "Generate Interview Questions"
4. Verify you get:
   - Technical questions with difficulty levels
   - Behavioral questions testing specific skills
   - Situational scenario questions
   - Culture fit questions
   - Follow-up questions

#### Resume Improvements
1. Go to profile or resume section
2. Click "Get Resume Suggestions"
3. Optionally specify target role and experience level
4. Verify you get:
   - Content optimization tips
   - Structure and formatting suggestions
   - Keyword optimization advice
   - Achievement enhancement ideas
   - Priority level and estimated impact

#### Career Guidance
1. Go to career guidance section
2. Input career goals (optional)
3. Specify target roles (optional)
4. Click "Get Career Guidance"
5. Verify you get:
   - Career trajectory analysis
   - Market opportunities
   - Skill development recommendations
   - Networking advice
   - Personal branding tips

## API Testing with cURL

### Authentication
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the token for other requests
TOKEN="your-jwt-token-here"
```

### Test AI Endpoints

#### Resume Improvements
```bash
curl -X POST http://localhost:5000/api/ai/resume-improvements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetRole": "Senior Software Engineer",
    "experienceLevel": "senior"
  }'
```

#### Career Guidance
```bash
curl -X GET "http://localhost:5000/api/ai/career-guidance?careerGoals=Become tech lead&targetRoles=Senior Engineer,Tech Lead" \
  -H "Authorization: Bearer $TOKEN"
```

#### Advanced Skills Extraction
```bash
curl -X GET http://localhost:5000/api/ai/advanced-skills \
  -H "Authorization: Bearer $TOKEN"
```

#### Job Match Analysis
```bash
curl -X POST http://localhost:5000/api/ai/job-match-analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "your-job-id",
    "candidateId": "your-candidate-id"
  }'
```

#### Interview Questions
```bash
curl -X GET http://localhost:5000/api/ai/interview-questions/your-application-id \
  -H "Authorization: Bearer $TOKEN"
```

#### Hiring Insights
```bash
# General insights
curl -X GET "http://localhost:5000/api/ai/hiring-insights?timeRange=30" \
  -H "Authorization: Bearer $TOKEN"

# Job-specific insights
curl -X GET http://localhost:5000/api/ai/hiring-insights/your-job-id \
  -H "Authorization: Bearer $TOKEN"
```

#### Success Prediction
```bash
curl -X GET http://localhost:5000/api/ai/success-prediction/your-application-id \
  -H "Authorization: Bearer $TOKEN"
```

## Automated Testing

### Backend Unit Tests
```bash
cd backend
npm test
```

Tests cover:
- ✅ AI controller endpoint behavior
- ✅ Enhanced AI service functionality
- ✅ Error handling and fallbacks
- ✅ Authentication and authorization
- ✅ Input validation

### Run Specific Test Suites
```bash
# Test only AI controller
npm test -- aiController.test.js

# Test only enhanced AI service
npm test -- enhancedAIService.test.js

# Run tests with coverage
npm test -- --coverage
```

## Frontend Testing

### Component Testing (if using React Testing Library)
```bash
cd frontend
npm test
```

### Manual Browser Testing Checklist
- [ ] Resume upload and analysis works
- [ ] Interview questions display properly
- [ ] Resume improvements show actionable suggestions
- [ ] Career guidance provides relevant advice
- [ ] Error states display user-friendly messages
- [ ] Loading states show during AI processing
- [ ] All TypeScript interfaces work correctly

## Performance Testing

### AI Response Time Testing
```bash
# Time a specific endpoint
time curl -X GET http://localhost:5000/api/ai/career-guidance \
  -H "Authorization: Bearer $TOKEN"
```

### Load Testing (using Apache Bench)
```bash
# Test 10 concurrent requests to resume analysis
ab -n 10 -c 2 -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/ai/resume-improvements
```

## Expected Response Times
- **Resume Analysis**: 5-15 seconds (with AI) / <1 second (fallback)
- **Interview Questions**: 3-8 seconds (with AI) / <1 second (fallback)
- **Career Guidance**: 4-10 seconds (with AI) / <1 second (fallback)
- **Skills Extraction**: 2-6 seconds (with AI) / <1 second (fallback)
- **Other endpoints**: 1-5 seconds (with AI) / <1 second (fallback)

## Testing Different Scenarios

### 1. AI API Available
- All features should use AI-powered analysis
- Responses should be detailed and contextual
- Response times may be slower but more accurate

### 2. AI API Unavailable
- All features should fallback gracefully
- Responses should use pattern matching and templates
- Response times should be fast (<1 second)
- No errors should be thrown to users

### 3. Network Issues
- Requests should timeout gracefully
- Error messages should be user-friendly
- Retry mechanisms should work correctly

### 4. Invalid Input Data
- Malformed requests should return 400 errors
- Missing required parameters should be caught
- File upload limits should be enforced

## Sample Test Data

### Test Resume Content
```
John Doe
Software Engineer

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
```

### Test Job Requirements
```
Senior Software Engineer position requiring:
- 5+ years of software development experience
- Expert-level React and TypeScript skills
- Node.js and REST API development
- Leadership and team management experience
- AI/ML knowledge preferred
- AWS cloud platform experience
```

## Troubleshooting

### Common Issues

#### "AI service timeout"
- **Cause**: Hugging Face API is slow or overloaded
- **Solution**: Wait and retry, or check if fallback is working

#### "Invalid JWT token"
- **Cause**: Token expired or malformed
- **Solution**: Re-authenticate and get new token

#### "Job/Application not found"
- **Cause**: Testing with non-existent IDs
- **Solution**: Use the test script to create valid test data

#### "File upload failed"
- **Cause**: File size too large or unsupported format
- **Solution**: Use smaller files (PDF/DOCX/TXT under 10MB)

#### "AI response parsing failed"
- **Cause**: Unexpected AI response format
- **Solution**: Check AI service logs and fallback handling

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=ai-service node scripts/test-ai-endpoints.js
```

### Checking AI Service Status
```bash
# Test Hugging Face API availability
curl -H "Authorization: Bearer $HUGGING_FACE_TOKEN" \
  https://api-inference.huggingface.co/models/microsoft/DialoGPT-large
```

## Testing Checklist

### Before Testing
- [ ] Backend server running
- [ ] Database connected
- [ ] Environment variables set
- [ ] Test user account exists
- [ ] Sample job postings available

### Core Features
- [ ] Resume analysis works with real files
- [ ] Interview questions generate for applications
- [ ] Resume improvements provide actionable advice
- [ ] Career guidance offers relevant suggestions
- [ ] Job match analysis gives accurate scores

### Edge Cases
- [ ] Large resume files (5-10MB)
- [ ] Unsupported file formats handled gracefully
- [ ] AI API failures fall back properly
- [ ] Network timeouts handled correctly
- [ ] Invalid user inputs rejected appropriately

### Performance
- [ ] Response times acceptable for AI features
- [ ] Fallback methods respond quickly
- [ ] Multiple concurrent requests handled
- [ ] Memory usage remains reasonable

### Security
- [ ] Authentication required for all endpoints
- [ ] File uploads validated and sanitized
- [ ] User data properly isolated
- [ ] Error messages don't leak sensitive info

## Next Steps

After testing, consider:
1. **Frontend Integration**: Build UI components for new features
2. **User Experience**: Add loading states and error handling
3. **Analytics**: Track feature usage and performance
4. **Optimization**: Cache frequently accessed data
5. **Monitoring**: Set up alerts for AI service health
