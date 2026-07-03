import { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, Download, RefreshCw, Settings2, Trash2, Plus, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toJpeg } from 'html-to-image';
import { toast } from 'react-hot-toast';

const TEMPLATES = [
  { id: 'split-v',    name: 'Split Vertical',   slots: 2, gridClass: 'grid-cols-2 grid-rows-1', slotClasses: ['',''] },
  { id: 'split-h',   name: 'Split Horizontal',  slots: 2, gridClass: 'grid-cols-1 grid-rows-2', slotClasses: ['',''] },
  { id: 'large-left',name: 'Large Left',         slots: 3, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['row-span-2','',''] },
  { id: 'large-top', name: 'Large Top',          slots: 3, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['col-span-2','',''] },
  { id: 'grid-4',    name: 'Grid 2×2',           slots: 4, gridClass: 'grid-cols-2 grid-rows-2', slotClasses: ['','','',''] },
  { id: 'grid-6',    name: 'Grid 3×2',           slots: 6, gridClass: 'grid-cols-3 grid-rows-2', slotClasses: ['','','','','',''] },
  { id: 'grid-9',    name: 'Grid 3×3',           slots: 9, gridClass: 'grid-cols-3 grid-rows-3', slotClasses: ['','','','','','','','',''] },
];

const ImageCollage = () => {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [images, setImages] = useState({}); // { [slotIndex]: { url, x, y, scale } }
  const [gap, setGap] = useState(8);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'generating' | 'done'

  const collageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState(null);

  // Drag State
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 50, y: 50 });

  const hasImages = Object.keys(images).length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(images).forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  const handleTemplateSelect = (tmpl) => {
    setTemplate(tmpl);
    const newImages = {};
    for (let i = 0; i < tmpl.slots; i++) {
      if (images[i]) newImages[i] = images[i];
    }
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
    if (images[activeUploadSlot]) URL.revokeObjectURL(images[activeUploadSlot].url);
    const url = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [activeUploadSlot]: { url, x: 50, y: 50, scale: 1 } }));
    e.target.value = '';
    setActiveUploadSlot(null);
  };

  const removeImage = (slotIndex, e) => {
    e.stopPropagation();
    if (!images[slotIndex]) return;
    URL.revokeObjectURL(images[slotIndex].url);
    setImages(prev => {
      const n = { ...prev };
      delete n[slotIndex];
      return n;
    });
  };

  // --- Drag to Pan ---
  const onPointerDown = (e, slotIndex) => {
    if (!images[slotIndex]) return;
    e.preventDefault();
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
    const sensitivity = 0.2 / images[draggingSlot].scale;
    setImages(prev => ({
      ...prev,
      [draggingSlot]: {
        ...prev[draggingSlot],
        x: initialPos.x + deltaX * sensitivity,
        y: initialPos.y + deltaY * sensitivity,
      }
    }));
  }, [draggingSlot, dragStart, initialPos, images]);

  const onPointerUp = useCallback(() => setDraggingSlot(null), []);

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

  const handleWheel = (e, slotIndex) => {
    if (!images[slotIndex]) return;
    if (e.cancelable) e.preventDefault();
    const zoomFactor = -e.deltaY * 0.005;
    setImages(prev => ({
      ...prev,
      [slotIndex]: {
        ...prev[slotIndex],
        scale: Math.max(0.5, Math.min(5, prev[slotIndex].scale + zoomFactor))
      }
    }));
  };

  const generateDownload = async () => {
    if (!collageRef.current) return;
    setDownloadState('generating');
    await new Promise(res => setTimeout(res, 120));
    try {
      const url = await toJpeg(collageRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: bgColor,
        skipFonts: true
      });
      const link = document.createElement('a');
      link.href = url;
      link.download = `collage_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Collage downloaded successfully!');
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate collage');
      setDownloadState('idle');
    }
  };

  const clear = () => {
    Object.values(images).forEach(img => URL.revokeObjectURL(img.url));
    setImages({});
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <LayoutGrid size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Ultimate Collage Maker</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Choose a layout, click slots to add photos, drag to pan, scroll to zoom.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* Preview Canvas */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          <div
            className="w-full bg-muted/10 rounded-xl border border-border/50 overflow-hidden relative"
            style={{ height: 'calc(100vh - 260px)', maxHeight: 620, minHeight: 280 }}
          >

            {/* Collage grid (screenshotted) */}
            <div
              ref={collageRef}
              className={`absolute inset-0 grid overflow-hidden ${template.gridClass}`}
              style={{ gap: `${gap}px`, backgroundColor: bgColor, padding: `${gap}px` }}
            >
              {Array.from({ length: template.slots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`relative overflow-hidden group border-2 border-dashed transition-all
                    ${images[idx]
                      ? 'border-transparent cursor-grab active:cursor-grabbing'
                      : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'}
                    ${template.slotClasses[idx]}`}
                  onMouseDown={(e) => onPointerDown(e, idx)}
                  onTouchStart={(e) => onPointerDown(e, idx)}
                  onWheel={(e) => handleWheel(e, idx)}
                  onClick={() => !images[idx] && triggerUpload(idx)}
                >
                  {images[idx] ? (
                    <>
                      <img
                        src={images[idx].url}
                        alt="slot"
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          transform: `scale(${images[idx].scale})`,
                          objectPosition: `${images[idx].x}% ${images[idx].y}%`,
                        }}
                      />
                      <button
                        onClick={(e) => removeImage(idx, e)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20"
                      >
                        <Trash2 size={13} />
                      </button>
                      {draggingSlot !== idx && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <span className="text-white text-xs font-semibold drop-shadow px-2 py-1 rounded bg-black/30">Drag · Scroll to Zoom</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <div className="w-10 h-10 rounded-full bg-background border border-border shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                      </div>
                      <span className="text-xs font-semibold">Click to add</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Generating overlay */}
            <AnimatePresence>
              {downloadState === 'generating' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl"
                >
                  <Loader2 size={30} className="animate-spin text-primary mb-3" />
                  <p className="font-bold text-foreground text-sm">Rendering High-Res Image…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">

            {/* Layout Selector */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <LayoutGrid size={15} /> Choose Layout
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl)}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-2.5 transition-all shadow-sm active:scale-[0.97] ${
                      template.id === tmpl.id
                        ? 'border-primary/50 bg-primary/8 ring-1 ring-primary/30'
                        : 'border-border/50 bg-muted/20 hover:bg-muted hover:border-border'
                    }`}
                  >
                    <div className={`w-14 h-10 grid gap-[3px] rounded overflow-hidden ${tmpl.gridClass}`}>
                      {Array.from({ length: tmpl.slots }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-[2px] transition-colors ${
                            template.id === tmpl.id ? 'bg-primary/40' : 'bg-muted-foreground/30'
                          } ${tmpl.slotClasses[i]}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${
                      template.id === tmpl.id ? 'text-primary' : 'text-foreground'
                    }`}>{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing & Color */}
            <div className="pt-2 border-t border-border/50 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={15} /> Spacing & Color
              </h3>

              {/* Gap Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Border Thickness</label>
                  <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{gap}px</span>
                </div>
                <div className="pt-1 pb-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={gap}
                    onChange={(e) => setGap(Number(e.target.value))}
                    className="collage-gap-slider w-full cursor-pointer outline-none"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '10px',
                      borderRadius: '999px',
                      background: `linear-gradient(to right, var(--primary) ${gap / 50 * 100}%, color-mix(in srgb, var(--muted) 80%, transparent) ${gap / 50 * 100}%)`,
                    }}
                  />
                  <style dangerouslySetInnerHTML={{__html: `
                    .collage-gap-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 22px;
                      height: 22px;
                      border-radius: 50%;
                      background: #ffffff;
                      border: 2.5px solid var(--primary);
                      cursor: pointer;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                      transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    .collage-gap-slider::-webkit-slider-thumb:hover {
                      transform: scale(1.2);
                      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    }
                    .collage-gap-slider::-moz-range-thumb {
                      width: 22px;
                      height: 22px;
                      border-radius: 50%;
                      background: #ffffff;
                      border: 2.5px solid var(--primary);
                      cursor: pointer;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    }
                  `}} />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Frame Color</label>
                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-border/50 p-0.5 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={bgColor.toUpperCase()}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-mono font-semibold text-foreground focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={generateDownload}
              disabled={!hasImages || downloadState !== 'idle'}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2
                shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset]
                disabled:opacity-50 active:scale-[0.98] overflow-hidden
                ${downloadState === 'done'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
                }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {downloadState === 'done' ? (
                  <motion.div key="done"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={20} /> Downloaded!
                  </motion.div>
                ) : downloadState === 'generating' ? (
                  <motion.div key="generating"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={20} className="animate-spin" /> Generating…
                  </motion.div>
                ) : (
                  <motion.div key="idle"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Download size={20} /> Export Collage
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={clear}
              disabled={!hasImages || downloadState === 'generating'}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
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
