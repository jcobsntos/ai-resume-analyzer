import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useApplicationStore } from '@/store/applicationStore';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { stats, isLoading, fetchStats } = useApplicationStore();
  
  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Recruiter Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage applications and track recruitment metrics
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Applications</h3>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Pending</h3>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Reviewing</h3>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-orange-600">{stats.reviewing}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Interviewing</h3>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-purple-600">{stats.interviewing}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Hired</h3>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-green-600">{stats.hired}</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {user?.firstName}!</h2>
          <p className="text-gray-600">
            Your company recruitment dashboard - manage applications for your team's job postings.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/applications" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Manage Applications</div>
              <div className="text-sm text-gray-600">See applicants for your company</div>
            </Link>
            <Link to="/jobs/manage" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Manage Jobs</div>
              <div className="text-sm text-gray-600">Post and update job openings</div>
            </Link>
            <Link to="/applications?status=interviewing" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Interview Schedule</div>
              <div className="text-sm text-gray-600">View and manage interviews</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
