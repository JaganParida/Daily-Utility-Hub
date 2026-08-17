import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  Shield,
  Layers,
  Heart,
  Pin,
  Clock,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileText,
  ImageIcon,
  Code2,
  Table2,
  FileSpreadsheet,
  MonitorPlay,
  FolderArchive,
  Music,
  Sparkles,
  Command,
  ArrowRight,
  Sliders,
  Cpu,
  Check,
  LayoutGrid,
  Lock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { allTools, toolCategories } from "../data/toolCategories";

const CATEGORY_ITEMS = [
  { id: "pdf", label: "PDF Tools", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6] border-[#fad2cf]", count: 14, to: "/search" },
  { id: "image", label: "Image Studio", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea] border-[#ceead6]", count: 10, to: "/search" },
  { id: "code", label: "Developer", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]", count: 19, to: "/search" },
  { id: "spreadsheet", label: "Spreadsheets", icon: Table2, color: "text-[#b06000] bg-[#fef7e0] border-[#feefc3]", count: 7, to: "/search" },
  { id: "document", label: "Word & Docs", icon: FileSpreadsheet, color: "text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]", count: 11, to: "/search" },
  { id: "presentation", label: "Slides & PPT", icon: MonitorPlay, color: "text-[#7627bb] bg-[#f3e8fd] border-[#e9d2fd]", count: 8, to: "/search" },
  { id: "archive", label: "Vault & Security", icon: Lock, color: "text-[#007b83] bg-[#e0f2f1] border-[#b2dfdb]", count: 4, to: "/search" },
  { id: "media", label: "Media & Math", icon: Music, color: "text-[#c2185b] bg-[#fce4ec] border-[#f8bbd0]", count: 7, to: "/search" },
];

const Topbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const searchInputRef = useRef(null);
  const appsMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Keyboard shortcut for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsAppsMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (appsMenuRef.current && !appsMenuRef.current.contains(e.target)) {
        setIsAppsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Reset selected index whenever search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsAppsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Filter tools for Command Palette search (deduplicated)
  const searchResults = searchQuery.trim() === "" 
    ? allTools.slice(0, 8) 
    : allTools.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        setIsSearchOpen(false);
        navigate(searchResults[selectedIndex].to);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          FLAT GOOGLE-STYLE FULL-WIDTH NAVBAR (NO BUBBLE / NO CONTAINER)
      ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-[#dadce0] transition-all">
        <div className="w-full max-w-7xl mx-auto h-14 sm:h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Mobile Hamburger + Clean Google-Style Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-lg text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center shadow-xs group-hover:bg-[#1557b0] transition-colors">
                <Zap size={18} fill="currentColor" />
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-[#202124]">
                  Utility<span className="text-[#1a73e8] font-bold">Hub</span>
                </span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#e6f4ea] text-[#137333] border border-[#ceead6] hidden sm:inline-block">
                  100% Local
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-2">
              <Link
                to="/search"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === "/search"
                    ? "text-[#1a73e8] bg-[#e8f0fe] font-semibold"
                    : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
              >
                All Tools
              </Link>
              <Link
                to="/pinned"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === "/pinned"
                    ? "text-[#1a73e8] bg-[#e8f0fe] font-semibold"
                    : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
              >
                <Pin size={12} className="text-[#1a73e8]" />
                <span>Pinned</span>
              </Link>
              <Link
                to="/favorites"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === "/favorites"
                    ? "text-[#ea4335] bg-[#fce8e6] font-semibold"
                    : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
              >
                <Heart size={12} className="text-[#ea4335]" />
                <span>Favorites</span>
              </Link>
            </nav>
          </div>

          {/* Center: Google Omnibox Search Bar (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-1 max-w-lg mx-3 lg:mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-10 px-4 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] border border-transparent hover:border-[#dadce0] text-[#5f6368] hover:text-[#202124] flex items-center justify-between text-xs sm:text-sm font-normal transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search size={16} className="text-[#5f6368] group-hover:text-[#1a73e8] transition-colors shrink-0" />
                <span className="truncate text-xs sm:text-sm">Search 90+ client-side tools...</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#dadce0] text-[10px] font-mono text-[#5f6368] shadow-2xs shrink-0">
                <Command size={10} /> K
              </div>
            </button>
          </div>

          {/* Right: Search (Mobile), Google-Style App Grid Launcher, Privacy Tag & User Avatar */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Mobile Search Icon Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
              title="Search tools"
              aria-label="Search tools"
            >
              <Search size={20} />
            </button>

            {/* Google Apps 9-Dot Launcher Button */}
            <div ref={appsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isAppsMenuOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
                title="Utility Categories"
                aria-label="Google-style Apps Launcher"
              >
                <LayoutGrid size={20} />
              </button>

              {/* Google Apps Style Launcher Menu */}
              <AnimatePresence>
                {isAppsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full right-0 mt-2.5 w-[320px] sm:w-[360px] bg-white border border-[#dadce0] rounded-3xl shadow-[0_4px_24px_rgba(60,64,67,0.2)] p-4 z-50 grid grid-cols-3 gap-2"
                  >
                    {CATEGORY_ITEMS.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setIsAppsMenuOpen(false);
                            navigate(cat.to);
                          }}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f1f3f4] transition-colors text-center group cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border mb-1.5 shadow-2xs group-hover:scale-105 transition-transform ${cat.color}`}>
                            <Icon size={18} />
                          </div>
                          <span className="text-[11px] font-medium text-[#202124] group-hover:text-[#1a73e8] truncate w-full">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Privacy Telemetry Tag */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] border border-[#ceead6] text-[11px] font-semibold text-[#137333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34a853] animate-pulse" />
              <span>0KB Cloud</span>
            </div>

            {/* Google User Avatar / Sign In */}
            {currentUser ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-[#dadce0] text-xs font-bold text-[#202124] transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline-block max-w-[90px] truncate">{currentUser.name || "Account"}</span>
                  <ChevronDown size={12} className="text-[#5f6368]" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-full right-0 mt-2.5 w-60 bg-white border border-[#dadce0] rounded-2xl shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[#dadce0] mb-1">
                        <p className="text-xs font-bold text-[#202124] truncate">{currentUser.name || "User Account"}</p>
                        <p className="text-[11px] text-[#5f6368] truncate">{currentUser.email || "Offline Mode Active"}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition-colors"
                      >
                        <User size={14} className="text-[#1a73e8]" />
                        Workspace Profile
                      </Link>
                      <Link
                        to="/pinned"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition-colors"
                      >
                        <Pin size={14} className="text-[#1a73e8]" />
                        Pinned Utilities
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition-colors"
                      >
                        <Heart size={14} className="text-[#ea4335]" />
                        Favorite Tools
                      </Link>

                      <div className="pt-1 mt-1 border-t border-[#dadce0]">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#ea4335] hover:bg-[#fce8e6] rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-all shadow-2xs active:scale-[0.98]"
                >
                  Sign in
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MOBILE NAVIGATION DRAWER / SHEET
        ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden w-full border-t border-[#dadce0] bg-white px-4 py-3 shadow-lg"
            >
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#dadce0]">
                <Link
                  to="/search"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8f9fa] text-xs font-semibold text-[#202124]"
                >
                  <Layers size={15} className="text-[#1a73e8]" />
                  <span>All 90+ Tools</span>
                </Link>
                <Link
                  to="/pinned"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8f9fa] text-xs font-semibold text-[#202124]"
                >
                  <Pin size={15} className="text-[#1a73e8]" />
                  <span>Pinned</span>
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8f9fa] text-xs font-semibold text-[#202124]"
                >
                  <Heart size={15} className="text-[#ea4335]" />
                  <span>Favorites</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8f9fa] text-xs font-semibold text-[#202124]"
                >
                  <User size={15} className="text-[#34a853]" />
                  <span>Profile</span>
                </Link>
              </div>

              <div className="pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#80868b] mb-2">
                  Browse by Category
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORY_ITEMS.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.id}
                        to={cat.to}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-[#202124] hover:bg-[#f1f3f4]"
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${cat.color}`}>
                          <Icon size={13} />
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ Google-Style Command Palette Search Modal (Cmd+K) ═══ */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-white border border-[#dadce0] rounded-2xl shadow-[0_8px_32px_rgba(60,64,67,0.24)] overflow-hidden z-10 flex flex-col"
            >
              {/* Input Area */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#dadce0] bg-[#f8f9fa]">
                <Search size={18} className="text-[#1a73e8] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search 90+ tools (e.g. PDF, Image, JSON, Regex, Vault)..."
                  className="w-full bg-transparent text-sm text-[#202124] placeholder-[#80868b] focus:outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-0.5 rounded-md bg-[#e8eaed] text-[10px] font-mono text-[#5f6368] hover:bg-[#dadce0] hover:text-[#202124] cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Results List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((tool, index) => {
                    const ToolIcon = tool.icon || Zap;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={tool.to}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(tool.to);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                          isSelected
                            ? 'bg-[#e8f0fe] border border-[#d2e3fc] shadow-2xs'
                            : 'hover:bg-[#f1f3f4] border border-transparent hover:border-[#dadce0]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                            isSelected
                              ? 'bg-[#1a73e8] text-white'
                              : 'bg-[#e8f0fe] text-[#1a73e8] group-hover:bg-[#1a73e8] group-hover:text-white'
                          }`}>
                            <ToolIcon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold transition-colors truncate ${
                              isSelected ? 'text-[#1a73e8]' : 'text-[#202124] group-hover:text-[#1a73e8]'
                            }`}>
                              {tool.name}
                            </p>
                            <p className="text-[11px] text-[#5f6368] truncate mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isSelected 
                              ? 'bg-white text-[#1a73e8] border-[#d2e3fc]' 
                              : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                          }`}>
                            {tool.category || "Utility"}
                          </span>
                          <ArrowRight size={13} className={`transition-all ${
                            isSelected ? 'text-[#1a73e8] translate-x-0.5' : 'text-[#80868b] group-hover:text-[#1a73e8] group-hover:translate-x-0.5'
                          }`} />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[#5f6368] text-xs">
                    No tools found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Bottom Command Hint */}
              <div className="px-4 py-2.5 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between text-[11px] text-[#5f6368]">
                <span>Navigate with <kbd className="font-mono text-[#202124] bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">↑</kbd> <kbd className="font-mono text-[#202124] bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">↓</kbd></span>
                <span>Press <kbd className="font-mono text-[#202124] bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">Enter</kbd> to launch</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Topbar;
