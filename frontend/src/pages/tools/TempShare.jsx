import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, CheckCircle2, Clipboard, Globe, X, QrCode, Share2, Timer, Code, Link } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import * as QRCodeModule from 'qrcode';

const QRCode = QRCodeModule.default || QRCodeModule;

const WhatsAppIcon = ({ size = 16, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.381 9.805-9.782.001-2.592-1.01-5.031-2.846-6.87A9.742 9.742 0 0012.008 2.01c-5.402 0-9.802 4.382-9.805 9.783-.001 2.09.549 4.123 1.595 5.928l-1.047 3.825 3.925-1.029zm13.111-7.147c-.29-.145-1.713-.846-1.978-.941-.264-.096-.457-.145-.649.145-.191.29-.741.941-.909 1.134-.168.192-.336.216-.625.071-2.92-1.46-3.856-2.115-5.32-4.636-.39-.67.39-.623 1.117-2.072.12-.24.06-.45-.03-.594-.09-.145-.649-1.562-.889-2.14-.234-.563-.491-.486-.671-.495-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.713-.699 1.953-1.373.24-.675.24-1.253.168-1.373-.072-.12-.264-.192-.553-.337z" />
  </svg>
);

const TempShare = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileSelect({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [tab, setTab] = useState('file'); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [textVal, setTextVal] = useState('');
  const [shareType, setShareType] = useState('url'); // 'text' | 'url' | 'code'
  
  const [expiryHours, setExpiryHours] = useState(24);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [sharedLink, setSharedLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef(null);

  // Generate QR code whenever the sharedLink is updated
  useEffect(() => {
    if (sharedLink) {
      QRCode.toDataURL(sharedLink, { margin: 2, width: 250, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => {
          console.error('Error generating QR code:', err);
          toast.error('Could not generate QR Code');
        });
    } else {
      setQrCodeUrl('');
    }
  }, [sharedLink]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelection(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFileSelection(selectedFile);
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size cannot exceed 50MB');
      return;
    }
    setFile(selectedFile);
    setSharedLink('');
  };

  const handleUpload = async () => {
    let uploadFileObj = null;

    if (tab === 'file') {
      if (!file) {
        toast.error('Please select a file first.');
        return;
      }
      uploadFileObj = file;
    } else {
      if (!textVal.trim()) {
        toast.error('Please enter content to share.');
        return;
      }
      
      let filename = 'share_text.txt';
      if (shareType === 'url') {
        filename = 'share_url.txt';
        // Basic URL syntax correction
        if (!/^https?:\/\//i.test(textVal.trim()) && !textVal.trim().includes(' ')) {
          // If it's a URL-like string without space, check if we should label it URL
          // The download/redirect component will handle prepending http://
        }
      } else if (shareType === 'code') {
        filename = 'share_code.txt';
      }

      uploadFileObj = new File([textVal], filename, { type: 'text/plain' });
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading securely to temp share...');

    try {
      const formData = new FormData();
      formData.append('file', uploadFileObj);
      formData.append('expiryHours', expiryHours);
      formData.append('shareType', tab === 'file' ? 'file' : shareType);

      const response = await api.post('/share/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      
      // Point the sharedLink to the frontend page instead of backend direct download
      const frontendShareUrl = `${window.location.origin}/tools/temp-share/download/${data.fileId}`;
      setSharedLink(frontendShareUrl);
      setExpiresAt(data.expiresAt);
      
      toast.success('Secure link generated successfully!', { id: toastId });
    } catch (err) {
      console.error("Backend upload failed:", err);
      // Fallback local sharing link using window.URL (local ObjectURL)
      const localUrl = URL.createObjectURL(uploadFileObj);
      // Local URL is only valid on the user's browser, so we'll warn them
      const localShareUrl = `${window.location.origin}/tools/temp-share/download/local?blob=${encodeURIComponent(localUrl)}`;
      setSharedLink(localUrl);
      const expDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
      setExpiresAt(expDate);
      toast.error('Server offline. Generated local offline preview URL.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedLink);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const message = `Check out this temporary link from Daily Utility Hub: ${sharedLink}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Secure Temporary Share',
          text: 'Check out this temporary link from Daily Utility Hub:',
          url: sharedLink
        });
        toast.success('Shared successfully!');
      } catch (err) {
        console.warn('Native share cancelled or failed', err);
      }
    } else {
      handleCopy();
      toast.success('Native sharing not supported on this device. Link copied!');
    }
  };

  const resetAll = () => {
    setFile(null);
    setTextVal('');
    setSharedLink('');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <UploadCloud size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Secure Temp Share</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Upload files or share URLs and code instantly with automatic expiration.</p>
        </div>
      </div>

      {/* Tabs */}
      {!sharedLink && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setTab('file')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tab === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <File size={16} /> Share File
          </button>
          <button
            onClick={() => setTab('text')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tab === 'text' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code size={16} /> Share URL / Code
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Upload Settings */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs flex items-center gap-2"><Globe size={14}/> Share Settings</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Auto-Expire Link In</label>
                  <span className="text-sm font-bold bg-muted px-3 py-1 rounded-md">{expiryHours} {expiryHours === 1 ? 'Hour' : 'Hours'}</span>
                </div>
                <input 
                  type="range" min="1" max="168" step="1"
                  value={expiryHours} onChange={(e) => setExpiryHours(Number(e.target.value))}
                  disabled={sharedLink !== ''}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold px-1">
                  <span>1 Hour</span>
                  <span>7 Days</span>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border"></div>

            {/* Status Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${(!file && !textVal.trim()) ? 'bg-primary text-white' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {(!file && !textVal.trim()) ? '1' : <CheckCircle2 size={16}/>}
                </div>
                <span className={`text-sm font-semibold ${(!file && !textVal.trim()) ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {tab === 'file' ? 'Select File' : 'Enter Content'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${(file || textVal.trim()) && !sharedLink ? 'bg-primary text-white' : sharedLink ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                  {sharedLink ? <CheckCircle2 size={16}/> : '2'}
                </div>
                <span className={`text-sm font-semibold ${(file || textVal.trim()) && !sharedLink ? 'text-foreground' : 'text-muted-foreground'}`}>Upload & Share</span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${sharedLink ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {sharedLink ? <CheckCircle2 size={16}/> : '3'}
                </div>
                <span className={`text-sm font-semibold ${sharedLink ? 'text-emerald-500' : 'text-muted-foreground'}`}>Link Ready</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Dropzone / Input / Result */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[500px]">
          <AnimatePresence mode="wait">
            {!sharedLink ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                {tab === 'file' ? (
                  // File Share Tab
                  !file ? (
                    <div 
                      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full max-w-2xl h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-card hover:bg-muted/30 hover:border-primary/50'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                      <div className={`p-5 rounded-full mb-4 transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-background shadow-sm text-muted-foreground'}`}>
                        <UploadCloud size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Drag & Drop your file</h3>
                      <p className="text-sm text-muted-foreground mt-2 px-8 text-center">
                        Max file size: 10MB for guests, 50MB for members. Click to browse.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full max-w-2xl bg-card border border-border p-8 rounded-3xl shadow-sm text-center relative overflow-hidden">
                      <button onClick={() => setFile(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-rose-500 transition-colors">
                        <X size={24} />
                      </button>

                      <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-inner">
                        <File size={40} />
                      </div>
                      
                      <h3 className="font-bold text-2xl text-foreground truncate px-12">{file.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider font-semibold">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                      </p>

                      <div className="mt-8 flex justify-center">
                        <button 
                          onClick={handleUpload} disabled={isUploading}
                          className={`w-full max-w-xs py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md bg-primary hover:bg-primary/95 text-white shadow-primary/20 ${isUploading ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
                        >
                          {isUploading ? (
                            <>Uploading File... <span className="animate-spin text-lg">⏳</span></>
                          ) : (
                            <><Share2 size={20}/> Upload & Share File</>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  // Text / URL / Code Share Tab
                  <div className="w-full max-w-2xl bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShareType('url')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                          shareType === 'url' ? 'bg-primary/10 text-primary border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <Link size={16} /> URL Link
                      </button>
                      <button
                        onClick={() => setShareType('code')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                          shareType === 'code' ? 'bg-primary/10 text-primary border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <Code size={16} /> Code Snippet
                      </button>
                      <button
                        onClick={() => setShareType('text')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                          shareType === 'text' ? 'bg-primary/10 text-primary border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <File size={16} /> Plain Text
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        {shareType === 'url' ? 'Paste URL Link' : shareType === 'code' ? 'Paste Code' : 'Enter Text Content'}
                      </label>
                      <textarea
                        rows={6}
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        placeholder={
                          shareType === 'url' 
                            ? 'https://google.com' 
                            : shareType === 'code' 
                            ? 'const sayHello = () => console.log("Hello!");' 
                            : 'Type any message or note you wish to share temporarily...'
                        }
                        className="w-full bg-muted border border-border rounded-2xl p-4 text-sm font-semibold text-foreground focus:outline-none focus:border-primary resize-y"
                      />
                    </div>

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleUpload} disabled={isUploading}
                        className={`w-full max-w-xs py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md bg-primary hover:bg-primary/95 text-white shadow-primary/20 ${isUploading ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
                      >
                        {isUploading ? (
                          <>Generating... <span className="animate-spin text-lg">⏳</span></>
                        ) : (
                          <><Share2 size={20}/> Share Link</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              // Shared Result View (Link, QR Code, and Quick Share buttons)
              <motion.div
                key="result-zone"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-card border border-primary/30 p-8 rounded-3xl shadow-lg shadow-primary/5 text-center relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <CheckCircle2 size={32} />
                </div>
                
                <h2 className="text-2xl font-black text-foreground mt-6 mb-2">
                  {sharedLink.startsWith('blob:') ? 'Local Link Created (Offline)' : 'Secure Link Created!'}
                </h2>
                <div className="max-w-md mx-auto mb-2">
                  {sharedLink.startsWith('blob:') ? (
                    <p className="text-rose-500 dark:text-rose-400 text-xs font-bold bg-rose-500/10 py-2.5 px-4 rounded-xl border border-rose-500/20 leading-relaxed">
                      ⚠️ Server is currently busy or rate-limited. This is a local-only link that works only on this device/tab. It cannot be opened by others. Please try again later.
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm font-medium">
                      Open on any device to view, redirect, or download instantly.
                    </p>
                  )}
                </div>

                {/* Local Client-Side QR Code */}
                {qrCodeUrl && (
                  <div className="mt-8 bg-white p-4 rounded-2xl inline-block mx-auto border-2 border-border shadow-sm relative group cursor-pointer" title="Scan to download">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code"
                      className="w-48 h-48 rounded-lg group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-2xl">
                      <QrCode size={40} className="text-primary" />
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  {/* Shareable Link Input with Copy Button */}
                  <div className="relative max-w-md mx-auto">
                    <input 
                      type="text"
                      value={sharedLink}
                      readOnly
                      className="w-full bg-muted border border-border rounded-xl pl-4 pr-12 py-3 text-sm font-semibold text-foreground focus:outline-none focus:border-primary text-center"
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors"
                    >
                      {isCopied ? <CheckCircle2 size={16} /> : <Clipboard size={16} />}
                    </button>
                  </div>

                  {/* Share Options: WhatsApp, PC Native Share, Copy Link */}
                  <div className="flex justify-center items-center gap-3 pt-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all text-xs font-bold active:scale-95 shadow-sm"
                    >
                      <Clipboard size={14} /> Copy Link
                    </button>
                    
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white transition-all text-xs font-bold active:scale-95 shadow-sm"
                    >
                      <WhatsAppIcon size={15} /> WhatsApp
                    </button>

                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white transition-all text-xs font-bold active:scale-95 shadow-sm"
                    >
                      <Share2 size={14} /> Send Share
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Timer size={12}/> Link Expires: {new Date(expiresAt || Date.now() + expiryHours*3600000).toLocaleString()}
                  </div>
                  <button 
                    onClick={resetAll}
                    className="mt-4 text-xs font-bold text-muted-foreground hover:text-indigo-500 uppercase tracking-wider transition-colors"
                  >
                    Create Another Share
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default TempShare;
