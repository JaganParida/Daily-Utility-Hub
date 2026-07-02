import { useState } from 'react';
import { FileText, Download, RefreshCw, Trash2, ArrowUp, ArrowDown, Settings2, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

const PAGE_SIZES = [
  { id: 'a3', name: 'A3 (297 x 420 mm)' },
  { id: 'a4', name: 'A4 (210 x 297 mm)' },
  { id: 'a5', name: 'A5 (148 x 210 mm)' },
  { id: 'b4', name: 'B4 (250 x 353 mm)' },
  { id: 'b5', name: 'B5 (176 x 250 mm)' },
  { id: 'letter', name: 'Letter (8.5 x 11 in)' },
  { id: 'legal', name: 'Legal (8.5 x 14 in)' },
  { id: 'tabloid', name: 'Tabloid (11 x 17 in)' },
];

const ImageToPdf = () => {
  const [images, setImages] = useState([]); // Array of { file, url }
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [pdfOrientation, setPdfOrientation] = useState('p'); // 'p' for portrait, 'l' for landscape
  const [pageSize, setPageSize] = useState('a4');
  const [margin, setMargin] = useState(10); // Margin in mm (printer blank white space)

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const newImages = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].url);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newImgs = [...prev];
      const temp = newImgs[index - 1];
      newImgs[index - 1] = newImgs[index];
      newImgs[index] = temp;
      return newImgs;
    });
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const newImgs = [...prev];
      const temp = newImgs[index + 1];
      newImgs[index + 1] = newImgs[index];
      newImgs[index] = temp;
      return newImgs;
    });
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF(pdfOrientation, 'mm', pageSize);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate usable area after margin
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      for (let i = 0; i < images.length; i++) {
        const { url, file } = images[i];
        
        // Wait for image to load to get dimensions
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = url;
        });

        if (i > 0) {
          doc.addPage();
        }

        // Calculate scaling to fit page while maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const pageRatio = usableWidth / usableHeight;
        
        let finalWidth = usableWidth;
        let finalHeight = usableHeight;
        
        if (imgRatio > pageRatio) {
          finalHeight = usableWidth / imgRatio;
        } else {
          finalWidth = usableHeight * imgRatio;
        }

        // Center on page (accounting for margins)
        const x = margin + ((usableWidth - finalWidth) / 2);
        const y = margin + ((usableHeight - finalHeight) / 2);

        const imgType = file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(img, imgType, x, y, finalWidth, finalHeight);
      }

      doc.save('converted_document.pdf');
      toast.success('PDF Generated successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const clear = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shadow-sm">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Image to PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert photos to standard printable PDF documents (A4, Letter, etc.).</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm flex flex-col min-h-[50vh] relative space-y-6">
          <DropzoneComponent 
            className={images.length === 0 ? "flex-1 justify-center" : "shrink-0"}
            onFilesAccepted={handleFilesAccepted} 
            accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
            maxFiles={50}
            title="Drag & drop images here"
          />

          <AnimatePresence mode="popLayout">
          {images.length > 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-muted/10 border border-border p-4 md:p-6 rounded-xl shadow-inner flex-1 flex flex-col"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Pages ({images.length})</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                {images.map((img, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    key={img.url || `${img.file?.name}-${idx}`} 
                    className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border group hover:border-primary/50 transition-colors"
                  >
                    <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <img src={img.url} className="w-16 h-16 object-cover rounded-lg border border-border/50 shadow-sm" />
                    <div className="flex-1 truncate">
                      <p className="font-medium text-sm text-foreground truncate">{img.file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveDown(idx)}
                        disabled={idx === images.length - 1}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <div className="w-px h-6 bg-border mx-1"></div>
                      <button 
                        onClick={() => removeImage(idx)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${images.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings2 size={16} /> Document Layout
            </h3>
            
            {/* Paper Size */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Paper Size</label>
              <div className="relative group">
                <select 
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-red-500/50 outline-none transition-all cursor-pointer shadow-sm"
                >
                  {PAGE_SIZES.map(size => (
                    <option key={size.id} value={size.id} className="bg-background text-foreground">{size.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Orientation</label>
              <div className="flex p-1.5 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
                {['p', 'l'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPdfOrientation(mode)}
                    className={`flex-1 relative z-10 py-2.5 text-sm font-bold rounded-lg transition-colors ${pdfOrientation === mode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {pdfOrientation === mode && (
                      <motion.div layoutId="orientation-active" className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10" />
                    )}
                    {mode === 'p' ? 'Portrait' : 'Landscape'}
                  </button>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">White Margin</label>
                <span className="text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md">{margin} mm</span>
              </div>
              <div className="relative group pt-2 pb-2">
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, rgb(239 68 68) ${(margin / 50) * 100}%, var(--muted) ${(margin / 50) * 100}%)`,
                  }}
                />
                <style dangerouslySetInnerHTML={{__html: `
                  input[type=range]::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid rgb(239 68 68);
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    transition: transform 0.1s;
                  }
                  input[type=range]:hover::-webkit-slider-thumb {
                    transform: scale(1.15);
                  }
                `}} />
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">Leave empty white space around images (like a printer bounding box).</p>
            </div>

          </div>

          <div className="space-y-3">
            <button 
              onClick={generatePDF}
              disabled={isGenerating || isSuccess || images.length === 0}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]' 
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)]'
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Generated!
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={20} className="animate-spin" />
                    Generating...
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
                    Generate PDF
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <button 
              onClick={clear}
              disabled={isGenerating || images.length === 0}
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
