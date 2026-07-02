import { useState, useRef, useEffect } from 'react';
import { Maximize, Download, RefreshCw, Lock, Unlock, Settings2, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const SOCIAL_PRESETS = [
  { name: 'Insta Square', w: 1080, h: 1080 },
  { name: 'Insta Portrait', w: 1080, h: 1350 },
  { name: 'Insta Story', w: 1080, h: 1920 },
  { name: 'FB Story', w: 1080, h: 1920 },
  { name: 'WA Status', w: 1080, h: 1920 },
  { name: 'YT Shorts', w: 1080, h: 1920 },
  { name: 'YouTube Thumb', w: 1280, h: 720 },
  { name: 'Twitter Post', w: 1200, h: 675 },
  { name: 'Facebook Cover', w: 820, h: 312 },
  { name: 'LinkedIn Cover', w: 1584, h: 396 },
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
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-lg shadow-sm flex flex-col">
          {!image ? (
            <div className="flex flex-col justify-center min-h-[300px] md:min-h-[350px]">
              <DropzoneComponent 
                onFilesAccepted={handleFilesAccepted} 
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                maxFiles={1}
                title="Drag & drop an image to resize"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 px-1">
                <div className="flex flex-col">
                  <h3 className="font-medium text-foreground text-sm truncate max-w-[300px]" title={image.name}>{image.name}</h3>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Original: {originalSize.w} × {originalSize.h} px</p>
                </div>
                <div className="self-start md:self-auto bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-2">
                  Result: {width} × {height} px
                </div>
              </div>
              
              <div className="w-full h-[60vh] min-h-[300px] max-h-[700px] bg-muted/10 rounded-xl border border-border p-4 md:p-6 relative flex items-center justify-center">
                {/* Visual feedback of bounding box */}
                <div 
                  className="relative flex items-center justify-center bg-black/20 dark:bg-black/40 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
                  style={{
                    aspectRatio: `${width > 0 ? width : 1} / ${height > 0 ? height : 1}`,
                    width: width >= height ? '100%' : 'auto',
                    height: height >= width ? '100%' : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                >
                  <img 
                    src={image.url} 
                    alt="Preview" 
                    className="w-full h-full object-fill drop-shadow-md"
                  />
                  {!maintainRatio && (
                    <div className="absolute inset-0 border-[3px] border-red-500 border-dashed pointer-events-none z-10 shadow-[inset_0_0_30px_rgba(239,68,68,0.4)]"></div>
                  )}
                  {maintainRatio && (
                    <div className="absolute inset-0 border-2 border-emerald-500/20 pointer-events-none z-10"></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-4">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-5">
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={18} className="text-muted-foreground" /> Dimensions
              </h3>
              
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Width (px)</label>
                  <input 
                    type="number" 
                    value={width || ''}
                    onChange={handleWidthChange}
                    className="w-full bg-background border border-border rounded-lg p-3 text-base font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                    className="w-full bg-background border border-border rounded-lg p-3 text-base font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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

            {/* Social Presets */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5 flex items-center gap-2">
                <ImageIcon size={14} /> Social Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_PRESETS.map(preset => (
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
              className={`w-full py-3.5 font-bold text-base rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-80 ${
                downloadState === 'downloaded' 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg scale-[0.98]' 
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
            >
              {downloadState === 'idle' && <><Download size={18} /> Download Resized</>}
              {downloadState === 'downloading' && <><Loader2 size={18} className="animate-spin" /> Processing...</>}
              {downloadState === 'downloaded' && <><Check size={18} /> Downloaded!</>}
            </button>
            
            <button 
              onClick={clear}
              disabled={!image || isProcessing || downloadState !== 'idle'}
              className="w-full py-3.5 bg-muted/50 border border-border text-foreground font-bold text-base rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
