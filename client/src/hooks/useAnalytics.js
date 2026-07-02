import { useState, useEffect, useCallback } from 'react';

const RECENT_TOOLS_KEY = 'daily_utility_recent_tools';
const PINNED_TOOLS_KEY = 'daily_utility_pinned_tools';
const MAX_RECENT = 5; // Number of recent tools to track

export const useAnalytics = () => {
  const [recentTools, setRecentTools] = useState([]);
  const [pinnedTools, setPinnedTools] = useState([]);

  // Initialize state from local storage on mount
  useEffect(() => {
    try {
      const storedRecent = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];
      const storedPinned = JSON.parse(localStorage.getItem(PINNED_TOOLS_KEY)) || [];
      
      if (Array.isArray(storedRecent)) setRecentTools(storedRecent);
      if (Array.isArray(storedPinned)) setPinnedTools(storedPinned);
    } catch (e) {
      console.error('Failed to parse analytics from local storage', e);
    }
  }, []);

  const recordVisit = useCallback((toolPath) => {
    if (!toolPath || toolPath === '/') return;

    setRecentTools(prev => {
      // Remove it if it already exists to move it to the front
      const filtered = prev.filter(path => path !== toolPath);
      const updated = [toolPath, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const togglePin = useCallback((toolPath) => {
    if (!toolPath) return;

    setPinnedTools(prev => {
      const isPinned = prev.includes(toolPath);
      let updated;
      if (isPinned) {
        updated = prev.filter(path => path !== toolPath);
      } else {
        updated = [...prev, toolPath];
      }
      localStorage.setItem(PINNED_TOOLS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    recentTools,
    pinnedTools,
    recordVisit,
    togglePin
  };
};
