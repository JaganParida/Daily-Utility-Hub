import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Topbar from './Topbar';
import Footer from './Footer';
import { toolCategories } from '../data/toolCategories';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isTool = location.pathname.startsWith('/tools');
  const isProfile = location.pathname === '/profile';
  
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

  // Centralized SEO Metadata Manager
  useEffect(() => {
    const getPageMetadata = (pathname) => {
      const allTools = Object.values(toolCategories).flat();
      const tool = allTools.find(t => t.to === pathname);
      
      if (tool) {
        return {
          title: `${tool.name} - Daily Utility Hub | Free Web Utility`,
          description: `${tool.description} Fast, secure, and run completely client-side in your browser. No server uploads required.`
        };
      }
      
      if (pathname === '/' || pathname === '/dashboard') {
        return {
          title: 'Daily Utility Hub | Free Offline-First Developer & File Utilities',
          description: 'Daily Utility Hub is a premium suite of free, secure, client-side tools for file sharing, PDF edits, developer utilities, and conversion tasks. 100% private.'
        };
      }
      
      if (pathname === '/profile') {
        return {
          title: 'User Profile - Daily Utility Hub',
          description: 'Manage your Daily Utility Hub account profile details and usage configurations.'
        };
      }

      return {
        title: 'Daily Utility Hub',
        description: 'Free, secure, client-side offline-first developer & file utilities.'
      };
    };

    const meta = getPageMetadata(location.pathname);
    
    // Update Title tag
    document.title = meta.title;
    
    // Update Meta Description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);

    // Update Open Graph (OG) tags for rich snippets/shares
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', meta.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', meta.description);
    
  }, [location.pathname]);

  // Disable browser-level zoom (Keyboard, Mouse wheel + Ctrl, and Mobile viewport gestures) - Small Devices Only
  useEffect(() => {
    const isSmallDevice = () => window.innerWidth < 1024;

    // Disable Ctrl + scroll wheel zoom
    const preventWheelZoom = (e) => {
      if (e.ctrlKey && isSmallDevice()) {
        e.preventDefault();
      }
    };

    // Disable Keyboard zoom shortcuts (Ctrl +, Ctrl -, Ctrl 0)
    const preventKeyZoom = (e) => {
      if (e.ctrlKey && isSmallDevice() && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
        e.preventDefault();
      }
    };

    // Disable double-tap zoom on mobile
    let lastTouchTime = 0;
    const preventDoubleTapZoom = (e) => {
      if (!isSmallDevice()) return;
      const now = new Date().getTime();
      if (now - lastTouchTime <= 300) {
        e.preventDefault();
      }
      lastTouchTime = now;
    };

    // Disable multi-touch (pinch) viewport zoom
    const preventPinchZoom = (e) => {
      if (isSmallDevice() && e.touches && e.touches.length > 1) {
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

  // Global Intercepts for downloads and clear events to auto-scroll tools to top - Small Devices Only
  useEffect(() => {
    const isSmallDevice = () => window.innerWidth < 1024;

    // Intercept clicks on links that have download attributes
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (this.hasAttribute('download') && isSmallDevice()) {
        setTimeout(() => {
          if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 1000);
      }
      return originalClick.apply(this, arguments);
    };

    // Intercept global clicks on clear/reset/generate buttons
    const handleGlobalClearClick = (e) => {
      if (!isSmallDevice()) return;

      const button = e.target.closest('button') || e.target.closest('[role="button"]') || e.target.closest('input[type="button"]') || e.target.closest('input[type="submit"]');
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
        text.includes('generate') ||
        text.includes('regenerate') ||
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
        <Topbar isScrolled={isScrolled && isDashboard} headerVisible={headerVisible} />

        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 scroll-smooth">
          <div className={`w-full flex flex-col pb-20 md:pb-12 ${isDashboard ? 'pt-0' : 'pt-24 lg:pt-28'}`}>
            <Outlet context={{ isScrolled, setIsScrolled }} />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;
