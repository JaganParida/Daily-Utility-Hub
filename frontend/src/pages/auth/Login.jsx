import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Check
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between antialiased selection:bg-[#1a73e8] selection:text-white relative">
      {/* Subtle Micro-Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.35] -z-10"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#1a73e8] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1557b0] transition-colors">
            <Zap size={18} className="fill-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            Utility<span className="text-[#1a73e8]">Hub</span>
          </span>
          <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Security
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-1.5 rounded-lg shadow-xs transition-all group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Tools</span>
        </Link>
      </header>

      {/* Centered Executive Auth Card */}
      <main className="w-full max-w-[440px] mx-auto px-4 py-8">
        <PageTransition className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-7 sm:p-9 relative">
          
          {/* Card Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign in to UtilityHub
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              Welcome back. Access your saved bookmarks and pinned tools.
            </p>
          </div>

          <div className="space-y-5">
            {/* Google Authentication */}
            <div>
              <GoogleAuthButton 
                text="Continue with Google"
                onSuccess={() => navigate('/dashboard')}
              />
            </div>

            {/* Clean Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 absolute">
                or continue with email
              </span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1a73e8] transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1a73e8] transition-all font-medium placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                Create account
              </Link>
            </div>
          </div>

        </PageTransition>

        {/* Security / Privacy Trust Markers */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium text-center">
          <span className="flex items-center gap-1">
            <Check size={12} className="text-[#1a73e8]" /> 100% Client-Side Privacy
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Check size={12} className="text-[#1a73e8]" /> Free Forever
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Check size={12} className="text-[#1a73e8]" /> SHA-256 Protected
          </span>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <p>© {new Date().getFullYear()} Daily Utility Hub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
