import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, ChevronRight, Clock, FileText, Lock, Cookie as CookieIcon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const LegalLayout = ({ title, subtitle, lastUpdated, readTime, children, sections }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(sections?.[0]?.id || "");

  // Handle Hash Scroll on Initial Load
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(targetId);
        const mainContainer = document.querySelector("main");
        
        if (el && mainContainer) {
          const y = el.getBoundingClientRect().top + mainContainer.scrollTop - mainContainer.getBoundingClientRect().top - 110;
          mainContainer.scrollTo({ top: y, behavior: "smooth" });
          setActiveSection(targetId);
        }
      }, 300);
    } else {
      const mainContainer = document.querySelector("main");
      if (mainContainer) mainContainer.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  // Intersection Observer for Active TOC Tracking as User Scrolls
  useEffect(() => {
    if (!sections || sections.length === 0) return;

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    const mainContainer = document.querySelector("main");
    
    if (el && mainContainer) {
      const y = el.getBoundingClientRect().top + mainContainer.scrollTop - mainContainer.getBoundingClientRect().top - 110;
      mainContainer.scrollTo({ top: y, behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 pt-16 pb-24 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-100/40 via-slate-50/20 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Top Navigation & Breadcrumb */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>Daily Utility Hub</span>
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-blue-600 font-bold">Legal & Policies</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold mb-4 shadow-2xs">
                <Shield size={14} />
                Daily Utility Hub Legal Center
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base text-slate-600 font-normal max-w-2xl leading-relaxed mb-4">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Clock size={13} className="text-blue-600" />
                  <span>Last Updated: <strong className="text-slate-900">{lastUpdated}</strong></span>
                </div>
                {readTime && (
                  <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <FileText size={13} className="text-blue-600" />
                    <span>Estimated Read: <strong className="text-slate-900">{readTime}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Legally Verified & Current</span>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation Menu */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full lg:w-auto overflow-x-auto custom-scrollbar shrink-0">
              <Link 
                to="/privacy-policy" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/privacy-policy' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Lock size={14} />
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/terms-of-service' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText size={14} />
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/cookie-policy' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CookieIcon size={14} />
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
          
          {/* Main Article Content */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 w-full order-2 lg:order-1 min-w-0 prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-900 prose-li:text-slate-600"
          >
            {children}
          </motion.div>

          {/* Sticky Table of Contents Sidebar */}
          {sections && sections.length > 0 && (
            <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-28 order-1 lg:order-2">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    On This Page
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {sections.length} Sections
                  </span>
                </div>

                <nav className="flex flex-col gap-1.5 relative z-10">
                  {sections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={idx}
                        onClick={() => scrollToSection(section.id)}
                        className={`text-left text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{section.label}</span>
                        <ChevronRight 
                          size={13} 
                          className={`transition-transform shrink-0 ${
                            isActive ? 'translate-x-0.5 text-blue-600' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </nav>

                {/* Direct Contact Card inside TOC */}
                <div className="mt-6 pt-5 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">Have privacy questions?</p>
                  <a 
                    href="mailto:jaganparida39064@gmail.com"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Contact Legal Team &rarr;
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
