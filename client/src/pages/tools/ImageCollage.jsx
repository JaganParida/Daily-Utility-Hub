import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Download, RefreshCw, Settings2, Trash2, Move, ZoomIn, Check } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

const ImageCollage = () => {
  const [images, setImages] = useState([]); // { id, url, scale, x, y }
  const [layout, setLayout] = useState('default');
  const [gap, setGap] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  
  const collageRef = useRef(null);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const newImages = Array.from(files).map((file, i) => ({
      id: Date.now() + i,
      url: URL.createObjectURL(file),
      scale: 1,
      x: 50, // percentage 0-100 (50 is center)
      y: 50
    }));
    
    setImages(prev => {
      const combined = [...prev, ...newImages].slice(0, 9);
      return combined;
    });
    setLayout('default'); // reset layout on add
    setActiveIndex(null);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].url);
      newImgs.splice(index, 1);
      return newImgs;
    });
    if (activeIndex === index) setActiveIndex(null);
  };

  const updateActiveImage = (key, value) => {
    if (activeIndex === null) return;
    setImages(prev => {
      const newImgs = [...prev];
      newImgs[activeIndex] = { ...newImgs[activeIndex], [key]: value };
      return newImgs;
    });
  };

  const generateDownload = async () => {
    if (!collageRef.current || images.length === 0) return;
    setIsGenerating(true);
    
    // Deselect before taking screenshot to hide selection borders
    const previousActive = activeIndex;
    setActiveIndex(null);
    
    // Give state time to update and remove borders
    await new Promise(res => setTimeout(res, 100));

    try {
      const canvas = await html2canvas(collageRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: bgColor
      });
      
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collage_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Collage downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate collage', error);
      toast.error('Failed to generate collage');
    } finally {
      setActiveIndex(previousActive);
      setIsGenerating(false);
    }
  };

  const clear = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setActiveIndex(null);
  };

  // Dynamic layout engine
  const getLayoutGridClass = () => {
    const len = images.length;
    if (len === 1) return 'grid-cols-1';
    if (len === 2) return layout === 'horizontal' ? 'grid-rows-2' : 'grid-cols-2';
    if (len === 3) return layout === 'large-left' ? 'grid-cols-2 grid-rows-2' : (layout === 'row' ? 'grid-rows-3' : 'grid-cols-3');
    if (len === 4) return layout === 'row' ? 'grid-rows-4' : 'grid-cols-2 grid-rows-2';
    if (len > 4 && len <= 6) return 'grid-cols-3 grid-rows-2';
    if (len > 6) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-2';
  };

  const getCellClass = (index, total) => {
    if (total === 3 && layout === 'large-left') {
      if (index === 0) return 'row-span-2 col-span-1';
      return 'col-span-1 row-span-1';
    }
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg shadow-sm">
          <LayoutGrid size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Collage Maker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Interactive templates. Click any photo to adjust pan and zoom.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        
        {/* Main Preview Area */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col space-y-6 min-h-[600px]">
          
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interactive Preview</h3>
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">{images.length}/9 Images</span>
              </div>
              
              <div className="flex-1 w-full bg-muted/10 rounded-xl border border-border/50 flex flex-col items-center justify-center p-4 overflow-hidden relative">
                
                {/* The actual Collage DOM Node to be screenshotted */}
                <div 
                  ref={collageRef}
                  className={`grid w-full aspect-square md:aspect-[4/3] overflow-hidden ${getLayoutGridClass()}`}
                  style={{ gap: `${gap}px`, backgroundColor: bgColor, padding: `${gap}px` }}
                >
                  {images.map((img, idx) => (
                    <div 
                      key={img.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative overflow-hidden cursor-pointer group ${getCellClass(idx, images.length)} ${activeIndex === idx ? 'ring-4 ring-primary ring-inset z-10' : ''}`}
                    >
                      <img 
                        src={img.url} 
                        alt="collage piece"
                        className="w-full h-full object-cover transition-transform origin-center pointer-events-none"
                        style={{
                          transform: `scale(${img.scale}) translate(${(img.x - 50)}%, ${(img.y - 50)}%)`,
                          // object position acts as a base offset
                          objectPosition: 'center', 
                        }}
                      />
                      {/* Overlay on hover for discoverability */}
                      {activeIndex !== idx && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Move size={32} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
                    <RefreshCw size={32} className="animate-spin text-primary mb-4" />
                    <p className="font-bold text-foreground">Rendering High-Res Image...</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Thumbnails to manage images */}
          {images.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div 
                    key={img.id} 
                    className={`relative group shrink-0 cursor-pointer rounded-md border-2 transition-colors ${activeIndex === idx ? 'border-primary' : 'border-border'}`}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img src={img.url} className="w-14 h-14 object-cover rounded-sm shadow-sm" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 9 && (
                  <label className="w-14 h-14 shrink-0 border-2 border-dashed border-border rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
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
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            
            {/* Global Settings */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={16} /> Global Settings
              </h3>
              
              <div className="space-y-5">
                
                {/* Smart Layouts */}
                {images.length >= 2 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Template Layout</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg border border-border">
                      <button 
                        onClick={() => setLayout('default')}
                        className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'default' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Default Grid
                      </button>
                      
                      {images.length === 2 && (
                        <button 
                          onClick={() => setLayout('horizontal')}
                          className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'horizontal' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Split Horizontal
                        </button>
                      )}

                      {images.length === 3 && (
                        <button 
                          onClick={() => setLayout('large-left')}
                          className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'large-left' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Large Left
                        </button>
                      )}

                      {(images.length === 3 || images.length === 4) && (
                        <button 
                          onClick={() => setLayout('row')}
                          className={`py-2 text-sm font-medium rounded-md transition-all ${layout === 'row' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Rows
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Gap Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Border Gap</label>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{gap}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
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

            {/* Individual Image Adjustment */}
            <div className={`transition-opacity duration-300 ${activeIndex !== null ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center justify-between border-b border-border pb-3">
                <span className="flex items-center gap-2"><ZoomIn size={16} /> Adjust Photo</span>
                {activeIndex !== null && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">Selected</span>}
              </h3>
              
              {activeIndex !== null ? (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Scale */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-foreground">Zoom (Scale)</label>
                      <span className="text-xs font-bold text-muted-foreground">{images[activeIndex].scale.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1"
                      value={images[activeIndex].scale}
                      onChange={(e) => updateActiveImage('scale', Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Pan X */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-foreground">Pan Horizontal</label>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={images[activeIndex].x}
                      onChange={(e) => updateActiveImage('x', Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Pan Y */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-foreground">Pan Vertical</label>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={images[activeIndex].y}
                      onChange={(e) => updateActiveImage('y', Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setActiveIndex(null)}
                    className="w-full py-2 bg-muted text-foreground font-medium rounded-md hover:bg-border transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Check size={16} /> Done Adjusting
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on any photo in the collage to adjust its position and zoom.
                </p>
              )}
            </div>

          </div>

          <div className="space-y-3">
            <button 
              onClick={generateDownload}
              disabled={images.length === 0 || isGenerating}
              className="w-full py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-yellow-500/20 disabled:opacity-50"
            >
              <Download size={18} /> Download High-Res Collage
            </button>
            
            <button 
              onClick={clear}
              disabled={images.length === 0 || isGenerating}
              className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
