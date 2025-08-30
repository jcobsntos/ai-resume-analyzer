import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

const transitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { 
      duration: 0.2, 
      ease: [0.4, 0, 0.2, 1],
      opacity: { duration: 0.2 }
    }
  },
  slide: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { 
      duration: 0.25, 
      ease: [0.4, 0, 0.2, 1],
      x: { duration: 0.25 },
      opacity: { duration: 0.2 }
    }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { 
      duration: 0.2, 
      ease: [0.4, 0, 0.2, 1],
      y: { duration: 0.2 },
      opacity: { duration: 0.15 }
    }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { 
      duration: 0.2, 
      ease: [0.4, 0, 0.2, 1],
      scale: { duration: 0.2 },
      opacity: { duration: 0.15 }
    }
  }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  variant = 'slideUp' 
}) => {
  const location = useLocation();
  const transition = transitions[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={transition.transition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Higher-order component for easy page wrapping
export const withPageTransition = (
  Component: React.ComponentType,
  variant?: PageTransitionProps['variant']
) => {
  return (props: any) => (
    <PageTransition variant={variant}>
      <Component {...props} />
    </PageTransition>
  );
};

// Individual page transition variants for specific use cases
export const FadeTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition variant="fade">{children}</PageTransition>
);

export const SlideTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition variant="slide">{children}</PageTransition>
);

export const SlideUpTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition variant="slideUp">{children}</PageTransition>
);

export const ScaleTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition variant="scale">{children}</PageTransition>
);
