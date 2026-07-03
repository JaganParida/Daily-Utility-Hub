import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut
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

  // Sync profile data from backend
  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentUser(response.data);
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount to fetch session
  useEffect(() => {
    fetchProfile();
  }, []);

  // Sign Up with Email
  const signupWithEmail = async (email, password, name) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      toast.success('Successfully registered!');
      await fetchProfile();
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Sign In with Email
  const loginWithEmail = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      toast.success('Welcome back!');
      await fetchProfile();
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Google Sign In (Hybrid exchange)
  const loginWithGoogle = async () => {
    try {
      // 1. Get ID Token from Google popup via Firebase Auth client
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Exchange token with Express backend to register active session and cookie
      const response = await api.post('/auth/google', { idToken });
      toast.success('Signed in with Google!');
      await fetchProfile();
      
      // Clean up Firebase client auth state so it doesn't conflict
      await firebaseSignOut(auth);
      
      return response.data;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Logout
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
  const updateProfile = async (name, password) => {
    try {
      const response = await api.put('/auth/profile', { name, password });
      toast.success('Profile updated successfully!');
      await fetchProfile();
      return response.data;
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
      await fetchProfile();
    } catch (error) {
      toast.error('Failed to terminate session.');
    }
  };

  const handleAuthError = (error) => {
    const msg = error.response?.data?.message || 'Authentication failed. Please try again.';
    toast.error(msg);
  };

  const value = {
    currentUser,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateProfile,
    terminateSession,
    refreshUser: fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
