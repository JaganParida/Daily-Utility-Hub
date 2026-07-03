import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Topbar from './Topbar';

const Layout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  
  const isDashboard = location.pathname === '/dashboard';
  const isTool = location.pathname.startsWith('/tools');
  
  // Only show topbar on Dashboard
  const showTopbar = isDashboard;

  const handleScroll = (e) => {
    // Scroll state is now managed locally by child components (e.g. Dashboard)
    // using IntersectionObserver for precise trigger points.
    
    // Save scroll position if we are on the dashboard
    if (isDashboard) {
      sessionStorage.setItem('dashboardScroll', e.target.scrollTop);
    }
  };

  // Manage scroll restoration and routing effects
  useEffect(() => {
    // Reset Topbar scroll state on route change
    setIsScrolled(false);
    
    // Manage scroll positions
    if (mainRef.current) {
      if (isDashboard) {
        // Restore dashboard scroll
        const savedScroll = sessionStorage.getItem('dashboardScroll');
        if (savedScroll) {
          // Slight delay to ensure content is painted
          setTimeout(() => {
            if (mainRef.current) {
              mainRef.current.scrollTop = parseInt(savedScroll, 10);
            }
          }, 10);
        }
      } else if (isTool) {
        // Scroll to top when entering a new tool
        mainRef.current.scrollTop = 0;
      }
    }
  }, [location.pathname, isDashboard, isTool]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showTopbar && <Topbar isScrolled={isScrolled && isDashboard} />}
        
        {/* Global Tool Header - Static Back Button */}
        {isTool && (
          <div className="w-full px-4 md:px-8 py-4 shrink-0 bg-background z-40 flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-muted/80 border border-border px-5 py-2.5 rounded-full transition-all shadow-sm group whitespace-nowrap"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto flex flex-col relative z-10 scroll-smooth">
          <div className={`flex-1 flex flex-col ${isTool ? 'pt-8 md:pt-12' : 'p-0'}`}>
            <Outlet context={{ isScrolled, setIsScrolled }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
