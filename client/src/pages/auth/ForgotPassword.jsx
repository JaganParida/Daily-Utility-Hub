import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageTransition className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        
        <Link to="/login" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium bg-muted/40 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm">
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        {/* Brand Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 border border-primary/20">
            <KeyRound className="text-primary" size={24} />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
            Reset Password
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Enter your email to receive a secure reset link.
          </p>
        </div>

        {/* Flat Professional Card */}
        <div className="max-w-md w-full bg-card p-8 sm:p-10 rounded-2xl shadow-sm border border-border">
          
          {isSent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl text-center space-y-3">
              <h3 className="font-bold text-emerald-500 text-lg">Check your inbox</h3>
              <p className="text-sm text-emerald-500/80 font-medium">We've sent a password reset link to <span className="font-bold">{email}</span>.</p>
              <p className="text-xs text-muted-foreground mt-4">Make sure to check your spam folder.</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">Email address</label>
                  <input
                    type="email" required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/50 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-primary-foreground font-bold bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Mail size={18} />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default ForgotPassword;
