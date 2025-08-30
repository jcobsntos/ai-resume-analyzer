const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['candidate', 'recruiter', 'admin'],
      message: 'Role must be either candidate, recruiter, or admin'
    },
    default: 'candidate'
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Candidate-specific fields
  resume: {
    filename: String,
    originalName: String,
    path: String,
    uploadDate: Date,
    size: Number,
    extractedText: String,
    skills: [String],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String,
      current: Boolean
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number
    }]
  },
  
  // Recruiter-specific fields
  company: {
    type: String,
    required: function() { return this.role === 'recruiter'; }
  },
  department: {
    type: String,
    required: function() { return this.role === 'recruiter'; }
  },
  
  // Profile completion tracking
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for better query performance (email index created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ 'resume.skills': 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Pre-save middleware to update password changed timestamp
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to calculate profile completion
userSchema.methods.calculateProfileCompletion = function() {
  let completion = 0;
  const totalFields = this.role === 'candidate' ? 10 : 8;
  
  // Basic fields (common for all roles)
  if (this.firstName) completion += 1;
  if (this.lastName) completion += 1;
  if (this.email) completion += 1;
  if (this.phone) completion += 1;
  if (this.profilePicture) completion += 1;
  
  if (this.role === 'candidate') {
    const hasResume = this.resume && this.resume.filename;
    const hasExtracted = !!(this.resume && this.resume.extractedText && this.resume.extractedText.length > 0);
    if (hasResume) completion += 2;
    if (this.resume && Array.isArray(this.resume.skills) && this.resume.skills.length > 0) completion += 1;
    // Be forgiving: if we have extracted text from resume, give credit for experience/education
    if ((this.resume && Array.isArray(this.resume.experience) && this.resume.experience.length > 0) || hasExtracted) completion += 1;
    if ((this.resume && Array.isArray(this.resume.education) && this.resume.education.length > 0) || hasExtracted) completion += 1;
  } else if (this.role === 'recruiter') {
    if (this.company) completion += 1.5;
    if (this.department) completion += 1.5;
  }
  
  this.profileCompletion = Math.round((completion / totalFields) * 100);
  return this.profileCompletion;
};

// Static method to get user stats
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('User', userSchema);
