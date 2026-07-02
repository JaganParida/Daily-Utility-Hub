import { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, Download, RefreshCw, Settings2, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { toast } from 'react-hot-toast';

const TEMPLATES = [
  { id: 'split-v', name: 'Split Vertical', slots: 2, gridClass: 'grid-cols-2 grid-rows-1', slotClasses: ['',''] },
  { id: 'split-h', name: 'Split Horizontal', slots: 2, gridClass: 'grid-cols-1 grid-rows-2', slotClasses: ['',''] },
  { id: 'large-left', name: 'Large Left', slots: 3, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['row-span-2', '', ''] },
  { id: 'large-top', name: 'Large Top', slots: 3, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['col-span-2', '', ''] },
  { id: 'grid-4', name: 'Grid 2x2', slots: 4, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['','','',''] },
  { id: 'grid-6', name: 'Grid 3x2', slots: 6, gridClass: 'grid-cols-3 grid-rows-2', slotClasses: ['','','','','',''] },
  { id: 'grid-9', name: 'Grid 3x3', slots: 9, gridClass: 'grid-cols-3 grid-rows-3', slotClasses: ['','','','','','','','',''] },
];

const ImageCollage = () => {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [images, setImages] = useState({}); // { [slotIndex]: { url, x, y, scale } }
  const [gap, setGap] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const collageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState(null);

  // Drag State
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 50, y: 50 });

  const handleTemplateSelect = (tmpl) => {
    setTemplate(tmpl);
    // Keep existing images that fit in new template, discard others
    const newImages = {};
    for (let i = 0; i < tmpl.slots; i++) {
      if (images[i]) newImages[i] = images[i];
    }
    // Cleanup revoked URLs
    Object.keys(images).forEach(key => {
      if (Number(key) >= tmpl.slots) URL.revokeObjectURL(images[key].url);
    });
    setImages(newImages);
  };

  const triggerUpload = (slotIndex) => {
    setActiveUploadSlot(slotIndex);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || activeUploadSlot === null) return;
    
    // Revoke old URL if exists
    if (images[activeUploadSlot]) {
      URL.revokeObjectURL(images[activeUploadSlot].url);
    }

    const url = URL.createObjectURL(file);
    setImages(prev => ({
      ...prev,
      [activeUploadSlot]: { url, x: 50, y: 50, scale: 1 }
    }));
    
    // Reset file input
    e.target.value = '';
    setActiveUploadSlot(null);
  };

  const removeImage = (slotIndex, e) => {
    e.stopPropagation();
    if (!images[slotIndex]) return;
    URL.revokeObjectURL(images[slotIndex].url);
    setImages(prev => {
      const newImgs = { ...prev };
      delete newImgs[slotIndex];
      return newImgs;
    });
  };

  // --- Drag to Pan Logic ---
  const onPointerDown = (e, slotIndex) => {
    if (!images[slotIndex]) return;
    e.preventDefault(); // prevent text selection
    setDraggingSlot(slotIndex);
    setDragStart({ x: e.clientX || e.touches[0].clientX, y: e.clientY || e.touches[0].clientY });
    setInitialPos({ x: images[slotIndex].x, y: images[slotIndex].y });
  };

  const onPointerMove = useCallback((e) => {
    if (draggingSlot === null || !images[draggingSlot]) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // Convert pixels to percentage roughly (depends on container size, but this gives a good feel)
    // We multiply by a sensitivity factor, e.g., 0.2
    const sensitivity = 0.2 / images[draggingSlot].scale; 
    
    let newX = initialPos.x + (deltaX * sensitivity);
    let newY = initialPos.y + (deltaY * sensitivity);

    // Optional: clamp between 0 and 100
    // newX = Math.max(0, Math.min(100, newX));
    // newY = Math.max(0, Math.min(100, newY));

    setImages(prev => ({
      ...prev,
      [draggingSlot]: {
        ...prev[draggingSlot],
        x: newX,
        y: newY
      }
    }));
  }, [draggingSlot, dragStart, initialPos, images]);

  const onPointerUp = useCallback(() => {
    setDraggingSlot(null);
  }, []);

  useEffect(() => {
    if (draggingSlot !== null) {
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    } else {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [draggingSlot, onPointerMove, onPointerUp]);
  // -------------------------

  const handleWheel = (e, slotIndex) => {
    if (!images[slotIndex]) return;
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.005;
    setImages(prev => {
      const currentScale = prev[slotIndex].scale;
      const newScale = Math.max(0.5, Math.min(5, currentScale + zoomFactor));
      return {
        ...prev,
        [slotIndex]: { ...prev[slotIndex], scale: newScale }
      };
    });
  };

  const generateDownload = async () => {
    if (!collageRef.current) return;
    setIsGenerating(true);
    
    // Give state time to update
    await new Promise(res => setTimeout(res, 100));

    try {
      const url = await toJpeg(collageRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: bgColor
      });
      
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
      setIsGenerating(false);
    }
  };

  const clear = () => {
    Object.values(images).forEach(img => URL.revokeObjectURL(img.url));
    setImages({});
  };

  return (
    <div className="max-w-6xl mx-auto">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg shadow-sm">
          <LayoutGrid size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ultimate Collage Maker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Choose a template, click a slot to add photos, and swipe to adjust!</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        
        {/* Main Preview Area */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-[600px]">
          
          <div className="flex-1 w-full bg-muted/10 rounded-xl border border-border/50 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            
            {/* The actual Collage DOM Node to be screenshotted */}
            <div 
              ref={collageRef}
              className={`grid w-full aspect-square md:aspect-[4/3] overflow-hidden ${template.gridClass}`}
              style={{ gap: `${gap}px`, backgroundColor: bgColor, padding: `${gap}px` }}
            >
              {Array.from({ length: template.slots }).map((_, idx) => (
                <div 
                  key={idx}
                  className={`relative overflow-hidden group border-2 border-dashed ${images[idx] ? 'border-transparent' : 'border-border hover:border-primary hover:bg-primary/5'} transition-all cursor-grab active:cursor-grabbing ${template.slotClasses[idx]}`}
                  onMouseDown={(e) => onPointerDown(e, idx)}
                  onTouchStart={(e) => onPointerDown(e, idx)}
                  onWheel={(e) => handleWheel(e, idx)}
                  onClick={() => !images[idx] && triggerUpload(idx)}
                >
                  {images[idx] ? (
                    <>
                      <img 
                        src={images[idx].url} 
                        alt="collage piece"
                        className="w-full h-full object-cover origin-center pointer-events-none"
                        style={{
                          transform: `scale(${images[idx].scale})`,
                          objectPosition: `${images[idx].x}% ${images[idx].y}%`, 
                        }}
                      />
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => removeImage(idx, e)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      {/* Helper hint */}
                      {draggingSlot !== idx && (
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <span className="text-white text-xs font-bold drop-shadow-md">Drag to Pan • Scroll to Zoom</span>
                         </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <div className="w-12 h-12 rounded-full bg-background border border-border shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-sm font-medium">Click to add</span>
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
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6 flex flex-col">
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex-1">
            
            {/* Templates Selector */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <LayoutGrid size={16} /> Choose Layout
              </h3>
              
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl)}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-3 transition-all ${template.id === tmpl.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/30 hover:border-primary/50'}`}
                  >
                    {/* Visual representation of grid */}
                    <div className={`w-16 h-12 grid gap-1 ${tmpl.gridClass}`}>
                      {Array.from({ length: tmpl.slots }).map((_, i) => (
                        <div key={i} className={`bg-muted-foreground/30 rounded-sm ${tmpl.slotClasses[i]}`}></div>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground text-center">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Global Settings */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings2 size={16} /> Spacing & Color
              </h3>
              
              <div className="space-y-5">
                {/* Gap Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Border Thickness</label>
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
                  <label className="text-sm font-medium text-foreground">Frame Color</label>
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

          </div>

          <div className="space-y-3">
            <button 
              onClick={generateDownload}
              disabled={Object.keys(images).length === 0 || isGenerating}
              className="w-full py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-yellow-500/20 disabled:opacity-50"
            >
              <Download size={18} /> Export Collage
            </button>
            
            <button 
              onClick={clear}
              disabled={Object.keys(images).length === 0 || isGenerating}
              className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} /> Clear All Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCollage;
