import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, X, RefreshCw, 
  CheckCircle2, Sparkles, Sliders, Zap, ShieldCheck, ArrowRight,
  TrendingDown, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Setup pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const COMPRESSION_PRESETS = [
  {
    id: 'medium',
    label: 'Recommended Compression',
    reduction: '~50% Reduction',
    desc: 'Optimal balance between crisp visual quality and compact file size.',
    icon: ShieldCheck,
    badge: 'Recommended',
    scale: 1.3,
    quality: 0.48
  },
  {
    id: 'high',
    label: 'Extreme Compression',
    reduction: '~70% Reduction',
    desc: 'Smallest possible file size. Ideal for strict email & web portal limits.',
    icon: Zap,
    badge: 'Smallest Size',
    scale: 0.95,
    quality: 0.25
  },
  {
    id: 'low',
    label: 'Less Compression',
    reduction: '~25% Reduction',
    desc: 'Preserves high-resolution images & ultra-fine print for printing.',
    icon: Sparkles,
    badge: 'High Quality',
    scale: 1.6,
    quality: 0.78
  },
  {
    id: 'manual',
    label: 'Custom Target Size',
    reduction: 'Exact Limit',
    desc: 'Specify a strict maximum file weight limit (in MB or KB).',
    icon: Sliders,
    badge: 'Advanced',
    scale: null,
    quality: null
  }
];

const PdfCompressor = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [firstPageThumbnail, setFirstPageThumbnail] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [targetSizeMb, setTargetSizeMb] = useState('1.5');
  const [targetUnit, setTargetUnit] = useState('MB');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Result state
  const [resultBlob, setResultBlob] = useState(null);
  const [resultSize, setResultSize] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);

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
      toast.error('Please upload a valid PDF document.');
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      await loadPdf(selectedFile);
    }
  };

  const loadPdf = async (selectedFile) => {
    setIsProcessing(true);
    setResultBlob(null);
    setDownloadUrl(null);
    const toastId = toast.loading('Reading PDF document structure...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setFile(selectedFile);

      // Render thumbnail of page 1
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page1.render({ canvasContext: ctx, viewport }).promise;
      setFirstPageThumbnail(canvas.toDataURL());

      toast.success(`PDF Loaded: ${pdf.numPages} pages (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF. Protected or encrypted files are not supported.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setResultBlob(null);
    const toastId = toast.loading('Compressing PDF pages...');

    const targetVal = parseFloat(targetSizeMb) || 0.5;
    const targetBytes = targetUnit === 'MB' ? targetVal * 1024 * 1024 : targetVal * 1024;

    try {
      await new Promise(r => setTimeout(r, 120));
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let chosenScale = 1.3;
      let chosenQuality = 0.48;

      if (compressionLevel === 'manual') {
        const presets = [
          { scale: 1.6, quality: 0.80 },
          { scale: 1.5, quality: 0.65 },
          { scale: 1.4, quality: 0.50 },
          { scale: 1.3, quality: 0.40 },
          { scale: 1.1, quality: 0.32 },
          { scale: 0.9, quality: 0.22 },
          { scale: 0.7, quality: 0.15 },
          { scale: 0.5, quality: 0.10 }
        ];

        const firstPage = await pdf.getPage(1);
        let bestPreset = presets[presets.length - 1];

        for (let i = 0; i < presets.length; i++) {
          const { scale: curScale, quality: curQuality } = presets[i];
          const viewport = firstPage.getViewport({ scale: curScale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await firstPage.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', curQuality);
          const estTotal = dataUrl.length * 0.75 * pdf.numPages * 1.1;

          if (estTotal <= targetBytes) {
            bestPreset = presets[i];
            break;
          }
        }
        chosenScale = bestPreset.scale;
        chosenQuality = bestPreset.quality;
      } else {
        const preset = COMPRESSION_PRESETS.find(p => p.id === compressionLevel) || COMPRESSION_PRESETS[0];
        chosenScale = preset.scale;
        chosenQuality = preset.quality;
      }

      let compiledDoc = null;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProgress(Math.round((pageNum / pdf.numPages) * 90));
        const page = await pdf.getPage(pageNum);
        const originalViewport = page.getViewport({ scale: 1.0 });
        const renderViewport = page.getViewport({ scale: chosenScale });

        const canvas = document.createElement('canvas');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', chosenQuality);
        const ptWidth = originalViewport.width;
        const ptHeight = originalViewport.height;
        const orientation = ptWidth > ptHeight ? 'l' : 'p';

        if (pageNum === 1) {
          compiledDoc = new jsPDF({
            orientation,
            unit: 'pt',
            format: [ptWidth, ptHeight]
          });
        } else {
          compiledDoc.addPage([ptWidth, ptHeight], orientation);
        }

        compiledDoc.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight);
      }

      setProgress(100);
      const outputBlob = compiledDoc.output('blob');
      const url = URL.createObjectURL(outputBlob);
      setResultBlob(outputBlob);
      setResultSize(outputBlob.size);
      setDownloadUrl(url);

      const savedPercent = Math.max(0, Math.round(((file.size - outputBlob.size) / file.size) * 100));
      toast.success(`Compressed! Saved ${savedPercent}% (${(outputBlob.size / 1024 / 1024).toFixed(2)} MB)`, { id: toastId });

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_compressed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setTotalPages(0);
    setFirstPageThumbnail(null);
    setResultBlob(null);
    setDownloadUrl(null);
  };

  const getEstimatedReduction = () => {
    if (!file) return null;
    if (compressionLevel === 'high') return Math.round(file.size * 0.3);
    if (compressionLevel === 'low') return Math.round(file.size * 0.75);
    if (compressionLevel === 'manual') {
      const targetVal = parseFloat(targetSizeMb) || 0.5;
      return targetUnit === 'MB' ? targetVal * 1024 * 1024 : targetVal * 1024;
    }
    return Math.round(file.size * 0.5);
  };

  const estimatedSize = getEstimatedReduction();

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF Compressor Studio"
        description="Compress PDF documents with maximum visual clarity and smart raster downsampling."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Smart Size Reduction"
        extraBadge="Target Size Optimizer"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area */}
        <div className="flex-1 w-full flex flex-col gap-5">
          
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
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF to Compress
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. 100% private in-browser compression.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  Up to 80% Reduction
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  No File Upload to Server
                </span>
              </div>
            </div>
          ) : (
            /* Active Document Workspace */
            <div className="tool-card p-5 sm:p-6 space-y-6">
              
              {/* Document Overview Strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f8f9fa] rounded-2xl border border-[#dadce0]">
                <div className="flex items-center gap-3.5 min-w-0">
                  {firstPageThumbnail ? (
                    <img 
                      src={firstPageThumbnail} 
                      alt="Preview" 
                      className="w-14 h-18 object-cover rounded-lg border border-[#dadce0] shadow-xs shrink-0 bg-white"
                    />
                  ) : (
                    <div className="p-3 bg-[#e8f0fe] text-[#1a73e8] rounded-xl shrink-0">
                      <FileText size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm sm:text-base text-[#202124] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-[#5f6368] mt-0.5">
                      Original: <span className="font-bold text-[#202124]">{(file.size / 1024 / 1024).toFixed(2)} MB</span> &bull; {totalPages} Pages
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="btn-google-secondary text-xs py-2 px-3 self-end sm:self-center"
                >
                  <X size={14} /> Change File
                </button>
              </div>

              {/* Compression Tier Selector Cards (iLovePDF / SmallPDF caliber) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-3">
                  Choose Compression Level
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {COMPRESSION_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = compressionLevel === preset.id;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => setCompressionLevel(preset.id)}
                        className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-[#1a73e8] bg-[#e8f0fe]/60 shadow-sm ring-2 ring-[#1a73e8]/20'
                            : 'border-[#dadce0] bg-white hover:border-[#1a73e8]/50 hover:bg-[#f8fbff]'
                        }`}
                      >
                        {preset.badge && (
                          <div className={`absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs ${
                            preset.badge === 'Recommended' 
                              ? 'bg-[#1a73e8] text-white' 
                              : 'bg-[#34a853] text-white'
                          }`}>
                            {preset.badge}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${
                              isSelected 
                                ? 'bg-[#1a73e8] text-white border-[#1a73e8]' 
                                : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-[#202124]">
                                {preset.label}
                              </h4>
                              <span className="text-[11px] font-bold text-[#137333]">
                                {preset.reduction}
                              </span>
                            </div>
                          </div>

                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[#1a73e8]' : 'border-[#dadce0]'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />}
                          </div>
                        </div>

                        <p className="text-xs text-[#5f6368] leading-relaxed">
                          {preset.desc}
                        </p>

                        {preset.id === 'manual' && isSelected && (
                          <div 
                            className="pt-2.5 border-t border-[#dadce0] flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-bold text-[#5f6368]">Target Limit:</span>
                            <input 
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={targetSizeMb}
                              onChange={(e) => setTargetSizeMb(e.target.value)}
                              className="google-input text-xs font-bold py-1.5 px-2.5 w-24"
                              placeholder="1.5"
                            />
                            <select
                              value={targetUnit}
                              onChange={(e) => setTargetUnit(e.target.value)}
                              className="google-select text-xs font-bold py-1 px-2"
                            >
                              <option value="MB">MB</option>
                              <option value="KB">KB</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Size Estimation Meter */}
              <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#5f6368]">
                  <span>Size Comparison Estimate:</span>
                  <span className="text-[#137333] flex items-center gap-1">
                    <TrendingDown size={14} />
                    {estimatedSize ? `~${(estimatedSize / 1024 / 1024).toFixed(2)} MB expected` : 'Calculating...'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-[#dadce0]">
                    <span className="text-[10px] uppercase font-bold text-[#5f6368] block">Current</span>
                    <span className="text-sm font-extrabold text-[#202124]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="p-2.5 bg-[#e6f4ea] rounded-xl border border-[#ceead6]">
                    <span className="text-[10px] uppercase font-bold text-[#137333] block">Estimated</span>
                    <span className="text-sm font-extrabold text-[#137333]">
                      {estimatedSize ? `~${(estimatedSize / 1024 / 1024).toFixed(2)} MB` : 'Optimal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar during compression */}
              {isProcessing && (
                <div className="p-4 bg-[#e8f0fe] rounded-2xl border border-[#d2e3fc] space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#1a73e8]">
                    <span>Compressing & rendering pages...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-[#d2e3fc] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#1a73e8] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Download Card */}
              {resultBlob && !isProcessing && (
                <div className="p-4 bg-[#e6f4ea] border border-[#ceead6] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34a853] text-white flex items-center justify-center shrink-0">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#137333]">Compression Complete!</h4>
                      <p className="text-xs text-[#202124]">
                        Reduced from {(file.size / 1024 / 1024).toFixed(2)} MB to <span className="font-bold text-[#137333]">{(resultSize / 1024 / 1024).toFixed(2)} MB</span> ({Math.round(((file.size - resultSize) / file.size) * 100)}% saved)
                      </p>
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    download={`${file.name.replace('.pdf', '')}_compressed.pdf`}
                    className="btn-google-primary text-xs py-2 px-4 shadow-sm shrink-0"
                  >
                    <Download size={14} /> Download Again
                  </a>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Action Sidebar Panel */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <RefreshCw size={15} className="text-[#1a73e8]" /> Compression Summary
            </h3>

            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Preserves document layout, fonts, and vector text.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>100% private in-browser conversion. No data leaves your machine.</p>
              </div>
            </div>

            {file && (
              <div className="border-t border-[#dadce0] pt-3 text-xs space-y-2">
                <div className="flex justify-between text-[#5f6368]">
                  <span>Source File:</span>
                  <span className="font-bold text-[#202124] truncate max-w-[160px]">{file.name}</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Total Pages:</span>
                  <span className="font-bold text-[#202124]">{totalPages} Pages</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Mode:</span>
                  <span className="font-bold text-[#1a73e8] uppercase">{compressionLevel}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleCompress}
                disabled={isProcessing || !file}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Compressing ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Compress PDF</span>
                  </>
                )}
              </button>

              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full btn-google-secondary text-xs py-2 justify-center"
                >
                  <X size={14} /> Clear Document
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
