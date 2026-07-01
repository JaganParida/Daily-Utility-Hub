import { useState, useRef, useEffect } from 'react';
import { Unlock, UploadCloud, FileText, CheckCircle2, Eye, EyeOff, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfUnlock = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [removeSignatures, setRemoveSignatures] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
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
    setIsEncrypted(true);
    setPassword('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const inspectFile = async (selectedFile) => {
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    
    setIsInspecting(true);
    const toastId = toast.loading('Inspecting file protection...');
    try {
      const { data } = await axios.post('http://localhost:5000/api/pdf/inspect', formData);
      setIsInspecting(false);
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsEncrypted(data.isEncrypted);
      
      if (!data.isEncrypted) {
        toast.success('This PDF has no password protection.', { id: toastId });
      } else {
        toast.success('Encrypted PDF detected. Enter password to unlock.', { id: toastId });
      }
    } catch (e) {
      setIsInspecting(false);
      console.error(e);
      // Fallback: assume it might be encrypted
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsEncrypted(true);
      toast.dismiss(toastId);
    }
  };

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
    inspectFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    inspectFile(selectedFile);
  };

  const handleUnlock = async () => {
    if (!file) {
      toast.error('Please select an encrypted PDF file');
      return;
    }
    if (isEncrypted && !password.trim()) {
      toast.error('Please enter the document password');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('password', password);
    formData.append('removeSignatures', removeSignatures);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Decrypting PDF securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/unlock', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_unlocked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF unlocked successfully!', { id: toastId });
      setPassword('');
      setFile(null);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to unlock PDF. Is the password correct?';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-0">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-lg shadow-sm">
          <Unlock size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Unlock PDF (Decrypt)</h1>
          <p className="text-muted-foreground mt-1 text-sm">Remove password protection and permissions restrictions from your PDF permanently.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 w-full min-h-0">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !isInspecting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-yellow-500 bg-yellow-500/5' : 'border-border bg-card hover:border-yellow-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-600 mb-4 pointer-events-none">
                {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">
                {isInspecting ? 'Inspecting PDF file...' : 'Upload Encrypted PDF'}
              </h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                {isInspecting ? 'Reading encryption headers.' : 'Drag & drop a protected PDF file here or click to browse.'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-4 shrink-0 min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="w-12 h-12 bg-yellow-500/10 text-yellow-600 rounded-xl flex items-center justify-center shrink-0">
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
                  <button 
                    onClick={handleClear} 
                    className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                  >
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
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/10 relative">
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
          )}

          {file && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                {!isEncrypted ? (
                  <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-semibold">This PDF is already unlocked! You can download it directly.</span>
                  </div>
                ) : (
                  <>
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Original Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter the document password"
                        className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You must know the password to strip encryption.
                    </p>

                    <div className="flex items-start gap-3 border border-border bg-muted/20 p-3.5 rounded-xl mt-2">
                      <input
                        type="checkbox"
                        id="removeSignatures"
                        checked={removeSignatures}
                        onChange={(e) => setRemoveSignatures(e.target.checked)}
                        className="w-4 h-4 rounded text-yellow-500 border-border focus:ring-yellow-500 focus:ring-opacity-25 mt-0.5"
                      />
                      <label htmlFor="removeSignatures" className="text-xs font-bold text-foreground cursor-pointer select-none">
                        Remove digital signatures (Aadhaar cards, etc.)
                        <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                          Highly recommended. Prevents Acrobat and Chrome from showing "Signature Invalid" warnings on decrypted PDFs.
                        </span>
                      </label>
                    </div>
                  </>
                )}
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Decryption Info</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Removes passwords and permission restrictions permanently.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Supports AES-256 and legacy RC4 decryption.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>We delete files immediately after processing.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleUnlock}
            disabled={!file || (isEncrypted && !password.trim()) || isProcessing}
            className="w-full py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Unlock size={18} />
            {isProcessing ? 'Decrypting...' : !isEncrypted ? 'Download Unlocked' : 'Unlock PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfUnlock;
