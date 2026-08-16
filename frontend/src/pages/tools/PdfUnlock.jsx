import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import { 
  Unlock, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  X,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFName, PDFArray, PDFDict } from 'pdf-lib';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfUnlock = () => {
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
    // Scroll viewport to top on mobile when cleared
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inspectFile = async (selectedFile) => {
    setIsInspecting(true);
    const toastId = toast.loading('Inspecting file protection...');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Try loading without password to check if encrypted
      await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setIsInspecting(false);
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsEncrypted(false);
      toast.success('This PDF has no password protection.', { id: toastId });
    } catch (e) {
      setIsInspecting(false);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      if (e.name === 'PasswordException' || e.message?.toLowerCase().includes('password') || e.message?.toLowerCase().includes('decrypt') || e.message?.toLowerCase().includes('authenticate')) {
        setIsEncrypted(true);
        toast.success('Encrypted PDF detected. Enter password to unlock.', { id: toastId });
      } else {
        console.error(e);
        // Fallback: assume it might be encrypted
        setIsEncrypted(true);
        toast.dismiss(toastId);
      }
    }
  };

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setIsDragging(true); 
  };
  
  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
  };
  
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

    let toastId = toast.loading('Decrypting PDF locally in browser...');
    try {
      setIsProcessing(true);
      
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const decryptedBytes = await decryptPDF(fileBytes, password);
      
      let finalBytes = decryptedBytes;
      if (removeSignatures) {
        try {
          const pdfDoc = await PDFDocument.load(decryptedBytes);
          const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
          const signatureRefs = new Set();
          let signatureCount = 0;

          for (const [ref, obj] of indirectObjects) {
            if (obj instanceof PDFDict) {
              const type = obj.get(PDFName.of('Type'));
              const ft = obj.get(PDFName.of('FT'));
              
              if ((type && type.toString() === '/Sig') || (ft && ft.toString() === '/Sig')) {
                signatureRefs.add(ref.toString());
                signatureCount++;
                const keys = Array.from(obj.keys());
                keys.forEach(k => obj.delete(k));
              }
            }
          }

          if (signatureCount > 0) {
            // Remove from `/Fields` in `/AcroForm`
            const acroFormRef = pdfDoc.catalog.get(PDFName.of('AcroForm'));
            if (acroFormRef) {
              const acroForm = pdfDoc.context.lookup(acroFormRef);
              if (acroForm instanceof PDFDict) {
                const fieldsRef = acroForm.get(PDFName.of('Fields'));
                if (fieldsRef) {
                  const fields = pdfDoc.context.lookup(fieldsRef);
                  if (fields instanceof PDFArray) {
                    const filtered = fields.asArray().filter(ref => !signatureRefs.has(ref.toString()));
                    const arr = fields.asArray();
                    arr.length = 0;
                    filtered.forEach(item => arr.push(item));
                  }
                }
              }
            }

            // Remove from `/Annots` in pages
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
              const annotsRef = page.node.get(PDFName.of('Annots'));
              if (annotsRef) {
                const annots = pdfDoc.context.lookup(annotsRef);
                if (annots instanceof PDFArray) {
                  const filtered = annots.asArray().filter(ref => !signatureRefs.has(ref.toString()));
                  const arr = annots.asArray();
                  arr.length = 0;
                  filtered.forEach(item => arr.push(item));
                }
              }
            });

            finalBytes = await pdfDoc.save({ useObjectStreams: false });
          }
        } catch (sigError) {
          console.error('Failed to strip signatures, returning raw decrypted bytes:', sigError);
        }
      }

      const url = window.URL.createObjectURL(new Blob([finalBytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_unlocked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF unlocked successfully!', { id: toastId });
      setPassword('');
      setFile(null);
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      let errMsg = 'Failed to unlock PDF. Is the password correct?';
      if (error.message && (error.message.toLowerCase().includes('password') || error.message.toLowerCase().includes('decrypt') || error.message.toLowerCase().includes('authenticate'))) {
        errMsg = 'Incorrect password. Please try again.';
      }
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool-page-container">
      {/* Header Container */}
      <ToolHeader
        title="Unlock PDF (Decrypt)"
        description="Remove password protection and permissions restrictions from your PDF permanently."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#f29900] bg-[#fef7e0] border-[#feefc3]"
        badge="Password Decryptor"
        extraBadge="Remove Restrictions"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Workspace Area */}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isInspecting && fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,application/pdf"
                  />
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm">
                  {isInspecting ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {isInspecting ? 'Inspecting PDF file...' : 'Upload Encrypted PDF'}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {isInspecting
                    ? 'Reading encryption headers to determine protection level.'
                    : 'Drag & drop a protected PDF file here, or click to browse.'}
                </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                {/* File Info Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#202124] text-sm sm:text-base truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-[#5f6368] text-xs mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="btn-google-secondary text-xs py-1.5 px-3"
                      >
                        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showPreview ? 'Hide Preview' : 'Interactive Preview'}
                      </button>
                      <button
                        onClick={handleClear}
                        className="btn-google-danger text-xs py-1.5 px-3"
                      >
                        <X size={13} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Document Preview Section */}
                  <AnimatePresence>
                    {showPreview && previewUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-[#dadce0] pt-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                            Interactive Document Preview
                          </h4>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs space-y-5">
                  <div className="border-b border-[#dadce0] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Decryption Settings</h3>
                  </div>

                  {!isEncrypted ? (
                    <div className="flex items-start gap-3 p-4 bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-xl">
                      <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs sm:text-sm font-bold block">This PDF is already unlocked!</span>
                        <span className="text-xs text-[#137333]/80 mt-1 block leading-relaxed">
                          No password protection detected on this document. You can directly proceed to download it or strip digital signatures.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] block mb-2">
                          Original PDF Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter the document password"
                            className="google-input w-full pr-10 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124] transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-[#5f6368] mt-2 flex items-center gap-1.5">
                          <Info size={13} className="text-[#1a73e8] shrink-0" />
                          You must know the password to strip encryption and access the document.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Remove Signatures Option */}
                  <div className="pt-3 border-t border-[#dadce0]">
                    <div className="flex items-start gap-3 p-3.5 bg-[#f8f9fa] border border-[#dadce0] rounded-xl transition-colors cursor-pointer select-none">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="removeSignatures"
                          checked={removeSignatures}
                          onChange={(e) => setRemoveSignatures(e.target.checked)}
                          className="w-4 h-4 rounded text-[#1a73e8] focus:ring-[#1a73e8]/30 accent-[#1a73e8] cursor-pointer"
                        />
                      </div>
                      <label htmlFor="removeSignatures" className="text-xs font-bold text-[#202124] cursor-pointer flex-1">
                        Remove digital signature locks (Aadhaar cards, bank statements, etc.)
                        <span className="block text-[11px] text-[#5f6368] font-normal mt-0.5 leading-relaxed">
                          Highly recommended. Prevents Acrobat and browsers from displaying signature warning errors on decrypted PDFs.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar Panel */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#1a73e8]" /> Decryption Summary
            </h3>
            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Permanently removes passwords and printing/copying restrictions.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Supports 128-bit & 256-bit AES as well as standard RC4 encryption.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>100% private in-browser decryption.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dadce0] flex flex-col gap-2.5">
              <button
                onClick={handleUnlock}
                disabled={!file || (isEncrypted && !password.trim()) || isProcessing}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Decrypting PDF...
                  </>
                ) : (
                  <>
                    <Unlock size={16} />
                    <span>{!isEncrypted ? 'Download Unlocked PDF' : 'Unlock PDF Document'}</span>
                  </>
                )}
              </button>

              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full btn-google-secondary text-xs py-2 justify-center"
                >
                  Clear File
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfUnlock;
