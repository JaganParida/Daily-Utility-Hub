import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, X, 
  CheckCircle2, Sparkles, Sliders, Type, RotateCw, 
  Grid, Palette, Eye, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const COLOR_PALETTE = [
  { name: 'Red', hex: '#ea4335' },
  { name: 'Blue', hex: '#1a73e8' },
  { name: 'Green', hex: '#34a853' },
  { name: 'Yellow', hex: '#fbbc04' },
  { name: 'Charcoal', hex: '#3c4043' },
  { name: 'Gray', hex: '#80868b' }
];

const PRESET_TEXTS = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'APPROVED', 'DO NOT COPY'];

const POSITIONS = [
  { id: 'top-left',     label: 'Top Left',     gridClass: 'justify-start items-start' },
  { id: 'top-center',   label: 'Top Center',   gridClass: 'justify-center items-start' },
  { id: 'top-right',    label: 'Top Right',    gridClass: 'justify-end items-start' },
  { id: 'center-left',  label: 'Middle Left',  gridClass: 'justify-start items-center' },
  { id: 'center',       label: 'Center',       gridClass: 'justify-center items-center' },
  { id: 'center-right', label: 'Middle Right', gridClass: 'justify-end items-center' },
  { id: 'bottom-left',  label: 'Bottom Left',  gridClass: 'justify-start items-end' },
  { id: 'bottom-center',label: 'Bottom Center',gridClass: 'justify-center items-end' },
  { id: 'bottom-right', label: 'Bottom Right', gridClass: 'justify-end items-end' },
];

const PdfWatermark = () => {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [firstPageUrl, setFirstPageUrl] = useState(null);

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#ea4335');
  const [opacity, setOpacity] = useState(0.35);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState('center');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (firstPageUrl) URL.revokeObjectURL(firstPageUrl);
    };
  }, [downloadUrl, firstPageUrl]);

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

  const loadFile = async (f) => {
    setIsProcessing(true);
    setDownloadUrl(null);
    const toastId = toast.loading('Reading PDF document...');

    try {
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      setFile(f);

      // Render page 1
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 0.8 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page1.render({ canvasContext: ctx, viewport }).promise;
      setFirstPageUrl(canvas.toDataURL());

      toast.success(`PDF Loaded (${pdf.numPages} pages)`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF file.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setIsProcessing(true);
    const toastId = toast.loading('Stamping watermark across PDF pages...');

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const hexClean = color.replace('#', '');
      const r = parseInt(hexClean.substring(0, 2), 16) / 255;
      const g = parseInt(hexClean.substring(2, 4), 16) / 255;
      const b = parseInt(hexClean.substring(4, 6), 16) / 255;
      const stampColor = rgb(r, g, b);

      const textW = font.widthOfTextAtSize(watermarkText, fontSize);
      const textH = font.heightAtSize(fontSize);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        let x = (width - textW) / 2;
        let y = (height - textH) / 2;

        if (position === 'top-left') { x = 50; y = height - 50 - textH; }
        else if (position === 'top-center') { x = (width - textW) / 2; y = height - 50 - textH; }
        else if (position === 'top-right') { x = width - 50 - textW; y = height - 50 - textH; }
        else if (position === 'center-left') { x = 50; y = (height - textH) / 2; }
        else if (position === 'center-right') { x = width - 50 - textW; y = (height - textH) / 2; }
        else if (position === 'bottom-left') { x = 50; y = 50; }
        else if (position === 'bottom-center') { x = (width - textW) / 2; y = 50; }
        else if (position === 'bottom-right') { x = width - 50 - textW; y = 50; }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: stampColor,
          opacity,
          rotate: degrees(rotation)
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `${file.name.replace('.pdf', '')}_watermarked.pdf`;

      setDownloadUrl(url);
      setDownloadFileName(filename);
      toast.success('Watermark applied to all pages!', { id: toastId });

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply watermark.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setFirstPageUrl(null);
    setDownloadUrl(null);
  };

  const currentPosObj = POSITIONS.find(p => p.id === position) || POSITIONS[4];

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF Watermark Studio"
        description="Stamp custom text watermarks, security markings, or copyright seals across all pages with live visual preview."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Real-Time Visual Stamping"
        extraBadge="Custom Angle & Opacity"
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
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF to Watermark
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. Real-time watermark simulation.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  Live Visual Stamp Canvas
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  100% In-Browser
                </span>
              </div>
            </div>
          ) : (
            /* Live Interactive Watermark Preview Studio */
            <div className="tool-card p-4 sm:p-6 space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Eye size={16} />
                    <span>Live Page 1 Simulation</span>
                  </div>
                  <span className="text-xs text-[#5f6368] hidden sm:inline">&bull; {totalPages} Total Pages</span>
                </div>

                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="btn-google-secondary text-xs py-1 px-2.5"
                >
                  <X size={13} /> Change PDF
                </button>
              </div>

              {/* Realistic A4 Page Canvas with Watermark Overlay */}
              <div className="w-full bg-[#f1f3f4] p-4 sm:p-8 rounded-2xl flex items-center justify-center min-h-[440px] overflow-hidden">
                <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[1/1.414] bg-white rounded-xl shadow-lg border border-[#dadce0] overflow-hidden flex flex-col p-6 select-none">
                  
                  {/* Underneath: Fake Document Lines or Real Rendered First Page */}
                  {firstPageUrl ? (
                    <img 
                      src={firstPageUrl} 
                      alt="First Page"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85"
                    />
                  ) : (
                    <div className="space-y-3 opacity-25">
                      <div className="h-4 bg-[#202124] rounded-sm w-3/4 mb-6" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-full" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-5/6" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-full" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-4/5" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-full mt-4" />
                      <div className="h-2.5 bg-[#5f6368] rounded-sm w-2/3" />
                    </div>
                  )}

                  {/* Watermark Overlay Element */}
                  <div className={`absolute inset-0 p-6 flex pointer-events-none ${currentPosObj.gridClass}`}>
                    <div
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        color: color,
                        opacity: opacity,
                        fontSize: `${Math.max(14, Math.round(fontSize * 0.45))}px`,
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                      className="drop-shadow-xs"
                    >
                      {watermarkText || 'WATERMARK'}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Settings Studio Panel */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Sliders size={15} className="text-[#1a73e8]" /> Watermark Settings
            </h3>

            {/* 1. Watermark Text Input + Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Stamp Text</label>
              <input 
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="google-input w-full text-xs font-bold"
                placeholder="Enter watermark text"
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_TEXTS.map(txt => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setWatermarkText(txt)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-[#f1f3f4] hover:bg-[#e8f0fe] hover:text-[#1a73e8] rounded-md border border-[#dadce0] transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color Palette */}
            <div className="space-y-2 pt-2 border-t border-[#dadce0]">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Stamp Color</label>
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center text-white ${
                      color === c.hex ? 'scale-110 border-[#202124] shadow-xs' : 'border-white hover:scale-105'
                    }`}
                  >
                    {color === c.hex && <Check size={14} />}
                  </button>
                ))}
                <input 
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer p-0 border border-[#dadce0]"
                  title="Custom color"
                />
              </div>
            </div>

            {/* 3. 3x3 Position Picker */}
            <div className="space-y-2 pt-2 border-t border-[#dadce0]">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Stamp Position</label>
              <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                {POSITIONS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPosition(p.id)}
                    title={p.label}
                    className={`h-8 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${
                      position === p.id 
                        ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs' 
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    &bull;
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Opacity & Font Size Sliders */}
            <div className="space-y-3 pt-2 border-t border-[#dadce0]">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#5f6368] mb-1">
                  <span>Opacity</span>
                  <span className="text-[#1a73e8]">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#e8eaed] accent-[#1a73e8] rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#5f6368] mb-1">
                  <span>Font Size</span>
                  <span className="text-[#1a73e8]">{fontSize} pt</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="90" 
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#e8eaed] accent-[#1a73e8] rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#5f6368] mb-1">
                  <span>Rotation Angle</span>
                  <span className="text-[#1a73e8]">{rotation}°</span>
                </div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#e8eaed] accent-[#1a73e8] rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Apply Action */}
            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleApplyWatermark}
                disabled={isProcessing || !file || !watermarkText.trim()}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Applying Watermark...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Apply Watermark to PDF</span>
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

export default PdfWatermark;
