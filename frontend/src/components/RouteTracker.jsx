import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

const RouteTracker = () => {
  const location = useLocation();
  const { recordVisit } = useAnalytics();

  useEffect(() => {
    // Only record visits to actual tools (paths starting with /tools/)
    if (location.pathname.startsWith('/tools/')) {
      recordVisit(location.pathname);
    }
  }, [location.pathname, recordVisit]);

  return null; // This component doesn't render anything
};

export default RouteTracker;
