import {
  User, LogOut, Search, Menu, X, ChevronDown, Layers
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: headerVisible ? 0 : -100, opacity: headerVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full max-w-[1600px] mx-auto flex items-center justify-between px-3 sm:px-4 md:px-12 lg:px-20 xl:px-32 bg-transparent z-50 fixed top-0 inset-x-0 mt-3 sm:mt-4 transition-all duration-300 ${isScrolled ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
    >
      <div ref={megamenuRef} className="w-full flex items-center justify-between bg-[#111116] border border-[#222230] shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full px-4 sm:px-5 md:px-8 rounded-2xl relative">

        {/* LEFT: Logo */}
        <div className="flex items-center shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-[#7C5CFC] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
            </div>
            <span className="hidden sm:inline-block font-black text-base sm:text-lg tracking-tighter text-white">UtilityHub</span>
          </Link>
        </div>

        {/* CENTER: Nav items */}
        <nav className="hidden lg:flex items-center gap-1 mx-6">
          <Link to="/dashboard" className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPath === "/dashboard" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff08]"}`}>
            Home
          </Link>

          {/* Tools Megamenu Trigger */}
          <div onMouseEnter={() => setIsMegamenuOpen(true)} className="relative">
            <button
              onClick={() => setIsMegamenuOpen(p => !p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${isMegamenuOpen || currentPath.startsWith("/tools") ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff08]"}`}
            >
              Tools
              <ChevronDown size={12} className={`transition-transform duration-300 ${isMegamenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Megamenu Panel — fully opaque, clean design */}
            <AnimatePresence>
              {isMegamenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onMouseLeave={() => setIsMegamenuOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[720px] bg-[#141419] border border-[#222230] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden z-[200] flex min-h-[380px]"
                >
                  {/* Left: Categories */}
                  <div className="w-[210px] bg-[#111116] border-r border-[#1e1e28] flex flex-col py-3">
                    <h4 className="text-[9px] font-black text-[#5a5a6a] uppercase tracking-widest px-4 mb-2 flex items-center gap-1.5"><Layers size={9} /> Categories</h4>
                    <div className="overflow-y-auto flex-1 max-h-[380px] space-y-0.5 px-2">
                      {Object.keys(toolCategories).map((catName) => {
                        const isActive = catName === activeCategory;
                        return (
                          <button
                            key={catName}
                            onMouseEnter={() => setActiveCategory(catName)}
                            className={`w-full px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "bg-[#7C5CFC]/10 text-[#7C5CFC]"
                                : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"
                            }`}
                          >
                            <span className="truncate">{catName}</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${isActive ? "bg-[#7C5CFC]/15 text-[#7C5CFC]" : "bg-[#1e1e28] text-[#5a5a6a]"}`}>
                              {toolCategories[catName].length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Tools grid */}
                  <div className="flex-1 flex flex-col min-w-0 py-3 px-4">
                    <div className="pb-2.5 mb-2 border-b border-[#1e1e28] shrink-0 flex items-center justify-between">
                      <h3 className="text-xs font-black text-white">{activeCategory}</h3>
                      <span className="text-[9px] text-[#5a5a6a]">{toolCategories[activeCategory]?.length} tools</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5 max-h-[340px] pr-1 auto-rows-min">
                      {toolCategories[activeCategory]?.map((tool) => {
                        const Icon = tool.icon;
                        const isCurrent = tool.to === currentPath;
                        return (
                          <Link
                            key={tool.to}
                            to={tool.to}
                            onClick={() => setIsMegamenuOpen(false)}
                            className={`group flex gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                              isCurrent
                                ? "bg-[#7C5CFC] shadow-lg shadow-[#7C5CFC]/20"
                                : "hover:bg-[#1a1a22]"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                              isCurrent
                                ? "bg-white/20 text-white"
                                : (tool.color || "bg-[#7C5CFC]/10 text-[#7C5CFC]")
                            }`}>
                              <Icon size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className={`text-[11px] font-bold truncate ${isCurrent ? "text-white" : "text-[#c0c0cc] group-hover:text-white transition-colors"}`}>{tool.name}</h5>
                              <p className={`text-[9px] leading-tight mt-0.5 line-clamp-1 ${isCurrent ? "text-white/70" : "text-[#5a5a6a]"}`}>{tool.description}</p>
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
        </nav>

        {/* RIGHT: Search + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search trigger */}
          <button onClick={() => setIsPaletteOpen(true)} className="h-7 sm:h-8 flex items-center bg-[#1a1a22] hover:bg-[#222230] border border-[#2a2a35] hover:border-[#7C5CFC]/30 rounded-lg px-2 sm:px-2.5 transition-all text-[#6a6a7a] text-xs cursor-text gap-1.5">
            <Search size={12} />
            <span className="hidden sm:inline text-[10px] font-medium select-none">Search...</span>
            <div className="hidden sm:flex items-center gap-0.5 text-[8px] font-black text-[#8a8a9a] bg-[#111116] border border-[#2a2a35] px-1 py-0.5 rounded shrink-0">
              <span className="opacity-70">⌘</span><span className="opacity-70">K</span>
            </div>
          </button>

          {/* User */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/profile" className={`flex items-center gap-1.5 text-xs font-bold px-2 sm:px-2.5 py-1.5 rounded-lg border transition-all ${currentPath === "/profile" ? "bg-[#7C5CFC]/10 border-[#7C5CFC]/20 text-[#7C5CFC]" : "bg-[#1a1a22] border-[#2a2a35] hover:border-[#7C5CFC]/30 text-white"}`}>
                <div className="w-5 h-5 rounded-md bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center font-black text-[9px] border border-[#7C5CFC]/20">
                  {(user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline max-w-[60px] truncate text-[11px]">{user.name || user.displayName || 'Profile'}</span>
              </Link>
              <button onClick={logout} className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a22] border border-[#2a2a35] hover:border-red-500/40 hover:bg-red-500/10 text-[#6a6a7a] hover:text-red-400 transition-all cursor-pointer" title="Logout">
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white font-bold transition-all shadow text-[11px]">
              <User size={11} /> Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setIsMobileMenuOpen(p => !p)} className="flex lg:hidden items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a22] border border-[#2a2a35] text-[#6a6a7a] hover:text-white transition-all cursor-pointer">
            <Menu size={14} />
          </button>
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
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#111116] border-r border-[#222230] shadow-2xl flex flex-col overflow-hidden z-[160]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e28]">
                <span className="font-black text-base tracking-tighter text-white">UtilityHub</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-[#1a1a22] rounded-lg text-[#6a6a7a] hover:text-white cursor-pointer"><X size={14} /></button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${currentPath === "/dashboard" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Home
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${currentPath === "/profile" ? "bg-[#7C5CFC]/10 text-[#7C5CFC]" : "text-[#8a8a9a] hover:text-white hover:bg-[#ffffff06]"}`}>
                  Profile
                </Link>

                {/* Tools section */}
                <div className="pt-3 mt-2 border-t border-[#1e1e28]">
                  <h4 className="text-[9px] font-black text-[#5a5a6a] uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5"><Layers size={9} /> Tools</h4>
                  {Object.keys(toolCategories).map((catName) => (
                    <div key={catName}>
                      <button
                        onClick={() => setMobileExpandedCat(mobileExpandedCat === catName ? null : catName)}
                        className="w-full px-3 py-2 rounded-lg text-left text-[11px] font-bold text-[#8a8a9a] hover:text-white flex items-center justify-between cursor-pointer hover:bg-[#ffffff06]"
                      >
                        <span>{catName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-[#5a5a6a] bg-[#1a1a22] px-1.5 py-0.5 rounded-md">{toolCategories[catName].length}</span>
                          <ChevronDown size={11} className={`transition-transform text-[#5a5a6a] ${mobileExpandedCat === catName ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {mobileExpandedCat === catName && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden pl-4 space-y-0.5 border-l border-[#1e1e28] ml-4 mb-1">
                            {toolCategories[catName].map((tool) => (
                              <Link
                                key={tool.to}
                                to={tool.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${tool.to === currentPath ? "text-[#7C5CFC] bg-[#7C5CFC]/10" : "text-[#6a6a7a] hover:text-white hover:bg-[#ffffff06]"}`}
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

              {/* Footer */}
              {user && (
                <div className="border-t border-[#1e1e28] p-3">
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Topbar;
