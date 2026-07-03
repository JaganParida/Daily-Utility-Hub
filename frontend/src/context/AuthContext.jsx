import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign Up with Email
  const signupWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Sign In with Email
  const loginWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully logged out');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out');
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const handleAuthError = (error) => {
    // Graceful error messages
    switch (error.code) {
      case 'auth/invalid-email':
        toast.error('Invalid email address format.');
        break;
      case 'auth/user-not-found':
        toast.error('No account found with this email.');
        break;
      case 'auth/wrong-password':
        toast.error('Incorrect password.');
        break;
      case 'auth/email-already-in-use':
        toast.error('An account already exists with this email.');
        break;
      case 'auth/weak-password':
        toast.error('Password is too weak. Please use at least 6 characters.');
        break;
      case 'auth/invalid-api-key':
        toast.error('Firebase API key is missing or invalid. Check your .env file!');
        break;
      default:
        console.error(error);
        toast.error(error.message || 'Authentication failed. Please try again.');
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
