import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, X, Lock, 
  ShieldCheck, ShieldAlert, Eye, EyeOff, CheckCircle2, 
  KeyRound, Shield, Sparkles, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

const PdfLock = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      setFile(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security Permissions
  const [restrictPrinting, setRestrictPrinting] = useState(true);
  const [restrictCopying, setRestrictCopying] = useState(true);
  const [restrictModifying, setRestrictModifying] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setDownloadUrl(null);
    } else {
      toast.error('Only PDF documents are supported.');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected?.type === 'application/pdf') {
      setFile(selected);
      setDownloadUrl(null);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', score: 0, color: '#dadce0', width: '0%' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', score: 1, color: '#ea4335', width: '30%' };
    if (score <= 4) return { label: 'Good', score: 3, color: '#fbbc04', width: '70%' };
    return { label: 'Ultra Secure', score: 5, color: '#34a853', width: '100%' };
  };

  const strength = getPasswordStrength();

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

    setIsProcessing(true);
    const toastId = toast.loading('Encrypting document with AES encryption...');

    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const encryptedBytes = await encryptPDF(fileBytes, password, {
        ownerPassword: `${password}_owner_security`,
        allowPrinting: !restrictPrinting,
        allowModifying: !restrictModifying,
        allowCopying: !restrictCopying,
        useObjectStreams: false,
      });

      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `${file.name.replace('.pdf', '')}_protected.pdf`;

      setDownloadUrl(url);
      setDownloadFileName(filename);
      toast.success('Document encrypted & locked successfully!', { id: toastId });

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error('Failed to encrypt PDF. It may already be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setDownloadUrl(null);
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF Password & Security Lock"
        description="Encrypt PDF documents with standard AES password protection and enforce granular user permissions."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#137333] bg-[#e6f4ea] border-[#ceead6]"
        badge="AES-128 / AES-256 Engine"
        extraBadge="Permission Controls"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {!file ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`tool-card p-8 sm:p-12 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[380px] group ${
                isDragging 
                  ? 'border-[#1a73e8] bg-[#e8f0fe]/50 scale-[0.99] shadow-inner' 
                  : 'border-[#c2d7fb] hover:border-[#1a73e8] hover:bg-[#f8fbff]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-20 h-20 bg-[#e8f0fe] border border-[#d2e3fc] rounded-3xl flex items-center justify-center text-[#1a73e8] mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                <Lock size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF to Protect & Encrypt
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. 100% in-browser AES encryption.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  AES Bank-Grade Security
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  No Server Uploads
                </span>
              </div>
            </div>
          ) : (
            /* Active Document Security Form */
            <div className="tool-card p-5 sm:p-6 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#e8f0fe] text-[#1a73e8] rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#202124] truncate max-w-md">{file.name}</h4>
                    <p className="text-xs text-[#5f6368]">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; Unprotected PDF</p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="btn-google-secondary text-xs py-1.5 px-3"
                >
                  <X size={14} /> Change Document
                </button>
              </div>

              {/* Password Inputs */}
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block mb-1.5">
                    Document Open Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong document password"
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

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#5f6368]">Password Strength:</span>
                        <span style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-[#e8eaed] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block mb-1.5">
                    Confirm Password
                  </label>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to verify"
                    className={`google-input w-full text-sm font-semibold ${
                      confirmPassword && confirmPassword !== password ? 'border-[#ea4335]' : ''
                    }`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-[#ea4335] mt-1 font-bold">Passwords do not match.</p>
                  )}
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div className="pt-4 border-t border-[#dadce0] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                  Enforce Security Permissions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] cursor-pointer hover:bg-[#f1f3f4]">
                    <input 
                      type="checkbox"
                      checked={restrictPrinting}
                      onChange={(e) => setRestrictPrinting(e.target.checked)}
                      className="rounded text-[#1a73e8] focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-[#202124]">Block Printing</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] cursor-pointer hover:bg-[#f1f3f4]">
                    <input 
                      type="checkbox"
                      checked={restrictCopying}
                      onChange={(e) => setRestrictCopying(e.target.checked)}
                      className="rounded text-[#1a73e8] focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-[#202124]">Block Copying</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] cursor-pointer hover:bg-[#f1f3f4]">
                    <input 
                      type="checkbox"
                      checked={restrictModifying}
                      onChange={(e) => setRestrictModifying(e.target.checked)}
                      className="rounded text-[#1a73e8] focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-[#202124]">Block Editing</span>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar Cockpit */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#34a853]" /> Protection Cockpit
            </h3>

            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Standard PDF viewers (Acrobat, Chrome, Apple Preview) will require password to view.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Private encryption runs 100% inside your browser.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleLock}
                disabled={isProcessing || !file || !password || password !== confirmPassword}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Encrypting Document...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Encrypt & Lock PDF</span>
                  </>
                )}
              </button>

              {downloadUrl && !isProcessing && (
                <a
                  href={downloadUrl}
                  download={downloadFileName}
                  className="w-full btn-google-secondary text-xs py-2 justify-center border-[#34a853] text-[#137333] bg-[#e6f4ea] hover:bg-[#ceead6]"
                >
                  <CheckCircle2 size={14} className="text-[#34a853]" /> Download Protected PDF
                </a>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PdfLock;
