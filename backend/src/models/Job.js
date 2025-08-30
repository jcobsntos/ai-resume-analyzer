const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters'],
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    index: true
  },
  
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Philippines'
    },
    remote: {
      type: Boolean,
      default: false
    },
    hybrid: {
      type: Boolean,
      default: false
    }
  },
  
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    enum: {
      values: [
        'Engineering',
        'Product',
        'Design',
        'Marketing',
        'Sales',
        'Human Resources',
        'Finance',
        'Operations',
        'Customer Success',
        'Data Science',
        'Other'
      ],
      message: 'Department must be a valid option'
    },
    index: true
  },
  
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
      message: 'Job type must be full-time, part-time, contract, internship, or freelance'
    },
    index: true
  },
  
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: {
      values: ['entry', 'mid', 'senior', 'lead', 'executive'],
      message: 'Experience level must be entry, mid, senior, lead, or executive'
    },
    index: true
  },
  
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary must be positive']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary must be positive']
    },
    currency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    period: {
      type: String,
      default: 'monthly',
      enum: ['hourly', 'monthly', 'yearly']
    }
  },
  
  requiredSkills: {
    type: [String],
    required: [true, 'At least one required skill must be specified'],
    validate: {
      validator: function(skills) {
        return skills && skills.length > 0;
      },
      message: 'At least one required skill must be specified'
    }
  },
  
  preferredSkills: {
    type: [String],
    default: []
  },
  
  responsibilities: {
    type: [String],
    required: [true, 'Job responsibilities are required'],
    validate: {
      validator: function(responsibilities) {
        return responsibilities && responsibilities.length > 0;
      },
      message: 'At least one responsibility must be specified'
    }
  },
  
  qualifications: {
    type: [String],
    required: [true, 'Job qualifications are required'],
    validate: {
      validator: function(qualifications) {
        return qualifications && qualifications.length > 0;
      },
      message: 'At least one qualification must be specified'
    }
  },
  
  benefits: {
    type: [String],
    default: []
  },
  
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'paused', 'closed', 'filled'],
      message: 'Status must be draft, active, paused, closed, or filled'
    },
    default: 'active',
    index: true
  },
  
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(deadline) {
        return !deadline || deadline > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Job must be posted by a user']
  },
  
  // Analytics fields
  viewCount: {
    type: Number,
    default: 0
  },
  
  applicationCount: {
    type: Number,
    default: 0
  },
  
  // SEO and search optimization
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  tags: {
    type: [String],
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  urgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save validation for salary range
jobSchema.pre('save', function(next) {
  if (this.salary && this.salary.min !== undefined && this.salary.max !== undefined) {
    if (this.salary.max < this.salary.min) {
      return next(new Error('Maximum salary must be greater than or equal to minimum salary'));
    }
  }
  next();
});

// Virtual for full location string
jobSchema.virtual('fullLocation').get(function() {
  let location = `${this.location.city}, ${this.location.state}`;
  if (this.location.country !== 'Philippines') {
    location += `, ${this.location.country}`;
  }
  if (this.location.remote) {
    location += ' (Remote)';
  } else if (this.location.hybrid) {
    location += ' (Hybrid)';
  }
  return location;
});

// Virtual for salary range string
jobSchema.virtual('salaryRange').get(function() {
  if (!this.salary || (!this.salary.min && !this.salary.max)) {
    return null;
  }
  
  const formatSalary = (amount) => {
    const currency = this.salary.currency || 'PHP';
    const locale = currency === 'PHP' ? 'en-PH' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (this.salary.min && this.salary.max) {
    return `${formatSalary(this.salary.min)} - ${formatSalary(this.salary.max)} per ${this.salary.period}`;
  } else if (this.salary.min) {
    return `From ${formatSalary(this.salary.min)} per ${this.salary.period}`;
  } else {
    return `Up to ${formatSalary(this.salary.max)} per ${this.salary.period}`;
  }
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ department: 1, experienceLevel: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ 'location.city': 1, 'location.state': 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ featured: -1, urgent: -1, createdAt: -1 });

// Pre-save middleware to generate slug
jobSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + 
      '-' + 
      this._id.toString().slice(-6);
  }
  next();
});

// Pre-save middleware to generate tags
jobSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isModified('requiredSkills') || this.isNew) {
    const tags = new Set();
    
    // Add skills as tags
    this.requiredSkills.forEach(skill => {
      tags.add(skill.toLowerCase());
    });
    
    this.preferredSkills.forEach(skill => {
      tags.add(skill.toLowerCase());
    });
    
    // Add job type and experience level as tags
    tags.add(this.jobType);
    tags.add(this.experienceLevel);
    tags.add(this.department.toLowerCase());
    
    this.tags = Array.from(tags);
  }
  next();
});

// Instance method to check if job is expired
jobSchema.methods.isExpired = function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
};

// Instance method to increment view count
jobSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  return await this.save({ validateBeforeSave: false });
};

// Instance method to increment application count
jobSchema.methods.incrementApplications = async function() {
  this.applicationCount += 1;
  return await this.save({ validateBeforeSave: false });
};

// Static method to get job statistics
jobSchema.statics.getJobStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgApplications: { $avg: '$applicationCount' },
        totalViews: { $sum: '$viewCount' }
      }
    }
  ]);
  
  return stats;
};

// Static method to search jobs
jobSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = { ...filters };
  
  if (query) {
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { company: { $regex: query, $options: 'i' } },
      { requiredSkills: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  
  return this.find(searchQuery).populate('postedBy', 'firstName lastName company');
};

module.exports = mongoose.model('Job', jobSchema);
