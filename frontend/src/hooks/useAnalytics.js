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
      // Guest users: force clear pinning/recents state and local storage
      setPinnedTools([]);
      setRecentTools([]);
      try {
        localStorage.removeItem(RECENT_TOOLS_KEY);
        localStorage.removeItem(PINNED_TOOLS_KEY);
      } catch (e) {
        console.error('Failed to clear analytics from local storage', e);
      }
    }
  }, [currentUser]);

  const recordVisit = useCallback(async (toolPath) => {
    if (!toolPath || toolPath === '/') return;

    // Guest users are not allowed to save recents history
    if (!currentUser) return;

    // Update state first for instant UI response
    setRecentTools(prev => {
      const filtered = prev.filter(path => path !== toolPath);
      const updated = [toolPath, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      await api.post('/auth/analytics/visit', { toolPath });
      refreshUser();
    } catch (err) {
      console.error('Failed to sync history visit to backend:', err);
    }
  }, [currentUser, refreshUser]);

  const togglePin = useCallback(async (toolPath) => {
    if (!toolPath) return;

    // Guest users are not allowed to pin tools
    if (!currentUser) return;

    // Update state first for instant UI response
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

    try {
      await api.post('/auth/analytics/pin', { toolPath });
      refreshUser();
    } catch (err) {
      console.error('Failed to sync toggle pin to backend:', err);
    }
  }, [currentUser, refreshUser]);

  return {
    recentTools,
    pinnedTools,
    recordVisit,
    togglePin
  };
};
