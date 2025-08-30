const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: [true, 'Application must be associated with a job'],
    index: true
  },
  
  candidate: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Application must be associated with a candidate'],
    index: true
  },
  
  status: {
    type: String,
    enum: {
      values: ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
      message: 'Status must be a valid application status'
    },
    default: 'applied',
    index: true
  },
  
  // AI Analysis Results
  aiAnalysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'Overall AI score is required']
    },
    
    skillsMatch: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      matchedSkills: [String],
      missingSkills: [String],
      additionalSkills: [String]
    },
    
    experienceMatch: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      relevantExperience: [{
        company: String,
        position: String,
        relevanceScore: Number,
        matchingKeywords: [String]
      }],
      experienceGap: String
    },
    
    educationMatch: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      relevantEducation: [{
        institution: String,
        degree: String,
        field: String,
        relevanceScore: Number
      }]
    },
    
    semanticSimilarity: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      similarityMetrics: {
        resumeJobDescription: Number,
        skillsAlignment: Number,
        industryRelevance: Number
      }
    },
    
    // AI-generated insights and recommendations
    insights: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      interviewQuestions: [String]
    },
    
    // Processing metadata
    analysisDate: {
      type: Date,
      default: Date.now
    },
    
    processingTime: {
      type: Number, // in milliseconds
    },
    
    modelVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // Application-specific data
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  
  resumeAtApplication: {
    filename: String,
    originalName: String,
    path: String,
    extractedText: String,
    skills: [String],
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional candidate responses
  questionsResponses: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'multiple-choice', 'yes-no', 'rating'],
      default: 'text'
    }
  }],
  
  // Interview scheduling
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical'],
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    interviewer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }],
  
  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Recruiter notes and feedback
  recruiterNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Communication log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'message', 'meeting'],
      required: true
    },
    subject: String,
    content: String,
    sentBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    }
  }],
  
  // Offer details (if applicable)
  offer: {
    salary: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly'
      }
    },
    benefits: [String],
    startDate: Date,
    offerDate: Date,
    expiryDate: Date,
    accepted: Boolean,
    acceptedDate: Date,
    declinedReason: String
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['direct', 'linkedin', 'indeed', 'glassdoor', 'referral', 'other'],
    default: 'direct'
  },
  
  referredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  tags: [String],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ 'aiAnalysis.overallScore': -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Virtual for application age in days
applicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for current interview
applicationSchema.virtual('currentInterview').get(function() {
  if (!this.interviews || this.interviews.length === 0) return null;
  
  const upcoming = this.interviews
    .filter(interview => interview.status === 'scheduled' && interview.scheduledDate > new Date())
    .sort((a, b) => a.scheduledDate - b.scheduledDate);
    
  return upcoming.length > 0 ? upcoming[0] : null;
});

// Virtual for latest status update
applicationSchema.virtual('lastStatusUpdate').get(function() {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    return {
      status: this.status,
      date: this.createdAt,
      updatedBy: null
    };
  }
  
  return this.statusHistory[this.statusHistory.length - 1];
});

// Pre-save middleware to update status history
applicationSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      updatedBy: this.updatedBy || null // This should be set by the controller
    });
  }
  next();
});

// Pre-save middleware to calculate priority based on AI score
applicationSchema.pre('save', function(next) {
  if (this.isModified('aiAnalysis.overallScore') || this.isNew) {
    const score = this.aiAnalysis?.overallScore || 0;
    
    if (score >= 85) {
      this.priority = 'urgent';
    } else if (score >= 70) {
      this.priority = 'high';
    } else if (score >= 50) {
      this.priority = 'normal';
    } else {
      this.priority = 'low';
    }
  }
  next();
});

// Instance method to update status with history tracking
applicationSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    date: new Date(),
    updatedBy: updatedBy,
    notes: notes || null
  });
  return this.save();
};

// Instance method to add recruiter note
applicationSchema.methods.addRecruiterNote = function(note, addedBy, isPrivate = false) {
  this.recruiterNotes.push({
    note,
    addedBy,
    isPrivate,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interviews.push({
    ...interviewData,
    status: 'scheduled'
  });
  return this.save();
};

// Instance method to check if candidate is suitable
applicationSchema.methods.isSuitable = function(threshold = 60) {
  return this.aiAnalysis?.overallScore >= threshold;
};

// Instance method to get match summary
applicationSchema.methods.getMatchSummary = function() {
  if (!this.aiAnalysis) return null;
  
  return {
    overallScore: this.aiAnalysis.overallScore,
    skillsScore: this.aiAnalysis.skillsMatch?.score || 0,
    experienceScore: this.aiAnalysis.experienceMatch?.score || 0,
    educationScore: this.aiAnalysis.educationMatch?.score || 0,
    semanticScore: this.aiAnalysis.semanticSimilarity?.score || 0,
    strengths: this.aiAnalysis.insights?.strengths || [],
    recommendations: this.aiAnalysis.insights?.recommendations || []
  };
};

// Static method to get application statistics
applicationSchema.statics.getApplicationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);
  
  const totalApplications = await this.countDocuments();
  const averageScore = await this.aggregate([
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    total: totalApplications,
    averageScore: averageScore[0]?.avgScore || 0
  };
};

// Static method to find similar applications
applicationSchema.statics.findSimilarApplications = function(applicationId, limit = 5) {
  return this.aggregate([
    { $match: { _id: { $ne: mongoose.Types.ObjectId(applicationId) } } },
    {
      $addFields: {
        scoreDiff: {
          $abs: {
            $subtract: ['$aiAnalysis.overallScore', '$$application.aiAnalysis.overallScore']
          }
        }
      }
    },
    { $sort: { scoreDiff: 1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Application', applicationSchema);
