import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Droplets } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfWatermark = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
  };

  const handleWatermark = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!watermarkText.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('watermarkText', watermarkText);

    try {
      setIsProcessing(true);
      const toastId = toast.loading('Applying watermark securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/watermark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'watermarked_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Watermark applied successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add watermark to PDF. It may be encrypted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shadow-sm">
          <Droplets size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Add PDF Watermark</h1>
          <p className="text-muted-foreground mt-1 text-sm">Stamp your PDF documents with custom text across all pages.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & Preview Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          <div className="grid md:grid-cols-2 gap-6 h-64 shrink-0">
            {/* Dropzone */}
            {!file ? (
              <div 
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-full ${
                  isDragging ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-card hover:border-purple-500/50 hover:bg-muted/30'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-4 pointer-events-none">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-center items-center h-full relative group">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="font-bold text-foreground text-center truncate w-full px-4">{file.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button onClick={() => setFile(null)} className="absolute top-4 right-4 text-xs text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Remove
                </button>
              </div>
            )}

            {/* Visual Preview */}
            <div className="bg-white rounded-2xl border border-border shadow-inner p-4 relative overflow-hidden flex items-center justify-center h-full">
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span 
                  className="text-gray-300 font-bold whitespace-nowrap opacity-50 select-none pointer-events-none"
                  style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', transform: 'rotate(-45deg)' }}
                >
                  {watermarkText || 'PREVIEW'}
                </span>
              </div>
              <p className="text-gray-400 text-sm opacity-50 absolute bottom-4">Live Preview</p>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
             <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Watermark Text</label>
             <input
               type="text"
               value={watermarkText}
               onChange={(e) => setWatermarkText(e.target.value)}
               placeholder="e.g. CONFIDENTIAL or DRAFT"
               className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg font-medium"
               maxLength={30}
             />
          </div>

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Watermark Details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Applied diagonally across the center of all pages.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Text is semi-transparent to keep document readable.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>We delete your file immediately after processing.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleWatermark}
            disabled={!file || !watermarkText.trim() || isProcessing}
            className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Droplets size={18} />
            {isProcessing ? 'Applying...' : 'Stamp PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfWatermark;
