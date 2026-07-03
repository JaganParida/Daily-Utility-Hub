import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Download, Loader2, X, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Setup pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const COMPRESSION_LEVELS = [
  { id: 'low', label: 'Low Compression', quality: 0.8, scale: 1.5, desc: 'Highest quality, smaller file.' },
  { id: 'medium', label: 'Recommended', quality: 0.5, scale: 1.0, desc: 'Good quality, medium file.', badge: 'Recommended' },
  { id: 'high', label: 'Extreme', quality: 0.2, scale: 0.8, desc: 'Lowest quality, smallest file.' },
  { id: 'manual', label: 'Target Size', quality: null, scale: null, desc: 'Manually set max size.', badge: 'Advanced' }
];

const PdfCompressor = () => {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [targetSizeMb, setTargetSizeMb] = useState(2);
  const [targetUnit, setTargetUnit] = useState('MB');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      await loadPdf(droppedFile);
    } else {
      toast.error('Only PDF files are supported.');
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      await loadPdf(selectedFile);
    }
  };

  const loadPdf = async (selectedFile) => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setFile(selectedFile);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF. It might be corrupted or password protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    const levelSettings = COMPRESSION_LEVELS.find(l => l.id === compressionLevel);
    
    let levelQuality = 0.5;
    let levelScale = 1.0;
    
    if (compressionLevel === 'manual') {
      const origMb = file.size / (1024 * 1024);
      const targetMb = targetUnit === 'MB' ? targetSizeMb : targetSizeMb / 1024;
      const ratio = targetMb / origMb;
      if (ratio >= 0.8) { levelQuality = 0.8; levelScale = 1.2; }
      else if (ratio >= 0.5) { levelQuality = 0.6; levelScale = 1.0; }
      else if (ratio >= 0.3) { levelQuality = 0.4; levelScale = 0.9; }
      else if (ratio >= 0.1) { levelQuality = 0.2; levelScale = 0.8; }
      else { levelQuality = 0.1; levelScale = 0.6; }
    } else {
      levelQuality = levelSettings.quality;
      levelScale = levelSettings.scale;
    }
    
    try {
      // 1. Yield for UI update
      await new Promise(r => setTimeout(r, 100));

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let finalBlob = null;
      let success = false;
      const targetBytes = targetUnit === 'MB' ? targetSizeMb * 1024 * 1024 : targetSizeMb * 1024;
      
      let maxAttempts = compressionLevel === 'manual' ? 4 : 1;
      let currentQuality = levelQuality;
      let currentScale = levelScale;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let tempDoc = null;
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: currentScale });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport: viewport }).promise;

          const imgData = canvas.toDataURL('image/jpeg', currentQuality);
          
          const imgWidthMm = (viewport.width * 25.4) / 72;
          const imgHeightMm = (viewport.height * 25.4) / 72;
          const orientation = imgWidthMm > imgHeightMm ? 'l' : 'p';

          if (!tempDoc) {
            tempDoc = new jsPDF({ orientation, unit: 'mm', format: [imgWidthMm, imgHeightMm] });
          } else {
            tempDoc.addPage([imgWidthMm, imgHeightMm], orientation);
          }

          tempDoc.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm, undefined, 'FAST');
          
          // Progress within current attempt
          setProgress(Math.round((pageNum / pdf.numPages) * 100));
        }

        finalBlob = tempDoc.output('blob');
        
        if (compressionLevel !== 'manual' || finalBlob.size <= targetBytes) {
          success = true;
          break; // It fits or we aren't in manual mode
        } else {
          // Need more compression
          currentScale = Math.max(0.3, currentScale * 0.7);
          currentQuality = Math.max(0.01, currentQuality - 0.2);
          if (attempt === maxAttempts) break; 
        }
      }

      const downloadUrl = URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.replace('.pdf', '')}_compressed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      if (compressionLevel === 'manual' && !success && finalBlob.size > targetBytes) {
        toast.error(`Could not compress further! Lowest size achieved: ${(finalBlob.size/1024).toFixed(1)} KB.`);
      } else {
        toast.success('PDF compressed successfully!');
      }
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setProgress(0);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Smart PDF Compressor</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Drastically reduce PDF file sizes for easier sharing and uploading.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Workspace Area */}
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
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">
                    {isProcessing ? 'Analyzing Document...' : 'Upload PDF to Compress'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm leading-relaxed">
                    {isProcessing ? 'Inspecting structure...' : <span>Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>. Processing is fully secure.</span>}
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
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Select Compression Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COMPRESSION_LEVELS.map(level => (
                      <label 
                        key={level.id}
                        onClick={() => setCompressionLevel(level.id)}
                        className={`relative border rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all ${
                          compressionLevel === level.id ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' : 'border-border bg-muted/10 hover:bg-muted/30'
                        }`}
                      >
                        {level.badge && (
                          <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            {level.badge}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-foreground text-sm">{level.label}</p>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            compressionLevel === level.id ? 'border-primary' : 'border-muted-foreground/30'
                          }`}>
                            {compressionLevel === level.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                        
                        {level.id === 'manual' && compressionLevel === 'manual' && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0.1" 
                                step="any"
                                value={targetSizeMb}
                                onChange={(e) => setTargetSizeMb(Number(e.target.value))}
                                className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                              />
                              <select 
                                value={targetUnit}
                                onChange={(e) => setTargetUnit(e.target.value)}
                                className="bg-background border border-border text-foreground text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary shrink-0 cursor-pointer"
                              >
                                <option value="MB">MB</option>
                                <option value="KB">KB</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {isProcessing && (
                  <div className="border-t border-border pt-6 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                      <span>Compressing pages...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Action panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <RefreshCw size={16} /> Document Details
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Rasterizes & compresses internal images to drastically reduce size.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>{totalPages} pages ready for optimization.</p>
              </div>
            </div>

            {file && (
              <div className="border-t border-border pt-4 min-w-0">
                <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0 border border-border/50">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCompress}
                disabled={isProcessing || !file}
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
                      Compressing...
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
                      <Download size={20} />
                      <span>Compress PDF</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-border disabled:opacity-50"
                >
                  <X size={16} />
                  Clear Document
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfCompressor;
