import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  ArrowRight,
  Layers,
  LockKeyhole
} from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { toast } from 'react-hot-toast';

const Register = () => {
  const { sendSignupOtp, signupWithEmail } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP State
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [signupOtpToken, setSignupOtpToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [expireTimer, setExpireTimer] = useState(300); // 5 mins
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const otpRefs = useRef([]);

  // Timer countdowns for OTP
  useEffect(() => {
    let interval = null;
    if (step === 'otp') {
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
  }, [step]);

  // Password strength calculation
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

  const strength = getPasswordStrength(password);

  // Step 1: Send OTP to Email (MongoDB not touched yet)
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return toast.error('Please enter your full name.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return toast.error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }

    setIsSubmitting(true);
    try {
      const data = await sendSignupOtp(email.trim(), name.trim());
      setSignupOtpToken(data.signupOtpToken);
      setStep('otp');
      setResendCooldown(60);
      setExpireTimer(300);
      setIsOtpExpired(false);
      setOtp(['', '', '', '', '', '']);
      toast.success(`Verification code sent to ${email}`);

      if (data.devOtp) {
        toast(`[DEV MODE] OTP: ${data.devOtp}`, { icon: '🔑', duration: 10000 });
      }

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      // Handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and Create User in DB
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('').trim();

    if (enteredOtp.length !== 6) {
      return toast.error('Please enter the 6-digit verification code.');
    }

    if (isOtpExpired) {
      return toast.error('Verification code has expired. Please resend a new code.');
    }

    setIsVerifying(true);
    try {
      await signupWithEmail({
        signupOtpToken,
        otp: enteredOtp,
        password,
        name: name.trim()
      });

      navigate('/dashboard');
    } catch (err) {
      // Handled in context toast
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const data = await sendSignupOtp(email.trim(), name.trim());
      setSignupOtpToken(data.signupOtpToken);
      setResendCooldown(60);
      setExpireTimer(300);
      setIsOtpExpired(false);
      setOtp(['', '', '', '', '', '']);
      toast.success('New verification code sent!');
      if (data.devOtp) {
        toast(`[DEV MODE] OTP: ${data.devOtp}`, { icon: '🔑', duration: 10000 });
      }
      otpRefs.current[0]?.focus();
    } catch (err) {}
  };

  // OTP Box inputs handler
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
              Join thousands of productive developers.
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
                  <p className="text-xs font-bold text-white">Instant OTP Email Verification</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Accounts created only after confirmed code.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={14} className="text-[#8ab4f8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">All 90+ Tools Unlocked</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Complete suite free forever with no limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <LockKeyhole size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">2-Device Active Protection</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Automatic session monitoring and security.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Free Forever • No Spam</span>
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
                {step === 'details' ? 'Create Account' : 'Verify Email'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {step === 'details' 
                  ? 'Sign up in seconds to sync bookmarks and recent history.'
                  : `Enter the 6-digit verification code sent to ${email}`}
              </p>
            </div>

            {/* STEP 1: DETAILS */}
            {step === 'details' && (
              <div className="space-y-5">
                <div>
                  <GoogleAuthButton 
                    text="Sign up with Google"
                    onSuccess={() => navigate('/dashboard')}
                  />
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-3.5">
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {password && (
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                  >
                    {isSubmitting ? (
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
                  <Link to="/login" className="font-bold text-[#1a73e8] hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Verifying Email</p>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[210px]">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
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
                      {otp.map((digit, idx) => (
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
                    disabled={isVerifying || otp.join('').length !== 6 || isOtpExpired}
                    className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
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

          </div>
        </div>

      </PageTransition>
    </div>
  );
};

export default Register;
