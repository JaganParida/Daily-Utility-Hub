import { useState, useRef, useEffect } from 'react';
import { Palette, Download, Trash2, Settings, Copy, Check, Info, FileCode, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

// Utility: convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Utility: rgb to hex
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Utility: RGB to HSL
const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Utility: RGB to CMYK
const rgbToCmyk = (r, g, b) => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  c = Math.round(((c - k) / (1 - k)) * 100);
  m = Math.round(((m - k) / (1 - k)) * 100);
  y = Math.round(((y - k) / (1 - k)) * 100);
  k = Math.round(k * 100);

  return { c, m, y, k };
};

// Euclidean distance between two colors in RGB space
const colorDistance = (c1, c2) => {
  return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
};

const ImageColorExtractor = () => {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'generating' | 'done'

  const [extractedPalette, setExtractedPalette] = useState([]);
  const [customPalette, setCustomPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null); // currently active hex color info
  const [copiedText, setCopiedText] = useState(null); // tracks hex copied status
  const [exportFormat, setExportFormat] = useState('css'); // 'css' | 'tailwind' | 'json'

  const canvasRef = useRef(null);
  const swatchCanvasRef = useRef(null);
  const [hoveredColor, setHoveredColor] = useState(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const handleFilesAccepted = (files) => {
    if (!files.length) return;
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    const src = URL.createObjectURL(files[0]);
    setFile(files[0]);
    setImageSrc(src);
    setCustomPalette([]);
    setSelectedColor(null);
    setHoveredColor(null);
    setShowPicker(false);
  };

  // Extract dominant colors from canvas
  const extractColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale down image to sample pixels efficiently
    const sampleSize = 100; // 100x100 grid
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);

    const imgData = tempCtx.getImageData(0, 0, sampleSize, sampleSize).data;
    const colors = [];

    // Sample every 4th pixel for clustering
    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];
      if (a > 200) { // filter transparent pixels
        colors.push({ r, g, b });
      }
    }

    // Diverse palette algorithm:
    // Sort sampled colors by frequency, but keep only colors that are at least a distance of 45 away from already selected ones.
    const palette = [];
    const frequency = {};

    colors.forEach(c => {
      const hex = rgbToHex(c.r, c.g, c.b);
      frequency[hex] = (frequency[hex] || 0) + 1;
    });

    const sortedHexes = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);

    for (let hex of sortedHexes) {
      const rgb = hexToRgb(hex);
      let isDiverse = true;
      for (let p of palette) {
        if (colorDistance(rgb, hexToRgb(p)) < 45) {
          isDiverse = false;
          break;
        }
      }
      if (isDiverse) {
        palette.push(hex);
      }
      if (palette.length >= 6) break;
    }

    setExtractedPalette(palette);
    if (palette.length > 0) {
      selectColor(palette[0]);
    }
  };

  const drawMainImage = async () => {
    if (!imageSrc) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    await new Promise(resolve => {
      img.onload = resolve;
      img.src = imageSrc;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    extractColors();
  };

  useEffect(() => {
    if (imageSrc) {
      drawMainImage();
    }
  }, [imageSrc]);

  // Click & hover tracking on canvas
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    try {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setHoveredColor(hex);
      setPickerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowPicker(true);
    } catch (err) {
      // ignore security exceptions for external urls if any
    }
  };

  const handleMouseLeave = () => {
    setShowPicker(false);
  };

  const handleCanvasClick = () => {
    if (hoveredColor) {
      addCustomColor(hoveredColor);
    }
  };

  const addCustomColor = (hex) => {
    if (!customPalette.includes(hex)) {
      setCustomPalette(prev => [...prev, hex]);
      toast.success('Color added to custom palette!');
    }
    selectColor(hex);
  };

  const removeCustomColor = (hex, e) => {
    e.stopPropagation();
    setCustomPalette(prev => prev.filter(c => c !== hex));
  };

  const selectColor = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    setSelectedColor({
      hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const clear = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(null);
    setImageSrc(null);
    setExtractedPalette([]);
    setCustomPalette([]);
    setSelectedColor(null);
    setHoveredColor(null);
  };

  // Generate CSS/Tailwind export content
  const getExportCode = () => {
    const colors = [...extractedPalette, ...customPalette];
    if (!colors.length) return '';

    if (exportFormat === 'css') {
      return `:root {\n${colors.map((c, i) => `  --color-palette-${i + 1}: ${c};`).join('\n')}\n}`;
    } else if (exportFormat === 'tailwind') {
      return `colors: {\n${colors.map((c, i) => `  palette${i + 1}: "${c}",`).join('\n')}\n}`;
    } else {
      return JSON.stringify(colors, null, 2);
    }
  };

  // Export beautiful Swatch PNG card
  const handleExportPaletteCard = async () => {
    const colors = [...extractedPalette, ...customPalette];
    if (!colors.length) return;
    setDownloadState('generating');
    await new Promise(r => setTimeout(r, 1200));

    try {
      const canvas = swatchCanvasRef.current;
      const ctx = canvas.getContext('2d');

      const cardW = 600;
      const blockH = 100;
      const headerH = 80;
      const cardH = headerH + (colors.length * blockH);

      canvas.width = cardW;
      canvas.height = cardH;

      // Draw header background
      ctx.fillStyle = '#0f172a'; // dark slate
      ctx.fillRect(0, 0, cardW, headerH);

      // Draw Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('Color Swatch Palette', 30, headerH / 2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`DUH-${Date.now()}`, cardW - 30, headerH / 2);

      // Draw Color Blocks
      colors.forEach((color, i) => {
        const y = headerH + (i * blockH);

        // Color box
        ctx.fillStyle = color;
        ctx.fillRect(0, y, cardW, blockH);

        // Overlay pill box for details readability
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // dark slate overlay
        ctx.fillRect(30, y + 25, 220, 50);

        // Write codes
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(color.toUpperCase(), 50, y + 50);

        const rgbVal = hexToRgb(color);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px monospace';
        ctx.fillText(`RGB(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b})`, 130, y + 50);
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `palette_swatch_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Swatch card exported!');
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export swatch');
      setDownloadState('idle');
    }
  };

  const hasImage = !!imageSrc;
  const combinedPalette = [...extractedPalette, ...customPalette];

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <canvas ref={swatchCanvasRef} className="hidden" />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Palette size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Color Extractor</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Inspect images, click pixels to pick colors, extract dominant palettes, and export code variables.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Interactive Canvas */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          {!hasImage ? (
            <div className="flex-1 w-full h-full flex flex-col min-h-[50vh] items-stretch">
              <DropzoneComponent
                className="flex-1 h-full w-full justify-center"
                onFilesAccepted={handleFilesAccepted}
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
                maxFiles={1}
                title="Drag & drop target image here"
              />
            </div>
          ) : (
            <div
              className="w-full bg-muted/10 rounded-xl border border-border/50 overflow-hidden relative flex items-center justify-center cursor-crosshair group"
              style={{ height: 'calc(100vh - 250px)', maxHeight: 620, minHeight: 280 }}
            >
              <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleCanvasClick}
                className="max-w-full max-h-full object-contain rounded shadow-lg"
              />

              {/* Magnifier / Picker floating target info */}
              <AnimatePresence>
                {showPicker && hoveredColor && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    className="absolute pointer-events-none z-30 flex flex-col items-center gap-1.5"
                    style={{
                      left: pickerPos.x - 30,
                      top: pickerPos.y - 75,
                    }}
                  >
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-border/50 text-white text-[10px] font-bold py-1 px-2 rounded-full shadow-lg backdrop-blur-md">
                      <div className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: hoveredColor }} />
                      <span>{hoveredColor.toUpperCase()}</span>
                    </div>
                    {/* Triangular anchor arrow */}
                    <div className="w-2 h-2 bg-slate-950/80 border-r border-b border-border/50 rotate-45 -mt-1.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasImage ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings size={15} /> Palette Swatches
            </h3>

            {/* Extracted Auto Palette */}
            <div className="space-y-3.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dominant Colors</label>
              <div className="grid grid-cols-6 gap-2">
                {extractedPalette.map((color, i) => (
                  <button
                    key={color}
                    onClick={() => selectColor(color)}
                    className={`h-11 rounded-lg border transition-all relative overflow-hidden shadow-sm active:scale-[0.9] ${
                      selectedColor?.hex === color ? 'border-primary ring-2 ring-primary/30 scale-105 z-10' : 'border-border/30 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Color ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Custom picked Colors List */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Picked</label>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Click image to add
                </span>
              </div>

              {!customPalette.length ? (
                <p className="text-xs text-muted-foreground italic text-center py-2 bg-muted/10 rounded-lg border border-dashed border-border/40">No custom colors picked yet.</p>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {customPalette.map(color => (
                    <button
                      key={color}
                      onClick={() => selectColor(color)}
                      className={`h-11 rounded-lg border transition-all relative group shadow-sm active:scale-[0.9] ${
                        selectedColor?.hex === color ? 'border-primary ring-2 ring-primary/30 scale-105 z-10' : 'border-border/30 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {/* Delete dot */}
                      <span
                        onClick={(e) => removeCustomColor(color, e)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Color details block */}
            <AnimatePresence mode="wait">
              {selectedColor && (
                <motion.div
                  key={selectedColor.hex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-muted/30 border border-border/50 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg border border-border shadow-sm" style={{ backgroundColor: selectedColor.hex }} />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{selectedColor.hex.toUpperCase()}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Selection</p>
                    </div>
                  </div>

                  {/* Codes values list */}
                  <div className="space-y-2 text-xs font-semibold text-foreground pt-1">
                    {[
                      { id: 'hex',  label: 'HEX',   val: selectedColor.hex.toUpperCase() },
                      { id: 'rgb',  label: 'RGB',   val: selectedColor.rgb },
                      { id: 'hsl',  label: 'HSL',   val: selectedColor.hsl },
                      { id: 'cmyk', label: 'CMYK',  val: selectedColor.cmyk }
                    ].map(code => (
                      <div key={code.id} className="flex items-center justify-between bg-background/50 border border-border/30 py-1.5 px-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground uppercase">{code.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] truncate max-w-[130px]">{code.val}</span>
                          <button
                            onClick={() => copyToClipboard(code.val, `${selectedColor.hex}-${code.id}`)}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                          >
                            {copiedText === `${selectedColor.hex}-${code.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code Export Selector block */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileCode size={13} /> Export Format
                </label>
                <div className="flex gap-1">
                  {['css', 'tailwind', 'json'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border transition-colors ${
                        exportFormat === fmt ? 'bg-primary border-primary text-white' : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={getExportCode()}
                  className="w-full bg-muted/20 border border-border/50 p-2.5 rounded-xl font-mono text-[10px] text-muted-foreground h-20 resize-none outline-none"
                />
                <button
                  onClick={() => copyToClipboard(getExportCode(), 'export-code')}
                  className="absolute right-2 bottom-3 p-1.5 bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary rounded-lg shadow-sm transition-all"
                  title="Copy All"
                >
                  {copiedText === 'export-code' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleExportPaletteCard}
              disabled={downloadState !== 'idle' || !combinedPalette.length}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2
                shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset]
                disabled:opacity-50 active:scale-[0.98] overflow-hidden
                ${downloadState === 'done'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
                }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {downloadState === 'done' ? (
                  <motion.div key="done"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={20} /> Swatch Exported!
                  </motion.div>
                ) : downloadState === 'generating' ? (
                  <motion.div key="generating"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={20} className="animate-spin" /> Rendering Card…
                  </motion.div>
                ) : (
                  <motion.div key="idle"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Download size={20} /> Export Swatch Card
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={clear}
              disabled={downloadState === 'generating' || !hasImage}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Reset Picker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageColorExtractor;
