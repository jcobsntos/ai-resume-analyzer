import React from 'react';
import { motion } from 'framer-motion';

interface NavigationLoaderProps {
  isVisible: boolean;
  message?: string;
}

export const NavigationLoader: React.FC<NavigationLoaderProps> = ({ 
  isVisible, 
  message = 'Loading...' 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm"
    >
      {/* Progress Bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="h-1 bg-white/30"
      />
      
      {/* Loading Content */}
      <div className="flex items-center justify-center py-2 px-4">
        <div className="flex items-center space-x-2">
          {/* Animated Dots */}
          <div className="flex space-x-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
              className="w-2 h-2 bg-white/80 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
              className="w-2 h-2 bg-white/80 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
              className="w-2 h-2 bg-white/80 rounded-full"
            />
          </div>
          
          {/* Loading Text */}
          <span className="text-white text-sm font-medium">{message}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Simple progress bar for minimal loading indication
export const ProgressBar: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        exit={{ width: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-1 bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
      />
    </motion.div>
  );
};
