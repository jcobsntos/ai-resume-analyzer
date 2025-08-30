import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface SmoothTransitionProps {
  children: React.ReactNode;
}

export const SmoothTransition: React.FC<SmoothTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'exiting' | 'entering'>('idle');

  useEffect(() => {
    if (transitionStage === 'idle') {
      setTransitionStage('exiting');
    }
  }, [location.pathname, transitionStage]);

  useEffect(() => {
    if (transitionStage === 'exiting') {
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('entering');
      }, 150); // Half of transition time

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, children]);

  useEffect(() => {
    if (transitionStage === 'entering') {
      const timeout = setTimeout(() => {
        setTransitionStage('idle');
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [transitionStage]);

  const variants = {
    idle: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
    },
    exiting: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
    },
    entering: { 
      opacity: 0, 
      y: 10,
      transition: { duration: 0 }
    }
  };

  return (
    <motion.div
      variants={variants}
      animate={transitionStage}
      className="w-full"
      style={{ minHeight: '50vh' }} // Prevent layout shift
    >
      {displayChildren}
    </motion.div>
  );
};
