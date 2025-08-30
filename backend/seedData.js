const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Job = require('./src/models/Job');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const users = [
      {
        firstName: 'John',
        lastName: 'Candidate',
        email: 'candidate@test.com',
        password: 'password123',
        role: 'candidate',
        phone: '15550101',
      },
      {
        firstName: 'Jane',
        lastName: 'Recruiter',
        email: 'recruiter@test.com',
        password: 'password123',
        role: 'recruiter',
        phone: '15550102',
        company: 'TechCorp Inc.',
        department: 'Human Resources',
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        phone: '15550103',
      }
    ];

    const createdUsers = await User.create(users);
    console.log('Created test users:', createdUsers.map(u => ({ email: u.email, role: u.role })));

    // Find the recruiter to use as job poster
    const recruiter = createdUsers.find(u => u.role === 'recruiter');

    // Create test jobs
    const jobs = [
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        description: 'We are looking for an experienced software engineer to join our team. You will be responsible for developing high-quality applications using modern technologies.',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
          remote: false,
          hybrid: false
        },
        department: 'Engineering',
        jobType: 'full-time',
        experienceLevel: 'senior',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'AWS', 'MongoDB', 'Git'],
        preferredSkills: ['TypeScript', 'Docker', 'Kubernetes'],
        responsibilities: [
          'Design and develop web applications',
          'Collaborate with cross-functional teams',
          'Write clean, maintainable code',
          'Participate in code reviews',
          'Mentor junior developers'
        ],
        qualifications: [
          '5+ years of software development experience',
          'Proficiency in JavaScript, React, and Node.js',
          'Experience with cloud platforms (AWS, Azure, GCP)',
          'Strong problem-solving skills',
          'Bachelor\'s degree in Computer Science or related field'
        ],
        salary: {
          min: 120000,
          max: 180000,
          currency: 'USD',
          period: 'yearly'
        },
        benefits: ['Health Insurance', 'Dental Insurance', '401k', 'Flexible PTO'],
        status: 'active',
        postedBy: recruiter._id,
      },
      {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        description: 'Join our dynamic team to build amazing user interfaces for our growing platform. Perfect for someone passionate about UI/UX and modern frontend technologies.',
        location: {
          city: 'Remote',
          state: 'CA',
          country: 'United States',
          remote: true,
          hybrid: false
        },
        department: 'Engineering',
        jobType: 'full-time',
        experienceLevel: 'mid',
        requiredSkills: ['React', 'TypeScript', 'TailwindCSS', 'HTML', 'CSS', 'JavaScript'],
        preferredSkills: ['Next.js', 'Figma', 'Testing'],
        responsibilities: [
          'Build responsive user interfaces',
          'Implement design systems',
          'Optimize application performance',
          'Work closely with designers',
          'Contribute to technical decisions'
        ],
        qualifications: [
          '3+ years of frontend development experience',
          'Expert knowledge of React and TypeScript',
          'Experience with modern CSS frameworks (TailwindCSS preferred)',
          'Understanding of responsive design principles',
          'Portfolio of previous work'
        ],
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        },
        benefits: ['Health Insurance', 'Remote Work', 'Learning Budget'],
        status: 'active',
        postedBy: recruiter._id,
      },
      {
        title: 'Product Manager',
        company: 'InnovateCorp',
        description: 'We\'re seeking a strategic product manager to drive our product roadmap and work closely with engineering and design teams.',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'United States',
          remote: false,
          hybrid: true
        },
        department: 'Product',
        jobType: 'full-time',
        experienceLevel: 'mid',
        requiredSkills: ['Product Management', 'Agile', 'Analytics', 'Strategy', 'Communication'],
        preferredSkills: ['SQL', 'Data Analysis', 'UX Research'],
        responsibilities: [
          'Define product strategy and roadmap',
          'Gather and prioritize requirements',
          'Work with engineering teams',
          'Analyze market trends and user feedback',
          'Present to stakeholders'
        ],
        qualifications: [
          '4+ years of product management experience',
          'Experience with agile methodologies',
          'Strong analytical and communication skills',
          'Technical background preferred',
          'MBA or equivalent experience'
        ],
        salary: {
          min: 110000,
          max: 150000,
          currency: 'USD',
          period: 'yearly'
        },
        benefits: ['Health Insurance', 'Stock Options', 'Commuter Benefits'],
        status: 'active',
        postedBy: recruiter._id,
      }
    ];

    const createdJobs = await Job.create(jobs);
    console.log('Created test jobs:', createdJobs.map(j => ({ title: j.title, company: j.company })));

    console.log('\n✅ Seed data created successfully!');
    console.log('\n🔑 Test Accounts:');
    console.log('Candidate: candidate@test.com / password123');
    console.log('Recruiter: recruiter@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
