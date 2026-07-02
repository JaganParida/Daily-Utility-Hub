import { useState } from 'react';
import { ArrowRightLeft, Download, RefreshCw, Layers, FileCode2, Trash2 } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);

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

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const formatObj = FORMATS.find(f => f.id === targetFormat);
      if (!formatObj) throw new Error("Invalid format");

      const zip = new JSZip();
      const folder = images.length > 1 ? zip.folder(`converted_images_${Date.now()}`) : null;

      for (let i = 0; i < images.length; i++) {
        const imgObj = images[i];
        
        // Convert via canvas
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
        
        // If converting to JPEG, fill background with white (since JPEG has no transparency)
        if (formatObj.id === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);

        // Get Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, formatObj.mime, quality));
        
        const originalNameBase = imgObj.name.substring(0, imgObj.name.lastIndexOf('.')) || imgObj.name;
        const newFileName = `${originalNameBase}.${formatObj.ext}`;

        if (images.length === 1) {
          // Single file download directly
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = newFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Add to ZIP
          folder.file(newFileName, blob);
        }
      }

      // If multiple, generate and download ZIP
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
      
      toast.success(images.length > 1 ? 'Images successfully converted and zipped!' : 'Image converted successfully!');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during conversion');
    } finally {
      setIsProcessing(false);
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

          {images.length > 0 && (
            <div className="bg-muted/10 border border-border p-4 md:p-6 rounded-xl shadow-inner flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layers size={16} /> Batch Queue ({images.length})
                </h3>
                <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Clear Queue</button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border group hover:border-pink-500/50 transition-colors">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Area */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <FileCode2 size={16} /> Conversion Settings
            </h3>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">Target Format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTargetFormat(f.id)}
                    className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                      targetFormat === f.id 
                        ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-sm' 
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
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
              onClick={processImages}
              disabled={isProcessing || images.length === 0}
              className="w-full py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-pink-500/20 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Processing {images.length} {images.length === 1 ? 'file' : 'files'}...
                </>
              ) : (
                <>
                  <Download size={18} /> 
                  {images.length > 1 ? `Convert & Download ZIP` : `Convert & Download`}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageConverter;
