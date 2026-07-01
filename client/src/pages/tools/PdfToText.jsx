import { useState, useRef } from 'react';
import { Type, UploadCloud, FileText, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfToText = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pagesCount, setPagesCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFile(droppedFile);
    setExtractedText('');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      setIsProcessing(true);
      const toastId = toast.loading('Extracting text on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setExtractedText(response.data.text || 'No text found in this document (it might be a scanned image).');
      setPagesCount(response.data.pages || 0);
      
      toast.success('Text extracted successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to extract text. The file might be encrypted.';
      toast.error(errMsg);
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
    <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Extract Text from PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert PDF documents into raw, editable text.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-pink-500 bg-pink-500/5' : 'border-border bg-card hover:border-pink-500/50 hover:bg-muted/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                Drag & drop a PDF file here or click to browse.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{file.name}</h3>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setExtractedText(''); }} className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Remove
              </button>
            </div>
          )}

          {extractedText && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-0 flex-1">
               <div className="flex items-center justify-between mb-4 shrink-0">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extracted Text ({pagesCount} Pages)</h3>
                 <button 
                   onClick={copyToClipboard}
                   className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                 >
                   {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                   {copied ? 'Copied' : 'Copy Text'}
                 </button>
               </div>
               <textarea
                 readOnly
                 value={extractedText}
                 className="w-full flex-1 bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none custom-scrollbar resize-none"
               />
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Extraction Info</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Instantly extracts all human-readable text from the document.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Maintains basic line breaks and paragraphs.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Note: Does not work on scanned image-only PDFs (OCR not supported yet).</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleExtract}
            disabled={!file || isProcessing || extractedText.length > 0}
            className="w-full py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Type size={18} />
            {isProcessing ? 'Extracting...' : 'Extract Text Now'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfToText;
