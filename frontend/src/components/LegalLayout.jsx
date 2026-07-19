import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const LegalLayout = ({ title, lastUpdated, children, sections }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-20 selection:bg-[#2563eb]/30 selection:text-white">
      {/* Background elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2563eb]/5 blur-[120px] rounded-full pointer-events-none z-0" />
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Breadcrumb & Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#71717a] mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-white transition-colors">UtilityHub</Link>
            <ChevronRight size={12} />
            <span className="text-[#2563eb]">Legal</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#27272a] pb-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#60a5fa] text-xs font-bold mb-4 shadow-sm">
                <Shield size={14} />
                Legal Center
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                {title}
              </h1>
              <p className="text-sm text-[#a1a1aa] font-medium">
                Last Updated: {lastUpdated}
              </p>
            </div>
            
            {/* Context menu for other legal pages */}
            <div className="flex bg-[#111116] border border-[#27272a] rounded-xl p-1.5 shrink-0 shadow-lg w-full md:w-auto overflow-x-auto custom-scrollbar">
              <Link 
                to="/privacy-policy" 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${location.pathname === '/privacy-policy' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#18181b]'}`}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${location.pathname === '/terms-of-service' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#18181b]'}`}
              >
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${location.pathname === '/cookie-policy' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#18181b]'}`}
              >
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Main Prose Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 w-full order-2 lg:order-1"
          >
            <div className="prose prose-invert prose-sm md:prose-base max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#27272a]
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-[#a1a1aa] prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-[#60a5fa] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#d4d4d8] prose-strong:font-bold
              prose-ul:text-[#a1a1aa] prose-ul:my-6 prose-li:my-2
              prose-blockquote:border-l-2 prose-blockquote:border-[#2563eb] prose-blockquote:bg-[#18181b] prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-[#d4d4d8]"
            >
              {children}
            </div>
          </motion.div>

          {/* Sticky Table of Contents */}
          {sections && sections.length > 0 && (
            <div className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-28 order-1 lg:order-2">
              <div className="bg-[#111116] border border-[#27272a] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-bl-full blur-2xl" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-5 relative z-10">On this page</h3>
                <nav className="flex flex-col gap-1 relative z-10">
                  {sections.map((section, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSection(section.id)}
                      className="text-left text-xs font-medium text-[#71717a] hover:text-white hover:bg-[#ffffff08] px-3 py-2.5 rounded-lg transition-colors"
                    >
                      {section.label}
                    </button>
                  ))}
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
