import { useState, useRef } from 'react';
import { Settings, UploadCloud, FileText, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfMetadata = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    creator: '',
    producer: '',
    keywords: ''
  });

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

  const handleChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    const hasChanges = Object.values(metadata).some(val => val.trim() !== '');
    if (!hasChanges) {
      toast.error('Please fill in at least one metadata field to update');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    Object.entries(metadata).forEach(([key, val]) => {
      if (val.trim()) formData.append(key, val);
    });

    try {
      setIsProcessing(true);
      const toastId = toast.loading('Updating metadata securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/metadata', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      // Download the result
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'updated_metadata.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Metadata updated successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to update metadata. The file may be encrypted.';
      
      if (error.response?.data instanceof Blob) {
         const reader = new FileReader();
         reader.onload = () => {
           try {
             const json = JSON.parse(reader.result);
             toast.error(json.message || 'Failed to update metadata', { id: toastId });
           } catch {
             toast.error('Failed to update metadata', { id: toastId });
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
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit PDF Metadata</h1>
          <p className="text-muted-foreground mt-1 text-sm">Modify hidden document properties like Author, Title, and Creator.</p>
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
                isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-card hover:border-blue-500/50 hover:bg-muted/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 pointer-events-none">
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
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 overflow-y-auto custom-scrollbar">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Document Properties</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Title</label>
                   <input
                     type="text" name="title" value={metadata.title} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="Document Title"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Author</label>
                   <input
                     type="text" name="author" value={metadata.author} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="Author Name"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Subject</label>
                   <input
                     type="text" name="subject" value={metadata.subject} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="Subject"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Creator</label>
                   <input
                     type="text" name="creator" value={metadata.creator} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="Creator Application"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Producer</label>
                   <input
                     type="text" name="producer" value={metadata.producer} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="PDF Producer"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1 ml-1">Keywords</label>
                   <input
                     type="text" name="keywords" value={metadata.keywords} onChange={handleChange}
                     className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                     placeholder="Comma separated"
                   />
                 </div>
               </div>
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Metadata Info</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Edit hidden metadata used by search engines and document viewers.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Empty fields will be ignored (they won't overwrite existing data).</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>We delete your file immediately after processing.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleUpdate}
            disabled={!file || isProcessing}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isProcessing ? 'Updating...' : 'Save & Download'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfMetadata;
