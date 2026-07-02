import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Download, Image as ImageIcon, RefreshCw, Loader2, Check, ArrowRightLeft, Settings2, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';

const ImageCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle', 'downloading', 'downloaded'
  
  // Preview Object URLs (tracked in state to prevent memory leaks)
  const [originalUrl, setOriginalUrl] = useState('');
  const [compressedUrl, setCompressedUrl] = useState('');

  // Handle original file object URL lifecycle
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalUrl('');
    }
  }, [originalFile]);

  // Handle compressed file object URL lifecycle
  useEffect(() => {
    if (compressedFile) {
      const url = URL.createObjectURL(compressedFile);
      setCompressedUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCompressedUrl('');
    }
  }, [compressedFile]);
  
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
    if (!compressedUrl) return;
    
    setDownloadState('downloading');
    
    // Simulate processing time for better UX state feedback
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = compressedUrl;
      link.download = `compressed_${originalFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadState('downloaded');
      toast.success('Image downloaded successfully!');
      
      setTimeout(() => {
        setDownloadState('idle');
      }, 2500);
    }, 600);
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

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Area / Workspace */}
        <motion.div 
          layout 
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!originalFile ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!originalFile ? (
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
                  onFilesAccepted={handleFilesAccepted} 
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                  maxFiles={1}
                  title="Drag & drop an image to compress"
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
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center w-full min-h-0"
              >
                
                {/* Original */}
                <div className="flex flex-col items-center w-full min-w-0">
                  <div className="flex justify-between items-center w-full mb-3 px-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Original</h3>
                    <span className="text-base font-semibold text-foreground">{(originalFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="w-full h-auto max-h-[400px] min-h-[200px] bg-muted/20 rounded-xl p-2 border border-border flex items-center justify-center overflow-hidden relative group">
                    <img 
                      src={originalUrl} 
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
                    {compressedUrl ? (
                      <img 
                        src={compressedUrl} 
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

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
            <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!originalFile ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={16} /> Compression Settings
              </h3>
              
              <div className="space-y-6">
                
                {/* Strategy Tabs */}
                <div className="flex p-1.5 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
                  {['size', 'quality'].map((mode) => (
                    <button 
                      key={mode}
                      onClick={() => setStrategy(mode)}
                      className={`flex-1 relative z-10 py-2.5 text-sm font-bold rounded-lg transition-colors ${strategy === mode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {strategy === mode && (
                        <motion.div layoutId="strategy-active" className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10" />
                      )}
                      {mode === 'size' ? 'Target Size' : 'Target Quality'}
                    </button>
                  ))}
                </div>

                {/* Strategy Context Controls */}
                {strategy === 'size' ? (
                  <div className="space-y-3 animate-in fade-in">
                    <label className="text-sm font-semibold text-foreground">Max File Size</label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={targetSize}
                        onChange={(e) => setTargetSize(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono shadow-sm"
                      />
                      <div className="relative group w-28 shrink-0">
                        <select 
                          value={sizeUnit}
                          onChange={(e) => setSizeUnit(e.target.value)}
                          className="w-full appearance-none p-3 pl-4 pr-8 bg-muted/20 border border-border/50 group-hover:border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all font-semibold cursor-pointer shadow-sm"
                        >
                           <option value="KB" className="bg-background text-foreground">KB</option>
                           <option value="MB" className="bg-background text-foreground">MB</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-foreground">Quality Level</label>
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{quality}%</span>
                    </div>
                    <div className="relative group pt-2 pb-2">
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none transition-all"
                        style={{
                          background: `linear-gradient(to right, var(--primary) ${quality}%, var(--muted) ${quality}%)`,
                        }}
                      />
                      <style dangerouslySetInnerHTML={{__html: `
                        input[type=range]::-webkit-slider-thumb {
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: white;
                          border: 2px solid var(--primary);
                          cursor: pointer;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                          transition: transform 0.1s;
                        }
                        input[type=range]:hover::-webkit-slider-thumb {
                          transform: scale(1.15);
                        }
                      `}} />
                    </div>
                  </div>
                )}

                {/* Max Dimensions */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <label className="text-sm font-semibold text-foreground">Max Dimensions</label>
                  <div className="relative group">
                    <select 
                      value={maxWidthOrHeight}
                      onChange={(e) => setMaxWidthOrHeight(Number(e.target.value))}
                      className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value={4000} className="bg-background text-foreground">Original (No scaling)</option>
                      <option value={1920} className="bg-background text-foreground">1920px (Full HD)</option>
                      <option value={1280} className="bg-background text-foreground">1280px (HD)</option>
                      <option value={800} className="bg-background text-foreground">800px (Web Optimized)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownload}
                disabled={!compressedFile || isCompressing || downloadState !== 'idle'}
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
                      Downloading...
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
                      Download Image
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              <button 
                onClick={clear}
                disabled={isCompressing || !originalFile}
                className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <RefreshCw size={18} /> Upload New
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ImageCompressor;
