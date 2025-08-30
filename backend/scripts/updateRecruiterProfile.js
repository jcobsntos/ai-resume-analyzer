const mongoose = require('mongoose');
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

const updateRecruiterProfiles = async () => {
  try {
    await connectDB();
    
    // Find all recruiter users
    const recruiters = await User.find({ role: 'recruiter' });
    console.log(`Found ${recruiters.length} recruiter(s)`);
    
    for (const recruiter of recruiters) {
      console.log(`\nRecruiter: ${recruiter.fullName} (${recruiter.email})`);
      console.log(`Company: ${recruiter.company || 'NOT SET'}`);
      console.log(`Department: ${recruiter.department || 'NOT SET'}`);
      
      // Update recruiter with default company and department if not set
      let updated = false;
      if (!recruiter.company) {
        recruiter.company = 'TechCorp Philippines';
        updated = true;
        console.log('✅ Set default company: TechCorp Philippines');
      }
      
      if (!recruiter.department) {
        recruiter.department = 'Human Resources';
        updated = true;
        console.log('✅ Set default department: Human Resources');
      }
      
      if (updated) {
        await recruiter.save();
        console.log('✅ Profile updated successfully');
      } else {
        console.log('✅ Profile already complete');
      }
    }
    
    mongoose.connection.close();
    console.log('\nUpdate completed. Database connection closed.');
  } catch (error) {
    console.error('Error updating recruiter profiles:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the update script
updateRecruiterProfiles();
