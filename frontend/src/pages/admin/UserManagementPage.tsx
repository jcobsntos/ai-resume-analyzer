import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const UserManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    users,
    isLoading,
    error,
    totalUsers,
    search,
    roleFilter,
    activeFilter,
    fetchUsers,
    updateUser,
    deleteUser,
    setSearch,
    setRoleFilter,
    setActiveFilter,
  } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (id: string, patch: Partial<any>) => {
    await updateUser(id, patch);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchUsers(true); // Force refresh
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users {users.length ? `(${users.length})` : ''}</h1>
              <p className="text-gray-600">Manage users, roles and account status</p>
            </div>
            <button onClick={() => fetchUsers(true)} className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200">Refresh</button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-md">
              <option value="">All Roles</option>
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="px-3 py-2 border rounded-md">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Search</button>
          </form>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-gray-600">No users found. Try adjusting filters or creating users.</div>
          ) : (
            <div className="divide-y">
              {users.map(u => (
                <div key={u._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{u.firstName} {u.lastName} <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{u.role}</span></div>
                    <div className="text-sm text-gray-600">{u.email}{u.company ? ` • ${u.company}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateUser(u._id, { role: e.target.value as any })}
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                      className={`px-3 py-1 rounded-md text-sm ${u.isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
