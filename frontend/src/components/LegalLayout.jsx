import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Clock, CheckCircle2, ChevronRight, FileText, Lock, Cookie as CookieIcon } from "lucide-react";
import { motion } from "framer-motion";

const LegalLayout = ({ 
  title, 
  subtitle, 
  lastUpdated = "August 2026", 
  readTime = "5 min read",
  sections = [],
  children 
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    const mainContainer = document.querySelector('main');
    
    if (el && mainContainer) {
      const y = el.getBoundingClientRect().top + mainContainer.scrollTop - mainContainer.getBoundingClientRect().top - 110;
      mainContainer.scrollTo({ top: y, behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] pt-8 pb-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 space-y-8">
        
        {/* Top Navigation & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5f6368] mb-4 uppercase tracking-wider">
            <Link to="/" className="hover:text-[#1a73e8] transition-colors flex items-center gap-1.5">
              <span>Daily Utility Hub</span>
            </Link>
            <ChevronRight size={13} className="text-[#9aa0a6]" />
            <span className="text-[#1a73e8] font-bold">Legal & Policies</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#dadce0] pb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] text-xs font-bold mb-3 shadow-2xs">
                <Shield size={14} />
                Daily Utility Hub Legal Center
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#202124] tracking-tight mb-2 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-[#5f6368] font-normal max-w-2xl leading-relaxed mb-4">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5f6368]">
                <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-xl border border-[#dadce0] shadow-2xs">
                  <Clock size={13} className="text-[#1a73e8]" />
                  <span>Last Updated: <strong className="text-[#202124]">{lastUpdated}</strong></span>
                </div>
                {readTime && (
                  <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-xl border border-[#dadce0] shadow-2xs">
                    <FileText size={13} className="text-[#1a73e8]" />
                    <span>Estimated Read: <strong className="text-[#202124]">{readTime}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#137333] bg-[#e6f4ea] px-3 py-1.5 rounded-xl border border-[#ceead6] font-semibold shadow-2xs">
                  <CheckCircle2 size={13} className="text-[#34a853]" />
                  <span>Legally Verified & Current</span>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation Menu */}
            <div className="flex items-center bg-white border border-[#dadce0] rounded-2xl p-1.5 shadow-xs w-full lg:w-auto overflow-x-auto custom-scrollbar shrink-0">
              <Link 
                to="/privacy-policy" 
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/privacy-policy' 
                    ? 'bg-[#1a73e8] text-white shadow-xs' 
                    : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
                }`}
              >
                <Lock size={14} />
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/terms-of-service' 
                    ? 'bg-[#1a73e8] text-white shadow-xs' 
                    : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
                }`}
              >
                <FileText size={14} />
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  location.pathname === '/cookie-policy' 
                    ? 'bg-[#1a73e8] text-white shadow-xs' 
                    : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
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
            className="flex-1 w-full order-2 lg:order-1 min-w-0 prose max-w-none prose-headings:text-[#202124] prose-p:text-[#3c4043] prose-strong:text-[#202124] prose-li:text-[#3c4043] bg-white p-6 sm:p-10 rounded-2xl border border-[#dadce0] shadow-xs"
          >
            {children}
          </motion.div>

          {/* Sticky Table of Contents Sidebar */}
          {sections && sections.length > 0 && (
            <div className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-24 order-1 lg:order-2">
              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#dadce0]">
                  <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse" />
                    On This Page
                  </h3>
                  <span className="text-[10px] font-bold text-[#1a73e8] bg-[#e8f0fe] border border-[#d2e3fc] px-2 py-0.5 rounded-full">
                    {sections.length} Sections
                  </span>
                </div>

                <nav className="flex flex-col gap-1 relative z-10">
                  {sections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={idx}
                        onClick={() => scrollToSection(section.id)}
                        className={`text-left text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold border border-[#d2e3fc]'
                            : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
                        }`}
                      >
                        <span className="truncate pr-2">{section.label}</span>
                        <ChevronRight 
                          size={13} 
                          className={`transition-transform shrink-0 ${
                            isActive ? 'translate-x-0.5 text-[#1a73e8]' : 'text-[#9aa0a6] group-hover:translate-x-0.5'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
