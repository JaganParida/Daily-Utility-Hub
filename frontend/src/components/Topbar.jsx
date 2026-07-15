import {
  User, LogOut, Search, Menu, X, ChevronDown, Layers, Moon, Sun, HelpCircle, Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHotkeys } from "react-hotkeys-hook";
import CommandPalette from "./CommandPalette";
import { toolCategories } from "../data/toolCategories";

const Topbar = ({ isScrolled, headerVisible = true }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMegamenuOpen, setIsMegamenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(Object.keys(toolCategories)[0]);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  const { currentUser: user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const megamenuRef = useRef(null);

  useEffect(() => {
    setIsMegamenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handler = (e) => {
      if (megamenuRef.current && !megamenuRef.current.contains(e.target)) setIsMegamenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useHotkeys("ctrl+k, meta+k", (e) => { e.preventDefault(); setIsPaletteOpen(true); }, { enableOnFormTags: true });

  // Dark mode toggle
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((p) => !p);
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  };

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: headerVisible ? 0 : -80, opacity: headerVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full fixed top-0 inset-x-0 z-50"
    >
      {/* Subtle border at bottom when scrolled */}
      <div className={`w-full transition-all duration-300 ${isScrolled ? "bg-[#0b0b0f]/80 backdrop-blur-xl border-b border-[#1e1e28]" : "bg-transparent"}`}>
        <div ref={megamenuRef} className="max-w-[1200px] mx-auto flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 md:px-8">

          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg shadow-[#7C5CFC]/20 group-hover:shadow-[#7C5CFC]/30 group-hover:scale-105 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
            </div>
            <span className="hidden sm:inline-block font-black text-[15px] tracking-tight text-white">UtilityHub</span>
          </Link>

          {/* CENTER: Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 mx-8">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                currentPath === "/" ? "text-white" : "text-[#8a8a9a] hover:text-white"
              }`}
            >
              Home
            </Link>

            {/* Tools dropdown */}
            <div onMouseEnter={() => setIsMegamenuOpen(true)} className="relative">
              <button
                onClick={() => setIsMegamenuOpen(p => !p)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  isMegamenuOpen || currentPath.startsWith("/tools") ? "text-white" : "text-[#8a8a9a] hover:text-white"
                }`}
              >
                Tools
                <ChevronDown size={13} className={`transition-transform duration-200 ${isMegamenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* ═══ MEGAMENU ═══ */}
              <AnimatePresence>
                {isMegamenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    onMouseLeave={() => setIsMegamenuOpen(false)}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[700px] bg-[#111116] border border-[#1e1e28] rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[200] overflow-hidden"
                  >
                    {/* Gradient accent strip */}
                    <div className="h-[2px] w-full bg-gradient-to-r from-[#7C5CFC] via-[#A78BFA] to-[#7C5CFC]" />

                    <div className="flex" style={{ minHeight: '360px' }}>
                      {/* Left: Categories */}
                      <div className="w-[180px] border-r border-[#1a1a22] flex flex-col py-2">
                        <p className="text-[8px] font-black text-[#3e3e4e] uppercase tracking-[0.2em] px-4 py-1.5">Browse</p>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5">
                          {Object.keys(toolCategories).map((catName) => {
                            const isActive = catName === activeCategory;
                            return (
                              <button
                                key={catName}
                                onMouseEnter={() => setActiveCategory(catName)}
                                className={`w-full px-3 py-[6px] text-left text-[11px] font-medium transition-all flex items-center justify-between cursor-pointer rounded relative ${
                                  isActive
                                    ? "text-white bg-[#ffffff06]"
                                    : "text-[#6a6a7a] hover:text-[#b0b0bc] hover:bg-[#ffffff03]"
                                }`}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="catIndicator"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#7C5CFC] rounded-r-full"
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                  />
                                )}
                                <span className="truncate">{catName}</span>
                                <span className={`text-[9px] tabular-nums shrink-0 ml-2 ${isActive ? "text-[#7C5CFC]" : "text-[#3e3e4e]"}`}>
                                  {toolCategories[catName].length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Tools */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {/* Header with search */}
                        <div className="px-4 py-2.5 border-b border-[#1a1a22] flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-bold text-white">{activeCategory}</h3>
                            <span className="text-[9px] text-[#3e3e4e] bg-[#1a1a22] px-1.5 py-0.5 rounded font-mono">{toolCategories[activeCategory]?.length}</span>
                          </div>
                          <button
                            onClick={() => { setIsMegamenuOpen(false); setIsPaletteOpen(true); }}
                            className="flex items-center gap-1 text-[10px] text-[#4a4a5a] hover:text-[#7C5CFC] transition-colors cursor-pointer"
                          >
                            <Search size={10} />
                            <span>Search</span>
                          </button>
                        </div>

                        {/* Tools grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5">
                          <div className="grid grid-cols-2 gap-[3px]">
                            {toolCategories[activeCategory]?.map((tool, idx) => {
                              const Icon = tool.icon;
                              const isCurrent = tool.to === currentPath;
                              return (
                                <Link
                                  key={tool.to}
                                  to={tool.to}
                                  onClick={() => setIsMegamenuOpen(false)}
                                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden ${
                                    isCurrent
                                      ? "bg-[#7C5CFC]/12 border-l-2 border-[#7C5CFC]"
                                      : "hover:bg-[#ffffff04] border-l-2 border-transparent hover:border-[#7C5CFC]/40"
                                  }`}
                                >
                                  <div className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center ${
                                    isCurrent
                                      ? "bg-[#7C5CFC]/20 text-[#7C5CFC]"
                                      : (tool.color || "bg-[#1a1a22] text-[#6a6a7a] group-hover:text-[#7C5CFC] group-hover:bg-[#7C5CFC]/8")
                                  } transition-colors`}>
                                    <Icon size={13} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[11px] font-semibold truncate ${
                                      isCurrent ? "text-[#7C5CFC]" : "text-[#b0b0bc] group-hover:text-white transition-colors"
                                    }`}>{tool.name}</p>
                                    <p className="text-[9px] leading-tight mt-0.5 text-[#3e3e4e] truncate">{tool.description}</p>
                                  </div>
                                  <svg className={`w-3 h-3 shrink-0 transition-all ${isCurrent ? "text-[#7C5CFC] opacity-100" : "text-[#3e3e4e] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                </Link>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-[#1a1a22] shrink-0">
                          <button
                            onClick={() => { setIsMegamenuOpen(false); setIsPaletteOpen(true); }}
                            className="text-[10px] text-[#4a4a5a] hover:text-[#7C5CFC] font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            Browse all tools
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg text-[#6a6a7a] hover:text-[#8a8a9a] transition-colors cursor-text"
            >
              <Search size={14} />
              <span className="hidden sm:inline text-[11px] font-medium">Search...</span>
              <div className="hidden md:flex items-center gap-0.5 text-[9px] font-bold text-[#5a5a6a] bg-[#1a1a22] border border-[#2a2a35] px-1.5 py-0.5 rounded ml-1">
                <span>⌘K</span>
              </div>
            </button>

             {/* How to use instruction help */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6a7a] hover:text-white transition-colors cursor-pointer"
              title="How to use instructions"
            >
              <HelpCircle size={15} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6a7a] hover:text-white transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                    currentPath === "/profile"
                      ? "text-[#7C5CFC]"
                      : "text-[#8a8a9a] hover:text-white"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#7C5CFC] text-white flex items-center justify-center font-black text-[10px]">
                    {(user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[70px] truncate">{user.name || user.displayName || 'Profile'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5a5a6a] hover:text-red-400 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white font-bold transition-all text-[11px]">
                Sign up
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(p => !p)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-[#8a8a9a] hover:text-white transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] flex lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/70" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#111116] border-r border-[#1e1e28] shadow-2xl flex flex-col overflow-hidden z-[160]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a22]">
                <span className="font-black text-[15px] tracking-tight text-white">UtilityHub</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-[#1a1a22] rounded-lg text-[#6a6a7a] hover:text-white cursor-pointer"><X size={14} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-0.5">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${currentPath === "/" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Home
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${currentPath === "/profile" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Profile
                </Link>

                <div className="pt-3 mt-2 border-t border-[#1a1a22]">
                  <p className="text-[9px] font-black text-[#4a4a5a] uppercase tracking-[0.15em] px-3 mb-2">Tools</p>
                  {Object.keys(toolCategories).map((catName) => (
                    <div key={catName}>
                      <button
                        onClick={() => setMobileExpandedCat(mobileExpandedCat === catName ? null : catName)}
                        className="w-full px-3 py-2 rounded-lg text-left text-[11px] font-semibold text-[#8a8a9a] hover:text-white flex items-center justify-between cursor-pointer hover:bg-[#ffffff05]"
                      >
                        <span>{catName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[#4a4a5a]">{toolCategories[catName].length}</span>
                          <ChevronDown size={11} className={`transition-transform text-[#4a4a5a] ${mobileExpandedCat === catName ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {mobileExpandedCat === catName && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden pl-4 space-y-0.5 border-l border-[#1a1a22] ml-4 mb-1">
                            {toolCategories[catName].map((tool) => (
                              <Link
                                key={tool.to}
                                to={tool.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${tool.to === currentPath ? "text-[#7C5CFC] bg-[#7C5CFC]/10" : "text-[#5a5a6a] hover:text-white hover:bg-[#ffffff06]"}`}
                              >
                                {tool.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {user && (
                <div className="border-t border-[#1a1a22] p-3">
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Instructions Modal Overlay */}
      <AnimatePresence>
        {isInfoOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInfoOpen(false)}
              className="absolute inset-0 bg-[#0b0b0f]/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative z-10 w-full max-w-[460px] bg-[#111116] border border-[#1e1e28] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-[#7C5CFC] via-[#A78BFA] to-[#7C5CFC]" />

              <div className="p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">How to Use UtilityHub</h3>
                  <button onClick={() => setIsInfoOpen(false)} className="p-1 hover:bg-[#1a1a22] rounded-lg text-[#6a6a7a] hover:text-white cursor-pointer transition-colors"><X size={14} /></button>
                </div>

                {/* Body Content */}
                <div className="space-y-4 text-xs text-[#8a8a9a]">
                  <p className="leading-relaxed">
                    UtilityHub runs all operations <span className="text-[#A78BFA] font-bold">100% locally</span> on your device. We never upload your files to any server.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] font-black text-[10px] shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="font-bold text-white mb-0.5">Select a file (Optional)</p>
                        <p className="leading-relaxed">Drop a file into the workspace or click "Select file". The system will auto-detect compatible operations.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] font-black text-[10px] shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="font-bold text-white mb-0.5">Choose Format & Operation</p>
                        <p className="leading-relaxed">Select your target format and the specific operation you'd like to perform from the dropdowns.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] font-black text-[10px] shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="font-bold text-white mb-0.5">Launch & Process</p>
                        <p className="leading-relaxed">Click "Launch" to start processing instantly. Once done, you'll see the download link or options.</p>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Alert */}
                  <div className="mt-5 p-3 rounded-lg bg-[#7C5CFC]/5 border border-[#7C5CFC]/15 flex gap-2.5 items-start">
                    <Shield size={14} className="text-[#7C5CFC] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white mb-0.5">Privacy First</p>
                      <p className="leading-relaxed text-[11px]">Since everything is local, your files are secure and private. Ideal for processing confidential documents.</p>
                    </div>
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
