import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
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
    <PageTransition className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium bg-card/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 hover:bg-card shadow-sm">
        <ArrowLeft size={18} />
        Back to Home
      </Link>
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-3xl shadow-sm border border-border relative">
        <Link to="/login" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="pt-4">
          <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground px-4">
            Enter the email associated with your account and we'll send you a link to reset your password.
          </p>
        </div>

        {isSent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-3">
            <h3 className="font-bold text-emerald-500 text-lg">Check your inbox</h3>
            <p className="text-sm text-emerald-600/80">We've sent a password reset link to <span className="font-semibold">{email}</span>.</p>
            <p className="text-xs text-muted-foreground mt-4">Make sure to check your spam folder.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Email address</label>
              <input
                type="email" required
                className="mt-1 appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/50 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" aria-hidden="true" />
                  </span>
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;
