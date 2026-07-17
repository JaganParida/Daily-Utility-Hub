import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
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

  // Sync profile data from backend on request
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentUser(prev => prev ? { ...prev, ...response.data } : response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        await firebaseSignOut(auth);
        setCurrentUser(null);
      }
    }
  };

  // Load user profile on startup using HTTP-only cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if returning from a Google redirect sign-in flow
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          const idToken = await redirectResult.user.getIdToken();
          const response = await api.post('/auth/session', { idToken, mode: 'google' });
          if (response.data) {
            setCurrentUser(response.data);
            toast.success('Signed in with Google!');
          }
          return;
        }

        const response = await api.get('/auth/profile');
        if (response.data) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        // Ignored on startup
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Sign Up with Email & Password
  const signupWithEmail = async (email, password, name) => {
    try {
      // 1. Create account on Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Sync and register account in MongoDB
      const response = await api.post('/auth/session', { idToken, mode: 'register', name });
      toast.success('Successfully registered!');

      setCurrentUser({
        ...response.data,
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
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
        emailVerified: userCredential.user.emailVerified
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
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
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
  const terminateSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session terminated.');
      await refreshUser();
    } catch (error) {
      toast.error('Failed to terminate session.');
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
    toggleFavorite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
