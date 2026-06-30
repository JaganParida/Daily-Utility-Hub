import { useState, useRef, useEffect } from 'react';
import { Expand, Download, RefreshCw } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const ImageResizer = () => {
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [resizedBlob, setResizedBlob] = useState(null);
  const canvasRef = useRef(null);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewSrc(url);

    // Get original dimensions
    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setAspectRatio(img.width / img.height);
    };
    img.src = url;
  };

  const handleWidthChange = (e) => {
    const val = e.target.value;
    setWidth(val);
    if (maintainRatio && val) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (e) => {
    const val = e.target.value;
    setHeight(val);
    if (maintainRatio && val) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const resizeImage = () => {
    if (!file || !width || !height) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = Number(width);
      canvas.height = Number(height);
      
      const ctx = canvas.getContext('2d');
      // Use better interpolation if available
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Determine format
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        setResizedBlob(blob);
        toast.success('Image resized successfully!');
      }, type, 0.95);
    };
    img.src = previewSrc;
  };

  const handleDownload = () => {
    if (!resizedBlob) return;
    const url = URL.createObjectURL(resizedBlob);
    const link = document.createElement('a');
    link.href = url;
    // Keep original extension or fallback to jpg
    const ext = file.name.split('.').pop() || 'jpg';
    link.download = `resized_${file.name.replace(`.${ext}`, '')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setFile(null);
    setPreviewSrc('');
    setWidth('');
    setHeight('');
    setResizedBlob(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
          <Expand size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Resizer</h1>
          <p className="text-muted-foreground mt-1 text-sm">Change image dimensions instantly in your browser.</p>
        </div>
      </div>

      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {!file ? (
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
          maxFiles={1}
          title="Drag & drop an image to resize"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col items-center">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 w-full">Image Preview</h3>
               <div className="flex-1 flex items-center justify-center bg-muted/30 w-full rounded-lg p-4 border border-border/50 border-dashed">
                 <img 
                    src={resizedBlob ? URL.createObjectURL(resizedBlob) : previewSrc} 
                    alt="Preview" 
                    className="max-h-64 object-contain"
                 />
               </div>
               {resizedBlob && (
                 <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-emerald-500">
                      Resized: {width} x {height}px ({(resizedBlob.size / 1024).toFixed(1)} KB)
                    </p>
                 </div>
               )}
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Dimensions</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Width (px)</label>
                  <input 
                    type="number" 
                    value={width}
                    onChange={handleWidthChange}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Height (px)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={handleHeightChange}
                    className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={maintainRatio}
                    onChange={(e) => setMaintainRatio(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="group-hover:text-primary transition-colors">Maintain Aspect Ratio</span>
                </label>

                <button 
                  onClick={resizeImage}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Apply Resize
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={clear}
              className="px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} /> Start Over
            </button>
            {resizedBlob && (
              <button 
                onClick={handleDownload}
                className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20"
              >
                <Download size={18} /> Download
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
