import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useJobStore } from '@/store/jobStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { JobRecommendations } from '@/components/jobs/JobRecommendations';
import { formatDate, formatCurrency } from '@/lib/utils';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { jobs, fetchJobs, isLoading: jobsLoading } = useJobStore();
  const { applications, fetchApplications, stats, fetchStats, isLoading: appsLoading } = useApplicationStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Safe defaults for stats
  const safeStats = stats || {
    total: 0,
    pending: 0,
    reviewing: 0,
    interviewing: 0,
    hired: 0,
    rejected: 0,
  };

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoad(true);
      await Promise.all([
        fetchJobs(1, { isActive: true }),
        fetchApplications(),
        fetchStats(true),
      ]);
      setIsInitialLoad(false);
    };

    loadData();
  }, [fetchJobs, fetchApplications, fetchStats]);

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewing': 'bg-blue-100 text-blue-800',
      'interviewing': 'bg-purple-100 text-purple-800',
      'hired': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'reviewing':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'interviewing':
        return <UserIcon className="h-4 w-4" />;
      case 'hired':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const profileCompletionPercentage = user?.profileCompletion || 0;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your applications and discover new opportunities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{safeStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{safeStats.pending + safeStats.reviewing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{safeStats.interviewing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-2xl font-bold text-gray-900">{safeStats.hired}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Applications & Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Completion */}
            {profileCompletionPercentage < 100 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
                    <p className="text-sm text-gray-600">
                      A complete profile increases your chances of getting hired
                    </p>
                  </div>
                  <SparklesIcon className="h-6 w-6 text-blue-600" />
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Profile Completion</span>
                    <span>{profileCompletionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileCompletionPercentage}%` }}
                    />
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Complete Profile
                  <PlusIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Recent Applications */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                  <Link
                    to="/applications"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View All
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {appsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                    <p className="text-gray-600 mb-4">Start applying to jobs to track your progress here.</p>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Browse Jobs
                      <BriefcaseIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((application) => (
                      <Link key={application._id} to={`/applications/${application._id}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {typeof application.job === 'object' && application.job ? application.job.title : 'Job Not Available'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {typeof application.job === 'object' && application.job ? application.job.company : 'Company Not Available'} • 
                                Applied {formatDate(application.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {application.aiAnalysis && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {Math.round(application.aiAnalysis.overallScore)}% Match
                              </p>
                              <p className="text-xs text-gray-500">AI Score</p>
                            </div>
                          )}
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Recommended Jobs */}
          <div className="space-y-8">
            {/* Recommended Jobs */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended Jobs</h3>
                  <Link
                    to="/jobs"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View All
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {jobsLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h4>
                    <p className="text-gray-600">Check back later for new opportunities.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const appliedSet = new Set(
                        applications.map((a) => (typeof a.job === 'object' ? (a.job as any)._id : a.job))
                      );
                      return jobs.slice(0, 3).map((job) => (
                        <div key={job._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="mb-3">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                            <p className="text-sm text-gray-600">{job.company}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">📍 {job.location?.city}, {job.location?.state}</span>
                              {job.location?.remote && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  Remote
                                </span>
                              )}
                            </div>
                            
                            {job.salary && (
                              <div className="text-sm text-gray-600">
                                💰 {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.requiredSkills?.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.requiredSkills?.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                  +{job.requiredSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Posted {formatDate(job.createdAt)}
                            </span>
                            {appliedSet.has(job._id) ? (
                              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md">
                                Applied
                              </span>
                            ) : (
                              <Link
                                to={`/jobs/${job._id}`}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Apply
                              </Link>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  to="/jobs"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BriefcaseIcon className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">Browse Jobs</div>
                    <div className="text-sm text-gray-500">Find new opportunities</div>
                  </div>
                </Link>
                
                <Link
                  to="/applications"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">My Applications</div>
                    <div className="text-sm text-gray-500">Track your progress</div>
                  </div>
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserIcon className="h-5 w-5 mr-3 text-purple-600" />
                  <div>
                    <div className="font-medium">Update Profile</div>
                    <div className="text-sm text-gray-500">Keep your info current</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Application Status Summary */}
            {applications.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Review</span>
                    <span className="font-medium text-gray-900">{safeStats.pending + safeStats.reviewing}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Interviewing</span>
                    <span className="font-medium text-purple-600">{safeStats.interviewing}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Offers/Hired</span>
                    <span className="font-medium text-green-600">{safeStats.hired}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Job Recommendations */}
        <div className="mt-8">
          <JobRecommendations limit={6} showHeader={true} />
        </div>

        {/* Recent Activity */}
        {applications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {applications.slice(0, 5).map((application, index) => (
                    <li key={application._id}>
                      <div className="relative pb-8">
                        {index !== applications.slice(0, 5).length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">
                                  Applied to {typeof application.job === 'object' ? application.job.title : 'Job'}
                                </span>
                                <span className="text-gray-500"> at </span>
                                <span className="font-medium text-gray-900">
                                  {typeof application.job === 'object' ? application.job.company : 'Company'}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                Status: <span className="capitalize font-medium">{application.status}</span>
                                {application.aiAnalysis && (
                                  <span> • AI Match: {Math.round(application.aiAnalysis.overallScore)}%</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              {formatDate(application.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
