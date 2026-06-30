import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Settings2, ArrowRight } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
          <ImageIcon size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Image Compressor</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time compression targeting exact file sizes or quality.</p>
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
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          
          {/* Main Preview Area */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col space-y-6">
            <div className="grid md:grid-cols-2 gap-4 flex-1">
              {/* Original */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Original</h3>
                <div className="w-full h-64 bg-muted/30 rounded-xl p-2 border border-border/50 flex items-center justify-center">
                  <img 
                    src={URL.createObjectURL(originalFile)} 
                    alt="Original" 
                    className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{originalFile.name}</p>
                  <p className="text-xl font-bold text-muted-foreground mt-1">
                    {(originalFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Compressed */}
              <div className="flex flex-col items-center relative">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                  Compressed Result {isCompressing && <RefreshCw size={14} className="animate-spin" />}
                </h3>
                <div className="w-full h-64 bg-emerald-500/5 rounded-xl p-2 border border-emerald-500/20 flex items-center justify-center relative overflow-hidden">
                  {compressedFile ? (
                    <img 
                      src={URL.createObjectURL(compressedFile)} 
                      alt="Compressed" 
                      className={`max-h-full max-w-full object-contain rounded-lg shadow-sm transition-opacity duration-300 ${isCompressing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                    />
                  ) : (
                    <div className="text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="font-medium text-foreground text-sm truncate max-w-[200px]">
                    {compressedFile ? `min_${originalFile.name}` : '...'}
                  </p>
                  {compressedFile && (
                    <>
                      <p className="text-xl font-bold text-emerald-500 mt-1">
                        {(compressedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wide">
                        <ArrowRight size={12} /> {getSavings()}% Smaller
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={16} /> Strategy
              </h3>
              
              <div className="space-y-6">
                
                {/* Strategy Tabs */}
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border">
                  <button 
                    onClick={() => setStrategy('size')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${strategy === 'size' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Target Size
                  </button>
                  <button 
                    onClick={() => setStrategy('quality')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${strategy === 'quality' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Target Quality
                  </button>
                </div>

                {/* Strategy Context Controls */}
                {strategy === 'size' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-foreground">Maximum File Size</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={targetSize}
                        onChange={(e) => setTargetSize(e.target.value)}
                        className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                      />
                      <select 
                        value={sizeUnit}
                        onChange={(e) => setSizeUnit(e.target.value)}
                        className="p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-medium w-24 shrink-0"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Algorithm will compress until the file is below this size.</p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-foreground">Quality Level</label>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{quality}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                      <span>Smaller Size</span>
                      <span>Better Quality</span>
                    </div>
                  </div>
                )}

                {/* Max Dimensions */}
                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-medium text-foreground mb-2">Max Width / Height</label>
                  <select 
                    value={maxWidthOrHeight}
                    onChange={(e) => setMaxWidthOrHeight(Number(e.target.value))}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
                  >
                    <option value={4000}>Original (No scaling)</option>
                    <option value={1920}>1920px (Full HD)</option>
                    <option value={1280}>1280px (HD)</option>
                    <option value={800}>800px (Web Optimized)</option>
                    <option value={400}>400px (Thumbnail)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleDownload}
                disabled={!compressedFile || isCompressing}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
              >
                <Download size={18} /> Download Image
              </button>
              
              <button 
                onClick={clear}
                className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Upload Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
