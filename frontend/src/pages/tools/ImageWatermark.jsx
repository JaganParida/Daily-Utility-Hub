import { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Download, Trash2, Settings, Stamp, Layers, FileImage, Sliders, Layout, RefreshCw, CheckCircle, Upload, ChevronDown, RotateCcw, Brush, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const POSITION_PRESETS = [
  { id: 'center',       name: 'Center' },
  { id: 'top-left',     name: 'Top Left' },
  { id: 'top-right',    name: 'Top Right' },
  { id: 'bottom-left',  name: 'Bottom Left' },
  { id: 'bottom-right', name: 'Bottom Right' },
  { id: 'tiled',        name: 'Tiled Grid' },
];

const FONTS = [
  { id: 'sans-serif', name: 'Clean Sans-Serif' },
  { id: 'serif',      name: 'Elegant Serif' },
  { id: 'monospace',  name: 'Modern Monospace' },
  { id: 'cursive',    name: 'Handwritten Script' },
];

const ImageWatermark = () => {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'generating' | 'done'
  const [toolMode, setToolMode] = useState('add'); // 'add' | 'remove'

  // History for Undo in Eraser mode
  const [history, setHistory] = useState([]); // Array of ImageData

  // ADD MODE SETTINGS
  const [watermarkType, setWatermarkType] = useState('text'); // 'text' | 'image'
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [fontSize, setFontSize] = useState(36); // px
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(-30); // degrees
  const [position, setPosition] = useState('tiled'); // preset id

  // Image logo settings
  const [logoFile, setLogoFile] = useState(null);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoScale, setLogoScale] = useState(0.2); // 20% of base image

  // REMOVE MODE SETTINGS (ERASER)
  const [brushSize, setBrushSize] = useState(30); // px
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const logoInputRef = useRef(null);
  const containerRef = useRef(null);

  // Revoke Object URLs on unmount
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      if (logoSrc) URL.revokeObjectURL(logoSrc);
    };
  }, [imageSrc, logoSrc]);

  const handleFilesAccepted = (files) => {
    if (!files.length) return;
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    const src = URL.createObjectURL(files[0]);
    setFile(files[0]);
    setImageSrc(src);
    setHistory([]);
  };

  const handleLogoAccepted = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (logoSrc) URL.revokeObjectURL(logoSrc);
    const src = URL.createObjectURL(f);
    setLogoFile(f);
    setLogoSrc(src);
  };

  const removeLogo = () => {
    if (logoSrc) URL.revokeObjectURL(logoSrc);
    setLogoFile(null);
    setLogoSrc(null);
  };

  const clear = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (logoSrc) URL.revokeObjectURL(logoSrc);
    setFile(null);
    setImageSrc(null);
    setLogoFile(null);
    setLogoSrc(null);
    setText('CONFIDENTIAL');
    setWatermarkType('text');
    setHistory([]);
  };

  // Helper to draw watermark onto any canvas (preview or final export)
  const drawWatermark = async (canvas, ctx) => {
    if (!imageSrc) return;

    // Load main image
    const mainImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = imageSrc;
    });

    canvas.width = mainImg.width;
    canvas.height = mainImg.height;
    ctx.drawImage(mainImg, 0, 0);

    ctx.save();
    ctx.globalAlpha = opacity;

    if (watermarkType === 'text') {
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = `${fontSize}px ${fontFamily}`;

      if (position === 'tiled') {
        const stepX = canvas.width / 4;
        const stepY = canvas.height / 4;
        for (let x = stepX / 2; x < canvas.width; x += stepX) {
          for (let y = stepY / 2; y < canvas.height; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        const offset = 40;

        if (position === 'top-left') {
          x = offset + ctx.measureText(text).width / 2;
          y = offset + fontSize / 2;
        } else if (position === 'top-right') {
          x = canvas.width - offset - ctx.measureText(text).width / 2;
          y = offset + fontSize / 2;
        } else if (position === 'bottom-left') {
          x = offset + ctx.measureText(text).width / 2;
          y = canvas.height - offset - fontSize / 2;
        } else if (position === 'bottom-right') {
          x = canvas.width - offset - ctx.measureText(text).width / 2;
          y = canvas.height - offset - fontSize / 2;
        }

        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
      }
    } else if (watermarkType === 'image' && logoSrc) {
      const markImg = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = logoSrc;
      });

      const markW = canvas.width * logoScale;
      const markH = markW * (markImg.height / markImg.width);

      if (position === 'tiled') {
        const stepX = canvas.width / 3;
        const stepY = canvas.height / 3;
        for (let x = stepX / 2; x < canvas.width; x += stepX) {
          for (let y = stepY / 2; y < canvas.height; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(markImg, -markW / 2, -markH / 2, markW, markH);
            ctx.restore();
          }
        }
      } else {
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        const offset = 40;

        if (position === 'top-left') {
          x = offset + markW / 2;
          y = offset + markH / 2;
        } else if (position === 'top-right') {
          x = canvas.width - offset - markW / 2;
          y = offset + markH / 2;
        } else if (position === 'bottom-left') {
          x = offset + markW / 2;
          y = canvas.height - offset - markH / 2;
        } else if (position === 'bottom-right') {
          x = canvas.width - offset - markW / 2;
          y = canvas.height - offset - markH / 2;
        }

        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(markImg, -markW / 2, -markH / 2, markW, markH);
      }
    }
    ctx.restore();
  };

  // Setup preview canvas dimensions
  const setupPreviewCanvas = async () => {
    if (!imageSrc) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const mainImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = imageSrc;
    });

    canvas.width = mainImg.width;
    canvas.height = mainImg.height;

    // Reset mask canvas matching original dimensions
    const mask = maskCanvasRef.current;
    if (mask) {
      mask.width = mainImg.width;
      mask.height = mainImg.height;
      const maskCtx = mask.getContext('2d');
      maskCtx.clearRect(0, 0, mask.width, mask.height);
    }

    if (toolMode === 'add') {
      drawWatermark(canvas, ctx);
    } else {
      // Just draw the clean original image
      ctx.drawImage(mainImg, 0, 0);
    }
  };

  useEffect(() => {
    setupPreviewCanvas();
  }, [imageSrc, toolMode]);

  // Re-draw preview for Add Watermark mode when options change
  useEffect(() => {
    if (!imageSrc || toolMode !== 'add') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawWatermark(canvas, ctx);
  }, [imageSrc, watermarkType, text, fontFamily, fontSize, color, opacity, rotation, position, logoSrc, logoScale, toolMode]);

  // --- DRAWING MASK LOGIC (ERASER MODE) ---
  const getCoordinates = (e) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinate relative to actual canvas resolution
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (toolMode !== 'remove') return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const mask = maskCanvasRef.current;
    const maskCtx = mask.getContext('2d');

    maskCtx.beginPath();
    maskCtx.moveTo(coords.x, coords.y);
    maskCtx.lineWidth = (brushSize / rectWidthScale());
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Translucent red
  };

  const drawMask = (e) => {
    if (!isDrawing || toolMode !== 'remove') return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const mask = maskCanvasRef.current;
    const maskCtx = mask.getContext('2d');
    maskCtx.lineTo(coords.x, coords.y);
    maskCtx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Find scale factor between client CSS width and actual canvas resolution
  const rectWidthScale = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    return rect.width / canvas.width;
  };

  const clearMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const maskCtx = mask.getContext('2d');
    maskCtx.clearRect(0, 0, mask.width, mask.height);
  };

  // --- CLIENT-SIDE WATERMARK INPAINTER ALGORITHM ---
  const handleErase = async () => {
    const canvas = previewCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!canvas || !mask) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = mask.getContext('2d');

    setDownloadState('generating');
    await new Promise(r => setTimeout(r, 1200)); // Smooth loading transition

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);

      // Save current state to history queue before applying changes
      setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);

      const pixels = imgData.data;
      const maskPixels = maskData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Identify masked pixels
      const isMasked = new Uint8Array(w * h);
      const maskedIndices = [];

      for (let i = 0; i < maskPixels.length; i += 4) {
        const idx = i / 4;
        if (maskPixels[i + 3] > 10) { // alpha channel has brush stroke
          isMasked[idx] = 1;
          maskedIndices.push(idx);
        }
      }

      if (maskedIndices.length === 0) {
        toast.error('Draw over the watermark first!');
        setDownloadState('idle');
        return;
      }

      const tempPixels = new Uint8ClampedArray(pixels);
      const maxRadius = 30; // Expanding ring search radius

      // Pixel propagation loop
      for (let idx of maskedIndices) {
        const px = idx % w;
        const py = Math.floor(idx / w);

        let sumR = 0, sumG = 0, sumB = 0, weightSum = 0;
        let found = false;

        // Search outward in rings
        for (let r = 1; r <= maxRadius && !found; r++) {
          for (let dx = -r; dx <= r; dx++) {
            for (let dy of [-r, r]) {
              const nx = px + dx;
              const ny = py + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (!isMasked[nIdx]) {
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  const weight = 1 / (dist * dist);
                  const p = nIdx * 4;
                  sumR += tempPixels[p] * weight;
                  sumG += tempPixels[p + 1] * weight;
                  sumB += tempPixels[p + 2] * weight;
                  weightSum += weight;
                  found = true;
                }
              }
            }
          }
          for (let dy = -r + 1; dy <= r - 1; dy++) {
            for (let dx of [-r, r]) {
              const nx = px + dx;
              const ny = py + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (!isMasked[nIdx]) {
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  const weight = 1 / (dist * dist);
                  const p = nIdx * 4;
                  sumR += tempPixels[p] * weight;
                  sumG += tempPixels[p + 1] * weight;
                  sumB += tempPixels[p + 2] * weight;
                  weightSum += weight;
                  found = true;
                }
              }
            }
          }
        }

        if (weightSum > 0) {
          const p = idx * 4;
          pixels[p]     = sumR / weightSum;
          pixels[p + 1] = sumG / weightSum;
          pixels[p + 2] = sumB / weightSum;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      clearMask();
      toast.success('Watermark removed!');
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Inpaint failed');
      setDownloadState('idle');
    }
  };

  const handleUndo = () => {
    if (!history.length) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const prevState = history[history.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(prev => prev.slice(0, -1));
    toast.success('Undo successful');
  };

  const handleDownload = async () => {
    if (!file) return;
    setDownloadState('generating');
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const canvas = previewCanvasRef.current; // The working canvas holds the updated image details
      const mimeType = file.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL(mimeType);
      link.download = `${toolMode === 'add' ? 'watermarked' : 'cleared'}_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Image exported successfully!');
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export image');
      setDownloadState('idle');
    }
  };

  const hasImage = !!imageSrc;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Stamp size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Image Watermarker</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Apply text/logo watermarks or use the Magic Eraser brush to remove visual overlays.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Preview Container */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          {!hasImage ? (
            <div className="flex-1 w-full h-full flex flex-col min-h-[50vh] items-stretch">
              <DropzoneComponent
                className="flex-1 h-full w-full justify-center"
                onFilesAccepted={handleFilesAccepted}
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
                maxFiles={1}
                title="Drag & drop image here"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Tool Mode selector Tabs */}
              <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 self-start gap-1">
                {[
                  { id: 'add',    label: 'Add Watermark',    icon: Stamp },
                  { id: 'remove', label: 'Erase Watermark', icon: Eraser }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setToolMode(mode.id)}
                    className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all relative ${
                      toolMode === mode.id ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {toolMode === mode.id && (
                      <motion.div
                        layoutId="tool-mode-active"
                        className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10"
                      />
                    )}
                    <mode.icon size={14} />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Working Interactive Canvas */}
              <div
                ref={containerRef}
                className="w-full bg-muted/10 rounded-xl border border-border/50 overflow-hidden relative flex items-center justify-center select-none"
                style={{ height: 'calc(100vh - 290px)', maxHeight: 580, minHeight: 280 }}
              >
                {/* Main image canvas */}
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                />

                {/* Drawing mask canvas (only visible in remove mode) */}
                {toolMode === 'remove' && (
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={drawMask}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawMask}
                    onTouchEnd={stopDrawing}
                    className="absolute max-w-full max-h-full object-contain cursor-brush z-20 touch-none"
                    style={{
                      // Align exactly with the main canvas size and position
                      width: previewCanvasRef.current?.getBoundingClientRect().width,
                      height: previewCanvasRef.current?.getBoundingClientRect().height,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Settings Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasImage ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings size={15} /> Settings Panel
            </h3>

            <AnimatePresence mode="wait">
              {toolMode === 'add' ? (
                <motion.div
                  key="add-settings"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Type Selector Tabs */}
                  <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 gap-1">
                    {[
                      { id: 'text',  label: 'Text',  icon: Type },
                      { id: 'image', label: 'Logo',  icon: FileImage }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setWatermarkType(type.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-colors relative ${
                          watermarkType === type.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {watermarkType === type.id && (
                          <motion.div
                            layoutId="type-active"
                            className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10"
                          />
                        )}
                        <type.icon size={14} />
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {/* Position Preset selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Layout size={13} /> Layout Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {POSITION_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => setPosition(preset.id)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all active:scale-[0.97] text-center ${
                            position === preset.id
                              ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                              : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional sub-menus */}
                  {watermarkType === 'text' ? (
                    <div className="space-y-4 pt-1">
                      {/* Text Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Watermark Text</label>
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="w-full bg-muted/20 border border-border/50 p-2.5 rounded-xl text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
                        />
                      </div>

                      {/* Font Family */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Font Style</label>
                        <div className="relative">
                          <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full appearance-none bg-muted/20 border border-border/50 p-2.5 pr-10 rounded-xl text-sm font-semibold text-foreground outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
                          >
                            {FONTS.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                        </div>
                      </div>

                      {/* Font Size slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Font Size</label>
                          <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="120"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="wm-slider w-full cursor-pointer outline-none"
                          style={{
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            height: '8px',
                            borderRadius: '999px',
                            background: `linear-gradient(to right, var(--primary) ${((fontSize - 12) / 108) * 100}%, var(--muted) ${((fontSize - 12) / 108) * 100}%)`,
                          }}
                        />
                      </div>

                      {/* Color Picker */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fill Color</label>
                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-border/50 p-0.5 bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={color.toUpperCase()}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-mono font-semibold text-foreground focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {/* Logo Image Uploader */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo Image</label>
                        {!logoSrc ? (
                          <div
                            onClick={() => logoInputRef.current?.click()}
                            className="border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all"
                          >
                            <Upload size={20} className="text-muted-foreground mb-1.5" />
                            <span className="text-xs font-bold text-muted-foreground">Select Logo (PNG/SVG)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                            <img src={logoSrc} className="w-10 h-10 object-contain rounded bg-white p-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{logoFile?.name}</p>
                              <p className="text-[10px] text-muted-foreground">Logo loaded</p>
                            </div>
                            <button onClick={removeLogo} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <input ref={logoInputRef} type="file" onChange={handleLogoAccepted} accept="image/*" className="hidden" />
                      </div>

                      {/* Logo Scale slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo Size (Scale)</label>
                          <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{Math.round(logoScale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.5"
                          step="0.01"
                          value={logoScale}
                          onChange={(e) => setLogoScale(Number(e.target.value))}
                          className="wm-slider w-full cursor-pointer outline-none"
                          style={{
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            height: '8px',
                            borderRadius: '999px',
                            background: `linear-gradient(to right, var(--primary) ${((logoScale - 0.05) / 0.45) * 100}%, var(--muted) ${((logoScale - 0.05) / 0.45) * 100}%)`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Shared Opacity and Rotation sliders */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    {/* Opacity slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Watermark Opacity</label>
                        <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{Math.round(opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="wm-slider w-full cursor-pointer outline-none"
                        style={{
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          height: '8px',
                          borderRadius: '999px',
                          background: `linear-gradient(to right, var(--primary) ${((opacity - 0.05) / 0.95) * 100}%, var(--muted) ${((opacity - 0.05) / 0.95) * 100}%)`,
                        }}
                      />
                    </div>

                    {/* Rotation slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Watermark Angle</label>
                        <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="wm-slider w-full cursor-pointer outline-none"
                        style={{
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          height: '8px',
                          borderRadius: '999px',
                          background: `linear-gradient(to right, var(--primary) ${((rotation + 180) / 360) * 100}%, var(--muted) ${((rotation + 180) / 360) * 100}%)`,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="remove-settings"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Brush size={14} className="text-primary" /> Magic Eraser Guide
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Simply draw over any logo, text watermark, or unwanted visual overlay on the image. Click <strong className="text-foreground">Erase Watermark</strong> to remove it.
                    </p>
                  </div>

                  {/* Brush Size Slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Brush Size</label>
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="wm-slider w-full cursor-pointer outline-none"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '8px',
                        borderRadius: '999px',
                        background: `linear-gradient(to right, var(--primary) ${((brushSize - 5) / 95) * 100}%, var(--muted) ${((brushSize - 5) / 95) * 100}%)`,
                      }}
                    />
                  </div>

                  {/* Eraser Actions (Undo + Erase) */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                    <button
                      onClick={handleErase}
                      disabled={downloadState === 'generating'}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-50"
                    >
                      <Eraser size={16} /> Erase Watermark
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleUndo}
                        disabled={!history.length || downloadState === 'generating'}
                        className="py-2.5 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 active:scale-[0.98]"
                      >
                        <RotateCcw size={12} /> Undo
                      </button>
                      <button
                        onClick={clearMask}
                        disabled={downloadState === 'generating'}
                        className="py-2.5 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <Trash2 size={12} /> Clear Mask
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global Scoped Sliders CSS */}
            <style dangerouslySetInnerHTML={{__html: `
              .wm-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid var(--primary);
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: transform 0.1s ease;
              }
              .wm-slider::-webkit-slider-thumb:hover {
                transform: scale(1.25);
              }
              .wm-slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid var(--primary);
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              }
            `}} />
          </div>

          {/* Download and Save Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              disabled={downloadState !== 'idle' || !hasImage || (toolMode === 'add' && watermarkType === 'image' && !logoSrc)}
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
                    <CheckCircle size={20} /> Saved!
                  </motion.div>
                ) : downloadState === 'generating' ? (
                  <motion.div key="generating"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={20} className="animate-spin" /> Exporting…
                  </motion.div>
                ) : (
                  <motion.div key="idle"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Download size={20} /> Save/Export Image
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={clear}
              disabled={downloadState === 'generating' || !hasImage}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Reset Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageWatermark;
