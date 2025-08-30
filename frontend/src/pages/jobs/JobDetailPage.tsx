import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJobStore } from '@/store/jobStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { applicationsAPI } from '@/services/api';
import aiService, { ResumeAnalysisResult } from '@/services/aiService';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { currentJob, fetchJobById, isLoading } = useJobStore();
  const { applyToJob, isLoading: applying } = useApplicationStore();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobById(id);
      // Check if already applied
      applicationsAPI.getMyApplications({ page: 1, limit: 1, jobId: id as string } as any)
        .then((res) => {
          const apps = res.data.data?.applications || [];
          setAlreadyApplied(apps.length > 0);
        })
        .catch(() => {});
    }
  }, [id, fetchJobById]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }

    if (!id) return;

    if (alreadyApplied) {
      toast.success('You already applied to this job');
      return;
    }

    const success = await applyToJob(id, resumeFile || undefined);
    if (success) {
      setShowApplicationForm(false);
      setResumeFile(null);
      setAlreadyApplied(true);
      toast.success('Application submitted successfully!');
    }
  };

  const runAnalysis = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to analyze fit');
      navigate('/login');
      return;
    }
    if (!id) return;
    setAnalyzing(true);
    try {
      const result = await aiService.analyzeProfileResumeForJob(id);
      setAnalysis(result);
      toast.success('AI analysis complete');
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setResumeFile(file);
    }
  };

  if (isLoading || !currentJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  const getJobTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-yellow-100 text-yellow-800',
      'contract': 'bg-blue-100 text-blue-800',
      'internship': 'bg-purple-100 text-purple-800',
      'freelance': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceLevelColor = (level: string) => {
    const colors = {
      'entry': 'bg-blue-100 text-blue-800',
      'mid': 'bg-green-100 text-green-800',
      'senior': 'bg-purple-100 text-purple-800',
      'lead': 'bg-red-100 text-red-800',
      'executive': 'bg-gray-100 text-gray-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </div>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentJob.title}</h1>
              <div className="flex items-center space-x-4 text-lg">
                <span className="font-semibold text-blue-600">{currentJob.company}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{currentJob.location?.city}, {currentJob.location?.state}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getJobTypeColor(currentJob.jobType)}`}>
                {currentJob.jobType.replace('-', ' ')}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getExperienceLevelColor(currentJob.experienceLevel)}`}>
                {currentJob.experienceLevel} level
              </span>
            </div>
          </div>

          {/* Job Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{currentJob.location?.city}, {currentJob.location?.state}</span>
            </div>
            
            {currentJob.salary && (
              <div className="flex items-center text-gray-600">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                <span>
                  {formatCurrency(currentJob.salary.min)} - {formatCurrency(currentJob.salary.max)}
                </span>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              <span>{currentJob.department}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Posted {formatDate(currentJob.createdAt)}</span>
            </div>
          </div>

          {/* Apply & AI Actions */}
          {isAuthenticated && user?.role === 'candidate' && (
            <div className="flex flex-col items-center gap-4">
              {/* AI Fit Analysis */}
              <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-purple-900">AI Fit Analysis</span>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                  >
                    {analyzing ? (
                      <>
                        <LoadingSpinner size="sm" className="text-white mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Fit'
                    )}
                  </button>
                </div>
                {analysis && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded border">
                      <div className="text-xs text-gray-500">Overall Match</div>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <div className="text-lg font-bold">{analysis.overallScore}%</div>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <div className="text-xs text-gray-500">Skills Match</div>
                      <div className="text-lg font-bold">{analysis.skillMatch.matchPercentage}%</div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <div className="text-xs text-gray-500">Confidence</div>
                      <div className="text-lg font-bold">{analysis.confidence}%</div>
                    </div>
                    <div className="md:col-span-3">
                      {analysis.keyStrengths?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm font-semibold text-green-700">Strengths</div>
                          <ul className="text-sm text-green-800 list-disc ml-5">
                            {analysis.keyStrengths.slice(0,3).map((s,i)=>(<li key={i}>{s}</li>))}
                          </ul>
                        </div>
                      )}
                      {analysis.areasForImprovement?.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-yellow-700">Areas for Improvement</div>
                          <ul className="text-sm text-yellow-800 list-disc ml-5">
                            {analysis.areasForImprovement.slice(0,3).map((s,i)=>(<li key={i}>{s}</li>))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                {!showApplicationForm ? (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    disabled={alreadyApplied}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors flex items-center ${alreadyApplied ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    {alreadyApplied ? 'Applied' : 'Apply for this Job'}
                  </button>
                ) : (
                  <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Application</h3>
                  
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Resume (Optional)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, DOC, DOCX (Max 10MB)
                      </p>
                      {resumeFile && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ {resumeFile.name} selected
                        </p>
                      )}
                    </div>

                    {resumeFile && (
                      <div className="mb-2 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        ✓ Ready to submit
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        {applying ? (
                          <LoadingSpinner size="sm" className="text-white" />
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                      <button
                        onClick={() => setShowApplicationForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-8">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {currentJob.description}
              </p>
            </div>
          </div>

          {/* Responsibilities & Qualifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Responsibilities */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600" />
                Responsibilities
              </h2>
              <ul className="space-y-3">
                {currentJob.responsibilities?.map((responsibility, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AcademicCapIcon className="h-6 w-6 mr-2 text-purple-600" />
                Qualifications
              </h2>
              <ul className="space-y-3">
                {currentJob.qualifications?.map((qualification, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700">{qualification}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-blue-600" />
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {currentJob.requiredSkills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-blue-100 text-blue-800 font-medium rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            {currentJob.preferredSkills && currentJob.preferredSkills.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {currentJob.preferredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Benefits & Additional Info */}
          {currentJob.benefits && currentJob.benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentJob.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About {currentJob.company}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Company</h3>
                <p className="text-gray-700">{currentJob.company}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Department</h3>
                <p className="text-gray-700">{currentJob.department}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-700">
                  {currentJob.location?.city}, {currentJob.location?.state}, {currentJob.location?.country}
                  {currentJob.location?.remote && <span className="text-green-600 ml-2">(Remote)</span>}
                  {currentJob.location?.hybrid && <span className="text-blue-600 ml-2">(Hybrid)</span>}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Employment Type</h3>
                <p className="text-gray-700 capitalize">{currentJob.jobType.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Apply Button for Mobile */}
        {isAuthenticated && user?.role === 'candidate' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
            <button
              onClick={() => setShowApplicationForm(true)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Apply for this Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
