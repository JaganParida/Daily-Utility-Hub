import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error('Please enter a valid email address.');
    }
    if (!password || password.trim() === '') {
      return toast.error('Please enter your password.');
    }

    setIsSubmitting(true);
    try {
      const response = await loginWithEmail(email, password);
      if (response && response.emailVerified === false) {
        toast.success('Please verify your email to continue.');
        navigate('/register', { state: { email, triggerGoogleOtp: true } });
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      const isNotFound = 
        error.code === 'auth/user-not-found' || 
        error.response?.status === 404 || 
        error.response?.data?.message?.toLowerCase().includes('not associated') ||
        error.message?.toLowerCase().includes('not associated') ||
        error.response?.data?.message?.toLowerCase().includes('register first') ||
        error.message?.toLowerCase().includes('register first');
        
      if (isNotFound) {
        toast.error('No account associated with this email. Redirecting to register...');
        setTimeout(() => {
          navigate('/register', { state: { email } });
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    const authPromise = loginWithGoogle();
    setIsGoogleLoading(true);
    try {
      const response = await authPromise;
      if (response && (response.requiresOtp || response.isNewUser || response.isEmailVerified === false || response.emailVerified === false)) {
        toast.success('Please verify your email to continue.');
        navigate('/register', { state: { email: response.email, triggerGoogleOtp: true } });
      } else if (response) {
        navigate('/');
      }
    } catch (error) {
      // Errors handled by AuthContext
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      {/* Left Column: Visual panel in Light Theme */}
      <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-100/90 relative items-center justify-center p-12 overflow-hidden border-r border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.06)_0%,transparent_60%)]" />
        <div className="absolute top-[25%] left-[20%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 mb-8 text-white">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 text-slate-900">
            Daily Utility Hub
          </h1>
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-5">
            Offline-First Developer & File Utilities
          </p>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            Sign in to access your customized workspaces, sync favorite tools across devices, and manage usage analytics.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel in Light Theme */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-white">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold text-xs bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobile-only compact logo header */}
          <div className="flex md:hidden flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 text-white shadow-md shadow-blue-600/20">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">UtilityHub</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              New to UtilityHub?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Form controls */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 ml-0.5 mb-1.5 block">Email Address</label>
                <input
                  type="email" required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm transition-all shadow-2xs"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 ml-0.5">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 pr-12 border border-slate-200 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm transition-all shadow-2xs"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 text-[10px] uppercase tracking-widest font-bold">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSubmit}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            {isGoogleLoading ? <Loader2 className="animate-spin" size={16} /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>
        </div>
      </PageTransition>
    </div>
  );
};

export default Login;
