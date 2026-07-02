import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Trash2, ArrowUp, ArrowDown, Settings2, ChevronDown, CheckCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

const PAGE_SIZES = [
  { id: 'a3',      name: 'A3  (297 × 420 mm)' },
  { id: 'a4',      name: 'A4  (210 × 297 mm)' },
  { id: 'a5',      name: 'A5  (148 × 210 mm)' },
  { id: 'b4',      name: 'B4  (250 × 353 mm)' },
  { id: 'b5',      name: 'B5  (176 × 250 mm)' },
  { id: 'letter',  name: 'Letter  (8.5 × 11 in)' },
  { id: 'legal',   name: 'Legal  (8.5 × 14 in)' },
  { id: 'tabloid', name: 'Tabloid  (11 × 17 in)' },
];

const ImageToPdf = () => {
  const [images, setImages] = useState([]); // [{ file, url }]
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'generating' | 'done'

  const [pdfOrientation, setPdfOrientation] = useState('p'); // 'p' portrait, 'l' landscape
  const [pageSize, setPageSize] = useState('a4');
  const [margin, setMargin] = useState(10); // mm

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => images.forEach(img => URL.revokeObjectURL(img.url));
  }, []);

  const handleFilesAccepted = (files) => {
    if (!files.length) return;
    const newImages = Array.from(files).map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const n = [...prev];
      URL.revokeObjectURL(n[index].url);
      n.splice(index, 1);
      return n;
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const n = [...prev];
      [n[index - 1], n[index]] = [n[index], n[index - 1]];
      return n;
    });
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const n = [...prev];
      [n[index + 1], n[index]] = [n[index], n[index + 1]];
      return n;
    });
  };

  const generatePDF = async () => {
    if (!images.length) return;
    setDownloadState('generating');
    const startTime = Date.now();

    try {
      const doc = new jsPDF(pdfOrientation, 'mm', pageSize);
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableW = pageWidth  - margin * 2;
      const usableH = pageHeight - margin * 2;

      for (let i = 0; i < images.length; i++) {
        const { url, file } = images[i];
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = url;
        });

        if (i > 0) doc.addPage();

        const imgRatio  = img.width / img.height;
        const pageRatio = usableW / usableH;
        let finalW = usableW, finalH = usableH;
        if (imgRatio > pageRatio) finalH = usableW / imgRatio;
        else                      finalW = usableH * imgRatio;

        const x = margin + (usableW - finalW) / 2;
        const y = margin + (usableH - finalH) / 2;
        const imgType = file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(img, imgType, x, y, finalW, finalH);
      }

      // Enforce minimum delay so the spinner looks intentional
      const elapsed = Date.now() - startTime;
      if (elapsed < 900) await new Promise(r => setTimeout(r, 900 - elapsed));

      doc.save('converted_document.pdf');
      toast.success('PDF generated successfully!');
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
      setDownloadState('idle');
    }
  };

  const clear = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const hasImages = images.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Image to PDF</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Convert photos to printable PDF documents — A4, Letter, and more.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* Left: Upload + Page Queue */}
        <motion.div
          layout
          className={`flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col transition-all duration-500 ease-out ${
            !hasImages ? 'min-h-[50vh] items-stretch p-4 md:p-5' : 'min-h-0 p-4 md:p-6 space-y-5'
          }`}
        >
          <DropzoneComponent
            className={hasImages ? 'shrink-0' : 'flex-1 justify-center'}
            onFilesAccepted={handleFilesAccepted}
            accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
            maxFiles={50}
            title="Drag & drop images here (multi-page supported)"
          />

          <AnimatePresence mode="popLayout">
            {hasImages && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-muted/10 border border-border p-4 md:p-5 rounded-xl shadow-inner flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers size={14} /> Pages ({images.length})
                  </h3>
                  <button onClick={clear} className="text-xs text-red-500 hover:text-red-600 font-semibold hover:underline">
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar min-h-0">
                  <AnimatePresence mode="popLayout">
                    {images.map((img, idx) => (
                      <motion.div
                        layout
                        key={img.url || `${img.file?.name}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                        className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50 group hover:border-primary/40 transition-all shadow-sm"
                      >
                        {/* Page number */}
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground shrink-0">{idx + 1}</span>

                        {/* Thumbnail */}
                        <img
                          src={img.url}
                          className="w-12 h-12 object-cover rounded-lg border border-border/50 shadow-sm shrink-0"
                          alt="page"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{img.file.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {(img.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-25 transition-colors"
                            title="Move up"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            onClick={() => moveDown(idx)}
                            disabled={idx === images.length - 1}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-25 transition-colors"
                            title="Move down"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <div className="w-px h-5 bg-border mx-1" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Settings Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasImages ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">

            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings2 size={15} /> Document Layout
            </h3>

            {/* Paper Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Paper Size</label>
              <div className="relative group">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                >
                  {PAGE_SIZES.map(s => (
                    <option key={s.id} value={s.id} className="bg-background text-foreground">{s.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Orientation</label>
              <div className="flex p-1.5 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative gap-1">
                {[{ id: 'p', label: 'Portrait' }, { id: 'l', label: 'Landscape' }].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPdfOrientation(mode.id)}
                    className={`flex-1 relative z-10 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      pdfOrientation === mode.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {pdfOrientation === mode.id && (
                      <motion.div
                        layoutId="orientation-active"
                        className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10"
                      />
                    )}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Slider */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">White Margin</label>
                <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{margin} mm</span>
              </div>
              <div className="pt-1 pb-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="pdf-margin-slider w-full cursor-pointer outline-none"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    height: '10px',
                    borderRadius: '999px',
                    background: `linear-gradient(to right, var(--primary) ${(margin / 50) * 100}%, color-mix(in srgb, var(--muted) 80%, transparent) ${(margin / 50) * 100}%)`,
                  }}
                />
                <style dangerouslySetInnerHTML={{__html: `
                  .pdf-margin-slider::-webkit-slider-thumb {
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
                  .pdf-margin-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  }
                  .pdf-margin-slider::-moz-range-thumb {
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
              <p className="text-xs text-muted-foreground leading-relaxed">Leave white space around images on each page.</p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={generatePDF}
              disabled={downloadState !== 'idle' || !hasImages}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2
                shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset]
                disabled:opacity-50 active:scale-[0.98] overflow-hidden
                ${downloadState === 'done'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {downloadState === 'done' ? (
                  <motion.div key="done"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={20} /> Generated!
                  </motion.div>
                ) : downloadState === 'generating' ? (
                  <motion.div key="generating"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={20} className="animate-spin" /> Generating PDF…
                  </motion.div>
                ) : (
                  <motion.div key="idle"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Download size={20} /> Generate PDF
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={clear}
              disabled={downloadState === 'generating' || !hasImages}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Clear Queue
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ImageToPdf;
