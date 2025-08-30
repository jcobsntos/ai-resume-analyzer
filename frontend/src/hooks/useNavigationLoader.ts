import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UseNavigationLoaderOptions {
  delay?: number; // Minimum loading time to prevent flashing
  showProgressBar?: boolean;
}

export const useNavigationLoader = (options: UseNavigationLoaderOptions = {}) => {
  const { delay = 200, showProgressBar = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Start loading
    setIsLoading(true);

    // Set minimum loading time to prevent flashing
    timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    // Cleanup timeout on unmount or location change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.pathname, delay]);

  return {
    isLoading: isLoading && showProgressBar,
    location: location.pathname
  };
};
