import { useState, useRef } from 'react';
import { FileDown, UploadCloud, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfMerge = () => {
  const [files, setFiles] = useState([]);
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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length === 0) {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    if (direction === 'up' && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === 'down' && index < files.length - 1) {
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    }
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 PDFs to merge');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });

    try {
      setIsProcessing(true);
      const toastId = toast.loading('Merging PDFs securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/merge', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      // Download the result
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDFs merged successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to merge PDFs. They may be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shadow-sm">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Merge PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Combine multiple PDF files into one securely.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & List Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging ? 'border-red-500 bg-red-500/5' : 'border-border bg-card hover:border-red-500/50 hover:bg-muted/30'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              multiple 
              accept=".pdf,application/pdf" 
            />
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 pointer-events-none">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload PDFs</h3>
            <p className="text-sm text-muted-foreground text-center pointer-events-none">
              Drag & drop PDF files here or click to browse.
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Files to Merge ({files.length})</h3>
                <span className="text-xs text-muted-foreground italic">Order will be preserved from top to bottom</span>
              </div>
              <div className="overflow-y-auto p-2 custom-scrollbar">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl group transition-colors">
                    <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveFile(idx, 'up')} disabled={idx === 0} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-30">
                        ↑
                      </button>
                      <button onClick={() => moveFile(idx, 'down')} disabled={idx === files.length - 1} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-30">
                        ↓
                      </button>
                      <button onClick={() => removeFile(idx)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Merge Settings</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Files are processed securely on the backend server.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Original files are deleted immediately after processing.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Maintains original quality and formatting.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className="w-full py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown size={18} />
            {isProcessing ? 'Processing...' : 'Merge PDFs Now'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfMerge;
