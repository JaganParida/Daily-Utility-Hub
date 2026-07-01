import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Scissors, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfSplit = () => {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('');
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

  const handleSplit = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!pages.trim()) {
      toast.error('Please specify pages to extract');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('pages', pages);

    try {
      setIsProcessing(true);
      const toastId = toast.loading('Splitting PDF securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/split', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'split_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF split successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to split PDF. Check your page ranges and ensure the PDF is not encrypted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Scissors size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Split PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Extract specific pages or page ranges into a new PDF document.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-card hover:border-blue-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 pointer-events-none">
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
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
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
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
               <div>
                 <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                   Select Pages to Extract
                   <span className="group relative cursor-help text-blue-500">
                     <HelpCircle size={16} />
                     <div className="absolute bottom-full mb-2 left-0 w-64 p-3 bg-foreground text-background text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                       Valid formats: "1-5", "8,11,13", or combinations like "1-3, 5, 8".
                     </div>
                   </span>
                 </label>
                 <input
                   type="text"
                   value={pages}
                   onChange={(e) => setPages(e.target.value)}
                   placeholder="e.g. 1-3, 5, 8"
                   className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg font-mono tracking-widest"
                 />
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 <button onClick={() => setPages(prev => prev ? prev + ', 1' : '1')} className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted text-foreground transition-colors font-medium text-left truncate">Extract First Page</button>
                 <button onClick={() => setPages(prev => prev ? prev + ', 1-5' : '1-5')} className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted text-foreground transition-colors font-medium text-left truncate">First 5 Pages</button>
                 <button onClick={() => setPages('')} className="px-3 py-2 text-xs border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors font-medium text-left truncate col-span-2">Clear Selection</button>
               </div>
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Split Details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Creates a new PDF containing only the pages you specified.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Use commas and dashes for complex selections (e.g., 1-5, 8, 11-13).</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Processed securely; we delete all files after splitting.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSplit}
            disabled={!file || !pages.trim() || isProcessing}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scissors size={18} />
            {isProcessing ? 'Splitting...' : 'Extract Pages'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfSplit;
