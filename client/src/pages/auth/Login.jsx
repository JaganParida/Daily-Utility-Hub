import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, ArrowLeft } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import Footer from '../../components/Footer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageTransition className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative mt-16 lg:mt-0">
        <Link to="/" className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium bg-card/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 hover:bg-card shadow-sm z-10">
        <ArrowLeft size={18} />
        Back to Home
      </Link>
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-3xl shadow-sm border border-border">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Log in to sync your tools across devices.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-background hover:bg-muted/50 text-foreground font-semibold transition-colors disabled:opacity-50"
          >
            {isGoogleLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign in with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground text-xs uppercase tracking-wider font-bold">Or continue with email</span>
            </div>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Email address</label>
              <input
                type="email" required
                className="mt-1 appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/50 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isGoogleLoading}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Password</label>
              <input
                type="password" required
                className="mt-1 appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/50 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isGoogleLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-semibold text-indigo-500 hover:text-indigo-400">
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" aria-hidden="true" />
                </span>
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-foreground hover:text-indigo-500 transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
      </PageTransition>
      <Footer />
    </div>
  );
};

export default Login;
