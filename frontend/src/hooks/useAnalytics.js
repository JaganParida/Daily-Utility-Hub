import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const RECENT_TOOLS_KEY = 'daily_utility_recent_tools';
const PINNED_TOOLS_KEY = 'daily_utility_pinned_tools';
const MAX_RECENT = 8; // Number of recent tools to track

export const useAnalytics = () => {
  const { currentUser, refreshUser } = useAuth();
  const [recentTools, setRecentTools] = useState([]);
  const [pinnedTools, setPinnedTools] = useState([]);

  // Sync state with currentUser when auth changes
  useEffect(() => {
    if (currentUser) {
      setPinnedTools(currentUser.pinnedTools || []);
      const paths = (currentUser.recentHistory || []).map(h => h.toolPath);
      setRecentTools(paths);
    } else {
      try {
        const storedRecent = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];
        const storedPinned = JSON.parse(localStorage.getItem(PINNED_TOOLS_KEY)) || [];
        if (Array.isArray(storedRecent)) setRecentTools(storedRecent);
        if (Array.isArray(storedPinned)) setPinnedTools(storedPinned);
      } catch (e) {
        console.error('Failed to parse analytics from local storage', e);
      }
    }
  }, [currentUser]);

  const recordVisit = useCallback(async (toolPath) => {
    if (!toolPath || toolPath === '/') return;

    // Update local storage/state first for instant UI response
    setRecentTools(prev => {
      const filtered = prev.filter(path => path !== toolPath);
      const updated = [toolPath, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      return updated;
    });

    // If authenticated, sync with the server database
    if (currentUser) {
      try {
        await api.post('/auth/analytics/visit', { toolPath });
        refreshUser();
      } catch (err) {
        console.error('Failed to sync history visit to backend:', err);
      }
    }
  }, [currentUser, refreshUser]);

  const togglePin = useCallback(async (toolPath) => {
    if (!toolPath) return;

    // Update local storage/state first for instant UI response
    setPinnedTools(prev => {
      const isPinned = prev.includes(toolPath);
      let updated;
      if (isPinned) {
        updated = prev.filter(path => path !== toolPath);
      } else {
        if (prev.length >= 12) {
          return prev;
        }
        updated = [...prev, toolPath];
      }
      localStorage.setItem(PINNED_TOOLS_KEY, JSON.stringify(updated));
      return updated;
    });

    // If authenticated, sync with the server database
    if (currentUser) {
      try {
        await api.post('/auth/analytics/pin', { toolPath });
        refreshUser();
      } catch (err) {
        console.error('Failed to sync toggle pin to backend:', err);
      }
    }
  }, [currentUser, refreshUser]);

  return {
    recentTools,
    pinnedTools,
    recordVisit,
    togglePin
  };
};
