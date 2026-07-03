import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Scissors, HelpCircle, Loader2, Eye, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

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
  };

  const inspectFile = async (selectedFile) => {
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF properties...');
    try {
      const { data } = await api.post('/pdf/inspect', formData);
      setIsInspecting(false);
      
      if (data.isEncrypted) {
        toast.error('This PDF is encrypted. Please decrypt (unlock) it first.', { id: toastId });
        return;
      }
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setTotalPages(data.pageCount);
      // Select all pages by default
      const allPages = Array.from({ length: data.pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);
      setPages(numbersToRangeString(allPages));
      toast.success(`PDF loaded: ${data.pageCount} pages detected`, { id: toastId });
    } catch (e) {
      setIsInspecting(false);
      console.error(e);
      toast.error('Failed to parse PDF file.', { id: toastId });
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

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('pages', pages);
    formData.append('mode', splitMode);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading(splitMode === 'split' ? 'Splitting PDF into separate pages...' : 'Extracting PDF pages securely...');
      
      const response = await api.post('/pdf/split', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = splitMode === 'split' ? '.zip' : '.pdf';
      const fileSuffix = splitMode === 'split' ? '_split' : '_extracted';
      link.setAttribute('download', `${file.name.replace('.pdf', '')}${fileSuffix}${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(splitMode === 'split' ? 'PDF split into separate files!' : 'Pages extracted successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const backendMsg = error.response?.data?.message || 'Failed to process PDF.';
      toast.error(backendMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header Container */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Scissors size={24} className="transform -rotate-45" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground flex items-center gap-2">
            Extract & Split PDF
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider">Premium</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Visually select pages or ranges to extract or split into clean, new documents.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Main Work Area */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
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
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px]
                    ${isDragging 
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
                
                {/* Glow effect on drag */}
                <div className={`absolute inset-0 bg-primary/5 blur-3xl transition-opacity duration-300 pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 
                    ${isDragging || isInspecting 
                      ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' 
                      : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isInspecting ? (
                      <Loader2 size={32} className="animate-spin" />
                    ) : (
                      <UploadCloud size={32} className={isDragging ? 'animate-bounce' : ''} />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {isInspecting ? 'Parsing PDF File...' : 'Upload PDF'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {isInspecting 
                      ? 'Please wait while we securely read the document metadata.' 
                      : 'Drag & drop your PDF file here, or click to browse files from your computer.'}
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
                <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6">
                  {/* Card header with divider */}
                  <div className="border-b border-border/80 pb-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Source Document</h3>
                        <p className="text-xs text-muted-foreground">Select pages and configure extraction</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3.5 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5 border border-border/60 hover:border-primary/30"
                      >
                        <Eye size={14} className={showPreview ? 'text-primary' : 'text-muted-foreground'} />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                      <button 
                        onClick={handleClear} 
                        className="text-xs text-red-400 hover:bg-red-500/10 px-3.5 py-2 rounded-xl transition-all font-semibold border border-red-500/20"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* File Metadata Details */}
                  <div className="flex items-center gap-4 min-w-0 w-full">
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground text-base truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Size: <span className="font-medium text-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="mx-2">&bull;</span>
                        Pages: <span className="font-medium text-foreground">{totalPages}</span>
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
                        <div className="border-t border-border/80 pt-5 mt-5 w-full flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Document Preview
                            </h4>
                            <a 
                              href={previewUrl} target="_blank" rel="noreferrer"
                              className="text-xs text-primary hover:text-indigo-400 hover:underline flex items-center gap-1.5 font-semibold"
                            >
                              Open in New Tab <ExternalLink size={12} />
                            </a>
                          </div>
                          <div className="w-full h-[400px] md:h-[500px] border border-border/85 rounded-xl overflow-hidden bg-muted/5 relative">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Grid Page Selector */}
                <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
                  {/* Card Header with presets */}
                  <div className="border-b border-border/80 pb-3 mb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Pages to Extract</h3>
                      <p className="text-xs text-muted-foreground mt-1">Select pages manually or use our preset toggles.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => selectPreset('all')} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/20 hover:text-primary text-foreground rounded-lg transition-all font-semibold">All</button>
                      <button onClick={() => selectPreset('odd')} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/20 hover:text-primary text-foreground rounded-lg transition-all font-semibold">Odds</button>
                      <button onClick={() => selectPreset('even')} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/20 hover:text-primary text-foreground rounded-lg transition-all font-semibold">Evens</button>
                      <button onClick={() => selectPreset('first5')} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/20 hover:text-primary text-foreground rounded-lg transition-all font-semibold">First 5</button>
                    </div>
                  </div>

                  {/* Page Grid */}
                  <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar pr-2 mb-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-1 min-h-[150px]">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const isSelected = selectedPages.includes(page);
                      return (
                        <motion.button
                          key={page}
                          onClick={() => handlePageClick(page)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl font-mono text-sm border font-bold transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                              : 'bg-background hover:bg-muted border-border text-foreground hover:border-primary/45'
                          }`}
                        >
                          {page}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Manual Range Selector */}
                  <div className="border-t border-border/80 pt-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        Manual Page Selection
                      </label>
                      <div className="relative group cursor-help text-primary hover:text-indigo-400 transition-colors">
                        <HelpCircle size={14} />
                        {/* Custom tooltip that opens on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-card border border-border/80 text-foreground text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                          <p className="font-semibold mb-1 text-primary">Formatting Examples:</p>
                          <p className="text-muted-foreground leading-relaxed">
                            • Page range: <code className="font-mono text-primary bg-primary/5 px-1 rounded">1-5</code><br />
                            • Specific pages: <code className="font-mono text-primary bg-primary/5 px-1 rounded">2, 4, 8</code><br />
                            • Combination: <code className="font-mono text-primary bg-primary/5 px-1 rounded">1-3, 6, 8-10</code>
                          </p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => handlePagesInputChange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8"
                      className="w-full bg-background border border-border/80 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-mono tracking-wider transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          {/* Output Format Card */}
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2 border-b border-border pb-3">
              <Sparkles size={16} /> Output Format
            </h3>

            <div className="flex flex-col gap-3">
              <motion.div
                whileHover={file ? { scale: 1.01 } : {}}
                onClick={() => file && setSplitMode('extract')}
                className={`flex items-start gap-3 p-4 bg-muted/10 border rounded-xl transition-all duration-200
                  ${!file ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${file && splitMode === 'extract'
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : 'border-border/80 hover:border-primary/30 hover:bg-muted/20'
                  }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 
                  ${file && splitMode === 'extract' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Single PDF Document</p>
                    {file && splitMode === 'extract' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Extract selected pages into one continuous PDF file.</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={file ? { scale: 1.01 } : {}}
                onClick={() => file && setSplitMode('split')}
                className={`flex items-start gap-3 p-4 bg-muted/10 border rounded-xl transition-all duration-200
                  ${!file ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${file && splitMode === 'split'
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : 'border-border/80 hover:border-primary/30 hover:bg-muted/20'
                  }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 
                  ${file && splitMode === 'split' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  <Scissors size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Separate PDFs (ZIP)</p>
                    {file && splitMode === 'split' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 text-balance">Split each selected page into its own individual file, packaged in a ZIP archive.</p>
                </div>
              </motion.div>
            </div>

            {/* Split Details Benefits */}
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary" /> Processing details
              </h4>
              <div className="space-y-3.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={14} />
                  <p>Creates a brand-new PDF containing only the pages you want.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={14} />
                  <p>Quick presets help you easily isolate even/odd/specific pages.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={14} />
                  <p>Processed securely; we delete all files after splitting.</p>
                </div>
              </div>
            </div>

            </div>

            {/* Split Action Button */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSplit}
                disabled={!file || selectedPages.length === 0 || isProcessing}
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
                      Processing PDF...
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
                      <Scissors size={20} />
                      <span>
                        {!file 
                          ? 'Upload a PDF' 
                          : selectedPages.length === 0 
                            ? 'Select Pages' 
                            : splitMode === 'split' 
                              ? `Split into ${selectedPages.length} PDFs` 
                              : `Extract ${selectedPages.length} Pages`
                        }
                      </span>
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

export default PdfSplit;
