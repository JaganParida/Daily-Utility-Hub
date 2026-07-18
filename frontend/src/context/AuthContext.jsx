import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

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
      // Only clear user on explicit 401 - never on network errors
      if (error.response?.status === 401 && isMountedRef.current) {
        setCurrentUser(null);
      }
      // Do NOT call firebaseSignOut or api.get('/auth/logout') here
      // This prevents cascading logouts from refreshUser failures
    }
  };

  // Load user profile on startup using HTTP-only cookies
  // Uses retry logic to handle race conditions during hard refresh (Ctrl+Shift+R)
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

        // If it's a network error (no response object), the request was likely
        // aborted by the browser during hard refresh. Retry once after a short delay.
        const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
        const isAborted = error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED';

        if ((isNetworkError || isAborted) && attempt < 2) {
          retryTimeout = setTimeout(() => {
            if (!cancelled) fetchProfile(attempt + 1);
          }, 800);
          return;
        }

        // Only destroy the session if the backend explicitly says it's invalid (401)
        if (error.response?.status === 401) {
          setCurrentUser(null);
          try { await firebaseSignOut(auth); } catch (_) {}
          try { await api.get('/auth/logout'); } catch (_) {}
        } else {
          // For all other errors (network issues, 500s, timeouts), just show no user
          // but do NOT destroy the session cookie - it's still valid
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

  // Sign Up with Email & Password
  const signupWithEmail = async (email, password, name) => {
    try {
      let userCredential;
      let mode = 'register';

      try {
        // 1. Try creating new Firebase Auth account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/email-already-in-use') {
          // Firebase user exists (possibly orphaned after DB deletion)
          // Sign in with existing Firebase credentials instead
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            mode = 'register'; // 'register' mode auto-creates MongoDB user if missing
          } catch (signInError) {
            // Wrong password for existing Firebase account
            await firebaseSignOut(auth);
            throw firebaseError; // Throw original "already in use" error
          }
        } else {
          throw firebaseError;
        }
      }

      const idToken = await userCredential.user.getIdToken();

      // 2. Sync and register/create account in MongoDB
      const response = await api.post('/auth/session', { idToken, mode, name });
      toast.success('Successfully registered!');

      setCurrentUser({
        ...response.data,
        uid: userCredential.user.uid
      });
      return response.data;
    } catch (error) {
      try { await firebaseSignOut(auth); } catch (_) {}
      handleAuthError(error);
      throw error;
    }
  };

  // Sign In with Email & Password
  const loginWithEmail = async (email, password) => {
    try {
      // 1. Verify credentials with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Sync session with backend (mode 'login' verifies email exists in database)
      const response = await api.post('/auth/session', { idToken, mode: 'login' });
      toast.success('Welcome back!');

      setCurrentUser({
        ...response.data,
        uid: userCredential.user.uid,
        emailVerified: response.data.isEmailVerified !== undefined ? response.data.isEmailVerified : response.data.emailVerified
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
      handleAuthError(error);
      throw error;
    }
  };

  // Google Authentication Sign In / Sign Up
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.post('/auth/session', { idToken, mode: 'google' });
      
      if (response.data.requiresOtp) {
        // Deferred login: Do not set current user yet, let frontend handle OTP
        return {
           ...response.data,
           firebaseUser: result.user
        };
      }

      toast.success('Signed in with Google!');

      setCurrentUser({
        ...response.data,
        uid: result.user.uid,
        emailVerified: response.data.isEmailVerified !== undefined ? response.data.isEmailVerified : response.data.emailVerified
      });
      return response.data;
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return; // User cancelled, no error needed
      }
      handleAuthError(error);
      throw error;
    }
  };

  // Finalize Google Signup after OTP
  const finalizeGoogleSignup = async (firebaseUser, otpVerifiedToken) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await api.post('/auth/session', { 
        idToken, 
        mode: 'google',
        otpVerifiedToken 
      });
      
      toast.success('Signed in with Google!');
      setCurrentUser({
        ...response.data,
        uid: firebaseUser.uid,
        emailVerified: true
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
      handleAuthError(error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      await api.get('/auth/logout');
      setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out');
    }
  };

  // Profile Update Helper
  const updateProfile = async (name) => {
    try {
      const response = await api.put('/auth/profile', { name });
      toast.success('Profile updated successfully!');
      await refreshUser();
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Send Password Reset Email (Forgot Password)
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Logout Session Helper (terminates another device session)
  // Updates state LOCALLY instead of calling refreshUser to prevent cascading logout
  const terminateSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      // Update state locally - remove the terminated session from the list
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
    const msgLower = (error.response?.data?.message || error.message || '').toLowerCase();
    const isConflict = 
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/email-already-in-use' ||
      error.response?.status === 404 || 
      error.response?.status === 400 || 
      msgLower.includes('register first') ||
      msgLower.includes('already exists') ||
      msgLower.includes('log in instead');
      
    if (isConflict) {
      return; // Page component will show a custom redirection toast
    }

    let msg = error.response?.data?.message || error.message || 'Authentication failed. Please try again.';
    
    // Clean Firebase code error messages
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          msg = 'Invalid email address format.';
          break;
        case 'auth/user-not-found':
          msg = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          msg = 'Incorrect password.';
          break;
        case 'auth/email-already-in-use':
          msg = 'An account already exists with this email.';
          break;
        case 'auth/weak-password':
          msg = 'Password is too weak (min 6 characters).';
          break;
        case 'auth/popup-blocked':
          msg = 'Google login popup was blocked. Please enable popups or try again.';
          break;
        default:
          break;
      }
    }
    toast.error(msg);
  };

  const value = {
    currentUser,
    loading,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateProfile,
    resetPassword,
    terminateSession,
    refreshUser,
    togglePin,
    toggleFavorite,
    finalizeGoogleSignup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
