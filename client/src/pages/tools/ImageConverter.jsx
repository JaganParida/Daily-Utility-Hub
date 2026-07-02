import { useState } from 'react';
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
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <ArrowRightLeft size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Image Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Batch convert images to WebP, JPEG, PNG, or BMP instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Area */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm flex flex-col min-h-[50vh] relative space-y-6">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-muted/10 border border-border p-4 md:p-6 rounded-xl shadow-inner flex-1 flex flex-col"
              >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layers size={16} /> Batch Queue ({images.length})
                </h3>
                <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Clear Queue</button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                {images.map((img, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    key={img.url || `${img.name}-${idx}`} 
                    className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border group hover:border-pink-500/50 transition-colors"
                  >
                    <img src={img.url} className="w-12 h-12 object-cover rounded-md border border-border/50 shadow-sm" />
                    <div className="flex-1 truncate">
                      <p className="font-medium text-sm text-foreground truncate">{img.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(img.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={() => removeImage(idx)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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
        </div>

        {/* Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${images.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <FileCode2 size={16} /> Conversion Settings
            </h3>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Format</label>
              <div className="relative group">
                <select 
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-red-500/50 outline-none transition-all cursor-pointer shadow-sm"
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
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Quality</label>
                  <span className="text-xs font-bold bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-md">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <p className="text-xs text-muted-foreground mt-1">Lower quality produces significantly smaller file sizes.</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button 
              onClick={convertImages}
              disabled={isConverting || isSuccess || images.length === 0}
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
                    Downloaded!
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
