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
  Sparkles,
  ArrowRight
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

      // Auto focus first OTP input box
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Mesh Circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 via-slate-50/0 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-12 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-12 right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Utilities
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daily Utility <span className="text-indigo-600">Hub</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Free, Fast & Secure Tools</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 'details' ? 'Create your account' : 'Verify your email'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {step === 'details' 
              ? 'Join free to pin favorite tools, sync settings, and monitor history.'
              : `We sent a 6-digit verification code to ${email}`}
          </p>
        </div>
      </div>

      {/* Card Form */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <PageTransition className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 rounded-2xl relative">
          
          {/* STEP 1: REGISTRATION DETAILS */}
          {step === 'details' && (
            <div className="space-y-6">
              {/* Google Sign-In */}
              <div>
                <GoogleAuthButton 
                  text="Sign up with Google" 
                  onSuccess={() => navigate('/dashboard')}
                />
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold absolute">
                  or with email
                </span>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
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
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2.5">
                      <div className="flex gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 h-full rounded-full transition-all duration-300 ${
                              strength.score >= level ? strength.color : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500 font-medium">
                        <span>Strength: {strength.text}</span>
                        <span>{strength.score >= 3 ? '✓ Secure' : 'Min 6 characters'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Guarantee Badge */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-900 leading-relaxed font-normal">
                    We will send a 6-digit verification code to your email. Your account is only created once verified.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Verifying</p>
                  <p className="text-sm font-bold text-slate-800">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Change Email
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
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
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-slate-50 text-slate-900 transition-all focus:outline-none focus:bg-white ${
                          digit 
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Expiration Timer & Resend */}
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>Code expires in:</span>
                    <span className={`font-mono font-bold ${expireTimer < 60 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatTimer(expireTimer)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={resendCooldown > 0 ? '' : 'animate-pulse'} />
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying || otp.join('').length !== 6 || isOtpExpired}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* Bottom Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Sign In
            </Link>
          </div>
        </PageTransition>
      </div>
    </div>
  );
};

export default Register;
