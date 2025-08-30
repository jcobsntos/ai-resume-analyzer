import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplicationStore } from '@/store/applicationStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { formatDate, truncateText } from '@/lib/utils';
import { ApplicationStatus } from '@/types';

export const ApplicationListPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    applications,
    isLoading,
    fetchApplications,
    updateApplicationStatus,
    bulkUpdateStatus,
    bulkDeleteApplications,
    stats,
    fetchStats,
    filters,
    setFilters,
    clearFilters,
  } = useApplicationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | ''>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [fetchApplications, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    fetchApplications(1, { ...filters });
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    await updateApplicationStatus(applicationId, newStatus);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedApplications.length === 0 || !bulkStatus) return;
    
    const success = await bulkUpdateStatus(selectedApplications, bulkStatus as ApplicationStatus);
    if (success) {
      setSelectedApplications([]);
      setBulkStatus('');
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) return;
    
    const success = await bulkDeleteApplications(selectedApplications);
    if (success) {
      setSelectedApplications([]);
      setShowBulkActions(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedApplications(prev => 
      prev.length === applications.length ? [] : applications.map(app => app._id)
    );
  };

  const toDisplayStatus = (raw: string) => {
    const map: Record<string, 'pending' | 'reviewing' | 'interviewing' | 'hired' | 'rejected' | 'withdrawn'> = {
      applied: 'pending',
      screening: 'reviewing',
      shortlisted: 'reviewing',
      interview: 'interviewing',
      offer: 'reviewing',
      hired: 'hired',
      rejected: 'rejected',
      withdrawn: 'withdrawn',
    };
    return map[raw] || (['pending','reviewing','interviewing','hired','rejected','withdrawn'].includes(raw) ? (raw as any) : 'pending');
  };

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
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'reviewing': return <EyeIcon className="h-4 w-4" />;
      case 'interviewing': return <CalendarDaysIcon className="h-4 w-4" />;
      case 'hired': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading && applications.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const isRecruiterOrAdmin = user?.role === 'recruiter' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'candidate' ? 'My Applications' : 'Application Management'}
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'candidate' 
                  ? 'Track the status of your job applications'
                  : 'Review and manage candidate applications'
                }
              </p>
            </div>
            
            {selectedApplications.length > 0 && isRecruiterOrAdmin && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedApplications.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Bulk Actions
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {isRecruiterOrAdmin && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
                <div className="text-sm text-gray-600">Reviewing</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{stats.interviewing}</div>
                <div className="text-sm text-gray-600">Interviewing</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
                <div className="text-sm text-gray-600">Hired</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedApplications.length > 0 && isRecruiterOrAdmin && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-900">
                  Manage {selectedApplications.length} selected applications:
                </span>
              </div>
              <button
                onClick={() => setShowBulkActions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Status Update Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                <div className="flex items-center space-x-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status...</option>
                    <option value="screening">Reviewing</option>
                    <option value="interview">Interviewing</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Delete Applications</h4>
                <div className="text-sm text-gray-600 mb-3">
                  Permanently delete {selectedApplications.length} applications. This action cannot be undone.
                </div>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Selected
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by candidate name, job title, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              {(filters.status || filters.jobId) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filters.dateRange?.startDate || ''}
                      onChange={(e) => setFilters({ 
                        dateRange: { ...filters.dateRange, startDate: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.dateRange?.endDate || ''}
                      onChange={(e) => setFilters({ 
                        dateRange: { ...filters.dateRange, endDate: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Score Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Min"
                      value={filters.aiScoreMin || ''}
                      onChange={(e) => setFilters({ aiScoreMin: Number(e.target.value) || undefined })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Max"
                      value={filters.aiScoreMax || ''}
                      onChange={(e) => setFilters({ aiScoreMax: Number(e.target.value) || undefined })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applications Table/List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {isRecruiterOrAdmin && applications.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === applications.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Select All ({applications.length})
                </label>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {user?.role === 'candidate' 
                  ? 'You haven\'t applied to any jobs yet. Browse available positions to get started!'
                  : 'No applications match your current filters.'
                }
              </p>
              {user?.role === 'candidate' && (
                <Link
                  to="/jobs"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Browse Jobs
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {isRecruiterOrAdmin && (
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application._id)}
                          onChange={() => toggleApplicationSelection(application._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(toDisplayStatus(application.status))}`}>
                              {getStatusIcon(toDisplayStatus(application.status))}
                              <span className="ml-1 capitalize">{toDisplayStatus(application.status)}</span>
                            </div>
                            <Link
                              to={`/applications/${application._id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {(typeof application.job === 'object' && application.job ? application.job.title : 'Job Not Available')}
                            </Link>
                            <p className="text-gray-600">
                              {(typeof application.job === 'object' && application.job ? application.job.company : 'Company Not Available')} • {application.candidate?.firstName} {application.candidate?.lastName}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* AI Score */}
                            {application.aiAnalysis?.overallScore && (
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(application.aiAnalysis.overallScore)}`}>
                                <div className="flex items-center">
                                  <StarIcon className="h-4 w-4 mr-1" />
                                  {application.aiAnalysis.overallScore}%
                                </div>
                              </div>
                            )}
                            
                            {/* Status */}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(toDisplayStatus(application.status))}`}>
                              {getStatusIcon(toDisplayStatus(application.status))}
                              <span className="ml-2 capitalize">{toDisplayStatus(application.status)}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            Applied {formatDate(application.createdAt)}
                          </div>
                          
                          {application.candidate?.email && (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {application.candidate.email}
                            </div>
                          )}
                          
                          {typeof application.job === 'object' && application.job && application.job.location && (
                            <div className="flex items-center">
                              <BriefcaseIcon className="h-4 w-4 mr-1" />
                              {application.job.location.city}, {application.job.location.state}
                            </div>
                          )}
                        </div>
                        
                        {/* AI Insights Preview */}
                        {application.aiAnalysis?.insights?.strengths && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-1">AI Analysis Highlights:</div>
                            <div className="text-sm text-blue-800">
                              {truncateText(application.aiAnalysis.insights.strengths.join(', '), 150)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      {/* Quick Status Update for Recruiters */}
                      {isRecruiterOrAdmin && (
                        <div className="flex space-x-2">
                          {toDisplayStatus(application.status) === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(application._id, 'screening' as any)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                            >
                              Review
                            </button>
                          )}
                          {toDisplayStatus(application.status) === 'reviewing' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'interview' as any)}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors text-sm"
                              >
                                Interview
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'rejected' as any)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      
                      <Link
                        to={`/applications/${application._id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {applications.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {applications.length} applications
            </div>
            {/* Add pagination controls here if needed */}
          </div>
        )}
      </div>
    </div>
  );
};
