import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import { Settings, UploadCloud, FileText, CheckCircle2, Loader2, Eye, ExternalLink, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    creator: '',
    producer: '',
    keywords: ''
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClear = () => {
    setFile(null);
    setShowPreview(false);
    setMetadata({ title: '', author: '', subject: '', creator: '', producer: '', keywords: '' });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inspectFile = async (selectedFile) => {
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF metadata...');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const meta = await pdf.getMetadata();
      const info = meta.info || {};

      setIsInspecting(false);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMetadata({
        title: info.Title || '',
        author: info.Author || '',
        subject: info.Subject || '',
        creator: info.Creator || '',
        producer: info.Producer || '',
        keywords: info.Keywords || ''
      });
      toast.success('PDF metadata loaded successfully!', { id: toastId });
    } catch (e) {
      setIsInspecting(false);
      console.error(e);
      if (e.name === 'PasswordException' || e.message?.toLowerCase().includes('password') || e.message?.toLowerCase().includes('decrypt') || e.message?.toLowerCase().includes('authenticate')) {
        toast.error('This PDF is encrypted. Please decrypt it first.', { id: toastId });
      } else {
        // Fallback
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        toast.dismiss(toastId);
      }
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

    let toastId = toast.loading('Updating PDF metadata locally...');
    try {
      setIsProcessing(true);
      
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.producer) pdfDoc.setProducer(metadata.producer);
      if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
      
      const updatedBytes = await pdfDoc.save({ useObjectStreams: false });
      
      const url = window.URL.createObjectURL(new Blob([updatedBytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_updated.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
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
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update metadata. The file might be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool-page-container">
      {/* Responsive Header Layout */}
      <ToolHeader
        title="Edit PDF Metadata"
        description="Modify hidden document properties like Author, Title, Creator, and Keywords."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Metadata Editor"
        extraBadge="Author, Title, Tags"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Workspace / Upload & Form Area */}
        <motion.div 
          layout 
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
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
                className="flex-1 h-full w-full flex flex-col justify-center"
              >
                <div 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={handleDrop}
                  onClick={() => !isInspecting && fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".pdf,application/pdf" 
                  />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">
                    {isInspecting ? 'Inspecting PDF Properties...' : 'Upload PDF'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-xs leading-relaxed">
                    {isInspecting ? 'Reading current metadata tags.' : 'Drag & drop a PDF file here, or click to browse.'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 w-full flex flex-col min-h-0"
              >
                {/* File Details Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#202124] text-sm sm:text-base truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-[#5f6368] text-xs mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="btn-google-secondary text-xs py-1.5 px-3"
                      >
                        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showPreview ? 'Hide Preview' : 'Interactive Preview'}
                      </button>
                      <button 
                        onClick={handleClear} 
                        className="btn-google-danger text-xs py-1.5 px-3"
                      >
                        <X size={13} className="inline mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showPreview && previewUrl && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-[#dadce0] pt-4 w-full flex flex-col gap-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Interactive Document Preview</h4>
                          <a 
                            href={previewUrl} target="_blank" rel="noreferrer"
                            className="text-xs text-[#1a73e8] hover:underline flex items-center gap-1 font-semibold"
                          >
                            Open in New Tab <ExternalLink size={12} />
                          </a>
                        </div>
                        <div className="w-full h-[360px] md:h-[450px] border border-[#dadce0] rounded-xl overflow-hidden bg-white relative">
                          <object 
                            data={previewUrl} 
                            type="application/pdf" 
                            className="w-full h-full"
                          >
                            <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                              <div className="p-6 text-center text-sm text-[#5f6368]">
                                Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                              </div>
                            </iframe>
                          </object>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Document Properties Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 mb-4">
                    Document Properties & Metadata
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">Document Title</label>
                      <input
                        type="text" 
                        name="title" 
                        value={metadata.title} 
                        onChange={handleChange}
                        className="google-input w-full text-sm font-semibold"
                        placeholder="Document Title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">Author / Creator</label>
                      <input
                        type="text" 
                        name="author" 
                        value={metadata.author} 
                        onChange={handleChange}
                        className="google-input w-full text-sm font-semibold"
                        placeholder="Author Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">Subject / Topic</label>
                      <input
                        type="text" 
                        name="subject" 
                        value={metadata.subject} 
                        onChange={handleChange}
                        className="google-input w-full text-sm font-semibold"
                        placeholder="Subject description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">Creator Tool / App</label>
                      <input
                        type="text" 
                        name="creator" 
                        value={metadata.creator} 
                        onChange={handleChange}
                        className="google-input w-full text-sm font-semibold"
                        placeholder="Creator Application"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">Keywords & Tags (Comma Separated)</label>
                      <input
                        type="text" 
                        name="keywords" 
                        value={metadata.keywords} 
                        onChange={handleChange}
                        className="google-input w-full text-sm font-semibold"
                        placeholder="e.g. report, annual, financial, 2026"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-1.5">PDF Producer (Read-Only)</label>
                      <input
                        type="text" 
                        name="producer" 
                        value={metadata.producer} 
                        readOnly
                        className="google-input w-full text-sm font-semibold bg-[#f8f9fa] text-[#5f6368] cursor-not-allowed"
                        placeholder="PDF Generator Engine"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Info size={15} className="text-[#1a73e8]" /> Metadata Summary
            </h3>
            
            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Edits internal metadata properties embedded in the PDF.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Improves search indexing, SEO metadata, and folder organization.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>100% private in-browser document modification.</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#dadce0]">
              <button 
                onClick={handleUpdate}
                disabled={!file || isProcessing}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Metadata...
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    <span>Save & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PdfMetadata;
