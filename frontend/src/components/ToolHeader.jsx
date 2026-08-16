import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Share2, Copy, Check, Pin, Heart, Sparkles, ArrowLeft } from 'lucide-react';
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
  const { togglePinnedTool, pinnedTools, toggleFavoriteTool, favoriteTools } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);

  const isPinned = pinnedTools?.includes(location.pathname);
  const isFavorited = favoriteTools?.includes(location.pathname);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Tool link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTogglePin = () => {
    if (togglePinnedTool) {
      togglePinnedTool(location.pathname);
      toast.success(isPinned ? "Removed from pinned tools" : "Pinned to quick access!");
    }
  };

  const handleToggleFavorite = () => {
    if (toggleFavoriteTool) {
      toggleFavoriteTool(location.pathname);
      toast.success(isFavorited ? "Removed from favorites" : "Added to your favorites!");
    }
  };

  return (
    <div className="w-full mb-6 sm:mb-8">
      {/* Top Breadcrumb & Mobile Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#5f6368] font-medium overflow-x-auto custom-scrollbar py-0.5">
          <Link 
            to="/" 
            className="hover:text-[#1a73e8] transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowLeft size={13} className="inline sm:hidden mr-0.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight size={12} className="text-[#9aa0a6] shrink-0" />
          <Link 
            to={categoryPath} 
            className="hover:text-[#1a73e8] transition-colors whitespace-nowrap"
          >
            {category}
          </Link>
          <ChevronRight size={12} className="text-[#9aa0a6] shrink-0" />
          <span className="text-[#202124] font-semibold truncate max-w-[180px] sm:max-w-none">
            {title}
          </span>
        </div>

        {/* Client-Side / Security Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] border border-[#ceead6] text-[11px] font-semibold text-[#137333] shadow-2xs">
            <ShieldCheck size={13} className="text-[#34a853]" />
            <span>{badge}</span>
          </div>
          {extraBadge && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef7e0] border border-[#feefc3] text-[11px] font-bold text-[#b06000] shadow-2xs">
              <Sparkles size={11} />
              <span>{extraBadge}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#dadce0] shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {Icon && (
            <div className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${iconColor}`}>
              <Icon size={24} className="sm:w-6 sm:h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#202124] tracking-tight leading-tight">
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
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#f1f3f4] w-full md:w-auto justify-end">
          {actions}
          
          <button
            onClick={handleTogglePin}
            title={isPinned ? "Unpin tool" : "Pin tool to topbar"}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isPinned 
                ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] shadow-2xs' 
                : 'bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border-[#dadce0]'
            }`}
          >
            <Pin size={14} className={isPinned ? "fill-current" : ""} />
            <span className="hidden sm:inline">{isPinned ? "Pinned" : "Pin"}</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isFavorited 
                ? 'bg-[#fce8e6] text-[#ea4335] border-[#fad2cf] shadow-2xs' 
                : 'bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border-[#dadce0]'
            }`}
          >
            <Heart size={14} className={isFavorited ? "fill-current" : ""} />
            <span className="hidden sm:inline">{isFavorited ? "Favorited" : "Favorite"}</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Copy direct tool link"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#f8f9fa] text-[#5f6368] hover:text-[#202124] border border-[#dadce0] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copiedLink ? <Check size={14} className="text-[#34a853]" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolHeader;
