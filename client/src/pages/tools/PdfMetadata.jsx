import { useState, useRef } from 'react';
import { Settings, UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfMetadata = () => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    creator: '',
    producer: '',
    keywords: ''
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const inspectFile = async (selectedFile) => {
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF metadata...');
    try {
      const { data } = await axios.post('http://localhost:5000/api/pdf/inspect', formData);
      setIsInspecting(false);
      
      if (data.isEncrypted) {
        toast.error('This PDF is encrypted. Please decrypt it first.', { id: toastId });
        return;
      }

      setFile(selectedFile);
      setMetadata({
        title: data.metadata.title || '',
        author: data.metadata.author || '',
        subject: data.metadata.subject || '',
        creator: data.metadata.creator || '',
        producer: data.metadata.producer || '',
        keywords: Array.isArray(data.metadata.keywords) 
          ? data.metadata.keywords.join(', ') 
          : (data.metadata.keywords || '')
      });
      toast.success('PDF metadata loaded successfully!', { id: toastId });
    } catch (e) {
      setIsInspecting(false);
      console.error(e);
      // Fallback
      setFile(selectedFile);
      toast.dismiss(toastId);
    }
  };

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
    inspectFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    inspectFile(selectedFile);
  };

  const handleChange = (e) => {
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', metadata.title);
    formData.append('author', metadata.author);
    formData.append('subject', metadata.subject);
    formData.append('creator', metadata.creator);
    formData.append('producer', metadata.producer);
    formData.append('keywords', metadata.keywords);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Updating metadata securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/metadata', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_updated.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Metadata updated successfully!', { id: toastId });
      setFile(null);
      setMetadata({
        title: '',
        author: '',
        subject: '',
        creator: '',
        producer: '',
        keywords: ''
      });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to update metadata.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit PDF Metadata</h1>
          <p className="text-muted-foreground mt-1 text-sm">Modify hidden document properties like Author, Title, Creator, and Keywords.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !isInspecting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-card hover:border-blue-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 pointer-events-none">
                {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">
                {isInspecting ? 'Inspecting PDF Properties...' : 'Upload PDF'}
              </h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                {isInspecting ? 'Reading current metadata tags.' : 'Drag & drop a PDF file here or click to browse.'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg truncate max-w-md">{file.name}</h3>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setMetadata({ title: '', author: '', subject: '', creator: '', producer: '', keywords: '' }); }} 
                className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold"
              >
                Change File
              </button>
            </div>
          )}

          {file && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Document Properties</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Title</label>
                    <input
                      type="text" name="title" value={metadata.title} onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Document Title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Author</label>
                    <input
                      type="text" name="author" value={metadata.author} onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Author Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Subject</label>
                    <input
                      type="text" name="subject" value={metadata.subject} onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Subject"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Creator</label>
                    <input
                      type="text" name="creator" value={metadata.creator} onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Creator Application"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Keywords</label>
                    <input
                      type="text" name="keywords" value={metadata.keywords} onChange={handleChange}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="e.g. tag1, tag2, document keyphrase (comma separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Producer (Read-Only)</label>
                    <input
                      type="text" name="producer" value={metadata.producer} readOnly
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                      placeholder="PDF Generator Engine"
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
                <p>Edits internal metadata properties embedded in the PDF.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Helps with search indexing, search engines, and folder sorting.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Original file is securely wiped after modification.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleUpdate}
            disabled={!file || isProcessing}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings size={18} />
            {isProcessing ? 'Updating...' : 'Save Metadata'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfMetadata;
