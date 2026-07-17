import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const Register = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpValidationToken, setOtpValidationToken] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [expireTimer, setExpireTimer] = useState(180);
  const [otpExpired, setOtpExpired] = useState(false);

  const { signupWithEmail, loginWithGoogle } = useAuth();
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

  // Handle Google Login redirect with OTP trigger
  useEffect(() => {
    if (location.state?.triggerGoogleOtp && location.state?.email && !otpSent) {
      setEmail(location.state.email);
      setOtpSent(true);
      setOtpExpired(false);
      setResendTimer(60);
      setExpireTimer(180);
      setOtpInput(['', '', '', '', '', '']);

      const sendGoogleOtp = async () => {
        try {
          const otpResponse = await api.post('/auth/otp/send', { email: location.state.email });
          setOtpValidationToken(otpResponse.data.token);
          toast.success('Verification code sent! Check your email inbox.');
        } catch (otpErr) {
          console.error('OTP send error:', otpErr);
          toast.error('Could not send verification email. Tap "Resend" to try again.');
        }
      };
      sendGoogleOtp();

      // Clear the trigger state to prevent loops on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, otpSent]);

  const sendRealOtp = async (targetEmail) => {
    try {
      const response = await api.post('/auth/otp/send', { email: targetEmail });
      setOtpValidationToken(response.data.token);
      setOtpSent(true);
      setOtpExpired(false);
      setResendTimer(60);
      setExpireTimer(180);
      setOtpInput(['', '', '', '', '', '']);
      toast.success('Verification OTP code sent! Please check your email inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP verification email.');
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create account in Firebase + MongoDB
      await signupWithEmail(email, password);
      
      // 2. Account created! Always show OTP screen so user can resend if needed
      setOtpSent(true);
      setOtpExpired(false);
      setResendTimer(60);
      setExpireTimer(180);
      setOtpInput(['', '', '', '', '', '']);

      // 3. Send OTP email (don't block the UI transition)
      try {
        const response = await api.post('/auth/otp/send', { email });
        setOtpValidationToken(response.data.token);
        toast.success('Verification code sent! Check your email inbox.');
      } catch (otpErr) {
        console.error('OTP send error:', otpErr);
        toast.error('Could not send verification email. Tap "Resend" to try again.');
      }
    } catch (error) {
      const isAlreadyExists = 
        error.code === 'auth/email-already-in-use' || 
        error.response?.status === 400 || 
        error.response?.data?.message?.toLowerCase().includes('already exists') ||
        error.message?.toLowerCase().includes('already exists') ||
        error.response?.data?.message?.toLowerCase().includes('log in instead') ||
        error.message?.toLowerCase().includes('log in instead');
        
      if (isAlreadyExists) {
        toast.error('An account already exists with this email. Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login', { state: { email } });
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsGoogleLoading(true);
    try {
      const response = await loginWithGoogle();
      if (response && response.isNewUser) {
        // Account created! Always show OTP screen so user can resend if needed
        setOtpSent(true);
        setOtpExpired(false);
        setResendTimer(60);
        setExpireTimer(180);
        setOtpInput(['', '', '', '', '', '']);

        // Send OTP email (don't block the UI transition)
        try {
          const otpResponse = await api.post('/auth/otp/send', { email: response.email });
          setOtpValidationToken(otpResponse.data.token);
          toast.success('Verification code sent! Check your email inbox.');
        } catch (otpErr) {
          console.error('OTP send error:', otpErr);
          toast.error('Could not send verification email. Tap "Resend" to try again.');
        }
      } else if (response) {
        toast.success('Successfully registered!');
        navigate('/');
      }
    } catch (error) {
      // Errors handled by AuthContext
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpExpired) {
      toast.error('Verification code has expired. Please request a new code.');
      return;
    }

    const typedCode = otpInput.join('');
    try {
      await api.post('/auth/otp/verify', { token: otpValidationToken, code: typedCode });
      toast.success('Email verified successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await sendRealOtp(email || 'your account');
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
            Register your secure account to manage files, convert documents, clean metadata, and transcribe videos seamlessly on any device.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel (unified dark theme for all screen sizes) */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-[#09090b]">
        {/* Floating Back to Home button */}
        {!otpSent && (
          <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3.5 py-1.5 rounded-none">
            <ArrowLeft size={13} />
            Back to Home
          </Link>
        )}

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

          {!otpSent ? (
            <>
              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Sign up
                </h2>
                <p className="text-zinc-500 text-sm mt-1.5 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#2563eb] font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>

              {/* Form controls */}
              <form className="space-y-5" onSubmit={handleInitialSubmit}>
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
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} required minLength="6"
                        className="appearance-none rounded-none relative block w-full px-4 py-3 pr-12 border border-zinc-800 placeholder-zinc-600 text-white bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting || isGoogleLoading}
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
                      <UserPlus size={16} />
                      Create Account
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
                  <span className="px-3 bg-[#09090b] text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Or register with</span>
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
            </>
          ) : (
            /* OTP Verification Panel */
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-5 text-[#2563eb]">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Verify Email
                </h2>
                <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed font-medium">
                  We've sent a 6-digit verification code to <span className="text-white font-bold">{email || 'your registered email'}</span>. Enter it below to activate your account.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                      className="w-12 h-14 text-center text-xl font-bold bg-zinc-900/40 border border-zinc-800 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-white focus:outline-none rounded-none transition-all font-mono"
                    />
                  ))}
                </div>

                {otpExpired ? (
                  <div className="flex items-center gap-2 text-red-400 bg-red-950/20 border border-red-900/30 px-3.5 py-2.5 text-xs font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>The verification code has expired. Please request a new one.</span>
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 text-xs font-semibold">
                    Code expires in: <span className="text-white font-bold font-mono">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpExpired || otpInput.some((d) => d === '')}
                  className="w-full py-3 px-4 rounded-none text-white font-bold bg-[#2563eb] hover:bg-[#1d4ed8] focus:outline-none transition-colors disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider"
                >
                  Verify & Proceed
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-800 flex flex-col items-center gap-3">
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-[#2563eb] disabled:text-zinc-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw size={12} className={resendTimer > 0 ? '' : 'animate-spin-slow'} />
                  {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend Verification Code'}
                </button>
                
                <button
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Change Email / Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default Register;
