import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Topbar from './Topbar';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  
  const isDashboard = location.pathname === '/dashboard';
  const isTool = location.pathname.startsWith('/tools');
  const isProfile = location.pathname === '/profile';
  
  // Only show topbar on Dashboard
  const showTopbar = isDashboard;
  const showBackButton = isTool || isProfile;

  const [isScrolled, setIsScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    
    // Save scroll position if we are on the dashboard
    if (isDashboard) {
      sessionStorage.setItem('dashboardScroll', currentScrollTop);
    }
    
    // Hide header on scroll down, show on scroll up (with a threshold)
    if (currentScrollTop > 80) {
      if (currentScrollTop > lastScrollY.current) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
    } else {
      setHeaderVisible(true);
    }
    
    setIsScrolled(currentScrollTop > 30);
    lastScrollY.current = currentScrollTop;
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
      } else if (isTool || isProfile) {
        // Scroll to top when entering a new tool or profile
        mainRef.current.scrollTop = 0;
      }
    }
  }, [location.pathname, isDashboard, isTool, isProfile]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showTopbar && <Topbar isScrolled={isScrolled && isDashboard} headerVisible={headerVisible} />}
        
        {/* Global Tool/Profile Header - Static Back Button */}
        {showBackButton && (
          <div className="w-full px-4 md:px-8 py-4 shrink-0 bg-background z-40 flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-muted/80 border border-border px-5 py-2.5 rounded-full transition-all shadow-sm group whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto flex flex-col relative z-10 scroll-smooth">
          <div className={`flex-1 flex flex-col ${showBackButton ? 'pt-4 pb-32 md:pt-12 md:pb-12' : 'p-0'}`}>
            <Outlet context={{ isScrolled, setIsScrolled }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
