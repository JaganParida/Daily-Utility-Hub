import { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';

const ImageCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    setOriginalFile(files[0]);
    setCompressedFile(null);
  };

  const compressImage = async () => {
    if (!originalFile) return;

    setIsCompressing(true);
    const options = {
      maxSizeMB: Number(maxSizeMB),
      maxWidthOrHeight: Number(maxWidthOrHeight),
      useWebWorker: true,
      onProgress: (p) => console.log(p) // Could add progress bar
    };

    try {
      const compressed = await imageCompression(originalFile, options);
      setCompressedFile(compressed);
      toast.success('Image compressed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error compressing image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setOriginalFile(null);
    setCompressedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
          <ImageIcon size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Compressor</h1>
          <p className="text-muted-foreground mt-1 text-sm">Compress JPG, PNG, and WEBP images locally in your browser. No server upload required.</p>
        </div>
      </div>

      {!originalFile ? (
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
          maxFiles={1}
          title="Drag & drop an image to compress"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original File Info */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Original Image</h3>
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={URL.createObjectURL(originalFile)} 
                  alt="Original" 
                  className="max-h-48 rounded-lg object-contain bg-muted/50 p-2"
                />
                <div className="w-full text-center">
                  <p className="font-medium text-foreground truncate">{originalFile.name}</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {(originalFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Compressed File Info */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 absolute top-6 left-6">Compressed Result</h3>
              
              {!compressedFile && !isCompressing && (
                <div className="text-center text-muted-foreground mt-8">
                  <p>Configure options and click Compress</p>
                </div>
              )}

              {isCompressing && (
                <div className="flex flex-col items-center text-primary mt-8">
                  <RefreshCw size={32} className="animate-spin mb-4" />
                  <p className="font-medium">Compressing...</p>
                </div>
              )}

              {compressedFile && (
                <div className="flex flex-col items-center gap-4 mt-8 w-full">
                  <img 
                    src={URL.createObjectURL(compressedFile)} 
                    alt="Compressed" 
                    className="max-h-48 rounded-lg object-contain bg-muted/50 p-2"
                  />
                  <div className="w-full text-center">
                    <p className="font-medium text-foreground truncate">compressed_{originalFile.name}</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-2">
                      {(compressedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-sm text-emerald-600/70 font-medium mt-1">
                      {Math.round(((originalFile.size - compressedFile.size) / originalFile.size) * 100)}% smaller
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Compression Settings</h3>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-foreground mb-2">Max Size (MB)</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-foreground mb-2">Max Width/Height (px)</label>
                <input 
                  type="number" 
                  min="100"
                  step="100"
                  value={maxWidthOrHeight}
                  onChange={(e) => setMaxWidthOrHeight(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <button 
                onClick={compressImage}
                disabled={isCompressing}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Compress
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={clear}
              className="px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} /> Start Over
            </button>
            {compressedFile && (
              <button 
                onClick={handleDownload}
                className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-md hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20"
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

export default ImageCompressor;
