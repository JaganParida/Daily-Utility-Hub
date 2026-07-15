import {
  User,
  LogOut,
  Search,
  ArrowLeft,
  Layers,
  Pin,
  Clock,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHotkeys } from "react-hotkeys-hook";

import CommandPalette from "./CommandPalette";
import { toolCategories } from "../data/toolCategories";

const Topbar = ({ isScrolled, headerVisible = true }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMegamenuOpen, setIsMegamenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { currentUser: user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const megamenuRef = useRef(null);

  // Identify which category contains the currently active tool page
  const activeCategoryOfCurrentTool = Object.keys(toolCategories).find(catName => 
    toolCategories[catName].some(tool => tool.to === currentPath)
  );

  // Set default active tab inside Megamenu to the category of the tool currently viewed, or "Developer Tools"
  const [activeCategory, setActiveCategory] = useState('Developer Tools');
  
  useEffect(() => {
    if (activeCategoryOfCurrentTool) {
      setActiveCategory(activeCategoryOfCurrentTool);
    }
  }, [activeCategoryOfCurrentTool, isMegamenuOpen]);

  // Mobile navigation accordion categories
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  // Close menus on path changes
  useEffect(() => {
    setIsMegamenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // Handle click outside to close megamenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megamenuRef.current && !megamenuRef.current.contains(event.target)) {
        setIsMegamenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Hotkey for Command Palette (Ctrl+K)
  useHotkeys(
    "ctrl+k, meta+k",
    (e) => {
      e.preventDefault();
      setIsPaletteOpen(true);
    },
    { enableOnFormTags: true },
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ 
        y: headerVisible ? 0 : -100, 
        opacity: headerVisible ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-12 lg:px-20 xl:px-32 bg-transparent z-50 fixed top-0 inset-x-0 mt-4 transition-all duration-300 ${
        isScrolled ? "h-16" : "h-20"
      }`}
    >
      <div 
        ref={megamenuRef} 
        className="w-full flex items-center justify-between bg-card/60 dark:bg-card/40 border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl h-full px-5 md:px-8 rounded-[24px] relative"
      >
        {/* LEFT: Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-foreground flex items-center justify-center text-background shadow-md transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="hidden sm:inline-block font-black text-xl tracking-tighter text-foreground whitespace-nowrap">
              UtilityHub
            </span>
          </Link>
        </div>

        {/* CENTER: Desktop Navigation Menus */}
        <nav className="hidden lg:flex items-center gap-1.5 mx-6">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPath === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            Dashboard
          </Link>

          {/* Tools Megamenu Trigger */}
          <div 
            onMouseEnter={() => setIsMegamenuOpen(true)}
            className="relative"
          >
            <button
              onClick={() => setIsMegamenuOpen(prev => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMegamenuOpen || currentPath.startsWith("/tools")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <span>Tools Directory</span>
              <ChevronDown 
                size={13} 
                className={`transition-transform duration-300 ${isMegamenuOpen ? "rotate-180" : ""}`} 
              />
            </button>

            {/* Desktop Megamenu Panel */}
            <AnimatePresence>
              {isMegamenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onMouseLeave={() => setIsMegamenuOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[840px] bg-card/95 border border-border/80 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden z-[100] flex min-h-[460px] p-2.5"
                >
                  {/* Left Column: Categories List */}
                  <div className="w-[260px] pr-2.5 flex flex-col gap-1 border-r border-border/50 p-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center gap-1">
                      <Layers size={10} /> Categories
                    </h4>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[380px] pr-0.5 space-y-0.5">
                      {Object.keys(toolCategories).map((catName) => {
                        const isActive = catName === activeCategory;
                        const isCurrentCategory = catName === activeCategoryOfCurrentTool;
                        const toolsCount = toolCategories[catName].length;

                        return (
                          <button
                            key={catName}
                            onMouseEnter={() => setActiveCategory(catName)}
                            className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                              isActive
                                ? "bg-primary/10 text-primary border border-primary/10"
                                : isCurrentCategory
                                ? "bg-muted/40 text-foreground border border-border/40 hover:bg-muted/70"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {catName}
                              {isCurrentCategory && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-muted border border-border/40 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                              {toolsCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Tools Grid */}
                  <div className="flex-1 p-4 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="border-b border-border/50 pb-3 mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-foreground">{activeCategory}</h3>
                        <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                          {toolCategories[activeCategory].length} operations
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Client-side utilities. Double click to launch or click pin.
                      </p>
                    </div>

                    {/* Tools list container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2.5 max-h-[350px] pr-1.5">
                      {toolCategories[activeCategory].map((tool) => {
                        const Icon = tool.icon;
                        const isCurrentTool = tool.to === currentPath;

                        return (
                          <Link
                            key={tool.to}
                            to={tool.to}
                            onClick={() => setIsMegamenuOpen(false)}
                            className={`group flex gap-3 p-3 rounded-xl border transition-all text-left relative ${
                              isCurrentTool
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "border-border/60 bg-muted/10 hover:bg-muted/40 hover:border-primary/25"
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                              isCurrentTool
                                ? "bg-white/20 text-white"
                                : tool.color || "bg-primary/10 text-primary"
                            }`}>
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                              <h5 className={`text-xs font-black truncate ${
                                isCurrentTool ? "text-white" : "text-foreground group-hover:text-primary transition-colors"
                              }`}>
                                {tool.name}
                              </h5>
                              <p className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${
                                isCurrentTool ? "text-white/80" : "text-muted-foreground"
                              }`}>
                                {tool.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/pinned"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPath === "/pinned"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            Pinned Tools
          </Link>
        </nav>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mac Search Trigger (Ctrl+K) */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/20 border border-border/80 hover:border-primary/40 hover:bg-muted/45 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-inner"
            title="Search Utilities (Ctrl+K)"
          >
            <Search size={16} />
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  currentPath === "/profile"
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted/10 border-border/80 hover:border-primary/30 text-foreground hover:bg-muted/40"
                }`}
                title="View Profile Settings"
              >
                <div className="w-5 h-5 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-black text-[9px] shrink-0 border border-primary/20">
                  {(user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline-block max-w-[90px] truncate">
                  {user.name || user.displayName || 'Profile'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/10 border border-border/80 hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all cursor-pointer group"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow hover:scale-[1.02] text-xs"
            >
              <User size={13} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Hamburger Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl bg-muted/20 border border-border/80 hover:border-primary/40 hover:bg-muted/45 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Toggle Menu"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Global Command Search Overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* Mobile Drawer sliding overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 h-full w-[290px] sm:w-[330px] bg-card border-r border-border shadow-2xl flex flex-col p-5 overflow-hidden z-[160]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 shrink-0 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background">
                    <svg className="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                    </svg>
                  </div>
                  <span className="font-black text-lg tracking-tighter text-foreground">UtilityHub</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body: Navigation Items */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
                {/* Core pages */}
                <div className="space-y-1">
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                      currentPath === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    Dashboard View
                  </Link>
                  <Link
                    to="/pinned"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                      currentPath === "/pinned" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    Pinned Tools
                  </Link>
                </div>

                {/* Categories & accordion folders */}
                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
                    <Layers size={10} /> Tool Categories
                  </h4>
                  
                  <div className="space-y-1 border-l border-border/80 ml-3.5 pl-2.5">
                    {Object.keys(toolCategories).map((catName) => {
                      const isExpanded = mobileExpandedCat === catName;
                      const hasActiveChild = toolCategories[catName].some(t => t.to === currentPath);

                      return (
                        <div key={catName} className="space-y-1">
                          <button
                            onClick={() => setMobileExpandedCat(isExpanded ? null : catName)}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              hasActiveChild
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                            }`}
                          >
                            <span>{catName}</span>
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 text-muted-foreground ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {/* Expanded category items */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden space-y-0.5 pl-3 border-l border-border/50 ml-1.5"
                              >
                                {toolCategories[catName].map((tool) => {
                                  const isCurrentTool = tool.to === currentPath;
                                  return (
                                    <Link
                                      key={tool.to}
                                      to={tool.to}
                                      className={`block px-2.5 py-1.5 rounded-md text-[11px] font-medium leading-tight ${
                                        isCurrentTool
                                          ? "text-primary bg-primary/10 border border-primary/10 font-bold"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      {tool.name}
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Topbar;
