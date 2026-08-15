import {
  User,
  LogOut,
  Search,
  Menu,
  X,
  ChevronDown,
  Layers,
  HelpCircle,
  Shield,
  ArrowLeft,
  Heart,
  Sparkles,
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
  const [hoveredTab, setHoveredTab] = useState(null);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(toolCategories)[0],
  );
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  const { currentUser: user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchWidth, setSearchWidth] = useState(280);
  useEffect(() => {
    const handleResize = () => {
      setSearchWidth(window.innerWidth < 640 ? 200 : 280);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const currentPath = location.pathname;
  const megamenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const prevTabRef = useRef(null);

  useEffect(() => {
    if (hoveredTab) {
      prevTabRef.current = hoveredTab;
    }
  }, [hoveredTab]);

  const TABS = ["tools", "instructions"];
  const currentTabIndex = hoveredTab ? TABS.indexOf(hoveredTab) : -1;
  const prevTabIndex = prevTabRef.current
    ? TABS.indexOf(prevTabRef.current)
    : -1;
  const slideDirection = currentTabIndex > prevTabIndex ? 1 : -1;

  const handleCategoryHover = (catName) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(catName);
    }, 45);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHoveredTab(null);
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  const mobileSearchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allTools = Object.values(toolCategories).flat();
  const uniqueTools = [];
  const seenPaths = new Set();
  for (const tool of allTools) {
    if (!seenPaths.has(tool.to)) {
      seenPaths.add(tool.to);
      uniqueTools.push(tool);
    }
  }

  const filteredTools = searchQuery
    ? uniqueTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (megamenuRef.current && !megamenuRef.current.contains(e.target))
        setHoveredTab(null);
      
      const isOutsideMobile = !mobileSearchRef.current || !mobileSearchRef.current.contains(e.target);
      const isOutsideDesktop = !desktopSearchRef.current || !desktopSearchRef.current.contains(e.target);
      
      if (isSearchExpanded && isOutsideMobile && isOutsideDesktop) {
        setIsSearchExpanded(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchExpanded]);

  useHotkeys(
    "ctrl+k, meta+k",
    (e) => {
      e.preventDefault();
      setIsSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    },
    { enableOnFormTags: true },
  );

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: headerVisible ? 0 : -80 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="w-full fixed top-0 inset-x-0 z-50"
    >
      {/* WhatsApp Dark Header container */}
      <div
        className={`w-full transition-all duration-300 ${
          isScrolled 
            ? "bg-[#111b21]/95 backdrop-blur-xl border-b border-[#222d34] shadow-[0_4px_25px_rgba(0,0,0,0.35)]" 
            : "bg-[#0b141a]/90 backdrop-blur-lg border-b border-[#222d34]/60"
        }`}
      >
        <div
          ref={megamenuRef}
          className="max-w-[1240px] mx-auto flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 md:px-8"
        >
          {/* LEFT: Logo or Back Button */}
          <div
            className={`transition-[opacity,transform] duration-300 ease-out ${
              isSearchExpanded 
                ? "opacity-0 pointer-events-none scale-95 md:opacity-100 md:pointer-events-auto md:scale-100 flex" 
                : "opacity-100 pointer-events-auto scale-100 flex"
            } items-center gap-2.5 shrink-0`}
          >
            {currentPath.startsWith("/tools") ? (
              <Link
                to="/"
                className="flex items-center gap-2 group shrink-0 text-[#e9edef] hover:text-[#00a884] transition-colors bg-[#202c33] hover:bg-[#222e35] border border-[#2a3942] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-0.5 text-[#8696a0] group-hover:text-[#00a884]" />
                <span className="hidden sm:inline-block">Back to Hub</span>
                <span className="sm:hidden">Back</span>
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-9 h-9 sm:w-8 sm:h-8 shrink-0 rounded-xl bg-[#00a884] flex items-center justify-center text-white shadow-md shadow-[#00a884]/25 group-hover:shadow-[#00a884]/40 group-hover:scale-105 transition-all">
                  <svg
                    className="w-5 h-5 sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                  </svg>
                </div>
                <span className="hidden sm:inline-block font-black text-[16px] tracking-tight text-[#e9edef]">
                  Utility<span className="text-[#00a884]">Hub</span>
                </span>
              </Link>
            )}
          </div>

          {/* CENTER: Nav (WhatsApp Dark morphing megamenu) */}
          <nav
            className="hidden lg:flex items-center gap-2 mx-8 h-full"
            onMouseLeave={() => setHoveredTab(null)}
          >
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-colors ${
                currentPath === "/"
                  ? "text-[#00a884] bg-[#00a884]/15 border border-[#00a884]/30"
                  : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
              }`}
            >
              Home
            </Link>

            {/* Tools hover wrapper */}
            <div
              className="relative py-4"
              onMouseEnter={() => setHoveredTab("tools")}
            >
              <button
                className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  hoveredTab === "tools" || currentPath.startsWith("/tools")
                    ? "text-[#00a884] bg-[#00a884]/15 border border-[#00a884]/30"
                    : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                }`}
              >
                Tools
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${hoveredTab === "tools" ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Instructions hover wrapper */}
            <div
              className="relative py-4"
              onMouseEnter={() => setHoveredTab("instructions")}
            >
              <button
                className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  hoveredTab === "instructions"
                    ? "text-[#00a884] bg-[#00a884]/15 border border-[#00a884]/30"
                    : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                }`}
              >
                Instructions
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${hoveredTab === "instructions" ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Morphing Dropdown Panel in WhatsApp Dark Mode */}
            <AnimatePresence>
              {hoveredTab && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: 4,
                    scale: 0.98,
                    transition: { duration: 0.15 },
                  }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-[85%] left-1/2 -translate-x-1/2 mt-1 bg-[#111b21] border border-[#222d34] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[200] overflow-hidden flex flex-col"
                  style={{ width: 860, height: 440 }}
                >
                  {/* Top WhatsApp Emerald line */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#00a884] via-[#53bdeb] to-[#00a884] shrink-0" />

                  <div className="relative w-full flex-1 overflow-hidden">
                    <AnimatePresence
                      mode="popLayout"
                      custom={slideDirection}
                      initial={false}
                    >
                      {hoveredTab === "tools" && (
                        <motion.div
                          key="tools"
                          custom={slideDirection}
                          initial={{
                            opacity: 0,
                            x: slideDirection === 1 ? 30 : -30,
                          }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: slideDirection === 1 ? -30 : 30,
                          }}
                          transition={{
                            duration: 0.25,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex absolute inset-0 bg-[#111b21]"
                        >
                          {/* Left: Categories */}
                          <div className="w-[200px] border-r border-[#222d34] bg-[#0b141a]/60 flex flex-col py-3 shrink-0">
                            <p className="text-[9px] font-black text-[#8696a0] uppercase tracking-[0.2em] px-5 py-1.5">
                              Categories
                            </p>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                              {Object.keys(toolCategories).map((catName) => {
                                const isActive = catName === activeCategory;
                                return (
                                  <button
                                    key={catName}
                                    onMouseEnter={() =>
                                      handleCategoryHover(catName)
                                    }
                                    className={`w-full px-3 py-2 text-left text-[12px] font-bold flex items-center justify-between cursor-pointer rounded-xl relative transition-colors ${
                                      isActive
                                        ? "text-[#00a884] bg-[#00a884]/15 border-l-2 border-[#00a884]"
                                        : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                                    }`}
                                  >
                                    <span className="truncate relative z-10">
                                      {catName}
                                    </span>
                                    <span
                                      className={`text-[9px] tabular-nums font-bold shrink-0 ml-2 relative z-10 ${
                                        isActive ? "text-[#00a884]" : "text-[#8696a0]"
                                      }`}
                                    >
                                      {toolCategories[catName].length}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right: Tools List */}
                          <div className="flex-1 flex flex-col min-w-0 bg-[#111b21]">
                            <div className="px-5 py-3 border-b border-[#222d34] flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[13px] font-bold text-[#e9edef]">
                                  {activeCategory}
                                </h3>
                                <span className="text-[10px] font-semibold text-[#00a884] bg-[#00a884]/10 border border-[#00a884]/20 px-2 py-0.5 rounded-full">
                                  {toolCategories[activeCategory]?.length} tools
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setHoveredTab(null);
                                  navigate('/search');
                                }}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-[#00a884] hover:text-[#25d366] transition-colors cursor-pointer"
                              >
                                <Search size={12} />
                                <span>Browse All</span>
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                              <div className="grid grid-cols-2 gap-2">
                                {toolCategories[activeCategory]?.map((tool) => {
                                  const Icon = tool.icon;
                                  const isCurrent = tool.to === currentPath;
                                  return (
                                    <Link
                                      key={tool.to}
                                      to={tool.to}
                                      onClick={() => setHoveredTab(null)}
                                      className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all relative ${
                                        isCurrent
                                          ? "bg-[#00a884]/15 border border-[#00a884]/40 text-[#00a884]"
                                          : "hover:bg-[#202c33] border border-transparent hover:border-[#2a3942]"
                                      }`}
                                    >
                                      <div
                                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                                          isCurrent
                                            ? "bg-[#00a884] text-white"
                                            : "bg-[#202c33] text-[#8696a0] group-hover:bg-[#00a884]/20 group-hover:text-[#00a884]"
                                        } transition-colors`}
                                      >
                                        <Icon size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`text-[12px] font-bold truncate ${
                                            isCurrent
                                              ? "text-[#00a884]"
                                              : "text-[#e9edef] group-hover:text-[#00a884] transition-colors"
                                          }`}
                                        >
                                          {tool.name}
                                        </p>
                                        <p className="text-[10px] leading-tight text-[#8696a0] truncate">
                                          {tool.description}
                                        </p>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="px-5 py-2.5 border-t border-[#222d34] flex items-center justify-between shrink-0 bg-[#0b141a]/40">
                              <span className="text-[11px] text-[#8696a0] font-medium">100% Client-Side Privacy Guaranteed</span>
                              <Link
                                to="/search"
                                onClick={() => setHoveredTab(null)}
                                className="text-[11px] text-[#00a884] hover:text-[#25d366] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                View full directory
                                <svg
                                  className="w-3 h-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {hoveredTab === "instructions" && (
                        <motion.div
                          key="instructions"
                          custom={slideDirection}
                          initial={{
                            opacity: 0,
                            x: slideDirection === 1 ? 30 : -30,
                          }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: slideDirection === 1 ? -30 : 30,
                          }}
                          transition={{
                            duration: 0.25,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="grid grid-cols-12 gap-6 p-6 text-left absolute inset-0 bg-[#111b21]"
                        >
                          {/* Left: Work Faster */}
                          <div className="col-span-5 border-r border-[#222d34] pr-6 space-y-4">
                            <div>
                              <span className="text-[9px] font-black tracking-widest text-[#00a884] uppercase">
                                Workflow Guide
                              </span>
                              <h4 className="text-sm font-black text-[#e9edef] mt-1">
                                High-Speed Utilities
                              </h4>
                              <p className="text-[11.5px] text-[#8696a0] mt-1 leading-relaxed">
                                Process PDFs, images, code, spreadsheets, and media entirely in your browser with zero latency.
                              </p>
                            </div>

                            <div className="space-y-3 pt-1">
                              <div>
                                <p className="text-[10px] font-black text-[#00a884] uppercase tracking-wider">
                                  01 // Direct Launcher
                                </p>
                                <p className="text-[11px] text-[#8696a0] leading-relaxed mt-0.5">
                                  Drop any file into the home workflow card to auto-detect its format and suggested conversion operations.
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-[#00a884] uppercase tracking-wider">
                                  02 // Instant Search
                                </p>
                                <p className="text-[11px] text-[#8696a0] leading-relaxed mt-0.5">
                                  Press{" "}
                                  <span className="bg-[#202c33] px-1.5 py-0.5 rounded text-[#e9edef] font-mono text-[10px] border border-[#2a3942] font-bold">
                                    CTRL + K
                                  </span>{" "}
                                  anywhere to open tools instantly.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Center: Guest vs Member */}
                          <div className="col-span-4 border-r border-[#222d34] pr-6 space-y-3">
                            <div>
                              <span className="text-[9px] font-black tracking-widest text-[#00a884] uppercase">
                                Privileges
                              </span>
                              <h4 className="text-sm font-black text-[#e9edef] mt-1">
                                Guest vs Member
                              </h4>
                            </div>

                            <div className="w-full text-[11px] text-[#8696a0]">
                              <div className="grid grid-cols-3 border-b border-[#222d34] pb-2 font-bold text-[#e9edef]">
                                <span>Utility</span>
                                <span className="text-center">Guest</span>
                                <span className="text-center text-[#00a884]">Member</span>
                              </div>
                              {[
                                { name: "90+ Client tools", guest: true, user: true },
                                { name: "Zero tracking & ads", guest: true, user: true },
                                { name: "Recent history log", guest: true, user: true },
                                { name: "Pin favorite tools", guest: false, user: true },
                                { name: "Cloud sync logs", guest: false, user: true },
                              ].map((row, i) => (
                                <div
                                  key={i}
                                  className="grid grid-cols-3 py-2 border-b border-[#222d34]/60 items-center"
                                >
                                  <span className="text-[#8696a0] truncate pr-1">
                                    {row.name}
                                  </span>
                                  <span className="text-center text-[#8696a0]">
                                    {row.guest ? "✓" : "✕"}
                                  </span>
                                  <span className="text-center text-[#00a884] font-black">
                                    {row.user ? "✓" : "✕"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: FAQs */}
                          <div className="col-span-3 space-y-4">
                            <div>
                              <span className="text-[9px] font-black tracking-widest text-[#00a884] uppercase">
                                Questions?
                              </span>
                              <h4 className="text-sm font-black text-[#e9edef] mt-1">
                                Quick FAQ
                              </h4>
                            </div>

                            <div className="space-y-3.5">
                              <div>
                                <p className="text-[11px] font-bold text-[#e9edef]">
                                  Is it 100% free?
                                </p>
                                <p className="text-[10px] text-[#8696a0] leading-relaxed mt-0.5">
                                  Yes! No paywalls, subscriptions, or hidden charges.
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-[#e9edef]">
                                  Are files private?
                                </p>
                                <p className="text-[10px] text-[#8696a0] leading-relaxed mt-0.5">
                                  100% private. Files never leave your local browser machine.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Mobile-only expanded search overlay in WhatsApp dark mode */}
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, y: "-50%" }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="block md:hidden absolute left-4 right-4 top-1/2 z-50"
                ref={mobileSearchRef}
              >
                <div className="relative flex items-center h-9 rounded-full border border-[#00a884] bg-[#202c33] px-3 shadow-2xl w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery("");
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#00a884] hover:bg-[#111b21] transition-colors shrink-0 mr-1.5 cursor-pointer"
                    title="Back"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-[12px] text-[#e9edef] focus:outline-none placeholder:text-[#8696a0]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery("");
                    }}
                    className="text-[#8696a0] hover:text-[#e9edef] shrink-0 p-0.5 ml-1"
                  >
                    <X size={13} />
                  </button>

                  {/* Mobile Suggestions dropdown list */}
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 max-h-[380px] overflow-hidden bg-[#111b21] border border-[#222d34] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[300] flex flex-col"
                      >
                        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                          {filteredTools.length > 0 ? (
                            filteredTools.map((tool) => {
                              const ToolIcon = tool.icon;
                              return (
                                <Link
                                  key={tool.to}
                                  to={tool.to}
                                  onClick={() => {
                                    setIsSearchExpanded(false);
                                    setSearchQuery("");
                                  }}
                                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#202c33] transition-colors border-b border-[#222d34]/60 last:border-b-0 group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-[#202c33] group-hover:bg-[#00a884]/20 flex items-center justify-center text-[#8696a0] group-hover:text-[#00a884] transition-colors shrink-0 mt-0.5">
                                    <ToolIcon size={14} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[12px] font-bold text-[#e9edef] group-hover:text-[#00a884] truncate block">
                                      {tool.name}
                                    </span>
                                    <p className="text-[10px] text-[#8696a0] leading-normal line-clamp-2 mt-0.5">
                                      {tool.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <div className="px-4 py-6 text-center text-xs text-[#8696a0]">
                              No matching tools found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RIGHT: Actions */}
          <div
            className={`flex items-center gap-2 sm:gap-2.5 shrink-0 transition-[opacity,transform] duration-300 ease-out ${
              isSearchExpanded 
                ? "opacity-0 pointer-events-none scale-95 md:opacity-100 md:pointer-events-auto md:scale-100 flex" 
                : "opacity-100 pointer-events-auto scale-100 flex"
            }`}
          >
            {/* Search */}
            <div className="relative shrink-0">
              {!isSearchExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="block md:hidden w-8 h-8 rounded-full border border-[#2a3942] hover:border-[#00a884] hover:bg-[#202c33] flex items-center justify-center text-[#8696a0] hover:text-[#00a884] cursor-pointer bg-[#111b21] transition-all shadow-xs shrink-0"
                  title="Search"
                >
                  <Search size={14} />
                </button>
              )}

              <div className="hidden md:flex items-center gap-2" ref={desktopSearchRef}>
                <AnimatePresence>
                  {isSearchExpanded && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSearchExpanded(false);
                        setSearchQuery("");
                      }}
                      className="w-8 h-8 rounded-full border border-[#2a3942] hover:border-[#00a884] hover:bg-[#202c33] flex items-center justify-center text-[#00a884] bg-[#111b21] transition-colors shrink-0 cursor-pointer shadow-xs"
                      title="Back"
                    >
                      <ArrowLeft size={13} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Desktop morphing search bar */}
                <motion.div
                  animate={{
                    width: isSearchExpanded ? searchWidth : 34,
                    borderColor: isSearchExpanded ? "#00a884" : "#2a3942",
                    backgroundColor: "#202c33",
                    boxShadow: isSearchExpanded ? "0 0 20px rgba(0, 168, 132, 0.25)" : "none",
                  }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center h-8 rounded-full border overflow-hidden shrink-0 cursor-pointer relative px-0.5"
                  onClick={() => {
                    if (!isSearchExpanded) {
                      setIsSearchExpanded(true);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }
                  }}
                  title={!isSearchExpanded ? "Search (Ctrl+K)" : undefined}
                >
                  <div className="w-7 h-7 flex items-center justify-center shrink-0 text-[#8696a0] pointer-events-none">
                    <Search size={14} />
                  </div>

                  <motion.input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tools (Ctrl+K)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    animate={{
                      width: isSearchExpanded ? searchWidth - 80 : 0,
                      opacity: isSearchExpanded ? 1 : 0,
                      pointerEvents: isSearchExpanded ? "auto" : "none",
                    }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="bg-transparent border-none text-[12px] text-[#e9edef] font-medium focus:outline-none placeholder:text-[#8696a0] ml-1 pr-6"
                  />

                  <motion.button
                    animate={{
                      opacity: isSearchExpanded ? 1 : 0,
                      scale: isSearchExpanded ? 1 : 0,
                      pointerEvents: isSearchExpanded ? "auto" : "none",
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearchExpanded(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-2 text-[#8696a0] hover:text-[#e9edef] shrink-0 p-0.5"
                  >
                    <X size={12} />
                  </motion.button>
                </motion.div>

                {/* Suggestions popup in WhatsApp Dark Mode */}
                <AnimatePresence>
                  {isSearchExpanded && searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-[360px] max-h-[380px] overflow-hidden bg-[#111b21] border border-[#222d34] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[300] flex flex-col"
                    >
                      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                        {filteredTools.length > 0 ? (
                          filteredTools.map((tool) => {
                            const ToolIcon = tool.icon;
                            return (
                              <Link
                                key={tool.to}
                                to={tool.to}
                                onClick={() => {
                                  setIsSearchExpanded(false);
                                  setSearchQuery("");
                                }}
                                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#202c33] transition-colors border-b border-[#222d34]/60 last:border-b-0 group"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#202c33] group-hover:bg-[#00a884]/20 flex items-center justify-center text-[#8696a0] group-hover:text-[#00a884] transition-colors shrink-0 mt-0.5">
                                  <ToolIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[12px] font-bold text-[#e9edef] group-hover:text-[#00a884] truncate block">
                                    {tool.name}
                                  </span>
                                  <p className="text-[10px] text-[#8696a0] leading-normal line-clamp-2 mt-0.5">
                                    {tool.description}
                                  </p>
                                </div>
                              </Link>
                            );
                          })
                        ) : (
                          <div className="px-4 py-6 text-center text-xs text-[#8696a0]">
                            No matching tools found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* User Profile / Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/favorites"
                  className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                    currentPath === "/favorites"
                      ? "text-[#00a884] bg-[#00a884]/15 border border-[#00a884]/30"
                      : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                  }`}
                >
                  <Heart
                    size={13}
                    className="text-rose-500 shrink-0 fill-current"
                  />
                  <span className="hidden sm:inline">Favorites</span>
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center gap-2 text-[12px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                    currentPath === "/profile"
                      ? "text-[#00a884] bg-[#00a884]/15 border-[#00a884]/40"
                      : "text-[#e9edef] bg-[#202c33] hover:bg-[#222e35] border-[#2a3942]"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#00a884] text-white flex items-center justify-center font-black text-[10px]">
                    {(user.name || user.displayName || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[70px] truncate">
                    {user.name || user.displayName || "Profile"}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8696a0] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#25d366] text-white font-bold text-[12px] shadow-sm shadow-[#00a884]/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen((p) => !p)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-[#e9edef] hover:bg-[#202c33] transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Bottom Sheet) in WhatsApp Dark Theme */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] flex flex-col justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative w-full max-h-[82vh] bg-[#111b21] border-t border-[#222d34] rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden z-[160]"
            >
              <div className="w-12 h-1 bg-[#2a3942] rounded-full mx-auto my-3 shrink-0" />

              <div className="flex items-center justify-between px-6 pb-3 border-b border-[#222d34] shrink-0">
                <span className="font-black text-xs tracking-wider text-[#e9edef] uppercase tracking-[0.1em]">
                  Workspace Navigation
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-[#202c33] rounded-lg text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-1.5 pb-8">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentPath === "/" ? "bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30" : "text-[#e9edef] hover:bg-[#202c33]"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentPath === "/profile" ? "bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30" : "text-[#e9edef] hover:bg-[#202c33]"
                  }`}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsInfoOpen(true);
                  }}
                  className="w-full text-left block px-4 py-2.5 rounded-xl text-xs font-bold text-[#e9edef] hover:bg-[#202c33] transition-all cursor-pointer"
                >
                  Instructions & FAQ
                </button>

                <div className="pt-4 mt-2 border-t border-[#222d34]">
                  <p className="text-[10px] font-black text-[#8696a0] uppercase tracking-[0.15em] px-4 mb-2.5">
                    Browse Categories
                  </p>
                  {Object.keys(toolCategories).map((catName) => (
                    <div key={catName}>
                      <button
                        onClick={() =>
                          setMobileExpandedCat(
                            mobileExpandedCat === catName ? null : catName,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-left text-xs font-semibold text-[#e9edef] hover:text-[#00a884] flex items-center justify-between cursor-pointer hover:bg-[#202c33]"
                      >
                        <span>{catName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#00a884] font-bold bg-[#00a884]/10 px-2 py-0.5 rounded-full border border-[#00a884]/20">
                            {toolCategories[catName].length}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform text-[#8696a0] ${mobileExpandedCat === catName ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      <AnimatePresence>
                        {mobileExpandedCat === catName && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4 space-y-0.5 border-l border-[#222d34] ml-5 mt-1 mb-2"
                          >
                            {toolCategories[catName].map((tool) => (
                              <Link
                                key={tool.to}
                                to={tool.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                                  tool.to === currentPath ? "text-[#00a884] bg-[#00a884]/15 font-bold" : "text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33]"
                                }`}
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
                <div className="border-t border-[#222d34] p-4 bg-[#0b141a] shrink-0">
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Instructions Modal Overlay in WhatsApp Dark Theme */}
      <AnimatePresence>
        {isInfoOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInfoOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative z-10 w-full max-w-[460px] bg-[#111b21] border border-[#222d34] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-[#00a884] via-[#53bdeb] to-[#00a884]" />

              <div className="p-5 sm:p-6 flex flex-col h-full max-h-[85vh]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#e9edef] uppercase tracking-wider">
                    Instructions & FAQ
                  </h3>
                  <button
                    onClick={() => setIsInfoOpen(false)}
                    className="p-1 hover:bg-[#202c33] rounded-lg text-[#8696a0] hover:text-[#e9edef] cursor-pointer transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-[#00a884] uppercase">
                        Instant Utilities
                      </span>
                      <h4 className="text-sm font-black text-[#e9edef] mt-1">
                        Daily Utility Hub
                      </h4>
                      <p className="text-[11.5px] text-[#8696a0] mt-1 leading-relaxed">
                        90+ client-side tools running securely in your browser with zero latency and zero data collection.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <p className="text-[10px] font-black text-[#00a884] uppercase tracking-wider">
                          01 // Find Tools
                        </p>
                        <p className="text-[11px] text-[#8696a0] leading-relaxed mt-0.5">
                          Press{" "}
                          <span className="bg-[#202c33] px-1.5 py-0.5 rounded text-[#e9edef] font-mono text-[10px] border border-[#2a3942] font-bold">
                            CTRL + K
                          </span>{" "}
                          to quickly open and search any utility.
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#00a884] uppercase tracking-wider">
                          02 // Execute Client-Side
                        </p>
                        <p className="text-[11px] text-[#8696a0] leading-relaxed mt-0.5">
                          Drop your files or paste text. Processing happens 100% locally.
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#00a884] uppercase tracking-wider">
                          03 // Save & Download
                        </p>
                        <p className="text-[11px] text-[#8696a0] leading-relaxed mt-0.5">
                          Export, copy, or download instantly with zero server lag.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feature Comparison Table */}
                  <div className="space-y-3 pt-2 border-t border-[#222d34]">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-[#00a884] uppercase">
                        Features
                      </span>
                      <h4 className="text-sm font-black text-[#e9edef] mt-1">
                        Account Capabilities
                      </h4>
                    </div>

                    <div className="w-full text-[11px] text-[#8696a0]">
                      <div className="grid grid-cols-3 border-b border-[#222d34] pb-2 font-bold text-[#e9edef]">
                        <span>Utility</span>
                        <span className="text-center">Guest</span>
                        <span className="text-center text-[#00a884]">Member</span>
                      </div>
                      {[
                        { name: "90+ Client-side tools", guest: true, user: true },
                        { name: "Zero tracking & ads", guest: true, user: true },
                        { name: "Recent history log", guest: true, user: true },
                        { name: "Pin favorite tools", guest: false, user: true },
                        { name: "Cloud sync logs", guest: false, user: true },
                      ].map((row, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-3 py-2 border-b border-[#222d34]/60 items-center"
                        >
                          <span className="text-[#8696a0] truncate pr-1">
                            {row.name}
                          </span>
                          <span className="text-center text-[#8696a0]">
                            {row.guest ? "✓" : "✕"}
                          </span>
                          <span className="text-center text-[#00a884] font-black">
                            {row.user ? "✓" : "✕"}
                          </span>
                        </div>
                      ))}
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
