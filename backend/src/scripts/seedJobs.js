const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
require('dotenv').config();

const sampleJobs = [
  {
    title: 'Senior Full Stack Developer',
    description: 'We are looking for a Senior Full Stack Developer to join our team in Manila. You will be responsible for developing and maintaining web applications using React, Node.js, and MongoDB. Experience with cloud platforms and modern development practices is essential.',
    company: 'TechStart Philippines',
    location: {
      city: 'Makati',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 80000,
      max: 120000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript', 'Express.js'],
    preferredSkills: ['AWS', 'Docker', 'GraphQL', 'Redis'],
    responsibilities: [
      'Develop and maintain full-stack web applications',
      'Collaborate with cross-functional teams to define and implement features',
      'Write clean, maintainable, and efficient code',
      'Mentor junior developers and conduct code reviews',
      'Participate in system design and architecture decisions'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '5+ years of experience in full-stack development',
      'Strong proficiency in React and Node.js',
      'Experience with NoSQL databases',
      'Excellent English communication skills'
    ],
    benefits: ['HMO', '13th month pay', 'Performance bonus', 'Flexible working hours', 'Professional development budget'],
    status: 'active'
  },
  {
    title: 'Frontend Developer (React)',
    description: 'Join our growing team as a Frontend Developer specializing in React. You will work on exciting e-commerce projects and help build user-friendly interfaces for our customers. Perfect opportunity for someone looking to grow in a fast-paced environment.',
    company: 'Shopee Philippines',
    location: {
      city: 'Taguig',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 55000,
      max: 85000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Redux', 'Webpack'],
    preferredSkills: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Jest'],
    responsibilities: [
      'Develop responsive web applications using React',
      'Implement pixel-perfect UI designs',
      'Optimize applications for maximum speed and scalability',
      'Collaborate with UX/UI designers and backend developers',
      'Write unit and integration tests'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or equivalent experience',
      '3+ years of React development experience',
      'Strong understanding of modern JavaScript',
      'Experience with state management libraries',
      'Good English communication skills'
    ],
    benefits: ['HMO with dependents', '13th month pay', 'Annual performance bonus', 'Learning and development stipend'],
    status: 'active'
  },
  {
    title: 'Backend Developer - Python',
    description: 'We are seeking a skilled Backend Developer with expertise in Python and Django. You will be working on fintech applications that serve millions of users across Southeast Asia. This is a great opportunity to work with cutting-edge technology in the financial sector.',
    company: 'GCash (Globe Fintech)',
    location: {
      city: 'Bonifacio Global City',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 70000,
      max: 100000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'Redis', 'Celery'],
    preferredSkills: ['AWS', 'Docker', 'Kubernetes', 'Microservices', 'GraphQL'],
    responsibilities: [
      'Design and implement scalable backend systems',
      'Develop and maintain RESTful APIs',
      'Optimize database queries and improve performance',
      'Implement security best practices for financial applications',
      'Work closely with mobile app developers and frontend teams'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '3-5 years of Python development experience',
      'Strong experience with Django framework',
      'Knowledge of database design and optimization',
      'Experience in fintech or banking is a plus'
    ],
    benefits: ['Comprehensive HMO', '13th month pay', 'Variable pay', 'Stock options', 'Free meals'],
    status: 'active'
  },
  {
    title: 'DevOps Engineer',
    description: 'Join our DevOps team and help us scale our infrastructure to support millions of users. You will work with modern cloud technologies and automation tools to ensure reliable and efficient deployment processes.',
    company: 'Grab Philippines',
    location: {
      city: 'Mandaluyong',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: true,
      hybrid: false
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 90000,
      max: 140000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'Linux'],
    preferredSkills: ['Helm', 'Prometheus', 'Grafana', 'ELK Stack', 'Ansible'],
    responsibilities: [
      'Design and maintain cloud infrastructure on AWS',
      'Implement CI/CD pipelines for multiple services',
      'Monitor system performance and troubleshoot issues',
      'Automate deployment and scaling processes',
      'Ensure security compliance and best practices'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '4+ years of DevOps or Infrastructure experience',
      'Strong experience with AWS services',
      'Proficiency in containerization and orchestration',
      'Excellent problem-solving and communication skills'
    ],
    benefits: ['Premium HMO', '13th month pay', 'Performance bonus', 'Remote work allowance', 'Learning budget'],
    status: 'active'
  },
  {
    title: 'Mobile App Developer (Flutter)',
    description: 'We are looking for a talented Mobile App Developer to join our team. You will be responsible for developing cross-platform mobile applications using Flutter. This role offers the opportunity to work on innovative projects that impact millions of users.',
    company: 'PayMaya Philippines',
    location: {
      city: 'Ortigas',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 60000,
      max: 90000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Flutter', 'Dart', 'iOS', 'Android', 'REST API', 'Git'],
    preferredSkills: ['Firebase', 'Redux', 'Native iOS/Android', 'GraphQL'],
    responsibilities: [
      'Develop and maintain cross-platform mobile applications',
      'Collaborate with design team to implement UI/UX requirements',
      'Integrate mobile apps with backend APIs',
      'Optimize app performance and user experience',
      'Participate in code reviews and testing processes'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '2-4 years of mobile development experience',
      'Strong proficiency in Flutter and Dart',
      'Experience with mobile app deployment processes',
      'Understanding of mobile security best practices'
    ],
    benefits: ['HMO coverage', '13th month pay', 'Quarterly bonus', 'Flexible work arrangements'],
    status: 'active'
  },
  {
    title: 'Data Analyst',
    description: 'Join our data team and help drive business decisions through data analysis and insights. You will work with large datasets and create reports that guide strategic initiatives across the organization.',
    company: 'Lazada Philippines',
    location: {
      city: 'Alabang',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Data Science',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 50000,
      max: 75000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics', 'Data Visualization'],
    preferredSkills: ['R', 'Power BI', 'AWS', 'Machine Learning', 'ETL'],
    responsibilities: [
      'Analyze large datasets to identify trends and patterns',
      'Create comprehensive reports and dashboards',
      'Collaborate with stakeholders to understand business requirements',
      'Develop and maintain data pipelines',
      'Present findings to management and cross-functional teams'
    ],
    qualifications: [
      'Bachelor\'s degree in Statistics, Mathematics, or related field',
      '2-4 years of data analysis experience',
      'Strong proficiency in SQL and Python',
      'Experience with data visualization tools',
      'Excellent analytical and communication skills'
    ],
    benefits: ['HMO', '13th month pay', 'Performance incentives', 'Training and certification support'],
    status: 'active'
  },
  {
    title: 'Junior Software Developer',
    description: 'Perfect opportunity for fresh graduates or junior developers to kickstart their career in software development. You will work with experienced developers and learn modern web technologies while contributing to real projects.',
    company: 'Accenture Philippines',
    location: {
      city: 'Quezon City',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: false
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: {
      min: 25000,
      max: 40000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Java', 'JavaScript', 'HTML', 'CSS', 'SQL', 'Git'],
    preferredSkills: ['React', 'Spring Boot', 'Angular', 'Node.js'],
    responsibilities: [
      'Assist in developing web applications under supervision',
      'Write clean and maintainable code',
      'Participate in code reviews and team meetings',
      'Learn new technologies and development practices',
      'Support testing and debugging activities'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science, IT, or related field',
      '0-2 years of programming experience',
      'Basic understanding of web development technologies',
      'Strong willingness to learn and grow',
      'Good English communication skills'
    ],
    benefits: ['HMO', '13th month pay', 'Training programs', 'Career development opportunities'],
    status: 'active'
  },
  {
    title: 'UI/UX Designer',
    description: 'We are seeking a creative UI/UX Designer to join our design team. You will be responsible for creating intuitive and visually appealing user interfaces for web and mobile applications.',
    company: 'Kumu Media Technologies',
    location: {
      city: 'Pasig',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Design',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 45000,
      max: 70000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping', 'User Research', 'Wireframing'],
    preferredSkills: ['InVision', 'Principle', 'After Effects', 'HTML/CSS basics'],
    responsibilities: [
      'Create user-centered designs for web and mobile applications',
      'Conduct user research and usability testing',
      'Develop wireframes, prototypes, and high-fidelity mockups',
      'Collaborate with developers to implement designs',
      'Maintain and evolve design systems and guidelines'
    ],
    qualifications: [
      'Bachelor\'s degree in Design, HCI, or related field',
      '2-4 years of UI/UX design experience',
      'Strong portfolio showcasing design skills',
      'Proficiency in design tools like Figma or Sketch',
      'Understanding of user-centered design principles'
    ],
    benefits: ['HMO', '13th month pay', 'Creative tools allowance', 'Flexible work schedule'],
    status: 'active'
  },
  {
    title: 'QA Engineer (Manual & Automation)',
    description: 'Join our quality assurance team and help ensure the highest quality of our software products. You will be responsible for both manual testing and test automation development.',
    company: 'Voyager Innovations',
    location: {
      city: 'Makati',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Engineering',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 50000,
      max: 75000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Manual Testing', 'Test Automation', 'Selenium', 'Java', 'API Testing', 'JIRA'],
    preferredSkills: ['TestNG', 'Maven', 'Jenkins', 'Postman', 'Mobile Testing'],
    responsibilities: [
      'Design and execute manual test cases',
      'Develop and maintain automated test scripts',
      'Perform API and database testing',
      'Identify, document, and track software defects',
      'Collaborate with development teams on quality improvements'
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or related field',
      '2-4 years of QA testing experience',
      'Experience with test automation tools',
      'Strong analytical and problem-solving skills',
      'Knowledge of testing methodologies and processes'
    ],
    benefits: ['HMO with dependents', '13th month pay', 'Performance bonus', 'Professional certification support'],
    status: 'active'
  },
  {
    title: 'Product Manager',
    description: 'Lead product development initiatives and work with cross-functional teams to deliver innovative solutions. This role requires strong technical understanding and business acumen.',
    company: 'Coins.ph',
    location: {
      city: 'BGC',
      state: 'Metro Manila',
      country: 'Philippines',
      remote: false,
      hybrid: true
    },
    department: 'Product',
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 100000,
      max: 150000,
      currency: 'PHP',
      period: 'monthly'
    },
    requiredSkills: ['Product Management', 'Agile', 'User Research', 'Data Analysis', 'Wireframing', 'SQL'],
    preferredSkills: ['Fintech experience', 'A/B Testing', 'Analytics tools', 'Technical background'],
    responsibilities: [
      'Define product strategy and roadmap',
      'Work with engineering teams to deliver features',
      'Conduct market research and competitive analysis',
      'Analyze user behavior and product metrics',
      'Collaborate with stakeholders across the organization'
    ],
    qualifications: [
      'Bachelor\'s degree in Business, Engineering, or related field',
      '4+ years of product management experience',
      'Strong analytical and strategic thinking skills',
      'Experience in fintech or financial services preferred',
      'Excellent communication and leadership skills'
    ],
    benefits: ['Premium HMO', '13th month pay', 'Stock options', 'Performance bonus', 'Flexible PTO'],
    status: 'active'
  }
];

async function seedJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-ai-analyzer');
    console.log('Connected to MongoDB');

    // Find a user to assign as the job poster (preferably a recruiter or admin)
    let recruiter = await User.findOne({ role: { $in: ['recruiter', 'admin'] } });
    
    if (!recruiter) {
      // Create a default recruiter if none exists
      console.log('No recruiter found, creating default recruiter...');
      recruiter = new User({
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@example.com',
        password: 'hashedpassword123', // This should be properly hashed in real scenario
        role: 'recruiter',
        company: 'Tech Companies Philippines',
        isEmailVerified: true
      });
      await recruiter.save();
      console.log('Default recruiter created');
    }

    // Clear existing jobs (optional - comment out if you want to keep existing jobs)
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Add postedBy field to each job
    const jobsWithPoster = sampleJobs.map(job => ({
      ...job,
      postedBy: recruiter._id
    }));

    // Insert sample jobs one by one to avoid slug conflicts
    const insertedJobs = [];
    for (const jobData of jobsWithPoster) {
      try {
        const job = new Job(jobData);
        const savedJob = await job.save();
        insertedJobs.push(savedJob);
        console.log(`✓ Created: ${savedJob.title} at ${savedJob.company}`);
      } catch (error) {
        console.error(`✗ Failed to create job: ${jobData.title} - ${error.message}`);
      }
    }
    console.log(`Successfully inserted ${insertedJobs.length} sample jobs`);

    // Display summary
    console.log('\n=== JOBS SUMMARY ===');
    insertedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company}`);
      console.log(`   Location: ${job.location.city}, ${job.location.state}`);
      console.log(`   Salary: ₱${job.salary.min?.toLocaleString()} - ₱${job.salary.max?.toLocaleString()} per ${job.salary.period}`);
      console.log(`   Experience: ${job.experienceLevel} | Type: ${job.jobType}`);
      console.log('');
    });

    console.log('Job seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
}

// Run the seed function
seedJobs();
