import { useState, useRef } from 'react';
import { ArrowRightLeft, Download, RefreshCw } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

const ImageConverter = () => {
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const canvasRef = useRef(null);

  const formats = [
    { label: 'PNG', value: 'image/png', ext: 'png' },
    { label: 'JPEG', value: 'image/jpeg', ext: 'jpg' },
    { label: 'WEBP', value: 'image/webp', ext: 'webp' },
    { label: 'BMP', value: 'image/bmp', ext: 'bmp' },
  ];

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setPreviewSrc(URL.createObjectURL(selectedFile));
    
    // Auto-select a different format than the original
    const currentMime = selectedFile.type;
    const alternative = formats.find(f => f.value !== currentMime) || formats[0];
    setTargetFormat(alternative.value);
  };

  const convertImage = () => {
    if (!file) return;
    setIsConverting(true);
    setConvertedBlob(null);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      // If converting to JPEG from PNG with transparency, fill white background first
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Conversion failed');
          setIsConverting(false);
          return;
        }
        setConvertedBlob(blob);
        toast.success('Image converted successfully!');
        setIsConverting(false);
      }, targetFormat, 0.95);
    };
    img.src = previewSrc;
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const formatObj = formats.find(f => f.value === targetFormat);
    const originalName = file.name.split('.')[0];
    link.download = `${originalName}_converted.${formatObj.ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setFile(null);
    setPreviewSrc('');
    setConvertedBlob(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
          <ArrowRightLeft size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert images between PNG, JPEG, WEBP, and BMP instantly.</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {!file ? (
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] }} 
          maxFiles={1}
          title="Drag & drop an image to convert"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            
            {/* Original Image */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col items-center">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 w-full">Original</h3>
               <div className="w-full flex justify-center bg-muted/30 rounded-lg p-4 h-48 border border-border/50 border-dashed">
                 <img 
                    src={previewSrc} 
                    alt="Original" 
                    className="max-h-full object-contain"
                 />
               </div>
               <div className="mt-4 text-center w-full">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground uppercase mt-1">{file.type.split('/')[1]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
               </div>
            </div>

            {/* Conversion Controls */}
            <div className="flex flex-col items-center gap-4 py-4 md:py-0">
               <div className="w-full">
                 <label className="block text-sm font-medium text-center text-muted-foreground mb-2">Target Format</label>
                 <select 
                   value={targetFormat}
                   onChange={(e) => setTargetFormat(e.target.value)}
                   className="w-40 p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-orange-500 outline-none transition-all text-center font-medium"
                 >
                   {formats.map(f => (
                     <option key={f.value} value={f.value}>{f.label}</option>
                   ))}
                 </select>
               </div>

               <button 
                  onClick={convertImage}
                  disabled={isConverting}
                  className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 mt-2"
               >
                 <ArrowRightLeft size={24} className={isConverting ? "animate-spin" : ""} />
               </button>
            </div>

            {/* Converted Image */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col items-center relative overflow-hidden">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 w-full">Converted</h3>
               
               {!convertedBlob ? (
                 <div className="w-full h-48 flex items-center justify-center border border-border border-dashed rounded-lg text-muted-foreground text-sm">
                   Awaiting conversion...
                 </div>
               ) : (
                 <>
                   <div className="w-full flex justify-center bg-orange-500/5 rounded-lg p-4 h-48 border border-orange-500/20">
                     <img 
                        src={URL.createObjectURL(convertedBlob)} 
                        alt="Converted" 
                        className="max-h-full object-contain"
                     />
                   </div>
                   <div className="mt-4 text-center w-full">
                      <p className="font-medium text-foreground truncate">
                        {file.name.split('.')[0]}_converted.{formats.find(f => f.value === targetFormat).ext}
                      </p>
                      <p className="text-sm font-bold text-orange-500 uppercase mt-1">
                        {formats.find(f => f.value === targetFormat).label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{(convertedBlob.size / 1024).toFixed(1)} KB</p>
                   </div>
                 </>
               )}
            </div>

          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6">
            <button 
              onClick={clear}
              className="px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} /> Start Over
            </button>
            {convertedBlob && (
              <button 
                onClick={handleDownload}
                className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shadow-orange-500/20"
              >
                <Download size={18} /> Download {formats.find(f => f.value === targetFormat).label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageConverter;
