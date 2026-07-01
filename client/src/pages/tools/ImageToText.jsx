import { useState, useRef } from 'react';
import { ScanText, UploadCloud, Copy, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Tesseract from 'tesseract.js';

const ImageToText = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile?.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    processImageSelection(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile?.type.startsWith('image/')) return;
    processImageSelection(selectedFile);
  };

  const processImageSelection = (file) => {
    setImage(file);
    setExtractedText('');
    setProgress(0);
    
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
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
      
      const result = await Tesseract.recognize(
        image,
        'eng',
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

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shadow-sm">
          <ScanText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image to Text (OCR)</h1>
          <p className="text-muted-foreground mt-1 text-sm">Scan photos of documents, notes, or slides and extract the text instantly.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0">
        
        {/* Upload & Action Panel */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Dropzone */}
          {!imagePreview ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-orange-500 bg-orange-500/5' : 'border-border bg-card hover:border-orange-500/50 hover:bg-muted/30'
              }`}
            >
              <input 
                type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" 
              />
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none text-center">Upload Image</h3>
              <p className="text-xs text-muted-foreground text-center pointer-events-none">
                Drag & drop a clear photo of text here.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground truncate mr-2">{image?.name}</h3>
                <button onClick={() => { setImage(null); setImagePreview(''); setExtractedText(''); }} className="text-xs text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors font-medium">
                  Remove
                </button>
              </div>
              <div className="p-4 bg-muted/10 flex justify-center items-center h-48">
                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full rounded shadow-sm object-contain" />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Scanner Info</h3>
              <div className="space-y-3 text-xs text-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                  <p>100% private. Processing happens inside your browser.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                  <p>Supports English text recognition.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                  <p>Best results with high-contrast, clear photos.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={extractText}
              disabled={!image || isProcessing}
              className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ScanText size={18} />
              {isProcessing ? `Scanning (${progress}%)...` : 'Extract Text Now'}
            </button>
            
            {isProcessing && (
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

        </div>

        {/* Results Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extracted Text</h3>
            <button 
              onClick={copyToClipboard}
              disabled={!extractedText}
              className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          
          <div className="flex-1 p-4">
            {extractedText ? (
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full h-full bg-transparent text-sm text-foreground focus:outline-none resize-none custom-scrollbar"
                placeholder="Extracted text will appear here. You can edit it if needed."
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-3">
                {isProcessing ? (
                  <>
                    <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                    <p>AI is reading the image...</p>
                  </>
                ) : (
                  <p>Upload an image and click "Extract Text Now" to see the results.</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageToText;
