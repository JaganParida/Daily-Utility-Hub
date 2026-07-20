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
    // Start popup immediately to prevent browser popup blockers from intercepting it
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070709] text-white">
      {/* Left Column: Visual panel */}
      <div className="hidden md:flex md:w-[42%] bg-[#070709] relative items-center justify-center p-12 overflow-hidden border-r border-[#18181b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_85%,#0f172a_0%,transparent_60%)]" />
        <div className="absolute top-[25%] left-[20%] w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[25%] right-[20%] w-80 h-80 bg-[#4f46e5]/10 rounded-full blur-[100px]" />
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#16161b_1px,transparent_1px),linear-gradient(to_bottom,#16161b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40" />

        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2563eb] flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)] mb-8 border border-white/10">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 text-white">
            Daily Utility Hub
          </h1>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-6">
            Standard Utilities & AI Workspaces
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            Sign in to access your dashboard, securely upload and process document assets, and run cloud-assisted transcriptions.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-[#09090b]">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3.5 py-1.5 rounded-none">
          <ArrowLeft size={13} />
          Back to Home
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobile-only compact logo header */}
          <div className="flex md:hidden flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-widest text-white uppercase">UtilityHub</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Sign in
            </h2>
            <p className="text-zinc-500 text-sm mt-1.5 font-medium">
              New to UtilityHub?{' '}
              <Link to="/register" className="text-[#2563eb] font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Form controls */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5 mb-1.5 block">Email Address</label>
                <input
                  type="email" required
                  className="appearance-none rounded-none relative block w-full px-4 py-3 border border-zinc-800 placeholder-zinc-600 text-white bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                  placeholder="Email Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">Password</label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-[#2563eb] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required
                    className="appearance-none rounded-none relative block w-full px-4 py-3 pr-12 border border-zinc-800 placeholder-zinc-600 text-white bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-none text-white font-bold bg-[#2563eb] hover:bg-[#1d4ed8] focus:outline-none transition-colors disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-xs uppercase tracking-wider"
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
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#09090b] text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Or sign in with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSubmit}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-800 rounded-none bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
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
