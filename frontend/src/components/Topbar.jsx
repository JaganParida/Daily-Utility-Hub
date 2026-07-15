import {
  User,
  LogOut,
  Search,
  Menu,
  X,
  Sparkles,
  Layers,
  Pin
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHotkeys } from "react-hotkeys-hook";

import CommandPalette from "./CommandPalette";

const Topbar = ({ isScrolled, headerVisible = true }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { currentUser: user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Close menus on path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

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
        isScrolled ? "h-14" : "h-16"
      }`}
    >
      <div 
        className="w-full flex items-center justify-between bg-card/75 dark:bg-card/50 border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl h-full px-5 md:px-8 rounded-2xl relative"
      >
        {/* LEFT: Branding Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-foreground flex items-center justify-center text-background shadow-sm transition-transform group-hover:scale-105">
              <svg className="w-4.5 h-4.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
            </div>
            <span className="hidden sm:inline-block font-black text-lg tracking-tighter text-foreground whitespace-nowrap">
              UtilityHub
            </span>
          </Link>
        </div>

        {/* CENTER: Spotlight Search Input Pill */}
        <div className="flex-1 flex justify-center px-4 max-w-md mx-auto">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="w-full h-9 flex items-center bg-muted/40 hover:bg-muted/65 border border-border/80 hover:border-primary/30 rounded-xl px-3 transition-all duration-200 text-left text-muted-foreground text-xs shadow-inner cursor-text relative group/btn"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground mr-2 group-hover/btn:text-foreground transition-colors shrink-0" />
            <span className="truncate flex-1 select-none font-medium text-[11px]">Search operations...</span>
            <div className="hidden sm:flex items-center gap-1 text-[9px] font-black text-foreground bg-muted border border-border/80 px-1.5 py-0.5 rounded shadow-sm shrink-0">
              <span className="text-muted-foreground opacity-80">Ctrl</span>
              <span className="text-muted-foreground opacity-80">K</span>
            </div>
          </button>
        </div>

        {/* RIGHT: Actions & User Options */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dashboard"
            className={`hidden md:inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentPath === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            Dashboard
          </Link>

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  currentPath === "/profile"
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted/10 border-border/80 hover:border-primary/30 text-foreground hover:bg-muted/40"
                }`}
                title="View Profile"
              >
                <div className="w-5 h-5 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-black text-[9px] shrink-0 border border-primary/20">
                  {(user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline-block max-w-[80px] truncate">
                  {user.name || user.displayName || 'Profile'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/10 border border-border/80 hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow hover:scale-[1.02] text-[11px]"
            >
              <User size={12} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Hamburger Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg bg-muted/20 border border-border/80 hover:border-primary/40 hover:bg-muted/45 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Toggle Menu"
          >
            <Menu size={14} />
          </button>
        </div>
      </div>

      {/* Global Command Search Overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] flex md:hidden">
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
              className="fixed top-0 left-0 bottom-0 h-full w-[280px] bg-card border-r border-border shadow-2xl flex flex-col p-5 overflow-hidden z-[160]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 shrink-0 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background">
                    <svg className="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    </svg>
                  </div>
                  <span className="font-black text-base tracking-tighter text-foreground">UtilityHub</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                    currentPath === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  Dashboard View
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                    currentPath === "/profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  My Profile
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Topbar;
