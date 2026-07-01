import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Scissors, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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
  const [pages, setPages] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const inspectFile = async (selectedFile) => {
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF properties...');
    try {
      const { data } = await axios.post('http://localhost:5000/api/pdf/inspect', formData);
      setIsInspecting(false);
      
      if (data.isEncrypted) {
        toast.error('This PDF is encrypted. Please decrypt (unlock) it first.', { id: toastId });
        return;
      }
      
      setFile(selectedFile);
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

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Extracting PDF pages securely...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/split', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_extracted.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Pages extracted successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const backendMsg = error.response?.data?.message || 'Failed to extract pages.';
      toast.error(backendMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Scissors size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Extract & Split PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visually select pages or ranges to extract into a clean new document.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Main Work Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* File Upload Dropzone */}
          {!file && (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !isInspecting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-card hover:border-blue-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 pointer-events-none">
                {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">
                {isInspecting ? 'Parsing PDF File...' : 'Upload PDF'}
              </h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                {isInspecting ? 'Please wait while we read metadata.' : 'Drag & drop a PDF here or click to browse.'}
              </p>
            </div>
          )}

          {/* Active File and Controls */}
          {file && (
            <>
              {/* File Info Header */}
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg truncate max-w-md">{file.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB &bull; {totalPages} Pages
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setTotalPages(0); setSelectedPages([]); setPages(''); }} 
                  className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Change File
                </button>
              </div>

              {/* Grid Page Selector */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col flex-1 min-h-[350px] overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Pages to Extract</h3>
                    <p className="text-xs text-muted-foreground mt-1">Click individual pages or select presets below</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => selectPreset('all')} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium">All</button>
                    <button onClick={() => selectPreset('odd')} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium">Odds</button>
                    <button onClick={() => selectPreset('even')} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium">Evens</button>
                    <button onClick={() => selectPreset('first5')} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium">First 5</button>
                  </div>
                </div>

                {/* The Page Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-1 min-h-[150px]">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const isSelected = selectedPages.includes(page);
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl font-mono text-sm border font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20 scale-105'
                            : 'bg-background hover:bg-muted border-border text-foreground'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Range Input Field */}
                <div className="border-t border-border pt-4 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manual Page Selection</label>
                    <span className="group relative cursor-help text-blue-500">
                      <HelpCircle size={14} />
                      <div className="absolute bottom-full mb-2 left-0 w-64 p-3 bg-foreground text-background text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        Valid formats: "1-5", "8,11,13", or combinations like "1-3, 5, 8".
                      </div>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={pages}
                    onChange={(e) => handlePagesInputChange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono tracking-widest"
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* Sidebar Actions */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Split details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Creates a brand-new PDF containing only the pages you want.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Quick presets help you easily isolate even/odd/specific pages.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Processed securely; we delete all files after splitting.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSplit}
            disabled={!file || selectedPages.length === 0 || isProcessing}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scissors size={18} />
            {isProcessing ? 'Extracting...' : `Extract ${selectedPages.length} Pages`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfSplit;
