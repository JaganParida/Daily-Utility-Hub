import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, KeyRound, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      {/* Left Column: Visual panel in Light Theme */}
      <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-100/90 relative items-center justify-center p-12 overflow-hidden border-r border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.06)_0%,transparent_60%)]" />
        <div className="absolute top-[25%] left-[20%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 mb-8 text-white">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 text-slate-900">
            Daily Utility Hub
          </h1>
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-5">
            Account Recovery & Security
          </p>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            Request a password reset link to safely verify your identity and configure a new security password.
          </p>
        </div>
      </div>

      {/* Right Column: Form panel in Light Theme */}
      <PageTransition className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 relative bg-white">
        <Link to="/login" className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold text-xs bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobile-only compact logo header */}
          <div className="flex md:hidden flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 text-white shadow-md shadow-blue-600/20">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">UtilityHub</span>
          </div>

          {!isSent ? (
            <>
              {/* Request Password Reset */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-blue-600 shadow-2xs">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">
                  Enter your registered email address below, and we'll send you a password reset link.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 ml-0.5 mb-1.5 block">Email Address</label>
                  <input
                    type="email" required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm transition-all shadow-2xs"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider active:scale-[0.98]"
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600 shadow-2xs">
                  <Mail size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Reset Link Sent
                </h2>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-medium">
                  We've successfully emailed a secure password reset link to <span className="text-slate-900 font-bold">{email}</span>. Click the link inside the email to complete the reset.
                </p>
              </div>

              {linkExpired ? (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>The reset link has expired. Please request a new one below.</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>Link Expiration Status:</span>
                    <span className="text-slate-900 font-mono font-bold">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(expireTimer / 180) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex flex-col items-center gap-3">
                <button
                  onClick={handleResend}
                  disabled={isSubmitting || resendTimer > 0}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 disabled:text-slate-400 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw size={13} className={isSubmitting ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Reset Link'}
                </button>

                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
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
