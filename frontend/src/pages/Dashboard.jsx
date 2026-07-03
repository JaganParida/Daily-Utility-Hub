import { Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText, Braces, Search, Calculator, TrendingUp, Percent, Landmark, FolderArchive, Pin, Clock, ArrowRight, Stamp, Palette, Volume2, FileAudio, Code2, Activity, BookMarked, Timer, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import CommandPalette from '../components/CommandPalette';

import { toolCategories, allTools } from '../data/toolCategories';

const circularCategories = [
  { name: 'Image Tools', icon: ImageIcon, gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
  { name: 'Text Tools', icon: Type, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20' },
  { name: 'Developer Tools', icon: Code2, gradient: 'from-purple-400 to-pink-500', shadow: 'shadow-purple-500/20' },
  { name: 'PDF Tools', icon: FileText, gradient: 'from-red-400 to-rose-500', shadow: 'shadow-red-500/20' },
  { name: 'Student & Docs', icon: BookMarked, gradient: 'from-orange-400 to-amber-500', shadow: 'shadow-orange-500/20' },
  { name: 'Finance & Productivity', icon: Calculator, gradient: 'from-fuchsia-400 to-rose-500', shadow: 'shadow-fuchsia-500/20' },
  { name: 'File & Storage Tools', icon: FolderArchive, gradient: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-500/20' },
];

const Dashboard = () => {
  const { pinnedTools, togglePin, recentTools = [] } = useAnalytics();
  const context = useOutletContext();
  const isScrolled = context?.isScrolled || false;
  const setIsScrolled = context?.setIsScrolled;
  
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [recentFilter, setRecentFilter] = useState('recent');
  const observerRef = useRef(null);

  // Category horizontal nav scroll controls
  const categoriesScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleCategoriesScroll = () => {
    if (categoriesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesScrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 10);
    }
  };

  useEffect(() => {
    const el = categoriesScrollRef.current;
    if (el) {
      handleCategoriesScroll();
      el.addEventListener('scroll', handleCategoriesScroll);
      window.addEventListener('resize', handleCategoriesScroll);
      const timeout = setTimeout(handleCategoriesScroll, 100);
      return () => {
        el.removeEventListener('scroll', handleCategoriesScroll);
        window.removeEventListener('resize', handleCategoriesScroll);
        clearTimeout(timeout);
      };
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger precisely when the element hits the 70px offset (just below topbar)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 100) {
          setIsScrolled?.(true);
        } else if (entry.isIntersecting) {
          setIsScrolled?.(false);
        }
      },
      {
        threshold: 0,
        rootMargin: "-70px 0px 0px 0px"
      }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [setIsScrolled]);

  const displayLimit = 8;
  const isPinLimitReached = pinnedTools.length >= displayLimit;

  // Resolve tool paths to actual tool objects
  const recentToolObjects = (recentTools || [])
    .map(path => allTools.find(t => t.to === path))
    .filter(Boolean);

  const pinnedToolObjects = (pinnedTools || [])
    .map(path => allTools.find(t => t.to === path))
    .filter(Boolean);

  // Combine and filter based on selection
  let filteredDisplayTools = [];
  if (recentFilter === 'all') {
    const combined = [...pinnedToolObjects];
    recentToolObjects.forEach(t => {
      if (!combined.some(item => item.to === t.to)) {
        combined.push(t);
      }
    });
    filteredDisplayTools = combined.slice(0, 8);
  } else if (recentFilter === 'pinned') {
    filteredDisplayTools = pinnedToolObjects.slice(0, 8);
  } else if (recentFilter === 'recent') {
    filteredDisplayTools = recentToolObjects.slice(0, 8);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const renderToolCard = (tool) => {
    const Icon = tool.icon;
    const isPinned = pinnedTools.includes(tool.to);
    const showPinButton = isPinned || !isPinLimitReached;
    
    // Extract color classes (e.g. "text-emerald-500 bg-emerald-500/10")
    const colorClasses = tool.color.split(' ');
    const textColor = colorClasses[0];
    // Find the hover border color based on the text color (e.g., text-emerald-500 -> border-emerald-500/50)
    const borderColor = textColor.replace('text-', 'border-') + '/50';

    return (
      <motion.div 
        key={tool.name} 
        variants={cardVariants}
        className="group relative h-full"
      >
        <Link 
          to={tool.to}
          className="block h-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow overflow-hidden relative"
        >
          {/* Faint watermark icon in background (matching Featured Tool layout) */}
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-500 pointer-events-none">
            <Icon size={100} />
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            
            {/* PREMIUM PINNED BADGE / HOVER PIN BUTTON */}
            <div className="h-6 mb-2 flex items-start">
              {showPinButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePin(tool.to);
                  }}
                  className={`transition-all duration-300 z-30 flex items-center ${
                    isPinned 
                      ? 'px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase rounded border border-primary/20 shadow-sm' 
                      : 'px-2.5 py-0.5 bg-muted/50 hover:bg-muted text-muted-foreground text-[10px] font-bold tracking-widest uppercase rounded border border-border opacity-0 group-hover:opacity-100'
                  }`}
                  title={isPinned ? "Unpin Tool" : "Pin Tool"}
                >
                  <Pin size={12} className={`mr-1.5 ${isPinned ? "fill-current" : ""}`} />
                  {isPinned ? "Pinned" : "Pin"}
                </button>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">{tool.name}</h2>
            
            <p className="text-muted-foreground text-sm max-w-[90%] mb-6 leading-relaxed flex-grow">
              {tool.description}
            </p>
            
            <div className="mt-auto flex items-center text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
              Launch Utility <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col overflow-x-hidden">
      
      {/* ========================================= */}
      {/* PREMIUM HERO SECTION                      */}
      {/* ========================================= */}
      <div className="relative z-10 w-full pt-32 pb-24 overflow-hidden bg-background border-b border-border">
        
        {/* Subtle grid pattern for a modern "dev" feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-[1200px] mx-auto w-full px-4 md:px-12 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center relative z-10 w-full"
          >

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-6 leading-[1.1]">
              Tools for <span className="text-muted-foreground">modern</span> <br className="hidden sm:block" />
              workflows.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground font-medium mb-12 max-w-2xl leading-relaxed">
              Instantly search, execute, and export across 50+ local utilities. Completely free, incredibly fast.
            </p>

            {/* Premium Mac-like Search Input */}
            <div className="w-full max-w-3xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 blur-xl opacity-20 group-hover:opacity-40 transition duration-500 rounded-2xl pointer-events-none"></div>
              <button
                onClick={() => setIsPaletteOpen(true)}
                className="w-full h-16 md:h-20 flex items-center bg-card/90 backdrop-blur-xl border border-border/80 hover:border-primary/50 rounded-2xl px-6 md:px-8 shadow-xl transition-all duration-300 relative cursor-text text-left group-hover:shadow-primary/5 group-hover:-translate-y-1"
              >
                <Search className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors w-6 h-6 md:w-8 md:h-8 mr-4" />
                <span className="text-muted-foreground text-base md:text-xl flex-1 truncate font-medium">
                  What do you need to do?
                </span>
                <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-foreground bg-muted/80 px-3 py-1.5 rounded-lg border border-border shrink-0 shadow-sm">
                  <span className="text-muted-foreground">Press</span>
                  <kbd className="font-sans">Ctrl</kbd>
                  <kbd className="font-sans">K</kbd>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MAIN CONTENT SECTION                      */}
      {/* ========================================= */}
      <div className="relative z-20 pt-12 pb-32 px-4 md:px-12 lg:px-20 xl:px-32 w-full bg-background">
        
        {/* Scroll Sentinel to trigger Topbar Category Nav morphing */}
        <div ref={observerRef} className="h-1 w-full -mt-12 mb-4" />

        {/* SLEEK CATEGORY NAVIGATION */}
        <div className="relative max-w-[1600px] mx-auto mb-6 group/nav">
          {/* Left Gradient & Arrow */}
          <AnimatePresence>
            {showLeftArrow && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-0 top-0 h-[44px] w-16 bg-gradient-to-r from-background via-background/90 to-transparent z-30 flex items-center justify-start pl-2 pointer-events-none md:hidden"
              >
                <button
                  onClick={() => {
                    categoriesScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-md pointer-events-auto active:scale-90 transition-transform cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Gradient & Arrow */}
          <AnimatePresence>
            {showRightArrow && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-0 top-0 h-[44px] w-16 bg-gradient-to-l from-background via-background/90 to-transparent z-30 flex items-center justify-end pr-2 pointer-events-none md:hidden"
              >
                <button
                  onClick={() => {
                    categoriesScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-foreground shadow-md pointer-events-auto active:scale-90 transition-transform cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={categoriesScrollRef}
            className="w-full overflow-x-auto no-scrollbar pb-4"
          >
            <div className="flex items-center justify-start md:justify-center gap-3 px-4 min-w-max mx-auto">
              {circularCategories.map((cat) => {
                const IconComponent = cat.icon;
                const safeId = cat.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      document.getElementById(safeId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-transparent border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer focus:outline-none group"
                  >
                    <IconComponent size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground tracking-tight whitespace-nowrap transition-colors">
                      {cat.name.replace(' Tools', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-20 max-w-[1600px] mx-auto">

          {/* Canva-Style "Featured / See what's new" Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="mb-16"
          >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground">See what's new</h3>
            <span className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer">Featured utilities</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          
            {/* 1. Recommended Developer Tool */}
            <div className="group relative col-span-1 h-full">
              <Link to="/tools/json-formatter" className="block h-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <Braces size={100} />
                </div>
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-fit px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-widest uppercase rounded mb-4 border border-emerald-500/20">Developer Pick</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors tracking-tight">JSON Formatter</h2>
                  <p className="text-muted-foreground text-sm max-w-[90%] mb-6 leading-relaxed">
                    Format, validate, and minify JSON data instantly with a beautiful editor.
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-semibold text-emerald-500 group-hover:text-emerald-500/80 transition-colors">
                    Launch Formatter <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* 2. Recommended PDF Tool */}
            <div className="group relative col-span-1 h-full">
              <Link to="/tools/pdf-edit" className="block h-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <FileText size={100} />
                </div>
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-fit px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase rounded mb-4 border border-primary/20">Featured Tool</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">PDF Editor</h2>
                  <p className="text-muted-foreground text-sm max-w-[90%] mb-6 leading-relaxed">
                    Edit, merge, split, and organize your PDF files with powerful, easy-to-use tools.
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    Launch Editor <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* 3. Recommended Image Tool */}
            <div className="group relative col-span-1 h-full">
              <Link to="/tools/image-compressor" className="block h-full bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <ImageIcon size={100} />
                </div>
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-fit px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase rounded mb-4 border border-primary/20">Most Popular</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">Image Compressor</h2>
                  <p className="text-muted-foreground text-sm max-w-[90%] mb-6 leading-relaxed">
                    Reduce image file sizes instantly without losing visible quality. Perfect for web optimization.
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    Launch Compressor <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </motion.div>
          
          {/* Canva-Style Recents & Pinned Hub */}
          {(pinnedToolObjects.length > 0 || recentToolObjects.length > 0) && (
            <div className="mb-16 border-b border-border/20 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Quick Access</h3>
                  <p className="text-sm text-muted-foreground font-medium">Jump back into your recent and pinned utilities.</p>
                </div>
                <div className="flex p-1 bg-muted/40 rounded-xl border border-border/40 relative self-start sm:self-center">
                  {['recent', 'pinned'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRecentFilter(tab)}
                      className={`relative px-6 py-2 text-sm font-semibold transition-colors duration-300 rounded-lg ${
                        recentFilter === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {recentFilter === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/50"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 capitalize">{tab}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredDisplayTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isPinned = pinnedTools.includes(tool.to);
                  return (
                    <motion.div
                      key={tool.to}
                      whileHover={{ scale: 1.02 }}
                      className="group bg-card hover:bg-muted/30 border border-border hover:border-primary/50 rounded-xl p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow"
                    >
                      {/* Subtle watermark background icon */}
                      <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-125 transition-all duration-500 pointer-events-none">
                        <ToolIcon size={80} />
                      </div>

                      {/* Mini Badge (Only show if Pinned) - Positioned Top Right */}
                      {isPinned && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 z-20 shadow-sm backdrop-blur-sm">
                          <Pin size={10} className="fill-current md:w-3 md:h-3" />
                          Pinned
                        </span>
                      )}

                      {/* Icon */}
                      <Link to={tool.to} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 z-10">
                        <ToolIcon size={20} className="md:w-[22px] md:h-[22px]" />
                      </Link>

                      {/* Content */}
                      <Link to={tool.to} className="flex-1 min-w-0 z-10 py-1 block">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {tool.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {tool.description}
                        </p>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All tools displayed below. */}
          {Object.entries(toolCategories).map(([categoryName, tools]) => {
            const safeId = categoryName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            return (
              <div key={categoryName} id={safeId} className="scroll-mt-32">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground/90 mb-8 border-b border-border/20 pb-3">
              {categoryName}
            </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              {tools.map(renderToolCard)}
            </motion.div>
            </div>
          )})}
        </div>
      </div>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
};

export default Dashboard;
