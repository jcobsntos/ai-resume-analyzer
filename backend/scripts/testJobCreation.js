const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-ai-analyzer');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testJobCreation = async () => {
  try {
    await connectDB();
    
    // Find a recruiter user
    const recruiter = await User.findOne({ role: 'recruiter' });
    if (!recruiter) {
      console.error('No recruiter found in database');
      return;
    }
    
    console.log(`Using recruiter: ${recruiter.fullName} (${recruiter.email})`);
    console.log(`Company: ${recruiter.company}`);
    
    // Test job data (minimal required fields)
    const testJobData = {
      title: 'Test Software Developer',
      description: 'This is a test job description with enough characters to meet the minimum requirement of 50 characters for validation.',
      company: recruiter.company || 'Test Company',
      location: {
        city: 'Manila',
        state: 'Metro Manila',
        country: 'Philippines'
      },
      department: 'Engineering',
      jobType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      preferredSkills: ['TypeScript', 'MongoDB'],
      responsibilities: [
        'Develop web applications',
        'Write clean code',
        'Collaborate with team'
      ],
      qualifications: [
        '2+ years of experience',
        'Knowledge of JavaScript',
        'Good communication skills'
      ],
      benefits: ['Health Insurance', 'Flexible Hours'],
      postedBy: recruiter._id
    };
    
    console.log('\nAttempting to create job with data:');
    console.log(JSON.stringify(testJobData, null, 2));
    
    // Try to create the job
    const job = await Job.create(testJobData);
    console.log('\n✅ Job created successfully!');
    console.log(`Job ID: ${job._id}`);
    console.log(`Title: ${job.title}`);
    console.log(`Slug: ${job.slug}`);
    
    // Clean up - delete the test job
    await Job.findByIdAndDelete(job._id);
    console.log('✅ Test job deleted');
    
    mongoose.connection.close();
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Job creation failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('\n📋 Validation Errors:');
      for (let field in error.errors) {
        console.log(`  - ${field}: ${error.errors[field].message}`);
      }
    }
    
    mongoose.connection.close();
  }
};

// Run the test
testJobCreation();
