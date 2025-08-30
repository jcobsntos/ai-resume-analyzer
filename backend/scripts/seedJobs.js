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

const findOrCreateUser = async () => {
  // Find an admin or recruiter user to assign as job poster
  let user = await User.findOne({ role: { $in: ['admin', 'recruiter'] } });
  
  if (!user) {
    console.log('No admin/recruiter found, creating a default job poster...');
    user = await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@company.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
  }
  
  return user._id;
};

const createSampleJobs = (posterId) => [
  {
    title: 'Senior Full Stack Developer',
    company: 'Globe Telecom',
    department: 'Engineering',
    location: {
      city: 'Manila',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 80000,
      max: 120000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'We are looking for a Senior Full Stack Developer to join our growing technology team. You will be responsible for developing and maintaining web applications using modern technologies.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'AWS', 'JavaScript', 'TypeScript'],
    preferredSkills: ['Docker', 'Kubernetes', 'GraphQL'],
    responsibilities: [
      'Develop and maintain web applications using React and Node.js',
      'Design and implement database schemas and APIs',
      'Collaborate with cross-functional teams to deliver high-quality products',
      'Mentor junior developers and conduct code reviews',
      'Optimize application performance and scalability'
    ],
    qualifications: [
      '5+ years of experience in full stack development',
      'Proficiency in React, Node.js, and MongoDB',
      'Experience with cloud platforms (AWS/Azure)',
      'Strong problem-solving skills',
      'Excellent communication skills'
    ],
    benefits: ['Health Insurance', 'Flexible Working Hours', 'Professional Development Budget'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Frontend Developer',
    company: 'Ayala Corporation',
    department: 'Product',
    location: {
      city: 'Makati',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 50000,
      max: 80000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Join our digital innovation team as a Frontend Developer. You will create beautiful and responsive user interfaces for our web applications.',
    requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript'],
    preferredSkills: ['Tailwind CSS', 'Next.js', 'Figma'],
    responsibilities: [
      'Build responsive and interactive user interfaces',
      'Implement designs from mockups and prototypes',
      'Optimize applications for maximum speed and scalability',
      'Collaborate with designers and backend developers',
      'Write clean, maintainable code following best practices'
    ],
    qualifications: [
      '3+ years of frontend development experience',
      'Expert in React and modern JavaScript',
      'Experience with CSS frameworks',
      'Knowledge of responsive design',
      'Portfolio of completed projects'
    ],
    benefits: ['Health Insurance', 'Remote Work Options', 'Career Growth Opportunities'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Software Engineer',
    company: 'Shopee Philippines',
    department: 'Engineering',
    location: {
      city: 'Pasig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 60000,
      max: 90000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'We are seeking a talented Software Engineer to join our engineering team. You will work on scalable systems that serve millions of users.',
    requiredSkills: ['Java', 'Python', 'Spring Boot', 'MySQL', 'Docker'],
    preferredSkills: ['Kubernetes', 'Redis', 'Kafka'],
    responsibilities: [
      'Design and develop high-performance backend services',
      'Work with microservices architecture',
      'Collaborate with product teams to deliver features',
      'Debug and resolve technical issues',
      'Participate in code reviews and system design discussions'
    ],
    qualifications: [
      "Bachelor's degree in Computer Science or related field",
      '2+ years of software development experience',
      'Proficiency in Java or Python',
      'Experience with microservices architecture',
      'Strong debugging and problem-solving skills'
    ],
    benefits: ['Competitive Salary', 'Stock Options', 'Learning Stipend'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Junior Web Developer',
    company: 'GCash',
    department: 'Product',
    location: {
      city: 'Taguig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: {
      min: 35000,
      max: 55000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Looking for a Junior Web Developer to join our product development team. Perfect opportunity for recent graduates or developers with 1-2 years of experience.',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    preferredSkills: ['Git', 'MongoDB', 'Express.js'],
    responsibilities: [
      'Assist in developing web applications',
      'Write clean, well-documented code',
      'Learn and implement new technologies',
      'Participate in team meetings and planning sessions',
      'Support testing and debugging activities'
    ],
    qualifications: [
      "Bachelor's degree in Computer Science or related field",
      '1-2 years of web development experience',
      'Knowledge of HTML, CSS, JavaScript',
      'Familiarity with modern frameworks',
      'Eagerness to learn and grow'
    ],
    benefits: ['Training Programs', 'Mentorship', 'Health Insurance'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'DevOps Engineer',
    company: 'Lazada Philippines',
    department: 'Operations',
    location: {
      city: 'Manila',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 70000,
      max: 100000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Join our infrastructure team as a DevOps Engineer. You will be responsible for maintaining and scaling our cloud infrastructure.',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Python'],
    preferredSkills: ['Bash', 'Terraform', 'Monitoring Tools'],
    responsibilities: [
      'Maintain and scale cloud infrastructure',
      'Implement CI/CD pipelines',
      'Monitor system performance and reliability',
      'Automate deployment processes',
      'Collaborate with development teams'
    ],
    qualifications: [
      '3+ years of DevOps experience',
      'Experience with AWS or Azure',
      'Knowledge of containerization (Docker, Kubernetes)',
      'Proficiency in scripting languages',
      'Experience with CI/CD pipelines'
    ],
    benefits: ['Flexible Hours', 'Remote Work', 'Tech Conference Allowance'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Senior Data Scientist',
    company: 'Smart Communications',
    department: 'Data Science',
    location: {
      city: 'Makati',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 90000,
      max: 130000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Join our data science team to build machine learning models and extract insights from large datasets to drive business decisions.',
    requiredSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas'],
    preferredSkills: ['Apache Spark', 'Tableau', 'AWS SageMaker'],
    responsibilities: [
      'Develop and deploy machine learning models',
      'Analyze large datasets to identify trends and patterns',
      'Collaborate with business stakeholders to define requirements',
      'Create data visualizations and reports',
      'Optimize model performance and accuracy'
    ],
    qualifications: [
      'Masters degree in Data Science, Statistics, or related field',
      '4+ years of experience in data science',
      'Proficiency in Python and R',
      'Experience with machine learning frameworks',
      'Strong analytical and problem-solving skills'
    ],
    benefits: ['Health Insurance', '13th Month Pay', 'Training Programs'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Mobile App Developer (React Native)',
    company: 'BPI',
    department: 'Engineering',
    location: {
      city: 'Pasig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 65000,
      max: 95000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Develop and maintain our mobile banking application using React Native. Work with our digital banking team to create seamless user experiences.',
    requiredSkills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Redux'],
    preferredSkills: ['TypeScript', 'Firebase', 'Jest', 'Detox'],
    responsibilities: [
      'Develop cross-platform mobile applications',
      'Implement new features and maintain existing codebase',
      'Collaborate with UX/UI designers',
      'Write unit and integration tests',
      'Optimize app performance for both platforms'
    ],
    qualifications: [
      '3+ years of React Native development experience',
      'Experience with mobile app deployment',
      'Knowledge of mobile security best practices',
      'Familiarity with banking or fintech applications',
      'Strong debugging and testing skills'
    ],
    benefits: ['Health Insurance', 'Life Insurance', 'Performance Bonus'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Cloud Solutions Architect',
    company: 'Accenture Philippines',
    department: 'Engineering',
    location: {
      city: 'Taguig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 100000,
      max: 150000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Design and implement cloud solutions for enterprise clients. Lead cloud migration projects and optimize cloud infrastructure.',
    requiredSkills: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform'],
    preferredSkills: ['Google Cloud', 'Ansible', 'Jenkins', 'Microservices'],
    responsibilities: [
      'Design scalable cloud architectures',
      'Lead cloud migration projects',
      'Implement DevOps best practices',
      'Provide technical guidance to development teams',
      'Ensure security and compliance standards'
    ],
    qualifications: [
      '5+ years of cloud architecture experience',
      'AWS/Azure certification required',
      'Experience with enterprise-scale deployments',
      'Strong understanding of networking and security',
      'Excellent client-facing skills'
    ],
    benefits: ['Health Insurance', 'Travel Opportunities', 'Certification Support'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'UI/UX Designer',
    company: 'Zalora Philippines',
    department: 'Design',
    location: {
      city: 'Manila',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 55000,
      max: 85000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Create intuitive and engaging user experiences for our e-commerce platform. Work closely with product managers and developers.',
    requiredSkills: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping', 'User Research'],
    preferredSkills: ['After Effects', 'Principle', 'InVision', 'Zeplin'],
    responsibilities: [
      'Design user interfaces for web and mobile platforms',
      'Conduct user research and usability testing',
      'Create wireframes, mockups, and prototypes',
      'Collaborate with development teams',
      'Maintain design systems and style guides'
    ],
    qualifications: [
      'Bachelor\'s degree in Design or related field',
      '3+ years of UI/UX design experience',
      'Portfolio showcasing e-commerce projects',
      'Understanding of responsive design principles',
      'Experience with design systems'
    ],
    benefits: ['Health Insurance', 'Employee Discounts', 'Creative Freedom'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Backend Developer (Node.js)',
    company: 'Grab Philippines',
    department: 'Engineering',
    location: {
      city: 'Taguig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 70000,
      max: 100000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Build and maintain backend services that power millions of rides and deliveries across Southeast Asia.',
    requiredSkills: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Redis'],
    preferredSkills: ['Go', 'Kafka', 'Elasticsearch', 'Microservices'],
    responsibilities: [
      'Develop and maintain RESTful APIs',
      'Optimize database performance and queries',
      'Implement caching and messaging systems',
      'Work with microservices architecture',
      'Monitor and debug production systems'
    ],
    qualifications: [
      '3+ years of backend development experience',
      'Strong knowledge of Node.js ecosystem',
      'Experience with database design and optimization',
      'Understanding of distributed systems',
      'Experience with high-traffic applications'
    ],
    benefits: ['Health Insurance', 'Stock Options', 'Grab Credits'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'QA Engineer',
    company: 'UnionBank of the Philippines',
    department: 'Engineering',
    location: {
      city: 'Pasig',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 50000,
      max: 75000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Ensure the quality of our digital banking applications through comprehensive testing strategies and automation.',
    requiredSkills: ['Selenium', 'Java', 'TestNG', 'Cucumber', 'API Testing'],
    preferredSkills: ['Cypress', 'Postman', 'JMeter', 'Jenkins'],
    responsibilities: [
      'Design and execute test plans and test cases',
      'Develop and maintain automated test scripts',
      'Perform functional, regression, and performance testing',
      'Collaborate with development teams on bug fixes',
      'Ensure compliance with banking regulations'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '2+ years of QA testing experience',
      'Experience with test automation tools',
      'Knowledge of banking/financial systems',
      'Strong attention to detail'
    ],
    benefits: ['Health Insurance', 'Banking Benefits', 'Training Programs'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  },
  {
    title: 'Cybersecurity Specialist',
    company: 'Metrobank',
    department: 'Engineering',
    location: {
      city: 'Makati',
      state: 'Metro Manila',
      country: 'Philippines'
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 85000,
      max: 125000,
      currency: 'PHP',
      period: 'monthly'
    },
    description: 'Protect our banking systems and customer data from cyber threats. Implement security measures and respond to incidents.',
    requiredSkills: ['Network Security', 'Penetration Testing', 'SIEM', 'Incident Response', 'Risk Assessment'],
    preferredSkills: ['CISSP', 'CEH', 'Splunk', 'Nessus', 'Burp Suite'],
    responsibilities: [
      'Monitor security events and incidents',
      'Conduct vulnerability assessments',
      'Implement security policies and procedures',
      'Respond to security breaches',
      'Provide security training to staff'
    ],
    qualifications: [
      'Bachelor\'s degree in Cybersecurity or related field',
      '4+ years of cybersecurity experience',
      'Security certifications preferred',
      'Experience in banking/financial sector',
      'Strong analytical and problem-solving skills'
    ],
    benefits: ['Health Insurance', 'Security Clearance', 'Certification Support'],
    status: 'active',
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    postedBy: posterId
  }
];

const seedJobs = async () => {
  try {
    await connectDB();
    
    // Find or create a user to post jobs
    console.log('Finding or creating job poster...');
    const posterId = await findOrCreateUser();
    
    // Create sample jobs with the poster ID
    const sampleJobs = createSampleJobs(posterId);
    
    // Get count of existing jobs
    const existingJobsCount = await Job.countDocuments({});
    console.log(`Found ${existingJobsCount} existing jobs in database`);
    
    // Insert new jobs one by one to trigger pre-save middleware
    console.log('Adding new sample jobs...');
    const insertedJobs = [];
    for (const jobData of sampleJobs) {
      // Check if job with same title and company already exists
      const existingJob = await Job.findOne({ 
        title: jobData.title, 
        company: jobData.company 
      });
      
      if (!existingJob) {
        const job = new Job(jobData);
        const savedJob = await job.save();
        insertedJobs.push(savedJob);
      } else {
        console.log(`Skipping duplicate job: ${jobData.title} at ${jobData.company}`);
      }
    }
    
    console.log(`Successfully seeded ${insertedJobs.length} jobs:`);
    insertedJobs.forEach(job => {
      console.log(`- ${job.title} at ${job.company} (${job.location.city})`);
    });
    
    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error seeding jobs:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed script
seedJobs();
