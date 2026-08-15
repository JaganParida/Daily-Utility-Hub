import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const Register = () => {
  const { signupWithEmail, loginWithGoogle, finalizeGoogleSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [googleUser, setGoogleUser] = useState(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpValidationToken, setOtpValidationToken] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [expireTimer, setExpireTimer] = useState(180);
  const [otpExpired, setOtpExpired] = useState(false);

  const otpRefs = useRef([]);

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

  const sendRealOtp = async (targetEmail) => {
    try {
      let token = null;
      let devOtp = null;

      try {
        const vercelRes = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail })
        });
        if (vercelRes.ok) {
          const vercelData = await vercelRes.json();
          if (vercelData.success && vercelData.token) {
            token = vercelData.token;
          }
        }
      } catch (vercelErr) {
        console.warn('Vercel serverless OTP fallback...', vercelErr);
      }

      if (!token) {
        const response = await api.post('/auth/otp/send', { email: targetEmail });
        if (!response.data?.success || !response.data?.token) {
          throw new Error(response.data?.message || 'Failed to send verification code');
        }
        token = response.data.token;
        devOtp = response.data.devOtp;
      }

      setOtpValidationToken(token);
      setOtpSent(true);
      setResendTimer(60);
      setExpireTimer(180);
      setOtpExpired(false);
      setOtpInput(['', '', '', '', '', '']);
      
      toast.success(`Verification code sent to ${targetEmail}`);
      if (devOtp) {
        toast(`[DEV MODE] OTP: ${devOtp}`, { icon: '🔑', duration: 8000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
      throw err;
    }
  };

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.triggerGoogleOtp && location.state?.email) {
      sendRealOtp(location.state.email);
    }
  }, [location.state]);

  const handleInitialSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/check-email-availability', { email });
      await sendRealOtp(email);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('An account already exists with this email address.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result && (result.requiresOtp || result.isNewUser || result.isEmailVerified === false || result.emailVerified === false)) {
        setGoogleUser(result);
        setEmail(result.email);
        setName(result.name || '');
        await sendRealOtp(result.email);
      } else if (result) {
        toast.success('Account setup complete!');
        navigate('/');
      }
    } catch (error) {
      // Handled in context
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpInput.join('');

    if (enteredOtp.length !== 6) {
      return toast.error('Please enter the 6-digit verification code.');
    }

    setIsVerifying(true);
    try {
      let isVerified = false;

      try {
        const verifyRes = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            otp: enteredOtp,
            token: otpValidationToken
          })
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            isVerified = true;
          }
        }
      } catch (vercelErr) {
        console.warn('Vercel serverless verify fallback...', vercelErr);
      }

      if (!isVerified) {
        const response = await api.post('/auth/otp/verify', {
          email,
          otp: enteredOtp,
          token: otpValidationToken
        });
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Invalid or expired OTP');
        }
      }

      if (googleUser) {
        await finalizeGoogleSignup(googleUser.email, googleUser.name, googleUser.googleId);
        toast.success('Google account verified successfully!');
      } else {
        await signupWithEmail(email, password, name || email.split('@')[0]);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pasteData)) return;

    const digits = pasteData.slice(0, 6).split('');
    const newOtp = [...otpInput];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtpInput(newOtp);
    const nextIdx = Math.min(digits.length, 5);
    otpRefs.current[nextIdx]?.focus();
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    sendRealOtp(email);
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
            Create Free Account
          </h1>
          <p className="text-indigo-400 text-xs font-mono uppercase tracking-wider mb-5">
            Zero Tracking • Zero Latency • 100% Free
          </p>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Join thousands of developers using Daily Utility Hub to edit, convert, compress, and process documents directly on device.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-[#08090d]">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-xs bg-[#0f1118] border border-[#1e2235] hover:bg-[#141722] px-3.5 py-2 rounded-xl shadow-xs">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="w-full max-w-sm">
          {!otpSent ? (
            <>
              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Sign Up
                </h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-400 font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>

              {/* Form controls */}
              <form className="space-y-5" onSubmit={handleInitialSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">Email Address</label>
                    <input
                      type="email" required
                      className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] placeholder-slate-500 text-white bg-[#0f1118] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting || isGoogleLoading}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} required minLength="6"
                        className="appearance-none rounded-xl relative block w-full px-4 py-3 pr-12 border border-[#1e2235] placeholder-slate-500 text-white bg-[#0f1118] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting || isGoogleLoading}
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
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30 text-xs uppercase font-mono tracking-wider active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Free Account
                    </>
                  )}
                </button>
              </form>

              {/* Social Login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e2235]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#08090d] text-slate-500 text-[10px] uppercase font-mono tracking-widest font-bold">Or register with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSubmit}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#1e2235] rounded-xl bg-[#0f1118] hover:bg-[#141722] text-white font-bold transition-all disabled:opacity-50 text-xs uppercase font-mono tracking-wider cursor-pointer shadow-xs active:scale-[0.98]"
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
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400 shadow-md">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Verify Email
                </h2>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed font-medium">
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
                      className="w-12 h-14 text-center text-xl font-bold bg-[#0f1118] border border-[#1e2235] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white focus:outline-none rounded-xl transition-all font-mono shadow-xs"
                    />
                  ))}
                </div>

                {otpExpired ? (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>The verification code has expired. Please request a new one.</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs font-semibold">
                    Code expires in: <span className="text-white font-bold font-mono">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpExpired || otpInput.some((d) => d === '') || isVerifying}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-40 cursor-pointer text-xs uppercase font-mono tracking-wider shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Proceed'
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-[#1e2235] flex flex-col items-center gap-3">
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 disabled:text-slate-500 transition-colors uppercase font-mono tracking-wider cursor-pointer"
                >
                  <RefreshCw size={13} className={resendTimer > 0 ? '' : 'animate-spin-slow'} />
                  {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Verification Code'}
                </button>
                
                <button
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase font-mono tracking-wider cursor-pointer"
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
