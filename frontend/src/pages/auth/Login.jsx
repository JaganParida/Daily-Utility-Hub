import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, ArrowLeft, Eye, EyeOff, Zap } from 'lucide-react';
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
      // Handled by context
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#08090d] text-[#f8fafc]">
      {/* Left Column: Visual panel in Next-Gen Obsidian Dark */}
      <div className="hidden md:flex md:w-[42%] bg-[#0c0e17] relative items-center justify-center p-12 overflow-hidden border-r border-[#1e2235]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15)_0%,transparent_60%)]" />
        <div className="absolute top-[25%] left-[20%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-8 text-white">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 text-white">
            Utility<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Hub</span>
          </h1>
          <p className="text-indigo-400 text-xs font-mono uppercase tracking-wider mb-5">
            Offline-First Client Engine
          </p>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Sign in to access your customized workspaces, sync favorite tools across devices, and inspect telemetry.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-24 bg-[#08090d]">
        <PageTransition className="w-full max-w-md mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Hub
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Authenticate via Google or your account credentials.
            </p>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 bg-[#0f1118] hover:bg-[#141722] border border-[#1e2235] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin text-indigo-400" size={18} />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e2235]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono tracking-wider">
              <span className="bg-[#08090d] px-3 text-slate-500 font-semibold">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] placeholder-slate-500 text-white bg-[#0f1118] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-0.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] placeholder-slate-500 text-white bg-[#0f1118] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Create an account
            </Link>
          </p>
        </PageTransition>
      </div>
    </div>
  );
};

export default Login;
