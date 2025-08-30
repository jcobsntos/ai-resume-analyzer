// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'recruiter' | 'candidate';
  phone?: string;
  profilePicture?: string;
  company?: string;
  department?: string;
  profileCompletion: number;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  // Optional profile fields that some UI uses
  location?: string;
  currentPosition?: string;
  experience?: number;
  skills?: string[];
  resume?: Resume;
}

export interface Resume {
  filename: string;
  originalName: string;
  path: string;
  uploadDate: string;
  size: number;
  extractedText: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  current: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
}

// Job types
export interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: JobLocation;
  department: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salary?: JobSalary;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  status: 'draft' | 'active' | 'paused' | 'closed' | 'filled';
  applicationDeadline?: string;
  postedBy: User;
  viewCount: number;
  applicationCount: number;
  slug: string;
  tags: string[];
  featured: boolean;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
  fullLocation?: string;
  salaryRange?: string;
}

export interface JobLocation {
  city: string;
  state: string;
  country: string;
  remote: boolean;
  hybrid: boolean;
}

export interface JobSalary {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
}

// Application types
export interface Application {
  _id: string;
  job: Job | string;
  candidate: User;
  status: 'pending' | 'reviewing' | 'interviewing' | 'hired' | 'rejected' | 'withdrawn';
  aiAnalysis?: AIAnalysis;
  coverLetter?: string;
  resumeAtApplication?: Resume;
  questionsResponses?: QuestionResponse[];
  interviews?: Interview[];
  statusHistory?: StatusHistoryItem[];
  recruiterNotes?: RecruiterNote[];
  communications?: Communication[];
  offer?: Offer;
  source?: string;
  referredBy?: User;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  applicationAge?: number;
  currentInterview?: Interview;
  lastStatusUpdate?: StatusHistoryItem;
}

export interface AIAnalysis {
  overallScore: number;
  skillsMatch: SkillsMatch;
  experienceMatch: ExperienceMatch;
  educationMatch: EducationMatch;
  semanticSimilarity: SemanticSimilarity;
  insights: AIInsights;
  analysisDate: string;
  processingTime: number;
  modelVersion: string;
}

export interface SkillsMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  details: {
    requiredMatched: number;
    requiredTotal: number;
    preferredMatched: number;
    preferredTotal: number;
  };
}

export interface ExperienceMatch {
  score: number;
  estimatedYears: number;
  seniorityIndicators: number;
  experienceGap: string;
  relevantExperience: RelevantExperience[];
}

export interface RelevantExperience {
  company: string;
  position: string;
  relevanceScore: number;
  matchingKeywords: string[];
}

export interface EducationMatch {
  score: number;
  educationLevel: string;
  relevantField: string;
  relevantEducation: RelevantEducation[];
}

export interface RelevantEducation {
  institution: string;
  degree: string;
  field: string;
  relevanceScore: number;
}

export interface SemanticSimilarity {
  score: number;
  similarityMetrics: {
    resumeJobDescription: number;
    skillsAlignment: number;
    industryRelevance: number;
  };
}

export interface AIInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  interviewQuestions: string[];
  // Extended optional fields from backend (graceful if absent)
  missingSkills?: string[];
  keywordSuggestions?: string[];
  recommendedRoles?: string[];
  learningPaths?: { title: string; url: string }[];
  summary?: string;
  careerLevelFit?: string;
  boostScoreActions?: { action: string; impact: number }[];
}

export interface QuestionResponse {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'yes-no' | 'rating';
}

export interface Interview {
  _id: string;
  type: 'phone' | 'video' | 'in-person' | 'technical';
  scheduledDate: string;
  duration: number;
  interviewer: User;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  rating?: number;
  feedback?: string;
}

export interface StatusHistoryItem {
  status: string;
  date: string;
  updatedBy: User;
  notes?: string;
}

export interface RecruiterNote {
  _id: string;
  note: string;
  addedBy: User;
  addedAt: string;
  isPrivate: boolean;
}

export interface Communication {
  _id: string;
  type: 'email' | 'phone' | 'message' | 'meeting';
  subject?: string;
  content: string;
  sentBy: User;
  sentAt: string;
  direction: 'inbound' | 'outbound';
}

export interface Offer {
  salary: {
    amount: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  benefits: string[];
  startDate: string;
  offerDate: string;
  expiryDate: string;
  accepted?: boolean;
  acceptedDate?: string;
  declinedReason?: string;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  token?: string; // some endpoints include token at top-level
  data?: T;
  results?: number;
  pagination?: Pagination;
  errors?: ValidationError[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  totalUsers?: number;
  totalJobs?: number;
  totalApplications?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Analytics types
export interface DashboardAnalytics {
  overview: OverviewStats;
  trends: TrendData;
  topMetrics: TopMetrics;
  charts: ChartData;
}

export interface OverviewStats {
  totalUsers?: number;
  totalCandidates?: number;
  totalRecruiters?: number;
  totalJobs?: number;
  myJobs?: number;
  activeJobs: number;
  totalApplications: number;
  avgMatchScore: number;
}

export interface TrendData {
  applicationsByDay: TrendPoint[];
  jobsByDay: TrendPoint[];
}

export interface TrendPoint {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  count: number;
  avgScore?: number;
}

export interface TopMetrics {
  topSkills: SkillMetric[];
  topCompanies: CompanyMetric[];
  applicationsByStatus: StatusMetric[];
}

export interface SkillMetric {
  _id: string;
  count: number;
  avgScore: number;
}

export interface CompanyMetric {
  _id: string;
  jobCount: number;
  totalApplications: number;
  avgViews: number;
}

export interface StatusMetric {
  _id: string;
  count: number;
  avgScore: number;
}

export interface ChartData {
  scoreDistribution: ScoreDistribution[];
  departmentBreakdown: DepartmentMetric[];
  experienceLevelBreakdown: ExperienceLevelMetric[];
}

export interface ScoreDistribution {
  _id: number;
  count: number;
  avgScore: number;
}

export interface DepartmentMetric {
  _id: string;
  jobCount: number;
  totalApplications: number;
}

export interface ExperienceLevelMetric {
  _id: string;
  jobCount: number;
  totalApplications: number;
  avgApplicationsPerJob: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'candidate' | 'recruiter';
  company?: string;
  department?: string;
  phone?: string;
}

export interface JobFormData {
  title: string;
  description: string;
  company?: string;
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
    hybrid: boolean;
  };
  department: string;
  jobType: string;
  experienceLevel: string;
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
  };
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  applicationDeadline?: string;
  featured: boolean;
  urgent: boolean;
}

export interface ApplicationFormData {
  jobId: string;
  coverLetter?: string;
  questionsResponses?: QuestionResponse[];
}

// Filter and search types
export interface JobFilters {
  search?: string;
  department?: string;
  jobType?: string;
  experienceLevel?: string;
  location?: string;
  remote?: boolean;
  minSalary?: number;
  maxSalary?: number;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  company?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  employmentType?: string;
}

export interface ApplicationFilters {
  status?: string;
  jobId?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  aiScoreMin?: number;
  aiScoreMax?: number;
}

// Paginated Response
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Application Status Type
export type ApplicationStatus = 'pending' | 'reviewing' | 'interviewing' | 'hired' | 'rejected' | 'withdrawn';

// User Role Type
export type UserRole = 'admin' | 'recruiter' | 'candidate';

// Analytics Types
export interface RecruitmentFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface TopCandidatesData {
  candidate: User;
  score: number;
  applications: number;
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}
