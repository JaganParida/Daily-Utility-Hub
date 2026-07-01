import { useState, useRef } from 'react';
import { FileDown, UploadCloud, FileText, CheckCircle2, Droplets } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfWatermark = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      toast.error('Please enter the watermark text');
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

      // Download the result
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
      const errMsg = error.response?.data?.message || 'Failed to apply watermark. The file may be encrypted.';
      
      // Axios blobs return as arraybuffer in error.response.data sometimes
      if (error.response?.data instanceof Blob) {
         const reader = new FileReader();
         reader.onload = () => {
           try {
             const json = JSON.parse(reader.result);
             toast.error(json.message || 'Failed to apply watermark', { id: toastId });
           } catch {
             toast.error('Failed to apply watermark', { id: toastId });
           }
         };
         reader.readAsText(error.response.data);
      } else {
        toast.error(errMsg, { id: toastId });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shadow-sm">
          <Droplets size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Watermark PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Add a text watermark across all pages of a PDF document.</p>
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
                isDragging ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-card hover:border-purple-500/50 hover:bg-muted/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                Drag & drop a PDF file here or click to browse.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{file.name}</h3>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Remove
              </button>
            </div>
          )}

          {file && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
               <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Watermark Text</label>
               <input
                 type="text"
                 value={watermarkText}
                 onChange={(e) => setWatermarkText(e.target.value)}
                 placeholder="e.g. CONFIDENTIAL"
                 className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
               />
               <p className="text-xs text-muted-foreground">
                 This text will be stamped diagonally across the center of all pages.
               </p>
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Watermark Settings</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Files are processed securely on the backend server.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Original file is deleted immediately after processing.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Protects your document from unauthorized use.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleWatermark}
            disabled={!file || !watermarkText.trim() || isProcessing}
            className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown size={18} />
            {isProcessing ? 'Processing...' : 'Apply Watermark'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfWatermark;
