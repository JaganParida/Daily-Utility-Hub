import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';
import { toast } from 'react-hot-toast';

const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalTab, 
    setAuthModalTab,
    loginWithEmail, 
    sendSignupOtp, 
    signupWithEmail 
  } = useAuth();

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState(authModalTab || 'login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Register OTP States
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [signupOtpToken, setSignupOtpToken] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [expireTimer, setExpireTimer] = useState(300);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const otpRefs = useRef([]);

  // Sync external tab request
  useEffect(() => {
    if (authModalTab) {
      setActiveTab(authModalTab);
      setRegStep('details');
    }
  }, [authModalTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (isAuthModalOpen && activeTab === 'register' && regStep === 'otp') {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setExpireTimer((prev) => {
          if (prev <= 1) {
            setIsOtpExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAuthModalOpen, activeTab, regStep]);

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score === 3) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    if (score === 4) return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
    return { score: 4, text: 'Very Strong', color: 'bg-indigo-600' };
  };
  const strength = getPasswordStrength(regPassword);

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      return toast.error('Please enter a valid email address.');
    }
    if (!loginPassword) {
      return toast.error('Please enter your password.');
    }

    setIsLoggingIn(true);
    try {
      await loginWithEmail(loginEmail.trim(), loginPassword);
      closeAuthModal();
    } catch (err) {
      // Toast handled by context
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Handle Send Register OTP
  const handleSendRegisterOtp = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      return toast.error('Please enter your full name.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      return toast.error('Please enter a valid email address.');
    }
    if (!regPassword || regPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }

    setIsSendingOtp(true);
    try {
      const data = await sendSignupOtp(regEmail.trim(), regName.trim());
      setSignupOtpToken(data.signupOtpToken);
      setRegStep('otp');
      setResendCooldown(60);
      setExpireTimer(300);
      setIsOtpExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success(`Verification code sent to ${regEmail}`);

      if (data.devOtp) {
        toast(`[DEV MODE] OTP: ${data.devOtp}`, { icon: '🔑', duration: 10000 });
      }

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      // Handled by context
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 3. Handle Verify OTP and Create Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length !== 6) {
      return toast.error('Please enter all 6 digits of the code.');
    }
    if (isOtpExpired) {
      return toast.error('Verification code has expired. Please resend a new code.');
    }

    setIsVerifyingOtp(true);
    try {
      await signupWithEmail({
        signupOtpToken,
        otp: code,
        password: regPassword,
        name: regName.trim()
      });
      closeAuthModal();
    } catch (err) {
      // Handled by context
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const data = await sendSignupOtp(regEmail.trim(), regName.trim());
      setSignupOtpToken(data.signupOtpToken);
      setResendCooldown(60);
      setExpireTimer(300);
      setIsOtpExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('New verification code sent!');
      if (data.devOtp) {
        toast(`[DEV MODE] OTP: ${data.devOtp}`, { icon: '🔑', duration: 10000 });
      }
      otpRefs.current[0]?.focus();
    } catch (err) {}
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);

    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(text)) {
      setOtpDigits(text.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 z-10 my-auto text-slate-800 antialiased"
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Brand Header with Signature Zap Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Zap size={20} className="fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Utility<span className="text-[#1a73e8]">Hub</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    100% Free
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Fast, Offline-First Developer Suite</p>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setRegStep('details');
                  setAuthModalTab('login');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setRegStep('details');
                  setAuthModalTab('register');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ══════════════ TAB 1: SIGN IN ══════════════ */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div>
                  <GoogleAuthButton 
                    text="Continue with Google"
                    onSuccess={closeAuthModal}
                  />
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
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
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    {isLoggingIn ? (
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

                <p className="text-center text-xs text-slate-500 pt-1">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setRegStep('details');
                    }}
                    className="font-bold text-[#1a73e8] hover:underline"
                  >
                    Create Free Account
                  </button>
                </p>
              </div>
            )}

            {/* ══════════════ TAB 2: CREATE ACCOUNT ══════════════ */}
            {activeTab === 'register' && regStep === 'details' && (
              <div className="space-y-5">
                <div>
                  <GoogleAuthButton 
                    text="Sign up with Google"
                    onSuccess={closeAuthModal}
                  />
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleSendRegisterOtp} className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {regPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                                strength.score >= level ? strength.color : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] mt-0.5 text-slate-500 font-medium">
                          <span>Strength: {strength.text}</span>
                          <span>{strength.score >= 3 ? '✓ Secure' : 'Min 6 characters'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8] shrink-0 mt-0.5" />
                    <span>A 6-digit verification code will be sent to your email. Account is created only after verification.</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue with Verification</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-500 pt-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-[#1a73e8] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}

            {/* ══════════════ TAB 2 (STEP 2): OTP VERIFICATION ══════════════ */}
            {activeTab === 'register' && regStep === 'otp' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Verifying Email</p>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[210px]">{regEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegStep('details')}
                    className="text-xs font-semibold text-[#1a73e8] hover:underline"
                  >
                    Edit Email
                  </button>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-between gap-1.5" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          className={`w-11 h-12 text-center text-lg font-bold rounded-xl border bg-slate-50 text-slate-900 transition-all focus:outline-none focus:bg-white ${
                            digit 
                              ? 'border-[#1a73e8] ring-2 ring-blue-500/20' 
                              : 'border-slate-200 focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-500/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>Expires in:</span>
                      <span className={`font-mono font-bold ${expireTimer < 60 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatTimer(expireTimer)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className="text-[#1a73e8] hover:underline font-semibold disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={resendCooldown > 0 ? '' : 'animate-spin'} />
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpDigits.join('').length !== 6 || isOtpExpired}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify & Complete Registration</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
