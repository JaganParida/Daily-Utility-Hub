import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Scissors, HelpCircle, Loader2, Eye, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const numbersToRangeString = (nums) => {
  if (nums.length === 0) return '';
  const sorted = [...nums].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
};

const parseRangeString = (str, total) => {
  const result = new Set();
  const parts = str.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          if (i > 0 && i <= total) result.add(i);
        }
      }
    } else {
      const num = parseInt(part.trim());
      if (!isNaN(num) && num > 0 && num <= total) result.add(num);
    }
  }
  return Array.from(result);
};

const PdfSplit = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [splitMode, setSplitMode] = useState('extract'); // 'extract' (1 PDF) or 'split' (ZIP of PDFs)
  const [pages, setPages] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClear = () => {
    setFile(null);
    setSelectedPages([]);
    setPages('');
    setTotalPages(0);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inspectFile = async (selectedFile) => {
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF properties...');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setIsInspecting(false);
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setTotalPages(pdf.numPages);
      // Select all pages by default
      const allPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      setSelectedPages(allPages);
      setPages(numbersToRangeString(allPages));
      toast.success(`PDF loaded: ${pdf.numPages} pages detected`, { id: toastId });
    } catch (e) {
      setIsInspecting(false);
      console.error(e);
      if (e.name === 'PasswordException' || e.message?.toLowerCase().includes('password') || e.message?.toLowerCase().includes('decrypt') || e.message?.toLowerCase().includes('authenticate')) {
        toast.error('This PDF is encrypted. Please decrypt (unlock) it first.', { id: toastId });
      } else {
        toast.error('Failed to parse PDF file.', { id: toastId });
      }
    }
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

  const handlePageClick = (pageNumber) => {
    let newSelected;
    if (selectedPages.includes(pageNumber)) {
      newSelected = selectedPages.filter(p => p !== pageNumber);
    } else {
      newSelected = [...selectedPages, pageNumber];
    }
    setSelectedPages(newSelected);
    setPages(numbersToRangeString(newSelected));
  };

  const handlePagesInputChange = (val) => {
    setPages(val);
    const parsed = parseRangeString(val, totalPages);
    setSelectedPages(parsed);
  };

  const selectPreset = (type) => {
    let preset = [];
    if (type === 'all') {
      preset = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (type === 'odd') {
      preset = Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n % 2 !== 0);
    } else if (type === 'even') {
      preset = Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n % 2 === 0);
    } else if (type === 'first5') {
      preset = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);
    }
    setSelectedPages(preset);
    setPages(numbersToRangeString(preset));
  };

  const handleSplit = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (selectedPages.length === 0) {
      toast.error('Please select at least one page to extract');
      return;
    }

    let toastId = toast.loading(splitMode === 'split' ? 'Splitting PDF locally...' : 'Extracting pages locally...');
    try {
      setIsProcessing(true);
      
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const originalDoc = await PDFDocument.load(fileBytes);
      
      let finalBytes;
      let extension = '.pdf';
      
      if (splitMode === 'extract') {
        const newDoc = await PDFDocument.create();
        const zeroIndexedPages = selectedPages.map(p => p - 1);
        const copiedPages = await newDoc.copyPages(originalDoc, zeroIndexedPages);
        copiedPages.forEach((page) => newDoc.addPage(page));
        finalBytes = await newDoc.save({ useObjectStreams: false });
      } else {
        const zip = new JSZip();
        for (const pageNum of selectedPages) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(originalDoc, [pageNum - 1]);
          singleDoc.addPage(copiedPage);
          const singleBytes = await singleDoc.save({ useObjectStreams: false });
          zip.file(`${file.name.replace('.pdf', '')}_page_${pageNum}.pdf`, singleBytes);
        }
        finalBytes = await zip.generateAsync({ type: 'blob' });
        extension = '.zip';
      }

      const fileBlob = finalBytes instanceof Blob ? finalBytes : new Blob([finalBytes], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileSuffix = splitMode === 'split' ? '_split' : '_extracted';
      link.setAttribute('download', `${file.name.replace('.pdf', '')}${fileSuffix}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(splitMode === 'split' ? 'PDF split into separate files!' : 'Pages extracted successfully!', { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to process PDF. The file might be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool-page-container">
      {/* Header Container */}
      <ToolHeader
        title="Extract & Split PDF"
        description="Visually select pages or ranges to extract or split into clean, new documents."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Page Range Extractor"
        extraBadge="Separate or Burst"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Main Work Area */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card p-4 md:p-6 flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!file ? (
              /* File Upload Dropzone */
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
                  className="flex-1 h-full w-full border-2 border-dashed border-[#c2d7fb] bg-white hover:border-[#1a73e8] hover:bg-[#f8fbff] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px]"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".pdf,application/pdf" 
                  />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center mb-4 text-[#1a73e8] shadow-2xs transition-transform duration-300 group-hover:scale-110">
                      {isInspecting ? (
                        <Loader2 size={32} className="animate-spin" />
                      ) : (
                        <UploadCloud size={32} />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#202124] mb-2 text-center">
                      {isInspecting ? 'Parsing PDF File...' : 'Upload PDF to Split'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5f6368] text-center max-w-sm leading-relaxed">
                      {isInspecting 
                        ? 'Please wait while we securely read the document metadata.' 
                        : <span>Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>. 100% private in-browser.</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Active File and Page Selection Layout */
              <motion.div
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                {/* File Info Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f9fa] border border-[#dadce0]">
                  {/* Card header with divider */}
                  <div className="border-b border-[#dadce0] pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#202124] text-xs uppercase tracking-wider">Source Document</h3>
                        <p className="text-xs text-[#5f6368]">Select pages and configure extraction</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="btn-google-secondary text-xs py-1.5 px-3"
                      >
                        <Eye size={13} className={showPreview ? 'text-[#1a73e8]' : 'text-[#5f6368]'} />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                      <button 
                        onClick={handleClear} 
                        className="btn-google-danger text-xs py-1.5 px-3"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* File Metadata Details */}
                  <div className="flex items-center gap-3 min-w-0 w-full">
                    <div className="p-2.5 bg-[#e8f0fe] rounded-xl border border-[#d2e3fc] text-[#1a73e8]">
                      <FileText size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#202124] text-sm sm:text-base truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[#5f6368] text-xs mt-0.5">
                        Size: <span className="font-semibold text-[#202124]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="mx-2">&bull;</span>
                        Total Pages: <span className="font-semibold text-[#202124]">{totalPages}</span>
                        <span className="mx-2">&bull;</span>
                        Selected: <span className="font-bold text-[#1a73e8]">{selectedPages.length}</span>
                      </p>
                    </div>
                  </div>

                  {/* Document Preview (Animated) */}
                  <AnimatePresence>
                    {showPreview && previewUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#dadce0] pt-4 mt-4 w-full flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-pulse" /> Document Preview
                            </h4>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Grid Page Selector */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs flex flex-col min-h-[360px]">
                  {/* Card Header with presets */}
                  <div className="border-b border-[#dadce0] pb-3 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Select Pages to Extract</h3>
                      <p className="text-xs text-[#5f6368] mt-0.5">Click pages to toggle selection or use quick filters.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => selectPreset('all')} className="px-2.5 py-1 text-xs btn-google-secondary">All</button>
                      <button onClick={() => selectPreset('odd')} className="px-2.5 py-1 text-xs btn-google-secondary">Odds</button>
                      <button onClick={() => selectPreset('even')} className="px-2.5 py-1 text-xs btn-google-secondary">Evens</button>
                      <button onClick={() => selectPreset('first5')} className="px-2.5 py-1 text-xs btn-google-secondary">First 5</button>
                    </div>
                  </div>

                  {/* Page Grid */}
                  <div className="flex-1 overflow-y-auto max-h-[340px] custom-scrollbar pr-1 mb-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-1 min-h-[140px]">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const isSelected = selectedPages.includes(page);
                      return (
                        <motion.button
                          key={page}
                          onClick={() => handlePageClick(page)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl font-mono text-xs sm:text-sm border font-bold transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                              : 'bg-white hover:bg-[#f8f9fa] border-[#dadce0] text-[#202124] hover:border-[#1a73e8]/50'
                          }`}
                        >
                          {page}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Manual Range Selector */}
                  <div className="border-t border-[#dadce0] pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                        Manual Page Range Expression
                      </label>
                      <div className="relative group cursor-help text-[#1a73e8]">
                        <HelpCircle size={14} />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-white border border-[#dadce0] text-[#202124] text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                          <p className="font-bold mb-1 text-[#1a73e8]">Formatting Examples:</p>
                          <p className="text-[#5f6368] leading-relaxed">
                            • Range: <code className="font-mono text-[#1a73e8] bg-[#e8f0fe] px-1 rounded">1-5</code><br />
                            • Specific pages: <code className="font-mono text-[#1a73e8] bg-[#e8f0fe] px-1 rounded">2, 4, 8</code><br />
                            • Mixed: <code className="font-mono text-[#1a73e8] bg-[#e8f0fe] px-1 rounded">1-3, 6, 8-10</code>
                          </p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => handlePagesInputChange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8"
                      className="google-input w-full font-mono text-xs sm:text-sm tracking-wider"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-[#1a73e8]" /> Output Mode
            </h3>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => file && setSplitMode('extract')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'extract'
                    ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-2xs'
                    : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${splitMode === 'extract' ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-bold ${splitMode === 'extract' ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>Single PDF Document</p>
                  <p className="text-[11px] text-[#5f6368] mt-0.5">Extract selected pages into one continuous PDF file.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => file && setSplitMode('split')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'split'
                    ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-2xs'
                    : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${splitMode === 'split' ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                  <Scissors size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-bold ${splitMode === 'split' ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>Individual PDFs (ZIP)</p>
                  <p className="text-[11px] text-[#5f6368] mt-0.5">Split each page into a separate file in a ZIP archive.</p>
                </div>
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#5f6368] pt-3 border-t border-[#dadce0]">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>Creates a clean PDF containing only selected pages.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>100% private in-browser extraction.</p>
              </div>
            </div>

            {/* Split Action Button */}
            <div className="pt-2 border-t border-[#dadce0]">
              <button 
                onClick={handleSplit}
                disabled={!file || selectedPages.length === 0 || isProcessing}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing PDF...
                  </>
                ) : (
                  <>
                    <Scissors size={16} />
                    <span>
                      {!file 
                        ? 'Upload a PDF' 
                        : selectedPages.length === 0 
                          ? 'Select Pages Above' 
                          : splitMode === 'split' 
                            ? `Split into ${selectedPages.length} PDFs (ZIP)` 
                            : `Extract ${selectedPages.length} Pages`
                      }
                    </span>
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

export default PdfSplit;
