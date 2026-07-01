import { useState, useRef } from 'react';
import { Lock, UploadCloud, FileText, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfLock = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restrictPrinting, setRestrictPrinting] = useState(true);
  const [restrictModifying, setRestrictModifying] = useState(true);
  const [restrictCopying, setRestrictCopying] = useState(true);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

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
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
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
      
      const response = await axios.post('http://localhost:5000/api/pdf/lock', formData, {
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
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
          <Lock size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lock PDF (Encrypt)</h1>
          <p className="text-muted-foreground mt-1 text-sm">Secure your document with AES-256 military-grade encryption and set permissions.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-card hover:border-emerald-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                Drag & drop a PDF file here or click to browse.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg truncate max-w-md">{file.name}</h3>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setPassword(''); setConfirmPassword(''); }} className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                Change File
              </button>
            </div>
          )}

          {file && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
                
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
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Encryption Info</h3>
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
          
          <button 
            onClick={handleLock}
            disabled={!file || !password.trim() || password !== confirmPassword || isProcessing}
            className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock size={18} />
            {isProcessing ? 'Encrypting...' : 'Lock PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfLock;
