import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const isMountedRef = useRef(true);

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Cleanup ref on unmount
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Sync profile data from backend on request
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (isMountedRef.current && response.data) {
        setCurrentUser(prev => prev ? { ...prev, ...response.data } : response.data);
      }
    } catch (error) {
      if (error.response?.status === 401 && isMountedRef.current) {
        setCurrentUser(null);
      }
    }
  };

  // Load user profile on startup using HTTP-only cookies
  useEffect(() => {
    let cancelled = false;
    let retryTimeout = null;

    const fetchProfile = async (attempt = 0) => {
      try {
        const response = await api.get('/auth/profile');
        if (cancelled) return;

        if (response.data) {
          setCurrentUser(response.data);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
        const isAborted = error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED';

        if ((isNetworkError || isAborted) && attempt < 2) {
          retryTimeout = setTimeout(() => {
            if (!cancelled) fetchProfile(attempt + 1);
          }, 800);
          return;
        }

        if (error.response?.status === 401) {
          setCurrentUser(null);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // 1. Send OTP for Registration (Zero DB writes at this stage)
  const sendSignupOtp = async (email, name) => {
    try {
      const response = await api.post('/auth/register/send-otp', { email, name });
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // 2. Verify OTP & Finalize Registration (DB Account created only AFTER OTP is verified)
  const signupWithEmail = async ({ signupOtpToken, otp, password, name }) => {
    try {
      const response = await api.post('/auth/register/verify', {
        signupOtpToken,
        otp,
        password,
        name
      });

      if (response.data && response.data.success) {
        toast.success('Account created successfully!');
        setCurrentUser(response.data);
        return response.data;
      }
      throw new Error(response.data?.message || 'Registration failed.');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // 3. Direct Login with Email & Password (Against MongoDB)
  const loginWithEmail = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      toast.success('Welcome back!');
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // 4. Google OAuth 2.0 Sign In (Google Cloud Credentials)
  const loginWithGoogle = async (credential) => {
    try {
      const response = await api.post('/auth/google', { credential });
      toast.success('Signed in with Google!');
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // 5. Logout
  const logout = async () => {
    try {
      await api.get('/auth/logout');
      setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out');
    }
  };

  // Profile Update Helper
  const updateProfile = async (name, avatar) => {
    try {
      const response = await api.put('/auth/profile', { name, avatar });
      toast.success('Profile updated successfully!');
      await refreshUser();
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Terminate device session
  const terminateSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setCurrentUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activeSessions: (prev.activeSessions || []).filter(s => s._id !== sessionId)
        };
      });
      toast.success('Session terminated.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to terminate session.';
      toast.error(msg);
    }
  };

  const togglePin = async (toolPath) => {
    try {
      const response = await api.post('/auth/analytics/pin', { toolPath });
      setCurrentUser(prev => prev ? { ...prev, pinnedTools: response.data.pinnedTools } : null);
      toast.success('Pins updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update pin');
    }
  };

  const toggleFavorite = async (toolPath) => {
    try {
      const response = await api.post('/auth/analytics/favorite', { toolPath });
      setCurrentUser(prev => prev ? { ...prev, favoriteTools: response.data.favoriteTools } : null);
      toast.success('Favorites updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleAuthError = (error) => {
    const msg = error.response?.data?.message || error.message || 'Authentication failed. Please try again.';
    toast.error(msg);
  };

  const value = {
    currentUser,
    loading,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    openAuthModal,
    closeAuthModal,
    sendSignupOtp,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateProfile,
    terminateSession,
    refreshUser,
    togglePin,
    toggleFavorite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
