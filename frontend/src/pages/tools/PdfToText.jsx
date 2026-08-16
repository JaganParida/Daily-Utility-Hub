import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import { Type, UploadCloud, FileText, CheckCircle2, Copy, Check, Download, Eye, EyeOff, ExternalLink, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfToText = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pagesCount, setPagesCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClear = () => {
    setFile(null);
    setExtractedText('');
    setPagesCount(0);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStats = () => {
    if (!extractedText) return { words: 0, chars: 0 };
    const cleanText = extractedText.trim();
    const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
    const chars = extractedText.length;
    return { words, chars };
  };

  const { words, chars } = getStats();

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
    setPreviewUrl(URL.createObjectURL(droppedFile));
    setExtractedText('');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    let toastId = toast.loading('Extracting text locally in browser...');
    try {
      setIsProcessing(true);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item);
        });
        
        const sortedY = Object.keys(lines).sort((a, b) => b - a);
        let pageText = '';
        sortedY.forEach(y => {
          const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
          pageText += lineItems.map(item => item.str).join(' ') + '\n';
        });
        
        text += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      
      setExtractedText(text.trim() || 'No text found in this document (it might be a scanned image).');
      setPagesCount(pdf.numPages);
      
      toast.success('Text extracted successfully!', { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to extract text. The file might be encrypted.', { id: toastId });
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

  const downloadTextFile = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${file.name.replace('.pdf', '')}_extracted_text.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Downloaded text file!');
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="Extract Text from PDF"
        description="Convert your PDF documents into editable raw text plain files."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#ea4335] bg-[#fce8e6] border-[#fad2cf]"
        badge="Text Extractor"
        extraBadge="Raw TXT & Layout"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload & Form Area */}
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
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">Upload a PDF</h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm leading-relaxed">
                    Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>.
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
                className="flex flex-col min-h-0 w-full space-y-5"
              >
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 bg-[#fce8e6] text-[#ea4335] border border-[#fad2cf] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#202124] text-sm sm:text-base truncate" title={file.name}>{file.name}</h3>
                        <p className="text-[#5f6368] text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                        Remove
                      </button>
                    </div>
                  </div>

                  {showPreview && previewUrl && (
                    <div className="border-t border-[#dadce0] pt-4 w-full flex flex-col gap-3">
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
                    </div>
                  )}
                </div>

                {extractedText && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dadce0] shadow-2xs flex flex-col min-h-0 flex-1 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 shrink-0 border-b border-[#dadce0] pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Extracted Plain Text ({pagesCount} Pages)</h3>
                        <p className="text-xs text-[#5f6368] mt-0.5 font-medium">
                          Words: <span className="text-[#202124] font-bold">{words.toLocaleString()}</span> &bull; Characters: <span className="text-[#202124] font-bold">{chars.toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={copyToClipboard}
                          className="btn-google-secondary text-xs py-1.5 px-3 font-semibold"
                        >
                          {copied ? <Check size={13} className="text-[#137333]"/> : <Copy size={13}/>}
                          {copied ? 'Copied' : 'Copy Text'}
                        </button>
                        <button 
                          onClick={downloadTextFile}
                          className="btn-google-primary text-xs py-1.5 px-3 font-semibold"
                        >
                          <Download size={13} /> Download .TXT
                        </button>
                      </div>
                    </div>
                    <textarea
                      readOnly
                      value={extractedText}
                      className="google-input w-full flex-1 min-h-[260px] p-4 text-xs sm:text-sm text-[#202124] custom-scrollbar resize-none font-mono leading-relaxed bg-[#f8f9fa]"
                      placeholder="Extracted text will appear here..."
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Panel */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Type size={15} className="text-[#1a73e8]" /> Extraction Summary
            </h3>
            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Instantly extracts raw text layers directly within your browser.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Calculates real-time word count and character count statistics.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>100% private in-browser document processing.</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#dadce0]">
              <button 
                onClick={handleExtract}
                disabled={!file || isProcessing || extractedText.length > 0}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Extracting Text...
                  </>
                ) : (
                  <>
                    <Type size={16} />
                    <span>{extractedText.length > 0 ? 'Text Extracted' : 'Extract Text Now'}</span>
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

export default PdfToText;
