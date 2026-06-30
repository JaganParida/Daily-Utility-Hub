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
  const [quality, setQuality] = useState(80); // 1-100
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  
  // Debounce ref
  const timeoutRef = useRef(null);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    setOriginalFile(files[0]);
    setCompressedFile(null);
  };

  // Auto-compress when settings change
  useEffect(() => {
    if (originalFile) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        compressImage();
      }, 500); // 500ms debounce
    }
  }, [originalFile, quality, maxWidthOrHeight]);

  const compressImage = async () => {
    if (!originalFile) return;

    setIsCompressing(true);
    
    // Map 1-100 quality to 0.1 - 1.0 initialQuality
    const initialQuality = quality / 100;
    // Map quality to a max size (rough estimate: 100 = 5MB, 1 = 0.05MB)
    const maxSizeMB = Math.max(0.05, (quality / 100) * 5);

    const options = {
      maxSizeMB,
      maxWidthOrHeight: Number(maxWidthOrHeight),
      initialQuality,
      useWebWorker: true,
    };

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
          <p className="text-muted-foreground mt-1 text-sm">Real-time client-side compression with quality controls and live preview.</p>
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
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Settings2 size={16} /> Compression Settings
              </h3>
              
              <div className="space-y-6">
                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-foreground">Target Quality</label>
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

                {/* Max Dimensions */}
                <div>
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
