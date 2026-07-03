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

  // Disable browser-level zoom (Keyboard, Mouse wheel + Ctrl, and Mobile viewport gestures)
  useEffect(() => {
    // Disable Ctrl + scroll wheel zoom
    const preventWheelZoom = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Disable Keyboard zoom shortcuts (Ctrl +, Ctrl -, Ctrl 0)
    const preventKeyZoom = (e) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
        e.preventDefault();
      }
    };

    // Disable double-tap zoom on mobile
    let lastTouchTime = 0;
    const preventDoubleTapZoom = (e) => {
      const now = new Date().getTime();
      if (now - lastTouchTime <= 300) {
        e.preventDefault();
      }
      lastTouchTime = now;
    };

    // Disable multi-touch (pinch) viewport zoom
    const preventPinchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventWheelZoom, { passive: false });
    window.addEventListener('keydown', preventKeyZoom);
    window.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });
    window.addEventListener('touchmove', preventPinchZoom, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventWheelZoom);
      window.removeEventListener('keydown', preventKeyZoom);
      window.removeEventListener('touchstart', preventDoubleTapZoom);
      window.removeEventListener('touchmove', preventPinchZoom);
    };
  }, []);

  // Global Intercepts for downloads and clear events to auto-scroll tools to top
  useEffect(() => {
    // Intercept clicks on links that have download attributes
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (this.hasAttribute('download')) {
        setTimeout(() => {
          if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 1000);
      }
      return originalClick.apply(this, arguments);
    };

    // Intercept global clicks on clear/reset buttons
    const handleGlobalClearClick = (e) => {
      const button = e.target.closest('button') || e.target.closest('[role="button"]');
      if (!button) return;

      const text = (button.innerText || button.textContent || '').toLowerCase();
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const title = (button.getAttribute('title') || '').toLowerCase();

      const isClearAction = 
        text.includes('clear') || 
        text.includes('reset') || 
        text.includes('start over') || 
        text.includes('cancel') ||
        text.includes('trash') ||
        text.includes('upload new') ||
        text.includes('upload another') ||
        ariaLabel.includes('clear') ||
        ariaLabel.includes('reset') ||
        title.includes('clear') ||
        title.includes('reset');

      if (isClearAction) {
        setTimeout(() => {
          if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    };

    window.addEventListener('click', handleGlobalClearClick, true);

    return () => {
      HTMLAnchorElement.prototype.click = originalClick;
      window.removeEventListener('click', handleGlobalClearClick, true);
    };
  }, []);

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
