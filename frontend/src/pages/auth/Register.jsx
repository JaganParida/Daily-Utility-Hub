import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
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
  Check
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
    return { score: 4, text: 'Very Strong', color: 'bg-[#1a73e8]' };
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between antialiased selection:bg-[#1a73e8] selection:text-white relative">
      {/* Subtle Micro-Grid Background */}
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
            Registration
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

      {/* Centered Executive Card */}
      <main className="w-full max-w-[460px] mx-auto px-4 py-8">
        <PageTransition className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-7 sm:p-9 relative">
          
          {/* Card Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {step === 'details' ? 'Create Free Account' : 'Verify Your Email'}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              {step === 'details' 
                ? 'Join free to pin tools, sync settings, and monitor history across devices.'
                : `We sent a 6-digit confirmation code to ${email}`}
            </p>
          </div>

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Google Button */}
              <div>
                <GoogleAuthButton 
                  text="Sign up with Google"
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

              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1a73e8] transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email Address */}
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
                      placeholder="alex@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1a73e8] transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      placeholder="Minimum 6 characters"
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

                  {/* Password Strength */}
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
                      <div className="flex justify-between items-center text-[10px] mt-1 text-slate-500 font-medium">
                        <span>Strength: {strength.text}</span>
                        <span>{strength.score >= 3 ? '✓ Strong Password' : 'Min 6 characters'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Guarantee Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                  <ShieldCheck className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                  <span>We send a 6-digit confirmation code to your email. Account is created in the database only after verification.</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Verification</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#1a73e8] hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Verifying Email</p>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[240px]">{email}</p>
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
                        className={`w-11 h-12 text-center text-lg font-bold rounded-xl border bg-slate-50/50 text-slate-900 transition-all focus:outline-none focus:bg-white ${
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
                  className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

export default Register;
