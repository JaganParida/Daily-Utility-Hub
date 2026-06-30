import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Download, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const ImageCollage = () => {
  const [images, setImages] = useState([]); // Array of ObjectURLs
  const [layout, setLayout] = useState('grid'); // grid, horizontal, vertical
  const [gap, setGap] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [collageBlob, setCollageBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);
  
  // Debounce ref
  const timeoutRef = useRef(null);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 9)); // Max 9 images
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index]);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  useEffect(() => {
    if (images.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        generateCollage();
      }, 500);
    } else {
      setCollageBlob(null);
    }
  }, [images, layout, gap, bgColor]);

  const generateCollage = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load all images
    const loadedImages = await Promise.all(images.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    }));

    // Calculate dimensions based on layout
    const targetSize = 800; // Base size for cells
    let canvasWidth, canvasHeight;
    const num = loadedImages.length;

    if (layout === 'horizontal') {
      canvasWidth = (targetSize * num) + (gap * (num + 1));
      canvasHeight = targetSize + (gap * 2);
    } else if (layout === 'vertical') {
      canvasWidth = targetSize + (gap * 2);
      canvasHeight = (targetSize * num) + (gap * (num + 1));
    } else {
      // Grid
      let cols = Math.ceil(Math.sqrt(num));
      let rows = Math.ceil(num / cols);
      // For exactly 3 images, 3x1 looks weird, let's do 2x2 grid with empty spot
      if (num === 3) { cols = 2; rows = 2; }
      
      canvasWidth = (cols * targetSize) + (gap * (cols + 1));
      canvasHeight = (rows * targetSize) + (gap * (rows + 1));
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Images
    let currentX = gap;
    let currentY = gap;
    
    let cols = layout === 'grid' ? (num === 3 ? 2 : Math.ceil(Math.sqrt(num))) : (layout === 'horizontal' ? num : 1);

    loadedImages.forEach((img, i) => {
      // Calculate aspect ratio crop (cover)
      const aspect = img.width / img.height;
      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0, sy = 0;

      // Crop to square for targetSize
      if (aspect > 1) {
        sWidth = img.height;
        sx = (img.width - img.height) / 2;
      } else {
        sHeight = img.width;
        sy = (img.height - img.width) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, currentX, currentY, targetSize, targetSize);

      if (layout === 'horizontal') {
        currentX += targetSize + gap;
      } else if (layout === 'vertical') {
        currentY += targetSize + gap;
      } else {
        // Grid
        currentX += targetSize + gap;
        if ((i + 1) % cols === 0) {
          currentX = gap;
          currentY += targetSize + gap;
        }
      }
    });

    canvas.toBlob((blob) => {
      setCollageBlob(blob);
      setIsGenerating(false);
    }, 'image/jpeg', 0.95);
  };

  const handleDownload = () => {
    if (!collageBlob) return;
    const url = URL.createObjectURL(collageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collage_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    images.forEach(src => URL.revokeObjectURL(src));
    setImages([]);
    setCollageBlob(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg shadow-sm">
          <LayoutGrid size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Collage Maker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Combine multiple images into stunning grid collages instantly.</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        
        {/* Main Preview Area */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col space-y-6 min-h-[500px]">
          
          {images.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <DropzoneComponent 
                onFilesAccepted={handleFilesAccepted} 
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                maxFiles={9}
                title="Drag & drop up to 9 images"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Collage Preview</h3>
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">{images.length}/9 Images</span>
              </div>
              
              <div className="w-full flex-1 bg-muted/30 rounded-xl p-4 border border-border/50 flex items-center justify-center relative overflow-hidden">
                {collageBlob ? (
                  <img 
                    src={URL.createObjectURL(collageBlob)} 
                    alt="Collage" 
                    className={`max-h-[600px] max-w-full object-contain shadow-md transition-opacity duration-300 ${isGenerating ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                  />
                ) : (
                  <div className="text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="animate-spin" />
                    <span className="text-sm">Generating Collage...</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Thumbnails to manage images */}
          {images.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img src={src} className="w-16 h-16 object-cover rounded-md border border-border shadow-sm" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 9 && (
                  <label className="w-16 h-16 shrink-0 border-2 border-dashed border-border rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                    <span className="text-2xl font-light">+</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleFilesAccepted(e.target.files)} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Settings2 size={16} /> Collage Settings
            </h3>
            
            <div className="space-y-6">
              
              {/* Layout Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Layout Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-lg border border-border">
                  <button 
                    onClick={() => setLayout('grid')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setLayout('horizontal')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'horizontal' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Row
                  </button>
                  <button 
                    onClick={() => setLayout('vertical')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'vertical' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Col
                  </button>
                </div>
              </div>

              {/* Gap Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Spacing (Gap)</label>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{gap}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Background Color</label>
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)} 
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                  />
                  <input 
                    type="text" 
                    value={bgColor.toUpperCase()}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleDownload}
              disabled={!collageBlob || isGenerating}
              className="w-full py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-yellow-500/20 disabled:opacity-50"
            >
              <Download size={18} /> Download Collage
            </button>
            
            <button 
              onClick={clear}
              className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCollage;
