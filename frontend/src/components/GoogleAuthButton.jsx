import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GoogleAuthButton = ({ text = 'Continue with Google', onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef(null);

  // Client ID from Google Cloud Console (can be configured via VITE_GOOGLE_CLIENT_ID)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '116515729571-jdjhjaf1130bu8b87odrj2n3sioopa7v.apps.googleusercontent.com';

  useEffect(() => {
    let checkInterval = null;

    const setupGoogleButton = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Render official Google button into our container
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'rectangular',
            logo_alignment: 'left',
            text: 'continue_with'
          });
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
        }
      }
    };

    // If Google script is already loaded
    if (window.google?.accounts?.id) {
      setupGoogleButton();
    } else {
      // Poll briefly for Google script load
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          setupGoogleButton();
        } else if (attempts > 30) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId]);

  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      toast.error('No Google credential returned.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle(response.credential);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Google login error:', err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          toast('Please ensure popups are allowed or click the Google button below.', { icon: 'ℹ️' });
        }
      });
    } else {
      toast.error('Google Sign-In is initializing. Please try again in a moment.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden/rendered Google standard button container */}
      <div 
        ref={buttonRef} 
        className="w-full flex justify-center [&>div]:!w-full [&>div>iframe]:!w-full"
        style={{ minHeight: '44px' }}
      >
        {/* Fallback button if Google script is loading */}
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 shadow-sm transition-all text-sm disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{text}</span>
        </button>
      </div>
    </div>
  );
};

export default GoogleAuthButton;
