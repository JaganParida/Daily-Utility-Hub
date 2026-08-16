import React, { useState, useEffect, useRef } from 'react';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, Download, Loader2, Trash2, ArrowUp, ArrowDown, 
  RotateCw, Plus, Image as ImageIcon, CheckCircle2, 
  Settings2, Sparkles, Layers, Sliders, RefreshCw, Copy, 
  Check, ArrowRight, LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { toast } from 'react-hot-toast';

const PAGE_SIZES = [
  { id: 'a4',      name: 'A4 (210 × 297 mm)',       desc: 'Standard Document' },
  { id: 'letter',  name: 'US Letter (8.5 × 11 in)',  desc: 'US Standard' },
  { id: 'legal',   name: 'Legal (8.5 × 14 in)',      desc: 'Extended' },
  { id: 'a3',      name: 'A3 (297 × 420 mm)',       desc: 'Large Poster' },
  { id: 'a5',      name: 'A5 (148 × 210 mm)',       desc: 'Booklet' },
  { id: 'fit',     name: 'Fit to Image Size',        desc: 'No Borders' },
];

const MARGIN_PRESETS = [
  { id: 'none',   label: 'No Margin', mm: 0 },
  { id: 'small',  label: 'Small',     mm: 5 },
  { id: 'normal', label: 'Standard',  mm: 10 },
  { id: 'large',  label: 'Large',     mm: 20 },
];

const ImageToPdf = () => {
  const [images, setImages] = useState([]); // [{ id, file, url, rotation }]
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [pdfOrientation, setPdfOrientation] = useState('p'); // 'p' portrait, 'l' landscape
  const [pageSize, setPageSize] = useState('a4');
  const [margin, setMargin] = useState(10);
  const [exportMode, setExportMode] = useState('combined'); // 'combined' | 'separate'
  const [imageQuality, setImageQuality] = useState('high'); // 'original' | 'high' | 'compressed'

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => images.forEach(img => URL.revokeObjectURL(img.url));
  }, []);

  const addFiles = (files) => {
    if (!files || !files.length) return;
    const newItems = Array.from(files).filter(f => f.type.startsWith('image/')).map((file, idx) => ({
      id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      file,
      url: URL.createObjectURL(file),
      rotation: 0
    }));

    if (newItems.length === 0) {
      toast.error('Please upload valid image files (JPG, PNG, WEBP, etc.)');
      return;
    }

    setImages(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
    toast.success(`Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}`);
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
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id) => {
    setImages(prev => {
      const item = prev.find(img => img.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(img => img.id !== id);
    });
    setDownloadUrl(null);
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, rotation: (img.rotation + 90) % 360 };
      }
      return img;
    }));
  };

  const duplicateImage = (id) => {
    const idx = images.findIndex(img => img.id === id);
    if (idx === -1) return;
    const target = images[idx];
    const newImg = {
      ...target,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: target.url // same blob
    };
    const next = [...images];
    next.splice(idx + 1, 0, newImg);
    setImages(next);
    toast.success('Page duplicated');
  };

  const moveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    setImages(prev => {
      const n = [...prev];
      const [moved] = n.splice(fromIdx, 1);
      n.splice(toIdx, 0, moved);
      return n;
    });
  };

  const rotateAll = () => {
    setImages(prev => prev.map(img => ({ ...img, rotation: (img.rotation + 90) % 360 })));
    toast.success('All pages rotated 90°');
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setDownloadUrl(null);
    toast.info('Cleared all images');
  };

  // Helper to load image onto a canvas with rotation applied
  const getProcessedCanvas = (imgObj) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const rot = imgObj.rotation % 360;
        const isOrthogonal = rot === 90 || rot === 270;
        
        canvas.width = isOrthogonal ? image.height : image.width;
        canvas.height = isOrthogonal ? image.width : image.height;
        
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        
        const qualityVal = imageQuality === 'compressed' ? 0.75 : imageQuality === 'high' ? 0.92 : 1.0;
        const dataUrl = canvas.toDataURL('image/jpeg', qualityVal);
        resolve({ dataUrl, width: canvas.width, height: canvas.height });
      };
      image.onerror = reject;
      image.src = imgObj.url;
    });
  };

  const handleConvert = async () => {
    if (!images.length) return;
    setIsProcessing(true);
    setProgress(5);
    const toastId = toast.loading('Converting images to PDF document...');

    try {
      if (exportMode === 'combined') {
        let doc = null;

        for (let i = 0; i < images.length; i++) {
          setProgress(Math.round(((i + 1) / images.length) * 85));
          const { dataUrl, width, height } = await getProcessedCanvas(images[i]);

          let pFormat = pageSize;
          let pOrient = pdfOrientation;
          let pageW, pageH;

          if (pageSize === 'fit') {
            pFormat = [width * 0.264583, height * 0.264583]; // px to mm
            pOrient = width > height ? 'l' : 'p';
          }

          if (i === 0) {
            doc = new jsPDF(pOrient, 'mm', pFormat);
          } else {
            doc.addPage(pFormat, pOrient);
          }

          pageW = doc.internal.pageSize.getWidth();
          pageH = doc.internal.pageSize.getHeight();

          const currentMargin = pageSize === 'fit' ? 0 : margin;
          const usableW = pageW - currentMargin * 2;
          const usableH = pageH - currentMargin * 2;

          const imgRatio = width / height;
          const pageRatio = usableW / usableH;
          let finalW = usableW;
          let finalH = usableH;

          if (imgRatio > pageRatio) {
            finalH = usableW / imgRatio;
          } else {
            finalW = usableH * imgRatio;
          }

          const x = currentMargin + (usableW - finalW) / 2;
          const y = currentMargin + (usableH - finalH) / 2;

          doc.addImage(dataUrl, 'JPEG', x, y, finalW, finalH);
        }

        setProgress(100);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const filename = `images_converted_${Date.now()}.pdf`;

        setDownloadUrl(url);
        setDownloadFileName(filename);
        toast.success('PDF document compiled successfully!', { id: toastId });

        // Auto trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Individual PDFs in ZIP
        const zip = new JSZip();

        for (let i = 0; i < images.length; i++) {
          setProgress(Math.round(((i + 1) / images.length) * 85));
          const { dataUrl, width, height } = await getProcessedCanvas(images[i]);

          let pFormat = pageSize;
          let pOrient = pdfOrientation;
          if (pageSize === 'fit') {
            pFormat = [width * 0.264583, height * 0.264583];
            pOrient = width > height ? 'l' : 'p';
          }

          const singleDoc = new jsPDF(pOrient, 'mm', pFormat);
          const pageW = singleDoc.internal.pageSize.getWidth();
          const pageH = singleDoc.internal.pageSize.getHeight();

          const currentMargin = pageSize === 'fit' ? 0 : margin;
          const usableW = pageW - currentMargin * 2;
          const usableH = pageH - currentMargin * 2;

          const imgRatio = width / height;
          const pageRatio = usableW / usableH;
          let finalW = usableW;
          let finalH = usableH;

          if (imgRatio > pageRatio) {
            finalH = usableW / imgRatio;
          } else {
            finalW = usableH * imgRatio;
          }

          const x = currentMargin + (usableW - finalW) / 2;
          const y = currentMargin + (usableH - finalH) / 2;

          singleDoc.addImage(dataUrl, 'JPEG', x, y, finalW, finalH);
          const pdfBytes = singleDoc.output('arraybuffer');
          const originalBase = images[i].file.name.substring(0, images[i].file.name.lastIndexOf('.')) || `page_${i + 1}`;
          zip.file(`${originalBase}.pdf`, pdfBytes);
        }

        setProgress(100);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const filename = `images_pdf_archive_${Date.now()}.zip`;

        setDownloadUrl(url);
        setDownloadFileName(filename);
        toast.success('All individual PDFs bundled in ZIP!', { id: toastId });

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert images to PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasImages = images.length > 0;

  return (
    <div className="tool-page-container">
      {/* Header */}
      <ToolHeader
        title="Advanced Image to PDF Converter"
        description="Convert JPG, PNG, WEBP, and photos into polished, printable PDF documents with custom layout, margins, and orientation."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Direct PDF Engine"
        extraBadge="Multi-Image Batch"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area: Grid of Images or Dropzone */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {!hasImages ? (
            /* Big Hero Dropzone */
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
                onChange={(e) => addFiles(e.target.files)} 
                className="hidden" 
                accept="image/*" 
                multiple 
              />
              <div className="w-20 h-20 bg-[#e8f0fe] border border-[#d2e3fc] rounded-3xl flex items-center justify-center text-[#1a73e8] mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                <ImageIcon size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select Images to Convert
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop image files here, or <span className="text-[#1a73e8] font-bold underline">choose from your device</span>. JPG, PNG, WEBP, and BMP supported.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#f1f3f4] text-[#5f6368] text-xs font-semibold rounded-full border border-[#dadce0]">
                  JPG &bull; PNG &bull; WEBP
                </span>
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  100% Private In-Browser
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  No Size Limit
                </span>
              </div>
            </div>
          ) : (
            /* Interactive Visual Page Gallery */
            <div className="tool-card p-4 sm:p-6 space-y-5">
              
              {/* Studio Gallery Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>{images.length} Page{images.length > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-[#5f6368] hidden sm:inline">
                    Drag tiles to reorder &bull; Click rotate to adjust orientation
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={rotateAll}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                    title="Rotate all images 90 degrees"
                  >
                    <RotateCw size={13} /> Rotate All
                  </button>
                  <button
                    onClick={() => addMoreInputRef.current?.click()}
                    className="btn-google-primary text-xs py-1.5 px-3 shadow-2xs"
                  >
                    <Plus size={14} /> Add More
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors cursor-pointer"
                    title="Clear all pages"
                  >
                    <Trash2 size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={addMoreInputRef} 
                    onChange={(e) => addFiles(e.target.files)} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                  />
                </div>
              </div>

              {/* Page Grid Tiles (iLovePDF Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 custom-scrollbar max-h-[65vh] overflow-y-auto p-1">
                {images.map((img, idx) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-[#f8f9fa] border border-[#dadce0] hover:border-[#1a73e8] rounded-2xl p-2 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md"
                  >
                    {/* Page Index Badge */}
                    <div className="absolute top-3 left-3 z-10 bg-[#202124]/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
                      Page {idx + 1}
                    </div>

                    {/* Quick Action Overlay (Hover / Touch) */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => rotateImage(img.id)}
                        className="p-1.5 bg-white/90 hover:bg-[#1a73e8] text-[#202124] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
                        title="Rotate 90°"
                      >
                        <RotateCw size={13} />
                      </button>
                      <button
                        onClick={() => duplicateImage(img.id)}
                        className="p-1.5 bg-white/90 hover:bg-[#1a73e8] text-[#202124] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
                        title="Duplicate Page"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-white/90 hover:bg-[#d93025] text-[#d93025] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
                        title="Delete Page"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Image Preview Canvas Box */}
                    <div className="w-full aspect-[3/4] bg-white rounded-xl border border-[#dadce0] overflow-hidden flex items-center justify-center relative shadow-inner mb-2">
                      <img 
                        src={img.url} 
                        alt={`Page ${idx + 1}`}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 pointer-events-none"
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                      />
                    </div>

                    {/* Footer: Filename + Move Controls */}
                    <div className="flex items-center justify-between gap-1 pt-1 px-1 border-t border-[#dadce0]/60">
                      <p className="text-[11px] font-semibold text-[#202124] truncate flex-1" title={img.file.name}>
                        {img.file.name}
                      </p>
                      
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => moveImage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 text-[#5f6368] hover:text-[#202124] disabled:opacity-20 cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowUp size={12} className="-rotate-90" />
                        </button>
                        <button
                          onClick={() => moveImage(idx, idx + 1)}
                          disabled={idx === images.length - 1}
                          className="p-1 text-[#5f6368] hover:text-[#202124] disabled:opacity-20 cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowDown size={12} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add More Tile */}
                <div
                  onClick={() => addMoreInputRef.current?.click()}
                  className="aspect-[3/4] border-2 border-dashed border-[#c2d7fb] hover:border-[#1a73e8] bg-white hover:bg-[#f8fbff] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                  <span className="text-xs font-bold text-[#1a73e8]">Add More</span>
                  <span className="text-[10px] text-[#5f6368]">Images</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Settings Studio Panel */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!hasImages ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Settings2 size={15} className="text-[#1a73e8]" /> Document Settings
            </h3>

            {/* 1. Page Orientation Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Orientation</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPdfOrientation('p')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pdfOrientation === 'p'
                      ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] font-bold shadow-2xs ring-2 ring-[#1a73e8]/20'
                      : 'bg-white border-[#dadce0] text-[#5f6368] hover:border-[#1a73e8]'
                  }`}
                >
                  <div className="w-6 h-8 border-2 border-current rounded-xs" />
                  <span className="text-xs">Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPdfOrientation('l')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pdfOrientation === 'l'
                      ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] font-bold shadow-2xs ring-2 ring-[#1a73e8]/20'
                      : 'bg-white border-[#dadce0] text-[#5f6368] hover:border-[#1a73e8]'
                  }`}
                >
                  <div className="w-8 h-6 border-2 border-current rounded-xs" />
                  <span className="text-xs">Landscape</span>
                </button>
              </div>
            </div>

            {/* 2. Paper Size Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="google-select w-full text-xs font-semibold"
              >
                {PAGE_SIZES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Margin Presets + Slider */}
            <div className="space-y-2 pt-2 border-t border-[#dadce0]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">Page Margins</label>
                <span className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-md border border-[#d2e3fc]">
                  {margin} mm
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {MARGIN_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMargin(p.mm)}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      margin === p.mm
                        ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-2xs'
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0"
                max="40"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none bg-[#e8eaed] accent-[#1a73e8] mt-1"
              />
            </div>

            {/* 4. Output Mode */}
            <div className="space-y-1.5 pt-2 border-t border-[#dadce0]">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Document Output</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportMode('combined')}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    exportMode === 'combined'
                      ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                      : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                  }`}
                >
                  Single PDF
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('separate')}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    exportMode === 'separate'
                      ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                      : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                  }`}
                >
                  Separate PDFs (ZIP)
                </button>
              </div>
            </div>

            {/* Document Summary Info */}
            <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs space-y-1.5">
              <div className="flex justify-between text-[#5f6368]">
                <span>Total Images:</span>
                <span className="font-bold text-[#202124]">{images.length} pages</span>
              </div>
              <div className="flex justify-between text-[#5f6368]">
                <span>Target Document:</span>
                <span className="font-bold text-[#202124]">{pageSize.toUpperCase()} ({pdfOrientation === 'p' ? 'Portrait' : 'Landscape'})</span>
              </div>
            </div>

            {/* Convert CTA Action */}
            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleConvert}
                disabled={isProcessing || !hasImages}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Compiling PDF ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Convert to PDF &bull; {images.length} Page{images.length > 1 ? 's' : ''}</span>
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
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ImageToPdf;
