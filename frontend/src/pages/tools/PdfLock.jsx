import { useState, useRef, useEffect } from 'react';
import { Lock, UploadCloud, FileText, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const PdfLock = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restrictPrinting, setRestrictPrinting] = useState(true);
  const [restrictModifying, setRestrictModifying] = useState(true);
  const [restrictCopying, setRestrictCopying] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClear = () => {
    setFile(null);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: 'None', score: 0, color: 'bg-muted' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', score, color: 'bg-red-500' };
    if (score <= 4) return { label: 'Medium', score, color: 'bg-yellow-500' };
    return { label: 'Strong', score, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFile(droppedFile);
    setPreviewUrl(URL.createObjectURL(droppedFile));
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleLock = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('password', password);
    formData.append('restrictPrinting', restrictPrinting);
    formData.append('restrictModifying', restrictModifying);
    formData.append('restrictCopying', restrictCopying);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Encrypting PDF securely on server...');
      
      const response = await api.post('/pdf/lock', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_locked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF locked successfully!', { id: toastId });
      setPassword('');
      setConfirmPassword('');
      setFile(null);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to lock PDF.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Lock size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Lock PDF (Encrypt)</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Secure your document with AES-256 military-grade encryption and set permissions.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload & Form Area */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!file ? (
              <motion.div
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full w-full flex flex-col justify-center"
              >
                <div 
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 pointer-events-none shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">Upload a PDF</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm pointer-events-none leading-relaxed">
                    Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 flex flex-col gap-4 shrink-0 min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-lg truncate w-full" title={file.name}>{file.name}</h3>
                    <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button onClick={handleClear} className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                    Change File
                  </button>
                </div>
              </div>

              {showPreview && previewUrl && (
                <div className="border-t border-border pt-4 w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Document Preview</h4>
                    <a 
                      href={previewUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/5 relative">
                    <object 
                      data={previewUrl} 
                      type="application/pdf" 
                      className="w-full h-full"
                    >
                      <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                        </div>
                      </iframe>
                    </object>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
                
                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                   
                   {/* Password */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Set Password</label>
                      <div className="relative">
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="Enter a strong password"
                           className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                         />
                         <button 
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                         >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                      </div>
                      
                      {/* Strength Meter */}
                      {password && (
                        <div className="space-y-1.5 pt-1">
                           <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-muted-foreground">Strength:</span>
                              <span className={strength.score <= 2 ? 'text-red-500' : strength.score <= 4 ? 'text-yellow-500' : 'text-emerald-500'}>
                                 {strength.label}
                              </span>
                           </div>
                           <div className="h-1 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                 <div 
                                   key={i} 
                                   className={`h-full flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-muted/50'}`} 
                                 />
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Confirm Password */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Confirm Password</label>
                      <div className="relative">
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="Re-enter password"
                           className={`w-full bg-background border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500/50' : 'border-border focus:ring-emerald-500/50'}`}
                         />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                         <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                            <ShieldAlert size={12}/> Passwords do not match
                         </p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                         <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                            <ShieldCheck size={12}/> Passwords match
                         </p>
                      )}
                   </div>

                </div>

                {/* Permissions / Restrictions Settings */}
                <div className="pt-6 border-t border-border space-y-4">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advanced Protection Permissions</h3>
                   <div className="space-y-3">
                      
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/20 border border-border/50 hover:bg-muted/40 rounded-xl transition-colors">
                         <input 
                           type="checkbox" 
                           checked={restrictPrinting}
                           onChange={(e) => setRestrictPrinting(e.target.checked)}
                           className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500/50 accent-emerald-500" 
                         />
                         <div>
                            <p className="text-sm font-semibold text-foreground">Restrict Printing</p>
                            <p className="text-xs text-muted-foreground">Disallows anyone from printing the document.</p>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/20 border border-border/50 hover:bg-muted/40 rounded-xl transition-colors">
                         <input 
                           type="checkbox" 
                           checked={restrictCopying}
                           onChange={(e) => setRestrictCopying(e.target.checked)}
                           className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500/50 accent-emerald-500" 
                         />
                         <div>
                            <p className="text-sm font-semibold text-foreground">Restrict Content Copying</p>
                            <p className="text-xs text-muted-foreground">Prevents highlighting and copying text or graphics.</p>
                         </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/20 border border-border/50 hover:bg-muted/40 rounded-xl transition-colors">
                         <input 
                           type="checkbox" 
                           checked={restrictModifying}
                           onChange={(e) => setRestrictModifying(e.target.checked)}
                           className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500/50 accent-emerald-500" 
                         />
                         <div>
                            <p className="text-sm font-semibold text-foreground">Restrict Modifications</p>
                            <p className="text-xs text-muted-foreground">Prevents editing content, form filling, or rotating pages.</p>
                         </div>
                      </label>

                   </div>
                </div>

             </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4">
              <Lock size={16} className="inline mr-2" /> Encryption Info
            </h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Uses strong AES-256 bit encryption standard.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Prevents unauthorized opening of critical sheets.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Files are permanently deleted after locking.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLock}
              disabled={!file || !password.trim() || password !== confirmPassword || isProcessing}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                isProcessing
                  ? 'bg-primary/70 text-primary-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isProcessing ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="animate-spin" size={20} />
                    Encrypting...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Lock size={20} />
                    Lock PDF
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PdfLock;
