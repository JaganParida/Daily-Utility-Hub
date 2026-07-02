import { useState, useRef, useCallback } from 'react';
import { Crop, Download, RefreshCw, RotateCw, FlipHorizontal, FlipVertical, Circle } from 'lucide-react';
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
  
  // Advanced Controls
  const [aspect, setAspect] = useState(undefined);
  const [isCircular, setIsCircular] = useState(false);
  const [rotate, setRotate] = useState(0); // 0, 90, 180, 270
  const [scaleX, setScaleX] = useState(1); // 1 or -1
  const [scaleY, setScaleY] = useState(1); // 1 or -1
  
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
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const handleAspectChange = (newAspect, circular = false) => {
    setAspect(newAspect);
    setIsCircular(circular);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (newAspect) {
        setCrop(centerAspectCrop(width, height, newAspect));
      } else {
        setCrop(undefined);
      }
    }
  };

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) {
       toast.error("Please draw a crop area first.");
       return;
    }

    const canvas = canvasRef.current;
    const image = imgRef.current;
    
    const scaleXRatio = image.naturalWidth / image.width;
    const scaleYRatio = image.naturalHeight / image.height;
    
    // Set canvas size based on bounding box of rotated image, but for cropping 
    // it's easier to just draw the cropped rect directly.
    canvas.width = completedCrop.width * scaleXRatio;
    canvas.height = completedCrop.height * scaleYRatio;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    
    // Fill background if rotated
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scaleX, scaleY);
    ctx.rotate((rotate * Math.PI) / 180);

    const cropX = completedCrop.x * scaleXRatio;
    const cropY = completedCrop.y * scaleYRatio;
    
    // Draw the image offset by the crop amount
    ctx.drawImage(
      image,
      -cropX - (canvas.width / 2),
      -cropY - (canvas.height / 2),
      image.naturalWidth,
      image.naturalHeight
    );
    
    ctx.resetTransform();

    // If circular, we can clip the canvas, but standard JPEG doesn't support transparency.
    // For circular, we'll export as PNG to keep transparency outside the circle.
    if (isCircular) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, Math.min(canvas.width, canvas.height)/2, 0, 2 * Math.PI);
      ctx.fill();
    }

    const type = isCircular || file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    
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
    
    const originalExt = file.name.split('.').pop() || 'jpg';
    const ext = isCircular || originalExt === 'png' ? 'png' : originalExt;
    
    link.download = `cropped_${file.name.replace(`.${originalExt}`, '')}.${ext}`;
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
    setRotate(0);
    setScaleX(1);
    setScaleY(1);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shadow-sm">
          <Crop size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Image Cropper</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visually crop, rotate, flip, or create circular avatars instantly.</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          
          {/* Cropper Area */}
          <div className="flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[50vh] relative">
            {!file ? (
              <div className="w-full h-full flex flex-col justify-center">
                <DropzoneComponent 
                  onFilesAccepted={handleFilesAccepted} 
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                  maxFiles={1}
                  title="Drag & drop an image to crop"
                />
              </div>
            ) : !croppedBlob ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  circularCrop={isCircular}
                  className="max-h-[600px]"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[600px] object-contain transition-transform"
                    style={{ transform: `scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)` }}
                  />
                </ReactCrop>
              ) : (
                <div className="flex flex-col items-center w-full h-full justify-center">
                  <div className="bg-muted/30 p-8 rounded-2xl border border-border w-full flex justify-center">
                    <img 
                      src={URL.createObjectURL(croppedBlob)} 
                      alt="Cropped result" 
                      className="max-h-[500px] object-contain drop-shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controls sidebar */}
            <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
              
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
                
                {/* Transform Controls */}
                {!croppedBlob && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3">Transform</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRotate((r) => (r + 90) % 360)}
                        className="flex-1 py-2 bg-muted hover:bg-border border border-border rounded-lg text-foreground flex flex-col items-center gap-1 transition-colors"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw size={18} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Rotate</span>
                      </button>
                      <button
                        onClick={() => setScaleX(s => s * -1)}
                        className="flex-1 py-2 bg-muted hover:bg-border border border-border rounded-lg text-foreground flex flex-col items-center gap-1 transition-colors"
                        title="Flip Horizontally"
                      >
                        <FlipHorizontal size={18} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Flip X</span>
                      </button>
                      <button
                        onClick={() => setScaleY(s => s * -1)}
                        className="flex-1 py-2 bg-muted hover:bg-border border border-border rounded-lg text-foreground flex flex-col items-center gap-1 transition-colors"
                        title="Flip Vertically"
                      >
                        <FlipVertical size={18} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Flip Y</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Aspect Ratio Templates */}
                {!croppedBlob && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3">Aspect Ratio</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Freeform', value: undefined, circ: false },
                        { label: '1:1 Square', value: 1, circ: false },
                        { label: '16:9 Landscape', value: 16 / 9, circ: false },
                        { label: '4:3 Classic', value: 4 / 3, circ: false },
                        { label: '9:16 Portrait', value: 9 / 16, circ: false },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => handleAspectChange(preset.value, preset.circ)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors border ${
                            aspect === preset.value && isCircular === preset.circ
                              ? 'bg-purple-500/10 border-purple-500 text-purple-500' 
                              : 'bg-muted/50 border-transparent text-foreground hover:bg-muted'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                          onClick={() => handleAspectChange(1, true)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors border flex items-center justify-between ${
                            isCircular 
                              ? 'bg-purple-500/10 border-purple-500 text-purple-500' 
                              : 'bg-muted/50 border-transparent text-foreground hover:bg-muted'
                          }`}
                        >
                          Circular Profile <Circle size={12} className={isCircular ? "fill-purple-500" : ""} />
                        </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!croppedBlob ? (
                  <button 
                    onClick={applyCrop}
                    className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/20"
                  >
                    Apply Crop & Transform
                  </button>
                ) : (
                  <button 
                    onClick={handleDownload}
                    className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download Cropped Image
                  </button>
                )}
                
                <button 
                  onClick={clear}
                  className="w-full py-3 bg-background border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> {croppedBlob ? 'Start Over' : 'Cancel & Clear'}
                </button>
              </div>

            </div>
        </div>
    </div>
  );
};

export default ImageCropper;
