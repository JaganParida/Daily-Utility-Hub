import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import { Lock, UploadCloud, FileText, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

const PdfLock = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
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
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
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

    let toastId = toast.loading('Encrypting PDF locally in browser...');
    try {
      setIsProcessing(true);
      
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const encryptedBytes = await encryptPDF(fileBytes, password, {
        ownerPassword: `${password}_owner_restrict`,
        allowPrinting: !restrictPrinting,
        allowModifying: !restrictModifying,
        allowCopying: !restrictCopying,
        useObjectStreams: false,
      });
      
      const url = window.URL.createObjectURL(new Blob([encryptedBytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_locked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF locked successfully!', { id: toastId });
      setPassword('');
      setConfirmPassword('');
      setFile(null);
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to encrypt PDF. The file might already be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="Lock PDF (Encrypt)"
        description="Secure your document with AES-256 military-grade encryption and set permissions."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#137333] bg-[#e6f4ea] border-[#ceead6]"
        badge="AES Encryption"
        extraBadge="Password Protection"
      />

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
                {/* File summary & preview toggle card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 bg-[#e6f4ea] text-[#137333] border border-[#ceead6] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#202124] text-sm sm:text-base truncate" title={file.name}>{file.name}</h3>
                        <p className="text-[#5f6368] text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="btn-google-secondary text-xs py-1.5 px-3"
                      >
                        <Eye size={13} />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                      <button onClick={handleClear} className="btn-google-danger text-xs py-1.5 px-3">
                        Change File
                      </button>
                    </div>
                  </div>

                  {showPreview && previewUrl && (
                    <div className="border-t border-[#dadce0] pt-4 w-full flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Interactive Document Preview</h4>
                        <a 
                          href={previewUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-[#1a73e8] hover:underline flex items-center gap-1 font-semibold"
                        >
                          Open in New Tab <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="w-full h-[360px] md:h-[450px] border border-[#dadce0] rounded-xl overflow-hidden bg-white relative">
                        <object 
                          data={previewUrl} 
                          type="application/pdf" 
                          className="w-full h-full"
                        >
                          <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                            <div className="p-6 text-center text-sm text-[#5f6368]">
                              Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                            </div>
                          </iframe>
                        </object>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Configuration */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] block">Set PDF Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a strong password"
                          className="google-input w-full pr-10 text-sm font-semibold"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      
                      {/* Strength Meter */}
                      {password && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-[#5f6368]">Strength:</span>
                            <span className={strength.score <= 2 ? 'text-[#d93025]' : strength.score <= 4 ? 'text-[#f29900]' : 'text-[#137333]'}>
                              {strength.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#f1f3f4] rounded-full overflow-hidden flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-full flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-[#e8eaed]'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] block">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className={`google-input w-full pr-10 text-sm font-semibold ${confirmPassword && password !== confirmPassword ? '!border-[#d93025]' : ''}`}
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-[#d93025] font-bold flex items-center gap-1">
                          <ShieldAlert size={12}/> Passwords do not match
                        </p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-xs text-[#137333] font-bold flex items-center gap-1">
                          <ShieldCheck size={12}/> Passwords match
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permissions / Restrictions Settings */}
                  <div className="pt-5 border-t border-[#dadce0] space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Advanced Permissions & Restrictions</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <label className="flex items-start gap-2.5 cursor-pointer p-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] rounded-xl transition-colors">
                        <input 
                          type="checkbox" 
                          checked={restrictPrinting}
                          onChange={(e) => setRestrictPrinting(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-[#1a73e8] focus:ring-[#1a73e8]/30 accent-[#1a73e8]" 
                        />
                        <div>
                          <p className="text-xs font-bold text-[#202124]">Restrict Printing</p>
                          <p className="text-[11px] text-[#5f6368] mt-0.5">Disallows printing the document</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer p-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] rounded-xl transition-colors">
                        <input 
                          type="checkbox" 
                          checked={restrictCopying}
                          onChange={(e) => setRestrictCopying(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-[#1a73e8] focus:ring-[#1a73e8]/30 accent-[#1a73e8]" 
                        />
                        <div>
                          <p className="text-xs font-bold text-[#202124]">Restrict Copying</p>
                          <p className="text-[11px] text-[#5f6368] mt-0.5">Disallows copying text & graphics</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer p-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] rounded-xl transition-colors">
                        <input 
                          type="checkbox" 
                          checked={restrictModifying}
                          onChange={(e) => setRestrictModifying(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-[#1a73e8] focus:ring-[#1a73e8]/30 accent-[#1a73e8]" 
                        />
                        <div>
                          <p className="text-xs font-bold text-[#202124]">Restrict Modifying</p>
                          <p className="text-[11px] text-[#5f6368] mt-0.5">Prevents editing & form filling</p>
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
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Lock size={15} className="text-[#1a73e8]" /> Encryption Details
            </h3>
            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Standard AES-256 / 128-bit encryption standard.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Protects confidential documents with user passwords.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>100% private in-browser encryption.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dadce0]">
              <button 
                onClick={handleLock}
                disabled={!file || !password.trim() || password !== confirmPassword || isProcessing}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Encrypting PDF...
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Protect & Lock PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfLock;
