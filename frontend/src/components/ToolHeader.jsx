import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Share2, Check, Pin, Heart, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ToolHeader = ({
  title,
  description,
  category = "Utilities",
  categoryPath = "/search",
  icon: Icon,
  iconColor = "text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]",
  badge = "Client-Side Processing",
  extraBadge,
  actions = null
}) => {
  const location = useLocation();
  const { currentUser, togglePin, toggleFavorite } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);

  // Local storage state for instant response & guest fallback
  const [localPinned, setLocalPinned] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('daily_utility_pinned_tools') || '[]');
    } catch {
      return [];
    }
  });

  const [localFavorites, setLocalFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('daily_utility_favorite_tools') || '[]');
    } catch {
      return [];
    }
  });

  // Sync state when currentUser loads
  useEffect(() => {
    if (currentUser?.pinnedTools) {
      setLocalPinned(currentUser.pinnedTools);
    }
    if (currentUser?.favoriteTools) {
      setLocalFavorites(currentUser.favoriteTools);
    }
  }, [currentUser]);

  const isPinned = currentUser?.pinnedTools?.includes(location.pathname) || localPinned.includes(location.pathname);
  const isFavorited = currentUser?.favoriteTools?.includes(location.pathname) || localFavorites.includes(location.pathname);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Tool link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTogglePin = async () => {
    const nextState = !isPinned;

    // 1. Optimistic Local State Update
    setLocalPinned(prev => {
      let updated;
      if (prev.includes(location.pathname)) {
        updated = prev.filter(p => p !== location.pathname);
      } else {
        updated = [...prev, location.pathname];
      }
      try {
        localStorage.setItem('daily_utility_pinned_tools', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Sync with Backend if logged in
    if (togglePin && currentUser) {
      try {
        await togglePin(location.pathname);
      } catch (err) {
        console.error("Failed to sync pin with account", err);
      }
    }

    toast.success(nextState ? "Pinned to quick access!" : "Removed from pinned tools");
  };

  const handleToggleFavorite = async () => {
    const nextState = !isFavorited;

    // 1. Optimistic Local State Update
    setLocalFavorites(prev => {
      let updated;
      if (prev.includes(location.pathname)) {
        updated = prev.filter(p => p !== location.pathname);
      } else {
        updated = [...prev, location.pathname];
      }
      try {
        localStorage.setItem('daily_utility_favorite_tools', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Sync with Backend if logged in
    if (toggleFavorite && currentUser) {
      try {
        await toggleFavorite(location.pathname);
      } catch (err) {
        console.error("Failed to sync favorite with account", err);
      }
    }

    toast.success(nextState ? "Added to your favorites!" : "Removed from favorites");
  };

  return (
    <div className="w-full mb-5 sm:mb-6">
      {/* Top Breadcrumb & Badges Container */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5f6368] font-medium flex-wrap min-w-0">
          <Link 
            to="/" 
            className="hover:text-[#1a73e8] transition-colors flex items-center gap-1 shrink-0 font-semibold text-[#5f6368]"
          >
            <span>Dashboard</span>
          </Link>
          <ChevronRight size={12} className="text-[#9aa0a6] shrink-0" />
          <Link 
            to={categoryPath} 
            className="hover:text-[#1a73e8] transition-colors shrink-0 font-semibold text-[#5f6368]"
          >
            {category}
          </Link>
          <ChevronRight size={12} className="text-[#9aa0a6] shrink-0" />
          <span className="text-[#202124] font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
        </nav>

        {/* Client-Side / Security Badge */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] border border-[#ceead6] text-[11px] font-semibold text-[#137333] shadow-2xs">
            <ShieldCheck size={13} className="text-[#34a853] shrink-0" />
            <span>{badge}</span>
          </div>
          {extraBadge && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef7e0] border border-[#feefc3] text-[11px] font-bold text-[#b06000] shadow-2xs">
              <Sparkles size={11} className="shrink-0" />
              <span>{extraBadge}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#dadce0] shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {Icon && (
            <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${iconColor}`}>
              <Icon size={22} className="sm:w-6 sm:h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#202124] tracking-tight leading-tight break-words">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-[#5f6368] mt-1 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions (Pin, Favorite, Copy Link, Custom Actions) */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#f1f3f4] w-full md:w-auto justify-end flex-wrap">
          {actions}
          
          <button
            type="button"
            onClick={handleTogglePin}
            title={isPinned ? "Unpin tool" : "Pin tool to quick access"}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isPinned 
                ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] shadow-xs' 
                : 'bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border-[#dadce0]'
            }`}
          >
            <Pin size={14} className={isPinned ? "fill-current text-[#1a73e8]" : "text-[#5f6368]"} />
            <span className="hidden sm:inline font-bold">{isPinned ? "Pinned" : "Pin"}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isFavorited 
                ? 'bg-[#fce8e6] text-[#ea4335] border-[#fad2cf] shadow-xs' 
                : 'bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border-[#dadce0]'
            }`}
          >
            <Heart size={14} className={isFavorited ? "fill-current text-[#ea4335]" : "text-[#5f6368]"} />
            <span className="hidden sm:inline font-bold">{isFavorited ? "Favorite" : "Favorite"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy direct tool link"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border border-[#dadce0] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copiedLink ? <Check size={14} className="text-[#34a853]" /> : <Share2 size={14} />}
            <span className="hidden sm:inline font-bold">{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolHeader;
