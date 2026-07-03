import { useState, useEffect } from 'react';
import { FileImage, Download, RefreshCw, Trash2, Layers, DownloadCloud, Settings2, ChevronDown, CheckCircle, FileCode2, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import JSZip from 'jszip';
import { toast } from 'react-hot-toast';

const FORMATS = [
  { id: 'jpeg', ext: 'jpg', mime: 'image/jpeg', name: 'JPEG' },
  { id: 'png', ext: 'png', mime: 'image/png', name: 'PNG' },
  { id: 'webp', ext: 'webp', mime: 'image/webp', name: 'WEBP' },
  { id: 'bmp', ext: 'bmp', mime: 'image/bmp', name: 'BMP' },
];

const ImageConverter = () => {
  const [images, setImages] = useState([]); // { file, url, name, size }
  const [targetFormat, setTargetFormat] = useState('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Revoke object URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
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

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const convertImages = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    const startTime = Date.now();

    try {
      const formatObj = FORMATS.find(f => f.id === targetFormat);
      if (!formatObj) throw new Error("Invalid format");

      const zip = new JSZip();
      const folder = images.length > 1 ? zip.folder(`converted_images_${Date.now()}`) : null;

      for (let i = 0; i < images.length; i++) {
        const imgObj = images[i];
        
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgObj.url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (formatObj.id === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, formatObj.mime, quality));
        
        const originalNameBase = imgObj.name.substring(0, imgObj.name.lastIndexOf('.')) || imgObj.name;
        const newFileName = `${originalNameBase}.${formatObj.ext}`;

        if (images.length === 1) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = newFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          folder.file(newFileName, blob);
        }
      }

      if (images.length > 1) {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `converted_images_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      // Enforce a minimum 1.0 second processing delay for smooth visual feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.success('Images converted successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <ArrowRightLeft size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Image Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Batch convert images to WebP, JPEG, PNG, or BMP instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Area / Workspace */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${images.length === 0 ? 'min-h-[50vh] items-stretch p-4 md:p-5' : 'min-h-0 p-4 md:p-6 space-y-6'}`}
        >
          <DropzoneComponent 
            className={images.length === 0 ? "flex-1 justify-center" : "shrink-0"}
            onFilesAccepted={handleFilesAccepted} 
            accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif'] }} 
            maxFiles={100}
            title="Drag & drop images to convert (Batch Upload Supported)"
          />

          <AnimatePresence mode="popLayout">
            {images.length > 0 && (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-muted/10 border border-border p-4 md:p-5 rounded-xl shadow-inner flex-1 flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers size={14} /> Batch Queue ({images.length})
                  </h3>
                  <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-semibold hover:underline">Clear Queue</button>
                </div>
                
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar min-h-0">
                  <AnimatePresence mode="popLayout">
                    {images.map((img, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        key={img.url} 
                        className="flex items-center gap-4 bg-muted/30 p-2.5 rounded-xl border border-border/50 group hover:border-primary/40 transition-colors duration-200 shadow-sm"
                      >
                        <img src={img.url} className="w-11 h-11 object-cover rounded-lg border border-border/50 shadow-sm" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-sm text-foreground truncate">{img.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{(img.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                          onClick={() => removeImage(idx)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Settings Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${images.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <FileCode2 size={16} /> Conversion Settings
            </h3>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Target Format</label>
              <div className="relative group">
                <select 
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                >
                  {FORMATS.map(f => (
                    <option key={f.id} value={f.id} className="bg-background text-foreground">{f.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Quality</label>
                  <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <div className="relative pt-2 pb-1">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="converter-quality-slider w-full cursor-pointer outline-none"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '10px',
                      borderRadius: '999px',
                      background: `linear-gradient(to right, var(--primary) ${(quality - 0.1) / 0.9 * 100}%, color-mix(in srgb, var(--muted) 60%, transparent) ${(quality - 0.1) / 0.9 * 100}%)`,
                    }}
                  />
                  <style dangerouslySetInnerHTML={{__html: `
                    .converter-quality-slider::-webkit-slider-thumb {
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
                    .converter-quality-slider::-webkit-slider-thumb:hover {
                      transform: scale(1.2);
                      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    }
                    .converter-quality-slider::-moz-range-thumb {
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
                <p className="text-xs text-muted-foreground mt-1">Lower quality produces smaller file sizes.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={convertImages}
              disabled={isConverting || isSuccess || images.length === 0}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
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
                    Converted!
                  </motion.div>
                ) : isConverting ? (
                  <motion.div
                    key="converting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={20} className="animate-spin" />
                    Converting...
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
                    Convert & Download
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <button 
              onClick={clearAll}
              disabled={isConverting || images.length === 0}
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

export default ImageConverter;
