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
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo({ top: y, behavior: "smooth" });
          setActiveSection(targetId);
        }
      }, 150);
    } else {
      window.scrollTo(0, 0);
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
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] pt-24 pb-28 selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Top Navigation & Breadcrumb */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a1aa] mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>UtilityHub</span>
            </Link>
            <ChevronRight size={13} className="text-[#52525b]" />
            <span className="text-primary font-bold">Legal & Compliance</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#27272a] pb-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 shadow-sm">
                <Shield size={14} />
                Official Trust & Legal Document
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base text-[#a1a1aa] font-normal max-w-2xl leading-relaxed mb-4">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a1a1aa]">
                <div className="flex items-center gap-1.5 font-medium bg-[#18181b] px-3 py-1 rounded-md border border-[#27272a]">
                  <Clock size={13} className="text-primary" />
                  <span>Last Updated: <strong className="text-white">{lastUpdated}</strong></span>
                </div>
                {readTime && (
                  <div className="flex items-center gap-1.5 font-medium bg-[#18181b] px-3 py-1 rounded-md border border-[#27272a]">
                    <FileText size={13} className="text-primary" />
                    <span>Estimated Read: <strong className="text-white">{readTime}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 font-medium">
                  <CheckCircle2 size={13} />
                  <span>Legally Verified & Current</span>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation Menu */}
            <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-2xl p-1.5 shadow-2xl w-full lg:w-auto overflow-x-auto custom-scrollbar shrink-0">
              <Link 
                to="/privacy-policy" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/privacy-policy' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
                }`}
              >
                <Lock size={14} />
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/terms-of-service' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
                }`}
              >
                <FileText size={14} />
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/cookie-policy' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
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
            className="flex-1 w-full order-2 lg:order-1 min-w-0"
          >
            {children}
          </motion.div>

          {/* Sticky Table of Contents Sidebar */}
          {sections && sections.length > 0 && (
            <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-28 order-1 lg:order-2">
              <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#27272a]/80">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    On This Page
                  </h3>
                  <span className="text-[10px] font-semibold text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded-full">
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
                            ? 'bg-primary/15 text-primary font-bold border border-primary/30 shadow-sm'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/60'
                        }`}
                      >
                        <span className="truncate pr-2">{section.label}</span>
                        <ChevronRight 
                          size={13} 
                          className={`transition-transform shrink-0 ${
                            isActive ? 'translate-x-0.5 text-primary' : 'opacity-0 group-hover:opacity-100 text-[#a1a1aa]'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </nav>

                {/* Direct Contact Card inside TOC */}
                <div className="mt-6 pt-5 border-t border-[#27272a]/80 bg-[#18181b]/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <p className="text-[11px] font-semibold text-[#a1a1aa] mb-2">Have privacy questions?</p>
                  <a 
                    href="mailto:jaganparida39064@gmail.com"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
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
