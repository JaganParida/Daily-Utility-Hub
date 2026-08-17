import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Heart, Pin, FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay, FolderArchive, Music, Zap
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { allTools } from "../data/toolCategories";

const FAVORITES_STORAGE_KEY = 'daily_utility_favorite_tools';
const PINNED_STORAGE_KEY = 'daily_utility_pinned_tools';

const Favorites = () => {
  const { currentUser, toggleFavorite, togglePin } = useAuth();

  const [localFavorites, setLocalFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [localPins, setLocalPins] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PINNED_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // Sync state when currentUser loads
  useEffect(() => {
    if (currentUser?.favoriteTools) {
      setLocalFavorites(currentUser.favoriteTools);
    }
    if (currentUser?.pinnedTools) {
      setLocalPins(currentUser.pinnedTools);
    }
  }, [currentUser]);

  // Combine unique active favorite paths
  const activeFavorites = Array.from(
    new Set([...(currentUser?.favoriteTools || []), ...localFavorites])
  );

  // Resolve tool details from allTools catalog
  const favoriteResolved = activeFavorites
    .map((path) => {
      const found = allTools.find((t) => t.to === path);
      if (found) {
        return {
          to: found.to,
          name: found.name,
          category: found.category || 'Utilities',
          description: found.description,
          icon: found.icon || Zap
        };
      }
      return null;
    })
    .filter(Boolean);

  const favoriteGroups = favoriteResolved.reduce((acc, tool) => {
    const cat = tool.category;
    if (!acc[cat]) {
      acc[cat] = {
        label: cat.toUpperCase(),
        tools: [],
      };
    }
    acc[cat].tools.push(tool);
    return acc;
  }, {});

  const handleToggleFavorite = async (toolPath) => {
    // 1. Local update
    setLocalFavorites(prev => {
      const updated = prev.filter(p => p !== toolPath);
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Backend sync
    if (toggleFavorite && currentUser) {
      try {
        await toggleFavorite(toolPath);
      } catch (_) {}
    }
  };

  const handleTogglePin = async (toolPath) => {
    const isPinned = (currentUser?.pinnedTools || localPins).includes(toolPath);

    // 1. Local update
    setLocalPins(prev => {
      let updated;
      if (isPinned) {
        updated = prev.filter(p => p !== toolPath);
      } else {
        updated = [...prev, toolPath];
      }
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Backend sync
    if (togglePin && currentUser) {
      try {
        await togglePin(toolPath);
      } catch (_) {}
    }
  };

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#f8f9fa] text-[#202124] pt-8 pb-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dadce0] pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] flex items-center justify-center text-[#ea4335] shadow-2xs">
                <Heart size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">Favorite Utilities</h1>
                <p className="text-xs text-[#5f6368] mt-0.5">Quick access to your preferred tools saved across all devices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#dadce0] text-xs font-semibold text-[#5f6368] shadow-2xs">
                {favoriteResolved.length} {favoriteResolved.length === 1 ? 'utility' : 'utilities'} saved
              </div>
            </div>
          </div>

          {/* Empty State */}
          {favoriteResolved.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-12 sm:p-16 border border-dashed border-[#dadce0] bg-white rounded-3xl text-center shadow-xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] flex items-center justify-center mb-4 text-[#ea4335]">
                <Heart size={32} />
              </div>
              <h3 className="text-base font-bold text-[#202124]">No favorites saved yet</h3>
              <p className="text-xs text-[#5f6368] mt-2 max-w-sm leading-relaxed">
                Click the Favorite (Heart) button on any tool header across the platform to save it to your personal favorites collection.
              </p>
              <Link
                to="/search"
                className="mt-6 px-6 py-2.5 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-all shadow-xs active:scale-95"
              >
                Browse All Utilities
              </Link>
            </motion.div>
          ) : (
            /* Groups Deck */
            <div className="space-y-8">
              {Object.keys(favoriteGroups).map((catKey) => {
                const group = favoriteGroups[catKey];
                return (
                  <div key={catKey} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#dadce0] pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a73e8]">{group.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368]">
                        {group.tools.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {group.tools.map((tool) => {
                        const ToolIcon = tool.icon || Zap;
                        const isPinned = (currentUser?.pinnedTools || localPins).includes(tool.to);

                        return (
                          <div 
                            key={tool.to} 
                            className="p-3.5 flex items-center justify-between gap-3 bg-white border border-[#dadce0] hover:border-[#ea4335] rounded-2xl shadow-xs group transition-all"
                          >
                            <Link
                              to={tool.to}
                              className="flex-1 flex items-center gap-3 min-w-0"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#fce8e6] border border-[#fad2cf] group-hover:bg-[#ea4335] group-hover:text-white flex items-center justify-center transition-colors shrink-0 text-[#ea4335]">
                                <ToolIcon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#202124] group-hover:text-[#ea4335] transition-colors truncate">{tool.name}</p>
                                <p className="text-[11px] text-[#5f6368] truncate mt-0.5">{tool.description}</p>
                              </div>
                            </Link>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleFavorite(tool.to)}
                                className="p-1.5 rounded-lg text-[#ea4335] hover:bg-[#fce8e6] cursor-pointer"
                                title="Remove from favorites"
                              >
                                <Heart size={14} fill="currentColor" />
                              </button>
                              <button
                                onClick={() => handleTogglePin(tool.to)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isPinned
                                    ? "text-[#1a73e8] bg-[#e8f0fe]"
                                    : "text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe]"
                                }`}
                                title={isPinned ? "Unpin tool" : "Pin tool"}
                              >
                                <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default Favorites;
