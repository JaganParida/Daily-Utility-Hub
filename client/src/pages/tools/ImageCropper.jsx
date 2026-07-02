import { useState, useRef, useEffect } from 'react';
import { Crop, Download, RefreshCw, RotateCw, FlipHorizontal, FlipVertical, Circle, Loader2, CheckCircle, Settings2, Image as ImageIcon } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import DropzoneComponent from '../../components/DropzoneComponent';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle', 'downloading', 'downloaded'
  const canvasRef = useRef(null);

  // Preview Object URLs (tracked in state to prevent memory leaks)
  const [previewUrl, setPreviewUrl] = useState('');
  const [croppedUrl, setCroppedUrl] = useState('');

  // Handle original file object URL lifecycle
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImgSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl('');
      setImgSrc('');
    }
  }, [file]);

  // Handle cropped file object URL lifecycle
  useEffect(() => {
    if (croppedBlob) {
      const url = URL.createObjectURL(croppedBlob);
      setCroppedUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCroppedUrl('');
    }
  }, [croppedBlob]);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setCrop(undefined);
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

    setIsProcessing(true);
    // Smooth 600ms processing delay for loader visual feedback
    await new Promise((res) => setTimeout(res, 600));

    try {
      const canvas = canvasRef.current;
      const image = imgRef.current;
      
      const scaleXRatio = image.naturalWidth / image.width;
      const scaleYRatio = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width * scaleXRatio;
      canvas.height = completedCrop.height * scaleYRatio;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scaleX, scaleY);
      ctx.rotate((rotate * Math.PI) / 180);

      const cropX = completedCrop.x * scaleXRatio;
      const cropY = completedCrop.y * scaleYRatio;
      
      ctx.drawImage(
        image,
        -cropX - (canvas.width / 2),
        -cropY - (canvas.height / 2),
        image.naturalWidth,
        image.naturalHeight
      );
      
      ctx.resetTransform();

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
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedUrl) return;
    setDownloadState('downloading');
    
    // Simulate processing time for beautiful UI flow
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = croppedUrl;
      
      const originalExt = file.name.split('.').pop() || 'jpg';
      const ext = isCircular || originalExt === 'png' ? 'png' : originalExt;
      
      link.download = `cropped_${file.name.replace(`.${originalExt}`, '')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadState('downloaded');
      toast.success('Image downloaded successfully!');
      
      setTimeout(() => {
        setDownloadState('idle');
      }, 2500);
    }, 850);
  };

  const clear = () => {
    setFile(null);
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
          <Crop size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Image Cropper</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Visually crop, rotate, flip, or create circular avatars instantly.</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          
        {/* Cropper Area */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!file ? (
              <motion.div 
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col justify-center"
              >
                <DropzoneComponent 
                  className="flex-1 h-full w-full justify-center"
                  onFilesAccepted={handleFilesAccepted} 
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                  maxFiles={1}
                  title="Drag & drop an image to crop"
                />
              </motion.div>
            ) : !croppedBlob ? (
              <motion.div 
                key="cropper"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center max-w-full min-h-0"
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  circularCrop={isCircular}
                  className="max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-hidden rounded-xl border border-border/50"
                >
                  <img
                    ref={imgRef}
                    alt="Crop target"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[60vh] lg:max-h-[calc(100vh-220px)] object-contain transition-transform"
                    style={{ transform: `scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)` }}
                  />
                </ReactCrop>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center w-full h-full justify-center min-h-0"
              >
                <div className="bg-muted/10 p-4 md:p-8 rounded-2xl border border-border w-full flex justify-center max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-hidden">
                  <img 
                    src={croppedUrl} 
                    alt="Cropped result" 
                    className="max-h-full object-contain drop-shadow-md rounded-lg"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            {/* Transform Controls */}
            {!croppedBlob && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3 flex items-center gap-2">
                  <Settings2 size={16} /> Transform
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotate((r) => (r + 90) % 360)}
                    className="flex-1 py-3 bg-muted/50 hover:bg-muted border border-border/50 hover:border-border rounded-xl text-foreground flex flex-col items-center gap-1.5 transition-all shadow-sm active:scale-[0.97]"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw size={18} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Rotate</span>
                  </button>
                  <button
                    onClick={() => setScaleX(s => s * -1)}
                    className="flex-1 py-3 bg-muted/50 hover:bg-muted border border-border/50 hover:border-border rounded-xl text-foreground flex flex-col items-center gap-1.5 transition-all shadow-sm active:scale-[0.97]"
                    title="Flip Horizontally"
                  >
                    <FlipHorizontal size={18} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Flip X</span>
                  </button>
                  <button
                    onClick={() => setScaleY(s => s * -1)}
                    className="flex-1 py-3 bg-muted/50 hover:bg-muted border border-border/50 hover:border-border rounded-xl text-foreground flex flex-col items-center gap-1.5 transition-all shadow-sm active:scale-[0.97]"
                    title="Flip Vertically"
                  >
                    <FlipVertical size={18} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Flip Y</span>
                  </button>
                </div>
              </div>
            )}

            {/* Aspect Ratio Templates */}
            {!croppedBlob && (
              <div className="pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3 flex items-center gap-2">
                  <ImageIcon size={16} /> Aspect Ratio
                </h3>
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
                      className={`w-full text-left px-3.5 py-3 text-xs font-semibold rounded-xl transition-all border shadow-sm active:scale-[0.98] ${
                        aspect === preset.value && !isCircular
                          ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400' 
                          : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleAspectChange(1, true)}
                    className={`w-full text-left px-3.5 py-3 text-xs font-semibold rounded-xl transition-all border shadow-sm active:scale-[0.98] flex items-center justify-between ${
                      isCircular 
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400' 
                        : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>Circular Profile</span>
                    <Circle size={12} className={isCircular ? "fill-purple-500 text-purple-500" : "text-muted-foreground"} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!croppedBlob ? (
              <button 
                onClick={applyCrop}
                disabled={!file || isProcessing}
                className="w-full h-14 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_12px_rgba(168,85,247,0.3)] disabled:opacity-50 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Cropping...
                  </>
                ) : (
                  'Apply Crop & Transform'
                )}
              </button>
            ) : (
              <button 
                onClick={handleDownload}
                disabled={downloadState !== 'idle'}
                className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 active:scale-[0.98] overflow-hidden ${
                  downloadState === 'downloaded' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                }`}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {downloadState === 'downloaded' ? (
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
                  ) : downloadState === 'downloading' ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
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
                      Download Cropped Image
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}
            
            <button 
              onClick={clear}
              disabled={isProcessing}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
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
