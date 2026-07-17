import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [expireTimer, setExpireTimer] = useState(180);
  const [otpExpired, setOtpExpired] = useState(false);

  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Handle Relaxation and Expiration Timers
  useEffect(() => {
    let interval = null;
    if (otpSent) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setExpireTimer((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent]);

  const sendOtpSimulated = (targetEmail) => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setOtpSent(true);
    setOtpExpired(false);
    setResendTimer(60);
    setExpireTimer(180);
    setOtpInput(['', '', '', '', '', '']);
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#18181b] border border-[#2563eb]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <ShieldCheck className="h-10 w-10 text-[#2563eb]" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb]">Verification OTP Sent</p>
              <p className="text-sm font-medium text-white mt-0.5">
                Use verification code below for <span className="font-bold text-zinc-300">{targetEmail}</span>:
              </p>
              <div className="mt-2.5 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3.5 text-center font-mono text-xl font-bold tracking-widest text-white selection:bg-[#2563eb]">
                {generated}
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-l border-zinc-800">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-zinc-400 hover:text-white focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 15000 });
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      sendOtpSimulated(email);
    } catch (error) {
      // Handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsGoogleLoading(true);
    try {
      const data = await loginWithGoogle('login');
      sendOtpSimulated(data.email || 'Google Account');
    } catch (error) {
      // Handled by AuthContext toast
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.substring(value.length - 1);
    setOtpInput(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && !isNaN(data)) {
      const chars = data.split('');
      setOtpInput(chars);
      otpRefs.current[5].focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpExpired) {
      toast.error('Verification code has expired. Please request a new code.');
      return;
    }

    const typedCode = otpInput.join('');
    if (typedCode === otpCode) {
      toast.success('Sign in verified successfully!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid verification code. Please try again.');
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    sendOtpSimulated(email || 'your account');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070709] text-white">
      {/* Mobile Top Visual Banner */}
      <div className="block md:hidden h-[25vh] bg-[#070709] relative overflow-hidden flex flex-col items-center justify-center shrink-0">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_50%_20%,#1e1b4b_0%,transparent_75%)] opacity-80" />
        <svg className="absolute bottom-0 left-0 w-full h-24" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <path d="M0,96 C288,192 576,64 864,160 C1152,256 1296,160 1440,96 L1440,320 L0,320 Z" fill="url(#wave-gradient-1)" />
          <path d="M0,160 C432,64 864,256 1296,128 C1344,115 1392,102 1440,96 L1440,320 L0,320 Z" fill="url(#wave-gradient-2)" />
          <defs>
            <linearGradient id="wave-gradient-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="wave-gradient-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-widest text-white font-sans uppercase">
            UTILITYHUB
          </h1>
          <p className="text-[10px] tracking-wider text-zinc-400 mt-1 uppercase font-semibold">
            Standard Utilities • AI Workspaces • Repeat
          </p>
        </div>
      </div>

      {/* Desktop Left Column: Visual panel */}
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

      {/* Right Column: Form panel (white sheet on mobile, dark theme on desktop) */}
      <PageTransition className="flex-1 flex flex-col justify-start md:justify-center items-center py-10 md:py-12 px-6 sm:px-12 lg:px-20 relative bg-white text-zinc-900 md:bg-[#09090b] md:text-white rounded-t-[32px] md:rounded-none min-h-[75vh] md:min-h-screen">
        {!otpSent && (
          <Link to="/" className="absolute top-6 left-6 flex items-center gap-1 text-zinc-500 hover:text-zinc-900 md:text-zinc-400 md:hover:text-white transition-colors font-bold text-xs bg-zinc-100 md:bg-zinc-900 border border-zinc-200 md:border-zinc-800 hover:bg-zinc-200 md:hover:bg-zinc-800 px-3.5 py-1.5 rounded-full md:rounded-none">
            <ArrowLeft size={13} />
            <span className="hidden md:inline">Back to Home</span>
          </Link>
        )}

        <div className="w-full max-w-sm mt-4 md:mt-0">
          {!otpSent ? (
            <>
              {/* Form Header */}
              <div className="mb-6 md:mb-8 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                  Sign in
                </h2>
                <p className="text-zinc-400 md:text-zinc-500 text-xs md:text-sm mt-1.5 font-medium">
                  New to UtilityHub?{' '}
                  <Link to="/register" className="text-[#2563eb] font-bold hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>

              {/* Form controls */}
              <form className="space-y-4" onSubmit={handleInitialSubmit}>
                <div className="space-y-3">
                  <div>
                    <label className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5 mb-1.5">Email Address</label>
                    <input
                      type="email" required
                      className="appearance-none rounded-full md:rounded-none relative block w-full px-5 py-3 border border-zinc-200 md:border-zinc-800 placeholder-zinc-400 md:placeholder-zinc-600 text-zinc-900 md:text-white bg-transparent md:bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                      placeholder="Email Id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting || isGoogleLoading}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">Password</label>
                      <Link to="/forgot-password" className="text-[10px] font-bold text-[#2563eb] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} required
                        className="appearance-none rounded-full md:rounded-none relative block w-full px-5 py-3 pr-12 border border-zinc-200 md:border-zinc-800 placeholder-zinc-400 md:placeholder-zinc-600 text-zinc-900 md:text-white bg-transparent md:bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting || isGoogleLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 md:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full md:rounded-none text-white font-bold bg-black md:bg-[#2563eb] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg text-xs uppercase tracking-wider mt-4"
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
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 md:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white md:bg-[#09090b] text-zinc-400 md:text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Or sign in with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSubmit}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-200 md:border-zinc-800 rounded-full md:rounded-none bg-zinc-50 md:bg-zinc-900 hover:bg-zinc-100 md:hover:bg-zinc-800 text-zinc-700 md:text-white font-bold transition-all disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
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
            </>
          ) : (
            /* OTP Verification Panel */
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-4 text-[#2563eb] mx-auto md:mx-0">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                  Verify Sign In
                </h2>
                <p className="text-zinc-500 text-xs md:text-sm mt-1.5 leading-relaxed font-medium">
                  We've sent a 6-digit verification code to <span className="text-zinc-800 md:text-white font-bold">{email || 'your registered email'}</span>. Enter it below.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                  {otpInput.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={otpExpired}
                      className="w-11 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-bold bg-zinc-100 md:bg-zinc-900/40 border border-zinc-200 md:border-zinc-800 focus:border-[#2563eb] text-zinc-900 md:text-white focus:outline-none rounded-lg md:rounded-none transition-all font-mono"
                    />
                  ))}
                </div>

                {otpExpired ? (
                  <div className="flex items-center gap-2 text-red-500 md:text-red-400 bg-red-50 md:bg-red-950/20 border border-red-200 md:border-red-900/30 px-3.5 py-2.5 text-xs font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Expired. Request a new code.</span>
                  </div>
                ) : (
                  <div className="text-center text-zinc-400 md:text-zinc-500 text-xs font-semibold">
                    Code expires in: <span className="text-zinc-900 md:text-white font-bold font-mono">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpExpired || otpInput.some((d) => d === '')}
                  className="w-full py-3.5 px-4 rounded-full md:rounded-none text-white font-bold bg-black md:bg-[#2563eb] focus:outline-none transition-colors disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider"
                >
                  Verify & Proceed
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-200 md:border-zinc-800 flex flex-col items-center gap-3">
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-[#2563eb] disabled:text-zinc-400 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw size={12} className={resendTimer > 0 ? '' : 'animate-spin-slow'} />
                  {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend Verification Code'}
                </button>
                
                <button
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-zinc-400 md:text-zinc-500 hover:text-zinc-900 md:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default Login;
