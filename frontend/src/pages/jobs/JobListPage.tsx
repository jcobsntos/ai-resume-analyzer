import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobStore } from '@/store/jobStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  BriefcaseIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import aiService, { JobMatchResult } from '@/services/aiService';
import { formatCurrency, formatDate } from '@/lib/utils';

export const JobListPage: React.FC = () => {
  const { jobs, isLoading, fetchJobs, searchJobs, setFilters, clearFilters, filters } = useJobStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [recommendations, setRecommendations] = useState<Record<string, JobMatchResult>>({});

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const loadRecs = async () => {
      if (user?.role === 'candidate') {
        try {
          const recs = await aiService.getJobRecommendations(user._id, 50);
          const map: Record<string, JobMatchResult> = {};
          recs.forEach(r => { map[r.jobId] = r; });
          setRecommendations(map);
        } catch (e) {
          // silently ignore in list view
        }
      }
    };
    loadRecs();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchJobs(searchQuery);
    } else {
      fetchJobs();
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters({ [filterName]: value });
  };

  const getEmploymentTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-yellow-100 text-yellow-800',
      'contract': 'bg-blue-100 text-blue-800',
      'internship': 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceLevelColor = (level: string) => {
    const colors = {
      'entry': 'bg-blue-100 text-blue-800',
      'mid': 'bg-green-100 text-green-800',
      'senior': 'bg-purple-100 text-purple-800',
      'executive': 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
          <p className="mt-2 text-gray-600">
            Discover opportunities that match your skills and career goals
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  animation="press"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="sm"
                animation="press"
                className="text-gray-600 hover:text-gray-900"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              {Object.values(filters).some(v => v && v !== '') && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  animation="bounce"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filters.department || ''}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Design">Design</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={filters.employmentType || ''}
                    onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={filters.experienceLevel || ''}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link
                        to={`/jobs/${job._id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-gray-600 font-medium">{job.company}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeColor(job.jobType)}`}>
                        {job.jobType.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExperienceLevelColor(job.experienceLevel)}`}>
                        {job.experienceLevel}
                      </span>
                      {user?.role === 'candidate' && recommendations[job._id] && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <StarIcon className="h-4 w-4 mr-1" />
                          {recommendations[job._id].matchScore}% match
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {job.location?.city}, {job.location?.state}
                    </div>
                    {job.department && (
                      <div className="flex items-center">
                        <span className="h-4 w-4 mr-1">🏢</span>
                        {job.department}
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        {formatCurrency(job.salary.min, job.salary.currency)} - {formatCurrency(job.salary.max, job.salary.currency)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Posted {formatDate(job.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills?.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills && job.requiredSkills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-sm rounded-md">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details →
                    </Link>
                    
                    {user?.role === 'candidate' && (
                      <Link
                        to={`/jobs/${job._id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More / Pagination would go here */}
        {jobs.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Showing {jobs.length} of {useJobStore.getState().totalJobs} jobs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
