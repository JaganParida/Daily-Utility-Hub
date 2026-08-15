import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, KeyRound, Loader2, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Timers for Forgot Password Link
  const [resendTimer, setResendTimer] = useState(60);
  const [expireTimer, setExpireTimer] = useState(180);
  const [linkExpired, setLinkExpired] = useState(false);

  const { resetPassword } = useAuth();

  useEffect(() => {
    let interval = null;
    if (isSent) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setExpireTimer((prev) => {
          if (prev <= 1) {
            setLinkExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSent]);

  const triggerResetFlow = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error('Please enter a valid email address.');
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/check-email', { email });
      await resetPassword(email);
      setIsSent(true);
      setLinkExpired(false);
      setResendTimer(60);
      setExpireTimer(180);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error('No account found with this email address.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerResetFlow();
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    triggerResetFlow();
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
            Daily Utility Hub
          </h1>
          <p className="text-indigo-400 text-xs font-mono uppercase tracking-wider mb-5">
            Account Recovery & Security
          </p>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Request a password reset link to safely verify your identity and configure a new security password.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-[#08090d]">
        <Link to="/login" className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-xs bg-[#0f1118] border border-[#1e2235] hover:bg-[#141722] px-3.5 py-2 rounded-xl shadow-xs">
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        <div className="w-full max-w-sm">
          {!isSent ? (
            <>
              {/* Request Password Reset */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400 shadow-md">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Reset Password
                </h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium leading-relaxed">
                  Enter your registered email address below, and we'll send you a password reset link.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">Email Address</label>
                  <input
                    type="email" required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] placeholder-slate-500 text-white bg-[#0f1118] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30 text-xs uppercase font-mono tracking-wider active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Reset Status View */
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 shadow-md">
                  <Mail size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Reset Link Sent
                </h2>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed font-medium">
                  We've successfully emailed a secure password reset link to <span className="text-white font-bold">{email}</span>. Click the link inside the email to complete the reset.
                </p>
              </div>

              {linkExpired ? (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>The reset link has expired. Please request a new one below.</span>
                </div>
              ) : (
                <div className="bg-[#0f1118] border border-[#1e2235] p-4 rounded-2xl space-y-2 shadow-md">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Link Expiration Status:</span>
                    <span className="text-white font-bold">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-[#181b28] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(expireTimer / 180) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#1e2235] flex flex-col items-center gap-3">
                <button
                  onClick={handleResend}
                  disabled={isSubmitting || resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 disabled:text-slate-500 transition-colors uppercase font-mono tracking-wider cursor-pointer"
                >
                  <RefreshCw size={13} className={isSubmitting ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Reset Link'}
                </button>

                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase font-mono tracking-wider cursor-pointer"
                >
                  Back / Change Email
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default ForgotPassword;
