import {
  User, LogOut, Search, Menu, X, ChevronDown, Layers, Moon, Sun, HelpCircle, Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHotkeys } from "react-hotkeys-hook";
import { toolCategories } from "../data/toolCategories";

const Topbar = ({ isScrolled, headerVisible = true }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null); // 'tools' | 'instructions' | null
  const [activeCategory, setActiveCategory] = useState(Object.keys(toolCategories)[0]);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  const { currentUser: user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const megamenuRef = useRef(null);

  useEffect(() => {
    setHoveredTab(null);
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handler = (e) => {
      if (megamenuRef.current && !megamenuRef.current.contains(e.target)) setHoveredTab(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useHotkeys("ctrl+k, meta+k", (e) => { e.preventDefault(); navigate('/search'); }, { enableOnFormTags: true });



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

          {/* CENTER: Nav (Stripe/CloudConvert style morphing megamenu) */}
          <nav className="hidden lg:flex items-center gap-1.5 mx-8 h-full" onMouseLeave={() => setHoveredTab(null)}>
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                currentPath === "/" ? "text-white" : "text-[#8a8a9a] hover:text-white"
              }`}
            >
              Home
            </Link>

            {/* Tools hover wrapper */}
            <div className="relative py-4" onMouseEnter={() => setHoveredTab("tools")}>
              <button
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  hoveredTab === "tools" || currentPath.startsWith("/tools") ? "text-white" : "text-[#8a8a9a] hover:text-white"
                }`}
              >
                Tools
                <ChevronDown size={12} className={`transition-transform duration-200 ${hoveredTab === "tools" ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Instructions hover wrapper */}
            <div className="relative py-4" onMouseEnter={() => setHoveredTab("instructions")}>
              <button
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  hoveredTab === "instructions" ? "text-white" : "text-[#8a8a9a] hover:text-white"
                }`}
              >
                Instructions
                <ChevronDown size={12} className={`transition-transform duration-200 ${hoveredTab === "instructions" ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Morphing Dropdown Panel */}
            <AnimatePresence>
              {hoveredTab && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute top-[85%] left-1/2 -translate-x-1/2 mt-1 bg-[#111116] border border-[#1e1e28] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden`}
                  layoutId="morphingDropdown"
                  style={{ width: hoveredTab === "tools" ? "700px" : "850px" }}
                >
                  {/* Top gradient bar */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#7C5CFC] via-[#A78BFA] to-[#7C5CFC]" />

                  {hoveredTab === "tools" ? (
                    /* ─── TOOLS MEGAMENU CONTENT ─── */
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

                      {/* Right: Tools List */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="px-4 py-2.5 border-b border-[#1a1a22] flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-bold text-white">{activeCategory}</h3>
                            <span className="text-[9px] text-[#3e3e4e] bg-[#1a1a22] px-1.5 py-0.5 rounded font-mono">{toolCategories[activeCategory]?.length}</span>
                          </div>
                          <button
                            onClick={() => { setHoveredTab(null); setIsPaletteOpen(true); }}
                            className="flex items-center gap-1 text-[10px] text-[#4a4a5a] hover:text-[#7C5CFC] transition-colors cursor-pointer"
                          >
                            <Search size={10} />
                            <span>Search</span>
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5">
                          <div className="grid grid-cols-2 gap-[3px]">
                            {toolCategories[activeCategory]?.map((tool) => {
                              const Icon = tool.icon;
                              const isCurrent = tool.to === currentPath;
                              return (
                                <Link
                                  key={tool.to}
                                  to={tool.to}
                                  onClick={() => setHoveredTab(null)}
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

                        <div className="px-4 py-2 border-t border-[#1a1a22] shrink-0">
                          <button
                            onClick={() => { setHoveredTab(null); setIsPaletteOpen(true); }}
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
                  ) : (
                    /* ─── INSTRUCTIONS MEGAMENU CONTENT ─── */
                    <div className="grid grid-cols-12 gap-6 p-6 text-left" style={{ minHeight: '320px' }}>
                      {/* Left: Work Faster & Steps */}
                      <div className="col-span-5 border-r border-[#1a1a22] pr-6 space-y-4">
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-[#7C5CFC] uppercase">Work Faster. Think Bigger.</span>
                          <h4 className="text-sm font-black text-white mt-1">The Modern Utility Hub</h4>
                          <p className="text-[11.5px] text-[#6a6a7a] mt-1 leading-relaxed">
                            We discarded the bloat and focused purely on performance, privacy, and speed. 50+ tools executing instantly in your browser.
                          </p>
                        </div>

                        <div className="space-y-3.5 pt-1">
                          <div>
                            <p className="text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">01 // Step: Locate instantly</p>
                            <p className="text-[11px] text-[#8a8a9a] leading-relaxed mt-0.5">
                              Hit <span className="bg-[#1a1a22] px-1.5 py-0.5 rounded text-white font-mono text-[10px] border border-[#222230]">CMD+K</span> anywhere to open the command palette.
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">02 // Step: Execute locally</p>
                            <p className="text-[11px] text-[#8a8a9a] leading-relaxed mt-0.5">
                              Paste your payload or drop files. Everything runs securely inside your local browser sandbox.
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">03 // Step: Export effortlessly</p>
                            <p className="text-[11px] text-[#8a8a9a] leading-relaxed mt-0.5">
                              Copy your formatted code with one click, or instantly download your processed assets.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Feature Comparison Table */}
                      <div className="col-span-4 border-r border-[#1a1a22] pr-6 space-y-3.5">
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-[#7C5CFC] uppercase">Transparent Access</span>
                          <h4 className="text-sm font-black text-white mt-1">Account Features</h4>
                        </div>

                        <div className="w-full text-[10.5px] text-[#8a8a9a]">
                          <div className="grid grid-cols-3 border-b border-[#1d1d27] pb-2 font-bold text-white">
                            <span>Utility Access</span>
                            <span className="text-center">Guest</span>
                            <span className="text-center">Member</span>
                          </div>
                          {[
                            { name: "50+ Client-side tools", guest: true, user: true },
                            { name: "Zero tracking & ads", guest: true, user: true },
                            { name: "Recent history log", guest: true, user: true },
                            { name: "Pin favorite tools", guest: false, user: true },
                            { name: "Cloud sync configs", guest: false, user: true },
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-3 py-2 border-b border-[#141419] items-center">
                              <span className="text-[#6a6a7a] truncate pr-1">{row.name}</span>
                              <span className="text-center">{row.guest ? "✓" : "✕"}</span>
                              <span className="text-center text-[#7C5CFC] font-black">{row.user ? "✓" : "✕"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: FAQs */}
                      <div className="col-span-3 space-y-4">
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-[#7C5CFC] uppercase">Questions?</span>
                          <h4 className="text-sm font-black text-white mt-1">Quick FAQ</h4>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <p className="text-[10.5px] font-bold text-white">Is it 100% free?</p>
                            <p className="text-[10px] text-[#6a6a7a] leading-relaxed mt-0.5">Yes. No paywalls, subscriptions, or hidden charges whatsoever.</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] font-bold text-white">Are files secure?</p>
                            <p className="text-[10px] text-[#6a6a7a] leading-relaxed mt-0.5">Strict Privacy. Calculations are local. We never see your data.</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] font-bold text-white">Why register?</p>
                            <p className="text-[10px] text-[#6a6a7a] leading-relaxed mt-0.5">Enable Zero Latency cross-device sync of your configuration logs.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search */}
            <button
              onClick={() => navigate('/search')}
              className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg text-[#6a6a7a] hover:text-[#8a8a9a] transition-colors cursor-text"
            >
              <Search size={14} />
              <span className="hidden sm:inline text-[11px] font-medium">Search...</span>
              <div className="hidden md:flex items-center gap-0.5 text-[9px] font-bold text-[#5a5a6a] bg-[#1a1a22] border border-[#2a2a35] px-1.5 py-0.5 rounded ml-1">
                <span>⌘K</span>
              </div>
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



      {/* Mobile Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] flex flex-col justify-end lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />
            {/* Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative w-full max-h-[82vh] bg-[#0d0d12] border-t border-[#1e1e28] rounded-t-[28px] shadow-[0_-15px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden z-[160]"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1 bg-[#272733] rounded-full mx-auto my-3 shrink-0" />

              {/* Title bar */}
              <div className="flex items-center justify-between px-6 pb-3 border-b border-[#1a1a22]/50 shrink-0">
                <span className="font-black text-xs tracking-wider text-white uppercase tracking-[0.1em]">Workspace Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-[#1a1a22] rounded-lg text-[#6a6a7a] hover:text-white cursor-pointer"><X size={14} /></button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-1.5 pb-8">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === "/" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Home
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === "/profile" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Profile
                </Link>
                <button onClick={() => { setIsMobileMenuOpen(false); setIsInfoOpen(true); }} className="w-full text-left block px-4 py-3 rounded-xl text-xs font-bold text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06] transition-all cursor-pointer">
                  Instructions
                </button>

                <div className="pt-4 mt-2 border-t border-[#1a1a22]">
                  <p className="text-[10px] font-black text-[#4a4a5a] uppercase tracking-[0.15em] px-4 mb-2.5">Tools</p>
                  {Object.keys(toolCategories).map((catName) => (
                    <div key={catName}>
                      <button
                        onClick={() => setMobileExpandedCat(mobileExpandedCat === catName ? null : catName)}
                        className="w-full px-4 py-3 rounded-xl text-left text-xs font-semibold text-[#8a8a9a] hover:text-white flex items-center justify-between cursor-pointer hover:bg-[#ffffff04]"
                      >
                        <span>{catName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#4a4a5a] font-bold bg-[#141419] px-2 py-0.5 rounded-full border border-[#1f1f2a]">{toolCategories[catName].length}</span>
                          <ChevronDown size={12} className={`transition-transform text-[#4a4a5a] ${mobileExpandedCat === catName ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {mobileExpandedCat === catName && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden pl-4 space-y-0.5 border-l border-[#1a1a22]/80 ml-5 mt-1 mb-2">
                            {toolCategories[catName].map((tool) => (
                              <Link
                                key={tool.to}
                                to={tool.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-3.5 py-2.5 rounded-lg text-[11px] font-medium transition-all ${tool.to === currentPath ? "text-[#7C5CFC] bg-[#7C5CFC]/10" : "text-[#5a5a6a] hover:text-white hover:bg-[#ffffff06]"}`}
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
                <div className="border-t border-[#1a1a22] p-4 bg-[#09090d] shrink-0">
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <LogOut size={14} /> Sign Out
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
