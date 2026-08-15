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
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { allTools, toolCategories } from "../data/toolCategories";

const CATEGORY_ITEMS = [
  { id: "pdf", label: "PDF Tools", icon: FileText, color: "text-rose-400 bg-rose-500/10 border-rose-500/20", count: 14 },
  { id: "image", label: "Image Studio", icon: ImageIcon, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", count: 10 },
  { id: "code", label: "Developer", icon: Code2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", count: 19 },
  { id: "spreadsheet", label: "Spreadsheets", icon: Table2, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", count: 7 },
  { id: "document", label: "Word & Docs", icon: FileSpreadsheet, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", count: 11 },
  { id: "presentation", label: "Slides & PPT", icon: MonitorPlay, color: "text-purple-400 bg-purple-500/10 border-purple-500/20", count: 8 },
  { id: "archive", label: "Vault & Files", icon: FolderArchive, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", count: 4 },
  { id: "media", label: "Media & Math", icon: Music, color: "text-pink-400 bg-pink-500/10 border-pink-500/20", count: 7 },
];

const Topbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategoryHover, setActiveCategoryHover] = useState("pdf");

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
      <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 pointer-events-none">
        <nav className="max-w-7xl mx-auto h-14 sm:h-16 px-3.5 sm:px-5 rounded-2xl glass-floating-nav flex items-center justify-between pointer-events-auto transition-all">
          
          {/* Brand Logo & Live Engine Badge */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[10px] bg-[#0c0e17] flex items-center justify-center">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-white">
                    Utility<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Hub</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
                    Pro
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Categories Menu Button */}
            <div ref={categoryMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCategoryMenuOpen
                    ? "bg-[#181b28] border-indigo-500/50 text-white shadow-sm"
                    : "bg-[#141722]/80 border-[#1e2235] text-slate-300 hover:text-white hover:bg-[#181b28]"
                }`}
              >
                <Layers size={14} className="text-indigo-400" />
                <span>Categories</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${isCategoryMenuOpen ? "rotate-180 text-indigo-400" : ""}`} />
              </button>

              {/* Categories Megamenu Dropdown */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2.5 w-[580px] bg-[#0f1118]/95 backdrop-blur-2xl border border-[#1e2235] rounded-2xl shadow-2xl p-3 z-50 grid grid-cols-2 gap-2"
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
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141722]/60 hover:bg-[#181b28] border border-transparent hover:border-[#262b40] transition-all text-left group cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${cat.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                                {cat.label}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-400">
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

          {/* Center: Command Bar Trigger */}
          <div className="flex-1 max-w-md mx-3 hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-9 px-3.5 rounded-xl bg-[#141722]/80 hover:bg-[#181b28] border border-[#1e2235] hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 flex items-center justify-between text-xs font-medium transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span className="truncate">Search 90+ tools instantly...</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e2235] border border-white/5 text-[10px] font-mono text-slate-300">
                <Command size={10} /> K
              </div>
            </button>
          </div>

          {/* Right Navigation & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search trigger icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-[#141722] border border-[#1e2235] text-slate-300 hover:text-white"
            >
              <Search size={16} />
            </button>

            {/* Quick Workspace Nav Badges */}
            <Link
              to="/pinned"
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                location.pathname === "/pinned"
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                  : "bg-[#141722]/60 border-[#1e2235] text-slate-300 hover:text-white hover:bg-[#181b28]"
              }`}
            >
              <Pin size={12} className="text-indigo-400" />
              <span>Pinned</span>
            </Link>

            <Link
              to="/favorites"
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                location.pathname === "/favorites"
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-[#141722]/60 border-[#1e2235] text-slate-300 hover:text-white hover:bg-[#181b28]"
              }`}
            >
              <Heart size={12} className="text-rose-400" />
              <span>Favorites</span>
            </Link>

            {/* Privacy Telemetry Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141722] border border-[#1e2235] text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Client-Side</span>
            </div>

            {/* User Account / Auth Button */}
            {currentUser ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#141722] hover:bg-[#181b28] border border-[#1e2235] text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-black text-white">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline-block max-w-[90px] truncate">{currentUser.name || "User"}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#0f1118]/95 backdrop-blur-xl border border-[#1e2235] rounded-2xl shadow-2xl p-1.5 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[#1e2235] mb-1">
                        <p className="text-xs font-bold text-white truncate">{currentUser.name || "User Account"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#181b28] transition-colors"
                      >
                        <User size={14} className="text-indigo-400" />
                        Account Settings
                      </Link>
                      <Link
                        to="/pinned"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#181b28] transition-colors"
                      >
                        <Pin size={14} className="text-indigo-400" />
                        Pinned Workspaces
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#181b28] transition-colors"
                      >
                        <Heart size={14} className="text-rose-400" />
                        Favorites
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1 border-t border-[#1e2235]"
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
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ═══ Command Palette Search Modal (Cmd+K) ═══ */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-[#0f1118] border border-[#1e2235] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col"
            >
              {/* Input Area */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e2235] bg-[#141722]/50">
                <Search size={18} className="text-indigo-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search all 90+ utilities..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-1 rounded bg-[#1e2235] text-[10px] font-mono text-slate-400 hover:text-white"
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
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181b28] border border-transparent hover:border-[#262b40] transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#141722] group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                            <ToolIcon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                              {tool.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-[#141722]">
                            {tool.category || "Utility"}
                          </span>
                          <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No tools found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Bottom Command Hint */}
              <div className="px-4 py-2 border-t border-[#1e2235] bg-[#0c0e17] flex items-center justify-between text-[11px] text-slate-500">
                <span>Navigate with <kbd className="font-mono text-slate-400">↑</kbd> <kbd className="font-mono text-slate-400">↓</kbd></span>
                <span>Press <kbd className="font-mono text-slate-400">Enter</kbd> to launch</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Topbar;
