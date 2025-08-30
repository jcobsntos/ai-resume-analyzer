import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useUserStore } from '@/store/userStore';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { stats: appStats, isLoading: appLoading, fetchStats } = useApplicationStore();
  const { totalUsers, isLoading: userLoading, fetchUsers } = useUserStore();
  
  useEffect(() => {
    fetchStats(true);
    fetchUsers(true);
  }, [fetchStats, fetchUsers]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            System overview and user management
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            {userLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-indigo-600">{totalUsers}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Applications</h3>
            {appLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{appStats.total}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Pending</h3>
            {appLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-yellow-600">{appStats.pending}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Reviewing</h3>
            {appLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-orange-600">{appStats.reviewing}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Interviewing</h3>
            {appLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-purple-600">{appStats.interviewing}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900">Hired</h3>
            {appLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-green-600">{appStats.hired}</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {user?.firstName}!</h2>
          <p className="text-gray-600">
            System administration dashboard - manage users, applications, and platform-wide settings.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/users" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Manage Users</div>
              <div className="text-sm text-gray-600">View and edit all users</div>
            </Link>
            <Link to="/applications" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">View Applications</div>
              <div className="text-sm text-gray-600">All applications across the platform</div>
            </Link>
            <Link to="/jobs/manage" className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="font-semibold text-gray-900">Manage Jobs</div>
              <div className="text-sm text-gray-600">Create and update job postings</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
