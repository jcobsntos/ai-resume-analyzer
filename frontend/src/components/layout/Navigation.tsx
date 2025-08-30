import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const avatarUrl = user?.profilePicture 
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/profiles/${user._id}/${user.profilePicture}` 
    : null;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { name: 'Home', href: '/', icon: HomeIcon },
        { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
      ];
    }

    const commonItems = [
      { name: 'Home', href: '/', icon: HomeIcon },
      { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
      { name: 'Applications', href: '/applications', icon: DocumentTextIcon },
    ];

    const roleSpecificItems = [];

    switch (user.role) {
      case 'candidate':
        roleSpecificItems.push({
          name: 'Dashboard',
          href: '/dashboard/candidate',
          icon: ChartBarIcon,
        });
        break;
      case 'recruiter':
        roleSpecificItems.push(
          { name: 'Dashboard', href: '/dashboard/recruiter', icon: ChartBarIcon },
          { name: 'Manage Jobs', href: '/jobs/manage', icon: BriefcaseIcon }
        );
        break;
      case 'admin':
        roleSpecificItems.push(
          { name: 'Dashboard', href: '/dashboard/admin', icon: ChartBarIcon },
          { name: 'Manage Jobs', href: '/jobs/manage', icon: BriefcaseIcon },
          { name: 'User Management', href: '/admin/users', icon: Cog6ToothIcon }
        );
        break;
    }

    return [...commonItems, ...roleSpecificItems];
  };

  const navigationItems = getNavigationItems();
  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <Link
              to="/"
              className="flex items-center px-4 text-xl font-bold text-blue-600 hover:text-blue-700"
              onClick={closeMenu}
            >
              Resume AI Analyzer
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isCurrentPath(item.href)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    onClick={closeMenu}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isCurrentPath('/profile')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full mr-2 object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 mr-2" />
                  )}
                  {user.firstName} {user.lastName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="clickable inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="clickable inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isCurrentPath(item.href)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 border-l-4'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  onClick={closeMenu}
                >
                  <div className="flex items-center">
                    <IconComponent className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile user section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
