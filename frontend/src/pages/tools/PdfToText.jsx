import { useLocation } from 'react-router-dom';
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
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Type size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Extract Text from PDF</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Convert your PDF documents into editable raw text plain files.</p>
        </div>
      </div>

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
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-4 shrink-0 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground text-lg truncate w-full" title={file.name}>{file.name}</h3>
                        <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3.5 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 border border-border shadow-sm"
                      >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPreview ? 'Hide Preview' : 'Interactive Preview'}
                      </button>
                      <button 
                        onClick={handleClear} 
                        className="text-xs text-red-400 bg-red-950/10 border border-red-900/20 hover:bg-red-950/20 px-3.5 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {showPreview && previewUrl && (
                    <div className="border-t border-border pt-4 w-full flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Document Preview</h4>
                        <a 
                          href={previewUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Open in New Tab <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/5 relative">
                        <object 
                          data={previewUrl} 
                          type="application/pdf" 
                          className="w-full h-full"
                        >
                          <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                            <div className="p-6 text-center text-sm text-muted-foreground">
                              Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                            </div>
                          </iframe>
                        </object>
                      </div>
                    </div>
                  )}
                </div>

                {extractedText && (
                  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-0 flex-1 relative overflow-hidden mt-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 shrink-0">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extracted Text ({pagesCount} Pages)</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Words: {words.toLocaleString()} &bull; Characters: {chars.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={copyToClipboard}
                          className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold"
                        >
                          {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button 
                          onClick={downloadTextFile}
                          className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold"
                        >
                          <Download size={14} /> Download TXT
                        </button>
                      </div>
                    </div>
                    <textarea
                      readOnly
                      value={extractedText}
                      className="w-full flex-1 min-h-[250px] lg:min-h-0 bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none custom-scrollbar resize-none font-mono"
                      placeholder="Extracted text will appear here..."
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Type size={16} /> Extraction Details
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Scrapes selectable text layer instantly from the PDF.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Computes readability stats: word count and character count.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Note: Scanned images with no text layer cannot be parsed (requires OCR).</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleExtract}
              disabled={!file || isProcessing || extractedText.length > 0}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                isProcessing
                  ? 'bg-primary/70 text-primary-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isProcessing ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="animate-spin" size={20} />
                    Extracting...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Type size={20} />
                    <span>Extract Text Now</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PdfToText;
