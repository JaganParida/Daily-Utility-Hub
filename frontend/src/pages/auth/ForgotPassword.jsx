import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, KeyRound, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Timers for Forgot Password Link
  const [resendTimer, setResendTimer] = useState(60); // 1 minute relaxation timer
  const [expireTimer, setExpireTimer] = useState(180); // 3 minutes expiration timer
  const [linkExpired, setLinkExpired] = useState(false);

  const { resetPassword } = useAuth();

  // Tick the relaxation and expiration countdowns
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
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSent(true);
      setLinkExpired(false);
      setResendTimer(60);
      setExpireTimer(180);
    } catch (error) {
      // Handled by AuthContext toast
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
            Request a password reset link to safely verify your identity and configure a new security key.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-[#09090b]">
        <Link to="/login" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3.5 py-1.5 rounded-none">
          <ArrowLeft size={13} />
          Back to Login
        </Link>

        <div className="w-full max-w-md">
          {!isSent ? (
            <>
              {/* Request Password Reset */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-5 text-[#2563eb]">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Reset Password
                </h2>
                <p className="text-zinc-500 text-sm mt-1.5 font-medium leading-relaxed">
                  Enter your email address below, and we'll send you a link to reset your password.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5 mb-1.5 block">Email Address</label>
                  <input
                    type="email" required
                    className="appearance-none rounded-none relative block w-full px-4 py-3 border border-zinc-800 placeholder-zinc-600 text-white bg-zinc-900/40 focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] text-sm transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-none text-white font-bold bg-[#2563eb] hover:bg-[#1d4ed8] focus:outline-none transition-colors disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-xs uppercase tracking-wider"
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
            /* Reset Status View with Expiry / Relaxation countdown timers */
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-500">
                  <Mail size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Reset Link Sent
                </h2>
                <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed font-medium">
                  We've successfully emailed a secure password reset link to <span className="text-white font-bold">{email}</span>. Click the link inside the email to configure your new credentials.
                </p>
              </div>

              {linkExpired ? (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/20 border border-red-900/30 px-3.5 py-2.5 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>The reset link has expired. Please request a new one below.</span>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 p-4 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>Link Expiration Status:</span>
                    <span className="text-white font-mono">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${(expireTimer / 180) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-800 flex flex-col items-center gap-3">
                <button
                  onClick={handleResend}
                  disabled={isSubmitting || resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-[#2563eb] disabled:text-zinc-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Reset Link'}
                </button>

                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
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
