import { useState, useRef, useEffect } from 'react';
import { Maximize, Download, RefreshCw, Lock, Unlock, Settings2, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const QUICK_PRESETS = [
  { name: 'Insta Square', w: 1080, h: 1080 },
  { name: 'Insta Portrait', w: 1080, h: 1350 },
  { name: 'Story / Reels', w: 1080, h: 1920 },
  { name: 'YouTube Thumb', w: 1280, h: 720 },
  { name: 'Full HD (Web)', w: 1920, h: 1080 },
  { name: '4K UHD', w: 3840, h: 2160 },
  { name: 'Twitter Post', w: 1200, h: 675 },
  { name: 'Passport Photo', w: 600, h: 600 },
  { name: 'A4 Document', w: 2480, h: 3508 },
  { name: 'US Letter', w: 2550, h: 3300 },
];

const ImageResizer = () => {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle', 'downloading', 'downloaded'
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [originalRatio, setOriginalRatio] = useState(1);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  
  // Track active selection for UI feedback
  const [activeScale, setActiveScale] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  const canvasRef = useRef(null);

  const handleFilesAccepted = (files) => {
    const file = files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage({
        file,
        url,
        name: file.name,
        type: file.type
      });
      setWidth(img.width);
      setHeight(img.height);
      setOriginalSize({ w: img.width, h: img.height });
      setOriginalRatio(img.width / img.height);
      setActiveScale(null);
      setActivePreset(null);
    };
    img.src = url;
  };

  const handleWidthChange = (e) => {
    const val = Number(e.target.value);
    setWidth(val);
    setActiveScale(null);
    setActivePreset(null);
    if (maintainRatio && val > 0) {
      setHeight(Math.round(val / originalRatio));
    }
  };

  const handleHeightChange = (e) => {
    const val = Number(e.target.value);
    setHeight(val);
    setActiveScale(null);
    setActivePreset(null);
    if (maintainRatio && val > 0) {
      setWidth(Math.round(val * originalRatio));
    }
  };

  const applyPreset = (presetName, w, h) => {
    setWidth(w);
    setHeight(h);
    setMaintainRatio(false);
    setActivePreset(presetName);
    setActiveScale(null);
  };

  const scaleByPercentage = (percent) => {
    const factor = percent / 100;
    setWidth(Math.round(originalSize.w * factor));
    setHeight(Math.round(originalSize.h * factor));
    setActiveScale(percent);
    setActivePreset(null);
  };

  const processResize = async () => {
    if (!image || width <= 0 || height <= 0) return;
    setIsProcessing(true);
    setDownloadState('downloading');
    
    // Slight delay to allow UI to show processing state
    await new Promise(res => setTimeout(res, 50));

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = image.url;
      });

      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Download
      const type = image.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const ext = type === 'image/png' ? 'png' : 'jpg';
      const dataUrl = canvas.toDataURL(type, 0.95);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `resized_${width}x${height}_${image.name.replace(/\.[^/.]+$/, "")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadState('downloaded');
      toast.success('Image resized and downloaded!');
      setTimeout(() => setDownloadState('idle'), 2500);
    } catch (error) {
      console.error(error);
      setDownloadState('idle');
      toast.error('Failed to resize image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clear = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setWidth(0);
    setHeight(0);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-md shadow-sm">
          <Maximize size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Image Resizer</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Resize images with precise dimensions, aspect ratio lock, or social presets.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Preview Area */}
        <motion.div layout className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-lg shadow-sm flex flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            {!image ? (
              <motion.div 
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full w-full flex flex-col justify-center min-h-[300px] md:min-h-[350px]"
              >
                <DropzoneComponent 
                  className="flex-1 h-full w-full justify-center"
                  onFilesAccepted={handleFilesAccepted} 
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                  maxFiles={1}
                  title="Drag & drop an image to resize"
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
                className="flex-1 flex flex-col w-full"
              >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 px-1">
                <div className="flex flex-col">
                  <h3 className="font-medium text-foreground text-sm truncate max-w-[300px]" title={image.name}>{image.name}</h3>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Original: {originalSize.w} × {originalSize.h} px</p>
                </div>
                <div className="self-start md:self-auto bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-2">
                  Result: {width} × {height} px
                </div>
              </div>
              
              <motion.div layout className="w-full min-h-[300px] bg-muted/10 rounded-xl border border-border p-4 md:p-6 relative flex items-center justify-center">
                {/* Visual feedback of bounding box */}
                <motion.div layout className="relative flex items-center justify-center max-w-full transition-all duration-500 ease-out">
                  {/* Invisible SVG spacer scaled to 4000px max dimension so it ALWAYS expands to fill the screen bounds (max-w-full and max-h) without being a tiny dot for small dimensions */}
                  <img 
                    src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${Math.round(((width > 0 ? width : 1) / Math.max(width > 0 ? width : 1, height > 0 ? height : 1)) * 4000)}' height='${Math.round(((height > 0 ? height : 1) / Math.max(width > 0 ? width : 1, height > 0 ? height : 1)) * 4000)}' viewBox='0 0 ${width > 0 ? width : 1} ${height > 0 ? height : 1}'%3E%3C/svg%3E`}
                    alt="spacer"
                    className="max-w-full opacity-0 pointer-events-none block transition-all duration-500 ease-out"
                    style={{ maxHeight: '65vh' }}
                  />
                  <motion.div layout className="absolute inset-0 bg-black/20 dark:bg-black/40 shadow-2xl transition-all duration-500 ease-out overflow-hidden">
                    <motion.img 
                      layout
                      src={image.url} 
                      alt="Preview" 
                      className="w-full h-full object-fill drop-shadow-md"
                    />
                    {!maintainRatio && (
                      <motion.div layout className="absolute inset-0 border-[3px] border-red-500 border-dashed pointer-events-none z-10 shadow-[inset_0_0_30px_rgba(239,68,68,0.4)]"></motion.div>
                    )}
                    {maintainRatio && (
                      <motion.div layout className="absolute inset-0 border-2 border-emerald-500/20 pointer-events-none z-10"></motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!image ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={18} className="text-muted-foreground" /> Dimensions
              </h3>
              
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Width (px)</label>
                  <input 
                    type="number" 
                    value={width || ''}
                    onChange={handleWidthChange}
                    className="w-full p-3 bg-background border border-border rounded-xl text-base font-mono text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                  />
                </div>
                
                <button 
                  onClick={() => setMaintainRatio(!maintainRatio)}
                  className={`p-3 mb-[1px] rounded-lg transition-colors border ${maintainRatio ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-muted border-border text-muted-foreground hover:bg-border'}`}
                  title={maintainRatio ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                >
                  {maintainRatio ? <Lock size={18} /> : <Unlock size={18} />}
                </button>

                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Height (px)</label>
                  <input 
                    type="number" 
                    value={height || ''}
                    onChange={handleHeightChange}
                    className="w-full p-3 bg-background border border-border rounded-xl text-base font-mono text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Scale */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">Quick Scale</label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 150, 200].map(pct => (
                  <button
                    key={pct}
                    onClick={() => scaleByPercentage(pct)}
                    disabled={!image}
                    className={`py-2 border rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${
                      activeScale === pct 
                        ? 'bg-foreground border-foreground text-background shadow-sm' 
                        : 'bg-muted/50 hover:bg-muted border-border text-foreground'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5 flex items-center gap-2">
                <ImageIcon size={14} /> Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.name, preset.w, preset.h)}
                    disabled={!image}
                    className={`p-2.5 border rounded-md text-left transition-colors flex flex-col disabled:opacity-50 ${
                      activePreset === preset.name 
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' 
                        : 'bg-muted/30 hover:bg-muted border-border'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${activePreset === preset.name ? 'text-emerald-600' : 'text-foreground'}`}>
                      {preset.name}
                    </span>
                    <span className={`text-xs ${activePreset === preset.name ? 'text-emerald-600/70' : 'text-muted-foreground'}`}>
                      {preset.w} × {preset.h}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-3">
              <button 
                onClick={processResize}
                disabled={!image || isProcessing || downloadState !== 'idle'}
                className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                  downloadState === 'downloaded' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
                }`}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {downloadState === 'downloaded' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Downloaded!
                    </motion.div>
                  ) : downloadState === 'downloading' ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
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
                      <Download size={20} />
                      Download Resized
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              <button 
                onClick={clear}
                disabled={!image || isProcessing || downloadState !== 'idle'}
                className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <RefreshCw size={18} /> Upload New
              </button>
            </div>
          </div>
        </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageResizer;
