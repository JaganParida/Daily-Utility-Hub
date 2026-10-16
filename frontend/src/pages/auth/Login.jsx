import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogIn, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LockKeyhole,
  Layers
} from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return toast.error('Please enter a valid email address.');
    }
    if (!password || password.trim() === '') {
      return toast.error('Please enter your password.');
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || '';
      if (error.response?.status === 404 || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('register first')) {
        toast.error('No account found with this email. Redirecting to registration...');
        setTimeout(() => {
          navigate('/register');
        }, 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-10 text-slate-800 antialiased selection:bg-[#1a73e8] selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-slate-50/0 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container: SaaS Two-Column Card */}
      <PageTransition className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Column: Visual & Benefits Panel (Desktop) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(26,115,232,0.25)_0%,transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10">
            {/* Top Brand Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-8">
              <div className="w-9 h-9 rounded-xl bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-[#1557b0] transition-colors">
                <Zap size={20} className="fill-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Utility<span className="text-[#8ab4f8]">Hub</span>
              </span>
            </Link>

            <h2 className="text-2xl font-black text-white tracking-tight leading-snug mb-3">
              One account for all your daily utilities.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-normal mb-8">
              Pin your most-used tools, sync recent conversions, and enjoy a seamless offline-first experience.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">100% Client-Side Privacy</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Files and PDFs never upload to servers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={14} className="text-[#8ab4f8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">90+ Free Production Tools</p>
                  <p className="text-[11px] text-slate-400 leading-tight">PDFs, images, code playgrounds, audio & more.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <LockKeyhole size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Multi-Device Session Sync</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Keep bookmarks and pins synced across 2 devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Free Forever • No Credit Card</span>
            <Link to="/" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              Back to Home <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto space-y-6">
            
            {/* Mobile Header (Hidden on desktop) */}
            <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-100">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white">
                  <Zap size={16} className="fill-white" />
                </div>
                <span className="font-bold text-base text-slate-900">
                  Utility<span className="text-[#1a73e8]">Hub</span>
                </span>
              </Link>
              <Link to="/" className="text-xs text-slate-500 font-medium hover:text-slate-800">
                Back to Tools
              </Link>
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enter your credentials or continue with Google.
              </p>
            </div>

            {/* Google Sign In Button */}
            <div>
              <GoogleAuthButton 
                text="Continue with Google"
                onSuccess={() => navigate('/dashboard')}
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                or with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-[#1a73e8] hover:underline">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

      </PageTransition>
    </div>
  );
};

export default Login;
