import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const RECENT_TOOLS_KEY = 'daily_utility_recent_tools';
const PINNED_TOOLS_KEY = 'daily_utility_pinned_tools';
const MAX_RECENT = 8; // Number of recent tools to track

export const useAnalytics = () => {
  const { currentUser, refreshUser } = useAuth();
  
  // Initialize from local storage or user profile
  const [recentTools, setRecentTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [pinnedTools, setPinnedTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PINNED_TOOLS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // Sync state when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      if (currentUser.pinnedTools && currentUser.pinnedTools.length > 0) {
        setPinnedTools(currentUser.pinnedTools);
        try {
          localStorage.setItem(PINNED_TOOLS_KEY, JSON.stringify(currentUser.pinnedTools));
        } catch (_) {}
      }
      if (currentUser.recentHistory && currentUser.recentHistory.length > 0) {
        const paths = currentUser.recentHistory.map(h => h.toolPath);
        setRecentTools(paths);
        try {
          localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(paths));
        } catch (_) {}
      }
    } else {
      // Guest users: load from local storage
      try {
        const localPins = JSON.parse(localStorage.getItem(PINNED_TOOLS_KEY) || '[]');
        const localRecents = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) || '[]');
        setPinnedTools(localPins);
        setRecentTools(localRecents);
      } catch (e) {
        console.error('Failed to load guest analytics from local storage', e);
      }
    }
  }, [currentUser]);

  const recordVisit = useCallback(async (toolPath) => {
    if (!toolPath || toolPath === '/') return;

    // Update state & local storage first for instant UI response
    setRecentTools(prev => {
      const filtered = prev.filter(path => path !== toolPath);
      const updated = [toolPath, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

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

    // Update state & local storage for instant UI feedback
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
      try {
        localStorage.setItem(PINNED_TOOLS_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

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
