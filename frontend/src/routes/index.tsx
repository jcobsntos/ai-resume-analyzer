import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';

// Pages
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { JobListPage } from '@/pages/jobs/JobListPage';
import { JobDetailPage } from '@/pages/jobs/JobDetailPage';
import { CandidateDashboard } from '@/pages/dashboards/CandidateDashboard';
import { RecruiterDashboard } from '@/pages/dashboards/RecruiterDashboard';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { ApplicationListPage } from '@/pages/applications/ApplicationListPage';
import { ApplicationDetailPage } from '@/pages/applications/ApplicationDetailPage';
import { JobManagementPage } from '@/pages/jobs/JobManagementPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'auth/login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'auth/register',
        element: <RegisterPage />,
      },
      {
        path: 'jobs',
        children: [
          {
            index: true,
            element: <JobListPage />,
          },
          {
            path: ':id',
            element: <JobDetailPage />,
          },
          {
            path: 'manage',
            element: (
              <RoleProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <JobManagementPage />
              </RoleProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'applications',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <ApplicationListPage />,
          },
          {
            path: ':id',
            element: <ApplicationDetailPage />,
          },
        ],
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute />,
        children: [
          {
            path: 'candidate',
            element: (
              <RoleProtectedRoute allowedRoles={['candidate']}>
                <CandidateDashboard />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'recruiter',
            element: (
              <RoleProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterDashboard />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'admin',
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <RoleProtectedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </RoleProtectedRoute>
        ),
        children: [
          {
            path: 'users',
            element: <UserManagementPage />,
          },
        ],
      },
      {
        path: 'test',
        element: <div>Test route works!</div>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
