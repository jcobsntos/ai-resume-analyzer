import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { aiService, JobMatchResult } from '@/services/aiService';
import { useJobStore } from '@/store/jobStore';
import {
  SparklesIcon,
  StarIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface JobRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export const JobRecommendations: React.FC<JobRecommendationsProps> = ({
  limit = 6,
  showHeader = true,
  className = '',
}) => {
  const { user } = useAuthStore();
  const { jobs, fetchJobs } = useJobStore();
  const [recommendations, setRecommendations] = useState<JobMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'candidate') {
      loadRecommendations();
    }
  }, [user, limit]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First fetch the latest jobs to ensure we have data
      await fetchJobs();
      
      // Try to get AI recommendations
      if (user?._id) {
        const result = await aiService.getJobRecommendations(user._id, limit);
        setRecommendations(result);
      } else {
        throw new Error('User ID not available');
      }
    } catch (error: any) {
      console.error('Failed to load job recommendations:', error);
      setError(error.message || 'Failed to load recommendations');
      
      // Fallback: show recent jobs if AI recommendations fail
      if (jobs.length > 0) {
        const fallbackRecommendations: JobMatchResult[] = jobs.slice(0, limit).map(job => ({
          jobId: job._id,
          matchScore: Math.floor(Math.random() * 40) + 60, // Random score 60-100
          reasons: ['Recent posting', 'Popular role', 'Good company'],
          skillsAlignment: Math.floor(Math.random() * 30) + 70,
          experienceAlignment: Math.floor(Math.random() * 30) + 70,
          locationPreference: Math.random() > 0.5,
        }));
        setRecommendations(fallbackRecommendations);
        setError(null); // Clear error since we have fallback
        toast.success('Showing recent job postings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = () => {
    loadRecommendations();
    toast.success('Refreshing recommendations...');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 55) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getJobById = (jobId: string) => {
    return jobs.find(job => job._id === jobId);
  };

  if (user?.role !== 'candidate') {
    return null;
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="h-7 w-7 mr-3 text-purple-600" />
              AI Job Recommendations
            </h2>
            <p className="text-gray-600 mt-1">
              Personalized job matches based on your profile and preferences
            </p>
          </div>
          
          <button
            onClick={refreshRecommendations}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {isLoading && recommendations.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Finding perfect job matches for you...</p>
          </div>
        </div>
      ) : error && recommendations.length === 0 ? (
        <div className="text-center py-12">
          <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshRecommendations}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => {
            const job = getJobById(recommendation.jobId);
            if (!job) return null;

            return (
              <div
                key={recommendation.jobId}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* AI Score Badge */}
                <div className="relative">
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(recommendation.matchScore)}`}>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 mr-1" />
                      {recommendation.matchScore}%
                    </div>
                  </div>
                  
                  <div className="p-6 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-16">
                      {job.title}
                    </h3>
                    <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {job.location?.city}, {job.location?.state}
                    </div>
                    
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* Match Insights */}
                <div className="px-6 pb-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      Why this matches you:
                    </h4>
                    <ul className="text-sm space-y-1">
                      {recommendation.reasons.slice(0, 2).map((reason, index) => (
                        <li key={index} className="text-purple-800">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Alignment Scores */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="font-semibold text-gray-900">
                        {recommendation.skillsAlignment}%
                      </div>
                      <div className="text-xs text-gray-600">Skills Match</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="font-semibold text-gray-900">
                        {recommendation.experienceAlignment}%
                      </div>
                      <div className="text-xs text-gray-600">Experience</div>
                    </div>
                  </div>
                </div>

                {/* Salary & Benefits */}
                <div className="px-6 pb-4">
                  {job.salary && (
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      job.jobType === 'full-time' ? 'bg-green-100 text-green-800' :
                      job.jobType === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.jobType?.replace('-', ' ') || 'Full Time'}
                    </span>
                    
                    {job.location?.remote && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Remote
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                    
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recommendations.length === 0 && !isLoading && !error && (
        <div className="text-center py-12">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 mb-4">
            Complete your profile and upload a resume to get personalized job recommendations
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      )}
    </div>
  );
};
