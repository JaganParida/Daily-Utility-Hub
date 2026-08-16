import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, X, 
  CheckCircle2, Sparkles, Image as ImageIcon, Check,
  Layers, Sliders, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const TARGET_FORMATS = [
  { id: 'png',  label: 'PNG Image',  ext: 'png',  badge: 'Lossless', desc: 'Maximum crispness & sharp text' },
  { id: 'jpg',  label: 'JPG Photo',  ext: 'jpg',  badge: 'Compact',  desc: 'Optimized for photos & email' },
  { id: 'webp', label: 'WEBP Image', ext: 'webp', badge: 'Modern',   desc: 'Ultra-small modern web format' },
];

const DPI_PRESETS = [
  { scale: 1.0, label: 'Standard (72 DPI)',   desc: 'Fastest render' },
  { scale: 1.5, label: 'High Res (150 DPI)',  desc: 'Recommended', isRecommended: true },
  { scale: 2.5, label: 'Ultra HD (300 DPI)',  desc: 'Print-grade crispness' },
];

const PdfConverter = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadFile(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState([]); // [{ pageNum, url }]
  const [targetFormat, setTargetFormat] = useState('png');
  const [imgQuality, setImgQuality] = useState(1.5);

  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      loadFile(dropped);
    } else {
      toast.error('Only PDF documents are supported.');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected?.type === 'application/pdf') {
      loadFile(selected);
    }
  };

  const loadFile = async (selectedFile) => {
    setIsInspecting(true);
    setPageThumbnails([]);
    const toastId = toast.loading('Reading PDF document structure...');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setFile(selectedFile);

      // Render thumbnail previews
      const thumbs = [];
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 12); pageNum++) {
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

      toast.success(`PDF Loaded: ${pdf.numPages} pages detected`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF.', { id: toastId });
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDownloadSinglePage = async (pageNum) => {
    if (!pdfDoc) return;
    const toastId = toast.loading(`Rendering page ${pageNum} in high resolution...`);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: imgQuality });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      let mimeType = 'image/png';
      if (targetFormat === 'jpg') mimeType = 'image/jpeg';
      if (targetFormat === 'webp') mimeType = 'image/webp';

      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${file.name.replace('.pdf', '')}_page_${pageNum}.${targetFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloaded Page ${pageNum}!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export single page.', { id: toastId });
    }
  };

  const handleConvertAll = async () => {
    if (!file || !pdfDoc) return;
    setIsProcessing(true);
    setProgress(5);
    const toastId = toast.loading(`Converting all ${totalPages} pages to ${targetFormat.toUpperCase()}...`);

    try {
      const zip = new JSZip();
      let mimeType = 'image/png';
      if (targetFormat === 'jpg') mimeType = 'image/jpeg';
      if (targetFormat === 'webp') mimeType = 'image/webp';

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(Math.round((pageNum / totalPages) * 85));
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: imgQuality });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        const base64 = dataUrl.split(',')[1];
        const baseName = file.name.replace('.pdf', '');
        zip.file(`${baseName}_page_${pageNum}.${targetFormat}`, base64, { base64: true });
      }

      setProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const filename = `${file.name.replace('.pdf', '')}_${targetFormat.toUpperCase()}_images.zip`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Converted ${totalPages} pages into ZIP!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert PDF to images.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setPageThumbnails([]);
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF to High-Res Image Converter"
        description="Convert every PDF page into crystal-clear PNG, JPG, or WEBP images with custom DPI scaling."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Multi-DPI Scaling"
        extraBadge="PNG • JPG • WEBP"
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
                {isInspecting ? <Loader2 size={36} className="animate-spin" /> : <ImageIcon size={36} />}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                {isInspecting ? 'Parsing PDF Document...' : 'Select PDF to Convert to Images'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. High-speed client-side rendering.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  Up to 300 DPI Ultra HD
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  100% In-Browser Privacy
                </span>
              </div>
            </div>
          ) : (
            /* Active PDF Studio Layout */
            <div className="tool-card p-4 sm:p-6 space-y-5">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>{totalPages} Pages Ready</span>
                  </div>
                  <span className="text-xs text-[#5f6368] hidden sm:inline">&bull; {file.name}</span>
                </div>

                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="btn-google-secondary text-xs py-1.5 px-3"
                >
                  <X size={14} /> Change PDF
                </button>
              </div>

              {/* Page Thumbnails Preview Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#5f6368]">
                  <span>Page Preview Gallery</span>
                  <span>Click page to download individually</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 custom-scrollbar max-h-[55vh] overflow-y-auto p-1">
                  {pageThumbnails.map((thumb) => (
                    <div
                      key={thumb.pageNum}
                      className="group relative bg-[#f8f9fa] border border-[#dadce0] hover:border-[#1a73e8] rounded-2xl p-2 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md"
                    >
                      <div className="absolute top-3 left-3 z-10 bg-[#202124]/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        Page {thumb.pageNum}
                      </div>

                      <div className="w-full aspect-[3/4] bg-white rounded-xl border border-[#dadce0] overflow-hidden flex items-center justify-center relative shadow-inner mb-2">
                        <img 
                          src={thumb.url} 
                          alt={`Page ${thumb.pageNum}`}
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                      </div>

                      <button
                        onClick={() => handleDownloadSinglePage(thumb.pageNum)}
                        disabled={isProcessing}
                        className="w-full btn-google-secondary text-[11px] py-1 justify-center"
                      >
                        <Download size={12} /> Save Page {thumb.pageNum}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Settings Studio Panel */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Sliders size={15} className="text-[#1a73e8]" /> Image Export Settings
            </h3>

            {/* 1. Target Format Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Image Format</label>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      targetFormat === fmt.id
                        ? 'bg-[#e8f0fe] border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-2xs'
                        : 'bg-white border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    <span className={`text-xs font-extrabold uppercase ${targetFormat === fmt.id ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>
                      {fmt.ext}
                    </span>
                    <span className="text-[10px] font-bold text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded-md">
                      {fmt.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Resolution & DPI Selector */}
            <div className="space-y-2 pt-2 border-t border-[#dadce0]">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Render Resolution / DPI</label>
              <div className="space-y-2">
                {DPI_PRESETS.map(preset => (
                  <button
                    key={preset.scale}
                    type="button"
                    onClick={() => setImgQuality(preset.scale)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      imgQuality === preset.scale
                        ? 'bg-[#e8f0fe] border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-2xs'
                        : 'bg-white border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${imgQuality === preset.scale ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-[#5f6368]">{preset.desc}</span>
                    </div>

                    {imgQuality === preset.scale && (
                      <Check size={16} className="text-[#1a73e8]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {file && (
              <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs space-y-2">
                <div className="flex justify-between text-[#5f6368]">
                  <span>Total Output:</span>
                  <span className="font-bold text-[#202124]">{totalPages} Images ({targetFormat.toUpperCase()})</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Output Package:</span>
                  <span className="font-bold text-[#1a73e8]">ZIP Archive</span>
                </div>
              </div>
            )}

            {/* Export CTA Button */}
            <div className="pt-2 border-t border-[#dadce0]">
              <button
                onClick={handleConvertAll}
                disabled={isProcessing || !file}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Rendering ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Convert & Download All ({totalPages} Pages)</span>
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

export default PdfConverter;
