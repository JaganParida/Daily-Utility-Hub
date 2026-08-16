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
  Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { allTools, toolCategories } from "../data/toolCategories";

const CATEGORY_ITEMS = [
  { id: "pdf", label: "PDF Tools", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6] border-[#fad2cf]", count: 14 },
  { id: "image", label: "Image Studio", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea] border-[#ceead6]", count: 10 },
  { id: "code", label: "Developer", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]", count: 19 },
  { id: "spreadsheet", label: "Spreadsheets", icon: Table2, color: "text-[#b06000] bg-[#fef7e0] border-[#feefc3]", count: 7 },
  { id: "document", label: "Word & Docs", icon: FileSpreadsheet, color: "text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]", count: 11 },
  { id: "presentation", label: "Slides & PPT", icon: MonitorPlay, color: "text-[#7627bb] bg-[#f3e8fd] border-[#e9d2fd]", count: 8 },
  { id: "archive", label: "Vault & Files", icon: FolderArchive, color: "text-[#007b83] bg-[#e0f2f1] border-[#b2dfdb]", count: 4 },
  { id: "media", label: "Media & Math", icon: Music, color: "text-[#c2185b] bg-[#fce4ec] border-[#f8bbd0]", count: 7 },
];

const Topbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchInputRef = useRef(null);
  const categoryMenuRef = useRef(null);
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
        setIsCategoryMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
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
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  // Filter tools for Command Palette search
  const searchResults = searchQuery.trim() === "" 
    ? allTools.slice(0, 8) 
    : allTools.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#dadce0] transition-all">
        <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand Logo with Google/CloudConvert clean typography */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a73e8] group-hover:text-[#1557b0] transition-colors" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#202124]">
                  Utility<span className="text-[#1a73e8]">Hub</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#e6f4ea] text-[#137333] border border-[#ceead6] hidden sm:inline-block">
                  Offline
                </span>
              </div>
            </Link>

            {/* Desktop Categories Mega Menu Button */}
            <div ref={categoryMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCategoryMenuOpen
                    ? "bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]"
                    : "bg-[#f8f9fa] border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
              >
                <Layers size={14} className={isCategoryMenuOpen ? "text-[#1a73e8]" : "text-[#5f6368]"} />
                <span>Categories</span>
                <ChevronDown size={13} className={`transition-transform ${isCategoryMenuOpen ? "rotate-180 text-[#1a73e8]" : "text-[#5f6368]"}`} />
              </button>

              {/* Categories Megamenu Dropdown */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.99 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-2 w-[540px] bg-white border border-[#dadce0] rounded-2xl shadow-xl p-3 z-50 grid grid-cols-2 gap-2"
                  >
                    {CATEGORY_ITEMS.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setIsCategoryMenuOpen(false);
                            navigate(`/search`);
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent hover:border-[#dadce0] transition-all text-left group cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${cat.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#202124] group-hover:text-[#1a73e8] transition-colors truncate">
                                {cat.label}
                              </span>
                              <span className="text-[10px] font-semibold text-[#80868b] group-hover:text-[#5f6368]">
                                {cat.count} tools
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Google-Style Omnibox Search Bar Trigger */}
          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-9 px-3.5 rounded-lg bg-[#f1f3f4] hover:bg-[#e8eaed] border border-transparent hover:border-[#dadce0] text-[#5f6368] hover:text-[#202124] flex items-center justify-between text-xs font-medium transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search size={14} className="text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                <span className="truncate">Search 90+ client-side tools...</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-[#dadce0] text-[10px] font-mono text-[#5f6368]">
                <Command size={10} /> K
              </div>
            </button>
          </div>

          {/* Right Navigation & User Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile search trigger icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-lg bg-[#f8f9fa] border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
            >
              <Search size={15} />
            </button>

            {/* Quick Workspace Nav Badges */}
            <Link
              to="/pinned"
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                location.pathname === "/pinned"
                  ? "bg-[#e8f0fe] border-[#d2e3fc] text-[#1a73e8]"
                  : "bg-[#f8f9fa] border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <Pin size={12} className="text-[#1a73e8]" />
              <span>Pinned</span>
            </Link>

            <Link
              to="/favorites"
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                location.pathname === "/favorites"
                  ? "bg-[#fce8e6] border-[#fad2cf] text-[#ea4335]"
                  : "bg-[#f8f9fa] border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <Heart size={12} className="text-[#ea4335]" />
              <span>Favorites</span>
            </Link>

            {/* Privacy Telemetry Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] border border-[#ceead6] text-[11px] font-semibold text-[#137333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34a853] animate-pulse" />
              <span>100% Client-Side</span>
            </div>

            {/* User Account / Auth Button */}
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
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(60,64,67,0.15)] p-1.5 z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-[#dadce0] mb-1">
                        <p className="text-xs font-bold text-[#202124] truncate">{currentUser.name || "User Account"}</p>
                        <p className="text-[11px] text-[#5f6368] truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                      >
                        <User size={14} className="text-[#1a73e8]" />
                        Account Settings
                      </Link>
                      <Link
                        to="/pinned"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                      >
                        <Pin size={14} className="text-[#1a73e8]" />
                        Pinned Workspaces
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                      >
                        <Heart size={14} className="text-[#ea4335]" />
                        Favorites
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#ea4335] hover:bg-[#fce8e6] transition-colors cursor-pointer text-left mt-1 border-t border-[#dadce0]"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Google-Style Command Palette Search Modal (Cmd+K) ═══ */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4">
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
                  placeholder="Search 90+ tools (e.g. PDF, Image, JSON, Regex, Vault)..."
                  className="w-full bg-transparent text-sm text-[#202124] placeholder-[#80868b] focus:outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-0.5 rounded-md bg-[#e8eaed] text-[10px] font-mono text-[#5f6368] hover:bg-[#dadce0] hover:text-[#202124]"
                >
                  ESC
                </button>
              </div>

              {/* Results List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((tool) => {
                    const ToolIcon = tool.icon || Zap;
                    return (
                      <button
                        key={tool.to}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(tool.to);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f1f3f4] border border-transparent hover:border-[#dadce0] transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] text-[#1a73e8] group-hover:bg-[#1a73e8] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                            <ToolIcon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#202124] group-hover:text-[#1a73e8] transition-colors truncate">
                              {tool.name}
                            </p>
                            <p className="text-[11px] text-[#5f6368] truncate mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-semibold text-[#5f6368] px-2 py-0.5 rounded-full bg-[#f1f3f4] border border-[#dadce0]">
                            {tool.category || "Utility"}
                          </span>
                          <ArrowRight size={13} className="text-[#80868b] group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all" />
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
