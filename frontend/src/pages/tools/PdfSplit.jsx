import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, Scissors, 
  CheckCircle2, Sparkles, RefreshCw, X, Check, Eye, 
  Grid, Layers, Filter, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const numbersToRangeString = (nums) => {
  if (!nums || nums.length === 0) return '';
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
  const [totalPages, setTotalPages] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState([]); // [{ pageNum, url }]
  const [selectedPages, setSelectedPages] = useState([]);
  const [rangeInput, setRangeInput] = useState('');
  const [splitMode, setSplitMode] = useState('extract'); // 'extract' (1 merged PDF) | 'split' (ZIP of single pages)
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');

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
    setIsInspecting(true);
    setDownloadUrl(null);
    setPageThumbnails([]);
    const toastId = toast.loading('Rendering PDF pages for visual selection...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setFile(selectedFile);

      // Select all by default
      const allNums = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      setSelectedPages(allNums);
      setRangeInput(numbersToRangeString(allNums));

      // Render thumbnails for each page (capped render scale for speed)
      const thumbs = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push({ pageNum, url: canvas.toDataURL() });
      }

      setPageThumbnails(thumbs);
      toast.success(`Loaded ${pdf.numPages} pages ready for extraction`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF. Protected or corrupted documents cannot be split.', { id: toastId });
    } finally {
      setIsInspecting(false);
    }
  };

  const togglePageSelection = (pageNum) => {
    let next;
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter(p => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setRangeInput(numbersToRangeString(next));
  };

  const handleRangeInputChange = (val) => {
    setRangeInput(val);
    const parsed = parseRangeString(val, totalPages);
    setSelectedPages(parsed);
  };

  const selectAll = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(numbersToRangeString(all));
  };

  const selectOdds = () => {
    const odds = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 !== 0);
    setSelectedPages(odds);
    setRangeInput(numbersToRangeString(odds));
  };

  const selectEvens = () => {
    const evens = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
    setSelectedPages(evens);
    setRangeInput(numbersToRangeString(evens));
  };

  const clearSelection = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleSplit = async () => {
    if (!file || selectedPages.length === 0) {
      toast.error('Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    const toastId = toast.loading('Extracting selected PDF pages...');

    try {
      await new Promise(r => setTimeout(r, 100));
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      const sortedIndices = [...selectedPages].sort((a, b) => a - b).map(p => p - 1);

      if (splitMode === 'extract') {
        // Mode 1: Combine selected pages into 1 single PDF
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, sortedIndices);
        copiedPages.forEach(p => newDoc.addPage(p));

        setProgress(90);
        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const filename = `${file.name.replace('.pdf', '')}_extracted_${selectedPages.length}pages.pdf`;

        setDownloadUrl(url);
        setDownloadFileName(filename);
        toast.success(`Extracted ${selectedPages.length} pages into 1 PDF!`, { id: toastId });

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Mode 2: Split every selected page into individual single-page PDFs in a ZIP
        const zip = new JSZip();

        for (let i = 0; i < sortedIndices.length; i++) {
          setProgress(Math.round(((i + 1) / sortedIndices.length) * 85));
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [sortedIndices[i]]);
          singleDoc.addPage(copiedPage);

          const singleBytes = await singleDoc.save();
          const pageActualNum = sortedIndices[i] + 1;
          const baseName = file.name.replace('.pdf', '');
          zip.file(`${baseName}_page_${pageActualNum}.pdf`, singleBytes);
        }

        setProgress(95);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const filename = `${file.name.replace('.pdf', '')}_split_pages.zip`;

        setDownloadUrl(url);
        setDownloadFileName(filename);
        toast.success(`Split ${selectedPages.length} pages into ZIP archive!`, { id: toastId });

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to split PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setTotalPages(0);
    setPageThumbnails([]);
    setSelectedPages([]);
    setRangeInput('');
    setDownloadUrl(null);
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="Split & Extract PDF Pages"
        description="Visually select and extract individual pages or custom ranges into a new document or individual files."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Visual Page Picker"
        extraBadge="Extract & Burst Modes"
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
              onClick={() => !isInspecting && fileInputRef.current?.click()}
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
                {isInspecting ? <Loader2 size={36} className="animate-spin" /> : <Scissors size={36} />}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                {isInspecting ? 'Parsing PDF Document...' : 'Select PDF to Split & Extract'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF document here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. Fast, private visual page extraction.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  Visual Page Thumbnails
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  100% In-Browser Privacy
                </span>
              </div>
            </div>
          ) : (
            /* Visual Page Studio Selection Layout */
            <div className="tool-card p-4 sm:p-6 space-y-5">
              
              {/* Studio Top Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Grid size={16} />
                    <span>{selectedPages.length} of {totalPages} Selected</span>
                  </div>
                </div>

                {/* Quick Selection Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={selectAll}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectOdds}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    Odd Pages
                  </button>
                  <button
                    onClick={selectEvens}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    Even Pages
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>

              {/* Range Expression Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0]">
                <span className="text-xs font-bold text-[#5f6368] uppercase tracking-wider shrink-0">
                  Page Range:
                </span>
                <input 
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeInputChange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 8-12"
                  className="google-input text-xs font-semibold py-1.5 px-3 flex-1 w-full"
                />
                <span className="text-[11px] text-[#5f6368] shrink-0 hidden md:inline">
                  Click thumbnails below to toggle
                </span>
              </div>

              {/* Visual Thumbnail Grid (iLovePDF caliber) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 custom-scrollbar max-h-[60vh] overflow-y-auto p-1">
                {pageThumbnails.map((thumb) => {
                  const isSelected = selectedPages.includes(thumb.pageNum);

                  return (
                    <div
                      key={thumb.pageNum}
                      onClick={() => togglePageSelection(thumb.pageNum)}
                      className={`group relative bg-[#f8f9fa] border-2 rounded-2xl p-2 flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                        isSelected 
                          ? 'border-[#1a73e8] bg-[#e8f0fe]/60 ring-2 ring-[#1a73e8]/25 scale-[1.01]' 
                          : 'border-[#dadce0] hover:border-[#1a73e8]/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox Badge */}
                      <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-lg flex items-center justify-center shadow-xs transition-colors ${
                        isSelected 
                          ? 'bg-[#1a73e8] text-white' 
                          : 'bg-white/90 border border-[#dadce0] text-transparent'
                      }`}>
                        <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                      </div>

                      {/* Page Number Tag */}
                      <div className="absolute top-3 left-3 z-10 bg-[#202124]/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        Page {thumb.pageNum}
                      </div>

                      {/* Thumbnail Container */}
                      <div className="w-full aspect-[3/4] bg-white rounded-xl border border-[#dadce0] overflow-hidden flex items-center justify-center relative shadow-inner mb-1.5">
                        <img 
                          src={thumb.url} 
                          alt={`Page ${thumb.pageNum}`}
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                      </div>

                      <div className="text-center pt-1 border-t border-[#dadce0]/50">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                          {isSelected ? '✓ Included' : 'Excluded'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar Cockpit */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Scissors size={15} className="text-[#1a73e8]" /> Split Mode Options
            </h3>

            {/* Split Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Extraction Mode</label>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSplitMode('extract')}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    splitMode === 'extract'
                      ? 'bg-[#e8f0fe] border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-2xs'
                      : 'bg-white border-[#dadce0] hover:border-[#1a73e8]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    splitMode === 'extract' ? 'border-[#1a73e8]' : 'border-[#dadce0]'
                  }`}>
                    {splitMode === 'extract' && <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Extract to 1 Combined PDF</h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">Merges all selected pages into a single new PDF document.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode('split')}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    splitMode === 'split'
                      ? 'bg-[#e8f0fe] border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-2xs'
                      : 'bg-white border-[#dadce0] hover:border-[#1a73e8]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    splitMode === 'split' ? 'border-[#1a73e8]' : 'border-[#dadce0]'
                  }`}>
                    {splitMode === 'split' && <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Split into Separate PDFs (ZIP)</h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">Creates individual 1-page PDF files bundled into a ZIP.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Document Stats */}
            {file && (
              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs space-y-2">
                <div className="flex justify-between text-[#5f6368]">
                  <span>Document:</span>
                  <span className="font-bold text-[#202124] truncate max-w-[160px]">{file.name}</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Selected Pages:</span>
                  <span className="font-bold text-[#1a73e8]">{selectedPages.length} of {totalPages}</span>
                </div>
              </div>
            )}

            {/* Split CTA Action */}
            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleSplit}
                disabled={isProcessing || !file || selectedPages.length === 0}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors size={18} />
                    <span>
                      {splitMode === 'extract' 
                        ? `Extract ${selectedPages.length} Pages (1 PDF)` 
                        : `Split ${selectedPages.length} Pages (ZIP)`
                      }
                    </span>
                  </>
                )}
              </button>

              {downloadUrl && !isProcessing && (
                <a
                  href={downloadUrl}
                  download={downloadFileName}
                  className="w-full btn-google-secondary text-xs py-2 justify-center border-[#34a853] text-[#137333] bg-[#e6f4ea] hover:bg-[#ceead6]"
                >
                  <CheckCircle2 size={14} className="text-[#34a853]" /> Download Again
                </a>
              )}

              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full btn-google-secondary text-xs py-2 justify-center"
                >
                  <X size={14} /> Change Document
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PdfSplit;
