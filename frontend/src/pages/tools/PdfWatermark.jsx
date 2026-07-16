import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Droplets, Eye, EyeOff, ExternalLink, Loader2, X, Settings2, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import DropzoneComponent from '../../components/DropzoneComponent';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const PdfWatermark = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#e61a1a'); // default red
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState('center'); // center, top-left, top-right, bottom-left, bottom-right
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const colors = [
    { name: 'Red', value: '#e61a1a' },
    { name: 'Blue', value: '#1a56e6' },
    { name: 'Grey', value: '#6b7280' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Black', value: '#0f172a' }
  ];

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClear = () => {
    setFile(null);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatermark = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!watermarkText.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    let toastId = toast.loading('Applying watermark locally in browser...');
    try {
      setIsProcessing(true);
      
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const hexToRgbFloat = (hex) => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return rgb(r, g, b);
      };
      
      const watermarkColor = hexToRgbFloat(color);
      const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = helveticaFont.heightAtSize(fontSize);
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        let x = 0;
        let y = 0;
        
        if (position === 'center') {
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
        } else if (position === 'top-left') {
          x = 40;
          y = height - 40 - textHeight;
        } else if (position === 'top-right') {
          x = width - 40 - textWidth;
          y = height - 40 - textHeight;
        } else if (position === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (position === 'bottom-right') {
          x = width - 40 - textWidth;
          y = 40;
        }
        
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: watermarkColor,
          opacity: parseFloat(opacity),
          rotate: degrees(parseFloat(rotation)),
        });
      });
      
      const watermarkedBytes = await pdfDoc.save({ useObjectStreams: false });
      
      const url = window.URL.createObjectURL(new Blob([watermarkedBytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_watermarked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Watermark applied successfully!', { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply watermark. The file might be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to determine CSS placement for the Live Preview
  const getPreviewAlignmentClass = () => {
    if (position === 'top-left') return 'items-start justify-start p-4';
    if (position === 'top-right') return 'items-start justify-end p-4';
    if (position === 'bottom-left') return 'items-end justify-start p-4';
    if (position === 'bottom-right') return 'items-end justify-end p-4';
    return 'items-center justify-center';
  };

  const getSliderBackground = (val, min, max) => {
    const pct = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, #4f46e5 ${pct}%, #1c1c21 ${pct}%)`;
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Header Container */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Droplets size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced PDF Watermark</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Stamp documents with customized text, positioning, colors, and opacity.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Workspace */}
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
                  <DropzoneComponent 
                    className="flex-1 h-full w-full justify-center"
                    onFilesAccepted={(files) => {
                      if (files.length === 0) return;
                      const selectedFile = files[0];
                      if (selectedFile.type !== 'application/pdf') {
                        toast.error('Only PDF files are allowed');
                        return;
                      }
                      setFile(selectedFile);
                      setPreviewUrl(URL.createObjectURL(selectedFile));
                    }} 
                    accept={{ 'application/pdf': ['.pdf'] }} 
                    maxFiles={1}
                    title="Drag & drop a PDF here"
                    subtitle="or click to browse"
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-64 shrink-0">
                <motion.div
                  key="file-box"
                  className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col h-64 md:h-full relative min-w-0"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                      <FileText size={28} />
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <h3 className="font-bold text-foreground truncate text-base" title={file.name}>{file.name}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-end border-t border-border pt-4 mt-auto">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3.5 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 border border-border"
                    >
                      {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPreview ? 'Hide Preview' : 'Interactive Preview'}
                    </button>
                    <button 
                      onClick={handleClear} 
                      className="text-xs text-red-400 bg-red-950/10 border border-red-900/20 hover:bg-red-950/20 px-3.5 py-2.5 rounded-xl transition-all font-semibold flex items-center gap-1.5"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </motion.div>

            {/* Box 2: Visual Live Preview */}
            <div className="bg-card rounded-2xl border border-border/80 p-5 relative overflow-hidden h-64 md:h-full flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Preview
                </span>
              </div>
              <div className={`flex-1 bg-[#09090b] rounded-xl border border-dashed border-border/80 flex relative overflow-hidden ${getPreviewAlignmentClass()}`}>
                <motion.span 
                  layout
                  className="font-black whitespace-nowrap select-none transition-all duration-100 drop-shadow-sm"
                  style={{ 
                    color: color, 
                    opacity: opacity, 
                    fontSize: `${fontSize * 0.4}px`, // scaled for preview box
                    transform: `rotate(${rotation}deg)` 
                  }}
                >
                  {watermarkText || 'PREVIEW'}
                </motion.span>
                
                {/* Background paper lines placeholder to show transparency */}
                <div className="absolute inset-x-4 top-1/4 h-2 bg-muted/10 rounded pointer-events-none z-0" />
                <div className="absolute inset-x-4 top-1/2 h-2 bg-muted/10 rounded pointer-events-none z-0" />
                <div className="absolute inset-x-4 top-3/4 h-2 bg-muted/10 rounded pointer-events-none z-0" />
              </div>
            </div>
          </div>

                {/* Interactive Document Preview */}
                <AnimatePresence>
                  {showPreview && previewUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3 shrink-0 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Document Preview</h4>
                        <a 
                          href={previewUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          Open in New Tab <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/5 relative">
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Watermark Configuration Options */}
                <motion.div 
                  layout
                  className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6"
                >
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-3 mb-5 flex items-center gap-2">
              <Settings2 size={16} /> Customize Watermark
            </h3>

            {/* Custom slider thumb styles injected inside the options block */}
            <style dangerouslySetInnerHTML={{__html: `
              input[type=range]::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #4f46e5;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transition: transform 0.1s;
              }
              input[type=range]:hover::-webkit-slider-thumb {
                transform: scale(1.2);
              }
            `}} />
             
            {/* Text Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Watermark Text</label>
              <div className="relative">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL or DRAFT"
                  className="w-full bg-[#09090b] border border-border/80 rounded-xl pl-4 pr-16 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base font-semibold shadow-inner"
                  maxLength={30}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded">
                  {watermarkText.length}/30
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Color Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">Color</label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {colors.map(c => {
                    const isSelected = color === c.value;
                    return (
                      <motion.button 
                        key={c.value} 
                        onClick={() => setColor(c.value)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center ${
                          isSelected ? 'border-primary ring-2 ring-primary/20 scale-105 shadow' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {isSelected && (
                          <Check size={14} className={c.value === '#0f172a' ? 'text-white' : 'text-neutral-900 invert font-bold'} />
                        )}
                      </motion.button>
                    );
                  })}
                  
                  {/* Custom color picker */}
                  <div className="relative w-8 h-8 rounded-full border border-border/80 overflow-hidden cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" title="Custom Color">
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Position Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Position</label>
                <div className="grid grid-cols-3 gap-1.5 w-44">
                  {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(pos => {
                    const isSelected = position === pos;
                    let label = pos.split('-').map(w => w[0]).join('').toUpperCase() || 'C';
                    if (pos === 'center') label = 'C';
                    return (
                      <button
                        key={pos}
                        onClick={() => setPosition(pos)}
                        className={`py-1.5 text-xs font-extrabold border rounded-lg transition-all uppercase ${
                          isSelected 
                            ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20 scale-105' 
                            : 'bg-[#09090b] hover:bg-neutral-800 text-muted-foreground border-border hover:border-muted-foreground/30'
                        }`}
                        style={
                          pos === 'center' ? { gridColumn: '2', gridRow: '2' } :
                          pos === 'bottom-left' ? { gridColumn: '1', gridRow: '3' } :
                          pos === 'bottom-right' ? { gridColumn: '3', gridRow: '3' } :
                          pos === 'top-left' ? { gridColumn: '1', gridRow: '1' } :
                          { gridColumn: '3', gridRow: '1' }
                        }
                        title={pos.replace('-', ' ')}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sliders Block */}
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border/80">
              {/* Opacity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opacity</label>
                  <span className="text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1.0" step="0.05"
                  value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all" 
                  style={{ background: getSliderBackground(opacity, 0.1, 1.0) }}
                />
              </div>

              {/* Font Size */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font Size</label>
                  <span className="text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">{fontSize}px</span>
                </div>
                <input 
                  type="range" min="14" max="96" step="2"
                  value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all" 
                  style={{ background: getSliderBackground(fontSize, 14, 96) }}
                />
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rotation</label>
                  <span className="text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">{rotation}°</span>
                </div>
                <input 
                  type="range" min="-90" max="90" step="5"
                  value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none transition-all" 
                  style={{ background: getSliderBackground(rotation, -90, 90) }}
                />
              </div>
            </div>
              </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Panel / Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Sparkles size={16} /> Watermark Details
            </h3>
            
            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Applies clean text formatting across every page.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Fully adjustable opacity prevents blocking content.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>We delete files immediately after processing.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleWatermark}
              disabled={!file || !watermarkText.trim() || isProcessing}
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
                    Applying...
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
                    <Sparkles size={20} />
                    <span>Stamp PDF</span>
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

export default PdfWatermark;
