import { useState, useRef, useEffect } from 'react';
import { Maximize, Download, RefreshCw, Lock, Unlock, Settings2, Image as ImageIcon } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const SOCIAL_PRESETS = [
  { name: 'Insta Square', w: 1080, h: 1080 },
  { name: 'Insta Portrait', w: 1080, h: 1350 },
  { name: 'Insta Story', w: 1080, h: 1920 },
  { name: 'YouTube Thumb', w: 1280, h: 720 },
  { name: 'Twitter Post', w: 1200, h: 675 },
  { name: 'Facebook Cover', w: 820, h: 312 },
];

const ImageResizer = () => {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [originalRatio, setOriginalRatio] = useState(1);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });

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
    };
    img.src = url;
  };

  const handleWidthChange = (e) => {
    const val = Number(e.target.value);
    setWidth(val);
    if (maintainRatio && val > 0) {
      setHeight(Math.round(val / originalRatio));
    }
  };

  const handleHeightChange = (e) => {
    const val = Number(e.target.value);
    setHeight(val);
    if (maintainRatio && val > 0) {
      setWidth(Math.round(val * originalRatio));
    }
  };

  const applyPreset = (w, h) => {
    setWidth(w);
    setHeight(h);
    // When applying a preset, we often want exactly those dimensions
    setMaintainRatio(false); 
  };

  const scaleByPercentage = (percent) => {
    const factor = percent / 100;
    setWidth(Math.round(originalSize.w * factor));
    setHeight(Math.round(originalSize.h * factor));
  };

  const processResize = async () => {
    if (!image || width <= 0 || height <= 0) return;
    setIsProcessing(true);
    
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
      
      toast.success('Image resized and downloaded!');
    } catch (error) {
      console.error(error);
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
          <Maximize size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Image Resizer</h1>
          <p className="text-muted-foreground mt-1 text-sm">Resize images with precise dimensions, aspect ratio lock, or social presets.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        
        {/* Preview Area */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
          {!image ? (
            <div className="flex-1 flex flex-col justify-center">
              <DropzoneComponent 
                onFilesAccepted={handleFilesAccepted} 
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                maxFiles={1}
                title="Drag & drop an image to resize"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium text-foreground">{image.name}</h3>
                  <p className="text-sm text-muted-foreground">Original: {originalSize.w} × {originalSize.h} px</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-md font-bold text-sm">
                  {width} × {height} px
                </div>
              </div>
              
              <div className="flex-1 bg-muted/10 rounded-xl border border-border flex items-center justify-center p-4 overflow-hidden relative">
                {/* Visual feedback of bounding box */}
                <div 
                  className="relative flex items-center justify-center"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: `${width}px`,
                    maxHeight: `${height}px`,
                  }}
                >
                  <img 
                    src={image.url} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain drop-shadow-md"
                    style={{
                      // If aspect ratio is broken, show it visually
                      width: !maintainRatio ? '100%' : 'auto',
                      height: !maintainRatio ? '100%' : 'auto',
                    }}
                  />
                  {!maintainRatio && (
                    <div className="absolute inset-0 border-2 border-red-500 border-dashed opacity-50 pointer-events-none rounded-sm"></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={16} /> Dimensions
              </h3>
              
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground">Width (px)</label>
                  <input 
                    type="number" 
                    value={width || ''}
                    onChange={handleWidthChange}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                
                <button 
                  onClick={() => setMaintainRatio(!maintainRatio)}
                  className={`p-2.5 mb-[1px] rounded-lg transition-colors border ${maintainRatio ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-muted border-border text-muted-foreground hover:bg-border'}`}
                  title={maintainRatio ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                >
                  {maintainRatio ? <Lock size={18} /> : <Unlock size={18} />}
                </button>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground">Height (px)</label>
                  <input 
                    type="number" 
                    value={height || ''}
                    onChange={handleHeightChange}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Quick Scale */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Quick Scale</label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 150, 200].map(pct => (
                  <button
                    key={pct}
                    onClick={() => scaleByPercentage(pct)}
                    disabled={!image}
                    className="py-1.5 bg-muted hover:bg-border border border-border rounded-md text-xs font-medium text-foreground transition-colors disabled:opacity-50"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Social Presets */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <ImageIcon size={14} /> Social Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.w, preset.h)}
                    disabled={!image}
                    className="p-2 bg-muted hover:bg-border border border-border rounded-md text-xs font-medium text-foreground text-left transition-colors flex flex-col disabled:opacity-50"
                  >
                    <span>{preset.name}</span>
                    <span className="text-muted-foreground text-[10px]">{preset.w} × {preset.h}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-3">
            <button 
              onClick={processResize}
              disabled={!image || isProcessing}
              className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              Download Resized
            </button>
            <button 
              onClick={clear}
              disabled={!image || isProcessing}
              className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} /> Start Over
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
