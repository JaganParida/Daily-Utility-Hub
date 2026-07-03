import { createContext, useContext, useState, useEffect } from 'react';
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

  // Sync profile data from backend on request
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentUser(prev => prev ? { ...prev, ...response.data } : response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        await firebaseSignOut(auth);
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    }
  };

  // Listen to Firebase Auth state change for automatic page-load session recovery
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          // Sync with MongoDB backend using 'refresh' mode (sets session cookie & retrieves profile)
          const response = await api.post('/auth/session', { idToken, mode: 'refresh' });
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          setCurrentUser({
            ...response.data,
            uid: firebaseUser.uid,
            emailVerified: firebaseUser.emailVerified
          });
        } catch (error) {
          console.error('Auto session sync failed:', error);
          await firebaseSignOut(auth);
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      } else {
        // Log out on backend when Firebase session terminates
        try {
          await api.get('/auth/logout');
        } catch (err) {}
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setCurrentUser({
        ...response.data,
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
      localStorage.removeItem('token');
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
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setCurrentUser({
        ...response.data,
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
      localStorage.removeItem('token');
      handleAuthError(error);
      throw error;
    }
  };

  // Google Sign In & Sign Up (Hybrid verification with modes 'login' vs 'register')
  const loginWithGoogle = async (mode = 'refresh') => {
    try {
      // 1. Trigger Google popup immediately
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Verify with Express backend, checking email exists/registers depending on mode
      const response = await api.post('/auth/session', { idToken, mode });
      toast.success(mode === 'register' ? 'Successfully registered!' : 'Signed in with Google!');
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setCurrentUser({
        ...response.data,
        uid: result.user.uid,
        emailVerified: result.user.emailVerified
      });
      return response.data;
    } catch (error) {
      await firebaseSignOut(auth);
      localStorage.removeItem('token');
      handleAuthError(error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      await api.get('/auth/logout');
      localStorage.removeItem('token');
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

  const handleAuthError = (error) => {
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
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
