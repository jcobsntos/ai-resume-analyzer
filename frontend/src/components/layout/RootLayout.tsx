import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navigation } from './Navigation';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/NavigationLoader';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import { useAuthStore, initializeAuth } from '@/store/authStore';

export const RootLayout: React.FC = () => {
  const { refreshUser, isAuthenticated } = useAuthStore();
  const { isLoading } = useNavigationLoader({ delay: 300 });
  const location = useLocation();

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth();
    
    // Refresh user data if authenticated
    if (isAuthenticated) {
      refreshUser();
    }
  }, [refreshUser, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar isVisible={isLoading} />
      <Navigation />
      <main>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
            opacity: { duration: 0.4 },
            y: { duration: 0.6 },
            scale: { duration: 0.6 }
          }}
          key={location.pathname}
        >
          <Outlet />
        </motion.div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};
