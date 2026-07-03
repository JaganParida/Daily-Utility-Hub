import { useState, useRef, useEffect } from 'react';
import { ScanText, Download, Globe, FileText, Loader2, ArrowRightLeft, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';

const ImageToText = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extractedText, setExtractedText] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Advanced Features
  const [ocrLanguage, setOcrLanguage] = useState('eng');

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'hin', name: 'Hindi' },
    { code: 'jpn', name: 'Japanese' }
  ];

  // Handle original file object URL lifecycle
  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview('');
    }
  }, [image]);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    setImage(files[0]);
    setExtractedText('');
    setProgress(0);
  };

  const enhanceImageForOCR = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Upscale image by 2x to improve Tesseract accuracy on low-res images
          const scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          
          // Draw and scale
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Grayscale & Contrast Enhancement
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to grayscale
            const gray = (r * 0.299) + (g * 0.587) + (b * 0.114);
            
            // Increase contrast heavily (push darks darker, lights lighter)
            const factor = (259 * (128 + 255)) / (255 * (259 - 128));
            let newGray = factor * (gray - 128) + 128;
            newGray = Math.max(0, Math.min(255, newGray)); // Clamp
            
            data[i] = newGray;
            data[i + 1] = newGray;
            data[i + 2] = newGray;
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractText = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setExtractedText('');
      
      // Pre-process the image for significantly better OCR accuracy
      const enhancedBlob = await enhanceImageForOCR(image);
      
      const result = await Tesseract.recognize(
        enhancedBlob,
        ocrLanguage,
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      setExtractedText(result.data.text || 'No text found in this image.');
      toast.success('Text extracted successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to extract text. Make sure the image is clear.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTxt = () => {
    if (!extractedText) return;
    const element = document.createElement("a");
    const file = new Blob([extractedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "extracted_text.txt";
    document.body.appendChild(element);
    element.click();
    element.remove();
    URL.revokeObjectURL(element.href);
    toast.success("Downloaded as .txt");
  };

  const clear = () => {
    setImage(null);
    setExtractedText('');
    setProgress(0);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <ScanText size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Image to Text (OCR)</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Extract text from photos instantly with advanced multi-language OCR.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Workspace */}
        <motion.div 
          layout 
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!image ? 'min-h-[50vh]' : 'min-h-[600px]'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!image ? (
              <motion.div 
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full w-full flex flex-col justify-center"
              >
                <DropzoneComponent 
                  className="flex-1 h-full w-full justify-center"
                  onFilesAccepted={handleFilesAccepted} 
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
                  maxFiles={1}
                  title="Drag & drop an image to extract text"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col w-full h-full min-h-0 gap-6"
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Extraction Workspace
                  </h3>
                  <button 
                    onClick={clear}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors font-semibold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.5fr] gap-6 items-stretch flex-1 min-h-0">
                  
                  {/* Left: Original Image Preview */}
                  <div className="flex flex-col items-center w-full min-w-0 bg-muted/20 border border-border rounded-xl overflow-hidden p-4 relative">
                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Original" 
                        className="max-h-[400px] max-w-full object-contain drop-shadow-md rounded"
                      />
                    </div>
                    <p className="font-medium text-muted-foreground text-xs truncate w-full text-center mt-4">
                      {image.name}
                    </p>
                  </div>

                  {/* Separator / Arrow */}
                  <div className="hidden lg:flex flex-col items-center justify-center text-muted-foreground">
                    <ArrowRightLeft size={24} className="opacity-30" />
                  </div>

                  {/* Right: Extracted Text Area */}
                  <div className="flex flex-col w-full min-w-0 bg-background border border-border rounded-xl overflow-hidden relative">
                    <div className="h-12 border-b border-border bg-muted/30 flex items-center justify-between px-4 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Text Result</span>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={copyToClipboard}
                          disabled={!extractedText}
                          className="text-xs bg-background hover:bg-muted text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors flex items-center gap-2 disabled:opacity-50 font-medium shadow-sm"
                        >
                          {copied ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button 
                          onClick={downloadAsTxt}
                          disabled={!extractedText}
                          className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg border border-transparent transition-colors flex items-center gap-2 disabled:opacity-50 font-medium shadow-sm"
                        >
                          <Download size={14}/>
                          Save
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 relative">
                      {extractedText ? (
                        <textarea
                          value={extractedText}
                          onChange={(e) => setExtractedText(e.target.value)}
                          className="w-full h-full min-h-[300px] bg-transparent text-sm text-foreground focus:outline-none resize-none custom-scrollbar leading-relaxed"
                          placeholder="Extracted text will appear here. You can edit it if needed."
                          spellCheck="false"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                          {isProcessing ? (
                            <>
                              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                              <p className="text-sm font-medium animate-pulse text-primary/80">Scanning Image...</p>
                            </>
                          ) : (
                            <>
                              <ScanText size={32} className="opacity-20" />
                              <p className="text-sm">Click 'Run OCR Scan' to extract text.</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right pane: Settings Panel */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Globe size={16} className="text-primary" /> Scanner Settings
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Document Language</label>
                <select
                  value={ocrLanguage}
                  onChange={(e) => setOcrLanguage(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Selecting the correct language significantly improves accuracy.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
                  <li>Processing is done locally via Tesseract.js.</li>
                  <li>Works best with high contrast text.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <button 
                onClick={extractText}
                disabled={!image || isProcessing}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary hover:shadow-primary/30"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ScanText size={20} />}
                {isProcessing ? `Scanning (${progress}%)...` : 'Run OCR Scan'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageToText;
