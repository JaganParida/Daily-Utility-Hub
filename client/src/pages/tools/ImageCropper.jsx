import { useState, useRef, useCallback } from 'react';
import { Crop, Download, RefreshCw } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageCropper = () => {
  const [file, setFile] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const canvasRef = useRef(null);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    
    setCrop(undefined);
    setImgSrc(URL.createObjectURL(selectedFile));
  };

  function onImageLoad(e) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  const handleAspectChange = (newAspect) => {
    setAspect(newAspect);
    if (imgRef.current && newAspect) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, newAspect));
    } else {
      setCrop(undefined);
    }
  };

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = canvasRef.current;
    const image = imgRef.current;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Canvas is empty');
        return;
      }
      setCroppedBlob(blob);
      toast.success('Image cropped successfully!');
    }, type, 1);
  };

  const handleDownload = () => {
    if (!croppedBlob) return;
    const url = URL.createObjectURL(croppedBlob);
    const link = document.createElement('a');
    link.href = url;
    const ext = file.name.split('.').pop() || 'jpg';
    link.download = `cropped_${file.name.replace(`.${ext}`, '')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setFile(null);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedBlob(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
          <Crop size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Cropper</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crop your images visually directly in your browser.</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {!file ? (
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
          maxFiles={1}
          title="Drag & drop an image to crop"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            
            {/* Cropper Area */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
              {!croppedBlob ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[600px]"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[600px] object-contain"
                  />
                </ReactCrop>
              ) : (
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Cropped Result</h3>
                  <img 
                    src={URL.createObjectURL(croppedBlob)} 
                    alt="Cropped result" 
                    className="max-h-[500px] object-contain rounded-lg border border-border/50 shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Controls sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Aspect Ratio</h3>
                
                <div className="space-y-2">
                  {[
                    { label: 'Freeform', value: undefined },
                    { label: '1:1 (Square)', value: 1 },
                    { label: '16:9 (Landscape)', value: 16 / 9 },
                    { label: '4:3', value: 4 / 3 },
                    { label: '9:16 (Portrait)', value: 9 / 16 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAspectChange(preset.value)}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
                        aspect === preset.value 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {!croppedBlob && (
                <button 
                  onClick={applyCrop}
                  disabled={!completedCrop?.width || !completedCrop?.height}
                  className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 shadow-sm shadow-purple-500/20"
                >
                  Apply Crop
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6">
            <button 
              onClick={clear}
              className="px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} /> {croppedBlob ? 'Start Over' : 'Cancel'}
            </button>
            {croppedBlob && (
              <button 
                onClick={handleDownload}
                className="px-6 py-2.5 bg-purple-500 text-white font-medium rounded-md hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-sm shadow-purple-500/20"
              >
                <Download size={18} /> Download Cropped Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;
