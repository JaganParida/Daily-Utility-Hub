import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import api from '../../lib/api';

const TempShareDownload = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('Connecting to secure server...');

  useEffect(() => {
    const fetchMetadataAndAction = async () => {
      try {
        setStatusText('Retrieving file metadata...');
        const response = await api.get(`/share/metadata/${id}`);
        const data = response.data;

        const backendBaseUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
          : 'http://localhost:5000';

        const downloadUrl = `${backendBaseUrl}/api/share/download/${id}`;

        if (data.shareType === 'url') {
          setStatusText('Redirecting to secure URL...');
          let targetUrl = data.content;
          if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'http://' + targetUrl;
          }
          // Redirect instantly
          window.location.replace(targetUrl);
        } else {
          setStatusText('Starting your download...');
          // Trigger file download instantly
          window.location.replace(downloadUrl);
          
          // Let the loading screen state linger briefly so the user sees it starting
          setTimeout(() => {
            setLoading(false);
          }, 2000);
        }
      } catch (err) {
        console.error('Error fetching share link:', err);
        const errMsg = err.response?.data?.error || err.response?.data?.message || 'The link is invalid or has expired.';
        setError(errMsg);
        setLoading(false);
      }
    };

    fetchMetadataAndAction();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/30 flex items-center justify-center shadow-lg relative">
            <Loader2 className="animate-spin text-primary" size={32} />
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground tracking-tight">Accessing Secure Link</h3>
            <p className="text-sm text-muted-foreground font-semibold animate-pulse">{statusText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-rose-500/20 p-8 rounded-3xl shadow-xl shadow-rose-500/5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
          
          <div className="w-16 h-16 mx-auto bg-rose-500/15 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-inner">
            <AlertCircle size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">Link Expired or Invalid</h2>
          <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95 text-sm"
            >
              <ArrowLeft size={16} /> Go to Dashboard
            </Link>
            <Link 
              to="/tools/temp-share"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white transition-all active:scale-95 shadow-md shadow-primary/10 text-sm"
            >
              Share New File
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback view after starting download
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-emerald-500/20 p-8 rounded-3xl shadow-xl shadow-emerald-500/5 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
        
        <div className="w-16 h-16 mx-auto bg-emerald-500/15 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
          <Download size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Downloading File</h2>
        <p className="text-muted-foreground text-sm font-semibold mb-6">
          Your download has started. If it didn't start automatically, click the button below to retry.
        </p>

        <div className="space-y-4">
          <a 
            href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000'}/api/share/download/${id}`}
            className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white transition-all active:scale-95 shadow-md shadow-primary/15 text-sm"
          >
            <Download size={18} /> Restart Download
          </a>
          
          <Link 
            to="/tools/temp-share"
            className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95 text-sm"
          >
            Upload/Share Another
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TempShareDownload;
