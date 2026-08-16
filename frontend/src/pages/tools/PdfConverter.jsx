import { useLocation, useNavigate } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, CheckCircle2, FileImage, FileType, 
  Download, Loader2, X, ExternalLink, RefreshCw, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfConverter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileLoad(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [file, setFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [targetFormat, setTargetFormat] = useState('png'); // png, jpg, webp
  const [imgQuality, setImgQuality] = useState(1.5); // scale multiplier for high-res images

  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);

  const handleFileLoad = async (selectedFile) => {
    setIsInspecting(true);
    const toastId = toast.loading('Reading PDF document properties...');
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          setFile(selectedFile);
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setIsInspecting(false);
          toast.success(`PDF loaded: ${pdf.numPages} pages detected`, { id: toastId });
        } catch (err) {
          console.error(err);
          setIsInspecting(false);
          toast.error('Error loading PDF file.', { id: toastId });
        }
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error(e);
      setIsInspecting(false);
      toast.error('Failed to parse PDF.', { id: toastId });
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
    handleFileLoad(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    handleFileLoad(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setPdfDocument(null);
    setTotalPages(0);
    setProgress(0);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert PDF to Images
  const handleConvert = async () => {
    if (!file || !pdfDocument) return;

    setIsProcessing(true);
    setProgress(0);
    const toastId = toast.loading(`Initializing PDF conversion to ${targetFormat.toUpperCase()}...`);

    try {
      const zip = new JSZip();
      const formatExt = targetFormat;
      let mimeType = 'image/png';
      if (targetFormat === 'jpg') mimeType = 'image/jpeg';
      if (targetFormat === 'webp') mimeType = 'image/webp';

      // Loop through all pages and render to canvases
      for (let i = 1; i <= totalPages; i++) {
        setProgress(Math.round(((i - 1) / totalPages) * 100));
        toast.loading(`Rendering page ${i} of ${totalPages}...`, { id: toastId });

        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: imgQuality });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        // Get data URL of the canvas
        const imgDataUrl = canvas.toDataURL(mimeType, 0.92);
        const imgBase64 = imgDataUrl.split(',')[1];

        zip.file(`page_${i}.${formatExt}`, imgBase64, { base64: true });
      }

      setProgress(95);
      toast.loading('Zipping images together...', { id: toastId });
      const content = await zip.generateAsync({ type: 'blob' });

      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.pdf$/i, '')}_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`PDF converted to ${targetFormat.toUpperCase()} images! ZIP downloaded.`, { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error('Conversion failed. Please try again.', { id: toastId });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="tool-page-container space-y-6">
      {/* Top Banner pointing to PDF to Word tool */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/40 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Looking for PDF to Word Converter?</h4>
            <p className="text-xs text-slate-300">Convert PDF to fully editable Word (.docx) documents with OCR & layout preservation.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tools/pdf-to-word', { state: file ? { initialFile: file } : null })}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 shrink-0"
        >
          <FileType className="w-4 h-4" /> Go to PDF to Word Tool
        </button>
      </div>

      <div className="flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">PDF to Image Converter</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Convert PDF pages into high-resolution PNG, JPG, or WEBP images instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Main Workspace Area */}
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
                  onClick={() => !isInspecting && fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">
                    {isInspecting ? 'Analyzing Document...' : 'Upload PDF to Convert'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm leading-relaxed">
                    {isInspecting ? 'Inspecting page count and structure.' : <span>Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>. Processing is fully secure.</span>}
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
                {/* Target format selection */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Select Target Image Format</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label 
                      onClick={() => setTargetFormat('png')}
                      className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                        targetFormat === 'png' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      <FileImage className={targetFormat === 'png' ? 'text-primary' : 'text-muted-foreground'} size={28} />
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">PNG Images</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">High-quality lossless images</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => setTargetFormat('jpg')}
                      className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                        targetFormat === 'jpg' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      <FileImage className={targetFormat === 'jpg' ? 'text-primary' : 'text-muted-foreground'} size={28} />
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">JPG Images</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Optimized compressed page images</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => setTargetFormat('webp')}
                      className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                        targetFormat === 'webp' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      <FileImage className={targetFormat === 'webp' ? 'text-primary' : 'text-muted-foreground'} size={28} />
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">WEBP Images</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Modern high compression format</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quality adjustment for images */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Rendering Scale (Image Quality)</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Standard (1x)', val: 1.0, desc: 'Web preview' },
                      { label: 'Medium (1.5x)', val: 1.5, desc: 'Balanced detail' },
                      { label: 'Ultra High (2.5x)', val: 2.5, desc: 'Print quality' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setImgQuality(opt.val)}
                        className={`flex-1 border rounded-xl p-3 text-left transition-all ${
                          imgQuality === opt.val ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/35'
                        }`}
                      >
                        <p className="font-bold text-xs text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active processing progress bar */}
                {isProcessing && (
                  <div className="border-t border-border pt-6 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                      <span>Converting PDF pages...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info / Controls Sidebar */}
        {file && (
          <div className="w-full lg:w-80 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-foreground text-sm">Loaded Document</h3>
              <button onClick={handleClear} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                <X size={14} /> Clear
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" size={24} />
                <div className="truncate">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{totalPages} pages • {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Convert & Download ZIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfConverter;
