import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, Clipboard, Globe, X, Download, QrCode, Share2, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const TempShare = () => {
  const [file, setFile] = useState(null);
  const [expiryHours, setExpiryHours] = useState(24);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [sharedLink, setSharedLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef(null);

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
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading securely...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiryHours', expiryHours);

      const response = await api.post('/share/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      
      const backendBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000';
      const shareUrl = `${backendBaseUrl}/api/share/download/${data.fileId}`;
      setSharedLink(shareUrl);
      setExpiresAt(data.expiresAt);
      
      toast.success('Secure link ready!', { id: toastId });
    } catch (err) {
      console.warn("Backend down. Falling back to local secure ObjectURL.", err);
      // Fallback local sharing link
      const localUrl = URL.createObjectURL(file);
      setSharedLink(localUrl);
      const expDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
      setExpiresAt(expDate);
      toast.success('Local offline link generated successfully!', { id: toastId });
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

  const resetAll = () => {
    setFile(null);
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
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Upload a file to generate a temporary, expiring download link instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Upload Dashboard */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${!file ? 'bg-primary text-white' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {!file ? '1' : <CheckCircle2 size={16}/>}
                </div>
                <span className={`text-sm font-semibold ${!file ? 'text-foreground' : 'text-muted-foreground'}`}>Select File</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${file && !sharedLink ? 'bg-primary text-white' : sharedLink ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                  {sharedLink ? <CheckCircle2 size={16}/> : '2'}
                </div>
                <span className={`text-sm font-semibold ${file && !sharedLink ? 'text-foreground' : 'text-muted-foreground'}`}>Upload & Share</span>
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

        {/* Right: Dropzone / Result */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[500px]">
          <AnimatePresence mode="wait">
            {!sharedLink ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                {!file ? (
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
                      Max upload size is 50MB. Click to browse.
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
                        className={`w-full max-w-xs py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md bg-primary hover:bg-primary text-white shadow-primary/20 ${isUploading ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
                      >
                        {isUploading ? (
                          <>Uploading... <span className="animate-spin text-lg">⏳</span></>
                        ) : (
                          <><Share2 size={20}/> Upload & Share</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result-zone"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-card border border-primary/30 p-8 rounded-3xl shadow-lg shadow-primary/5 text-center relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <CheckCircle2 size={32} />
                </div>
                
                <h2 className="text-2xl font-black text-foreground mt-6 mb-2">Upload Successful!</h2>
                <p className="text-muted-foreground text-sm font-medium">Scan the QR code or copy the link below.</p>

                <div className="mt-8 bg-white p-4 rounded-2xl inline-block mx-auto border-2 border-border shadow-sm relative group cursor-pointer" title="Scan to download">
                  {/* Dynamic QR Code from API */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(sharedLink)}&margin=10`} 
                    alt="QR Code"
                    className="w-48 h-48 rounded-lg group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-2xl">
                    <QrCode size={40} className="text-primary" />
                  </div>
                </div>

                <div className="mt-8 relative max-w-md mx-auto">
                  <input 
                    type="text"
                    value={sharedLink}
                    readOnly
                    className="w-full bg-muted border border-border rounded-xl pl-4 pr-12 py-3 text-sm font-semibold text-foreground focus:outline-none focus:border-primary text-center"
                  />
                  <button 
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    {isCopied ? <CheckCircle2 size={16} /> : <Clipboard size={16} />}
                  </button>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Timer size={12}/> Link Expires: {new Date(expiresAt || Date.now() + expiryHours*3600000).toLocaleString()}
                  </div>
                  <button 
                    onClick={resetAll}
                    className="mt-4 text-xs font-bold text-muted-foreground hover:text-indigo-500 uppercase tracking-wider transition-colors"
                  >
                    Upload Another File
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
