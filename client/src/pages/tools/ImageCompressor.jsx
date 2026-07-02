import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Settings2, ArrowRight, ArrowRightLeft } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';

const ImageCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Advanced Settings
  const [strategy, setStrategy] = useState('quality'); // 'quality' or 'size'
  const [quality, setQuality] = useState(80); // 1-100
  const [targetSize, setTargetSize] = useState(500);
  const [sizeUnit, setSizeUnit] = useState('KB'); // 'KB' or 'MB'
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(4000);
  
  // Debounce ref
  const timeoutRef = useRef(null);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    setOriginalFile(files[0]);
    setCompressedFile(null);
    
    // Auto-set target size to 50% of original as a good default
    const originalKb = files[0].size / 1024;
    if (originalKb > 1024) {
      setTargetSize(Number((originalKb / 1024 / 2).toFixed(2)));
      setSizeUnit('MB');
    } else {
      setTargetSize(Number((originalKb / 2).toFixed(0)));
      setSizeUnit('KB');
    }
  };

  // Auto-compress when settings change
  useEffect(() => {
    if (originalFile) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        compressImage();
      }, 600); // 600ms debounce
    }
  }, [originalFile, quality, targetSize, sizeUnit, strategy, maxWidthOrHeight]);

  const compressImage = async () => {
    if (!originalFile) return;
    if (strategy === 'size' && (!targetSize || targetSize <= 0)) return;

    setIsCompressing(true);
    
    let options = {
      maxWidthOrHeight: Number(maxWidthOrHeight),
      useWebWorker: true,
    };

    if (strategy === 'quality') {
      options.initialQuality = quality / 100;
      // Provide a high max size so it relies mostly on quality
      options.maxSizeMB = 50; 
    } else {
      // Strategy: Size
      options.maxSizeMB = sizeUnit === 'MB' ? Number(targetSize) : Number(targetSize) / 1024;
      options.maxIteration = 20; // Give the algorithm more attempts to hit extreme targets like 100KB
    }

    try {
      const compressed = await imageCompression(originalFile, options);
      setCompressedFile(compressed);
    } catch (error) {
      console.error(error);
      toast.error('Error compressing image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setOriginalFile(null);
    setCompressedFile(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const getSavings = () => {
    if (!originalFile || !compressedFile) return 0;
    const savings = ((originalFile.size - compressedFile.size) / originalFile.size) * 100;
    return savings > 0 ? Math.round(savings) : 0;
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-md shadow-sm">
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Image Compressor</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Real-time compression targeting exact file sizes or quality.</p>
        </div>
      </div>

      {!originalFile ? (
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
          maxFiles={1}
          title="Drag & drop an image to compress"
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          
          {/* Main Preview Area */}
          <div className="flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-lg shadow-sm flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center w-full">
              
              {/* Original */}
              <div className="flex flex-col items-center w-full min-w-0">
                <div className="flex justify-between items-center w-full mb-3 px-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Original</h3>
                  <span className="text-base font-semibold text-foreground">{(originalFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="w-full h-auto max-h-[400px] min-h-[200px] bg-muted/20 rounded-xl p-2 border border-border flex items-center justify-center overflow-hidden relative group">
                  <img 
                    src={URL.createObjectURL(originalFile)} 
                    alt="Original" 
                    className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="font-medium text-muted-foreground text-sm truncate w-full text-center mt-4 px-2" title={originalFile.name}>
                  {originalFile.name}
                </p>
              </div>

              {/* Separator / Arrow (Hidden on very small screens, visible on md+) */}
              <div className="hidden md:flex flex-col items-center justify-center text-muted-foreground">
                <ArrowRightLeft size={20} className="opacity-50" />
              </div>

              {/* Compressed */}
              <div className="flex flex-col items-center w-full min-w-0">
                <div className="flex justify-between items-center w-full mb-3 px-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    Result {isCompressing && <RefreshCw size={14} className="animate-spin" />}
                  </h3>
                  <span className={`text-base font-bold transition-colors ${compressedFile ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {compressedFile ? `${(compressedFile.size / 1024).toFixed(1)} KB` : '...'}
                  </span>
                </div>
                <div className="w-full h-auto max-h-[400px] min-h-[200px] bg-emerald-500/5 rounded-xl p-2 border border-emerald-500/20 flex items-center justify-center relative overflow-hidden group">
                  {compressedFile ? (
                    <img 
                      src={URL.createObjectURL(compressedFile)} 
                      alt="Compressed" 
                      className={`max-h-full max-w-full object-contain drop-shadow-sm transition-all duration-500 group-hover:scale-105 ${isCompressing ? 'opacity-50 blur-sm scale-95' : 'opacity-100 scale-100'}`}
                    />
                  ) : (
                    <div className="text-emerald-600/50 flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="animate-spin" />
                    </div>
                  )}
                </div>
                <div className="w-full flex items-center justify-between mt-4 px-2">
                  <p className="font-medium text-muted-foreground text-sm truncate max-w-[200px]" title={originalFile.name}>
                    {compressedFile ? `min_${originalFile.name}` : 'Processing...'}
                  </p>
                  {compressedFile && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                      -{getSavings()}%
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2 border-b border-border pb-4">
                <Settings2 size={18} className="text-muted-foreground" /> Compression Settings
              </h3>
              
              <div className="space-y-7">
                
                {/* Strategy Tabs */}
                <div className="flex bg-muted/40 rounded-lg border border-border p-1">
                  <button 
                    onClick={() => setStrategy('size')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${strategy === 'size' ? 'bg-background shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
                  >
                    Target Size
                  </button>
                  <button 
                    onClick={() => setStrategy('quality')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${strategy === 'quality' ? 'bg-background shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
                  >
                    Target Quality
                  </button>
                </div>

                {/* Strategy Context Controls */}
                {strategy === 'size' ? (
                  <div className="space-y-3 animate-in fade-in">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max File Size</label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={targetSize}
                        onChange={(e) => setTargetSize(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-lg text-base text-foreground focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                      />
                      <select 
                        value={sizeUnit}
                        onChange={(e) => setSizeUnit(e.target.value)}
                        className="p-3 bg-background border border-border rounded-lg text-base text-foreground focus:ring-1 focus:ring-primary outline-none transition-all font-medium w-24 shrink-0"
                      >
                         <option value="KB">KB</option>
                         <option value="MB">MB</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quality Level</label>
                      <span className="text-sm font-bold text-foreground">{quality}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}

                {/* Max Dimensions */}
                <div className="pt-5 border-t border-border">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Max Dimensions</label>
                  <select 
                    value={maxWidthOrHeight}
                    onChange={(e) => setMaxWidthOrHeight(Number(e.target.value))}
                    className="w-full p-3 bg-background border border-border rounded-lg text-base text-foreground focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                  >
                    <option value={4000}>Original (No scaling)</option>
                    <option value={1920}>1920px (Full HD)</option>
                    <option value={1280}>1280px (HD)</option>
                    <option value={800}>800px (Web Optimized)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownload}
                disabled={!compressedFile || isCompressing}
                className="w-full py-3.5 bg-foreground text-background font-bold text-base rounded-lg hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} /> Download
              </button>
              
              <button 
                onClick={clear}
                className="w-full py-3.5 bg-muted/50 border border-border text-foreground font-bold text-base rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Upload New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
