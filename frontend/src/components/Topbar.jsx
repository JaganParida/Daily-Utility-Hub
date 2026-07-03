import {
  User,
  LogOut,
  Search,
  ArrowLeft,
  Layers,
  Pin,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHotkeys } from "react-hotkeys-hook";

import CommandPalette from "./CommandPalette";

const Topbar = ({ isScrolled }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { currentUser: user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Global Hotkeys
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
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-20 w-full max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-12 lg:px-20 xl:px-32 bg-transparent z-50 absolute top-0 inset-x-0 mt-4 transition-all duration-300"
    >
      {/* LEFT: Logo & Back Button */}
      <motion.div layout className="flex items-center gap-2 md:gap-4 shrink-0">
        {location.pathname !== "/dashboard" && location.pathname !== "/" ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-muted/80 border border-border px-4 py-2 rounded-full transition-all shadow-sm group whitespace-nowrap"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline-block">Dashboard</span>
          </button>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <motion.div
              layout
              className="w-10 h-10 shrink-0 rounded-xl bg-foreground flex items-center justify-center text-background shadow-md transition-transform group-hover:scale-105"
            >
              <svg className="w-[22px] h-[22px] text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </motion.div>
            <span className="hidden sm:inline-block font-black text-2xl tracking-tighter text-foreground whitespace-nowrap">
              UtilityHub
            </span>
          </Link>
        )}
      </motion.div>

      {/* CENTER: Empty Space */}
      <div className="flex-1 flex justify-center px-6 md:px-12 lg:px-16 relative h-12 min-w-0"></div>

      {/* RIGHT: Navigation & User Profile */}
      <motion.div layout className="flex items-center gap-3 sm:gap-4 shrink-0">
        {user ? (
          <motion.div layout className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-sm font-bold text-foreground bg-card hover:bg-muted/80 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border hover:border-primary/30 shadow-sm transition-all duration-300 cursor-pointer"
              title="View Profile Settings"
            >
              <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-[11px] shrink-0 border border-primary/20">
                {(user.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate text-foreground/90 hover:text-foreground">
                {user.name || user.displayName || user.email || 'Profile'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all shadow-sm group"
              title="Logout"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <User size={18} />
            <span className="hidden sm:inline-block text-sm">Sign In</span>
          </Link>
        )}
      </motion.div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </motion.header>
  );
};

export default Topbar;
