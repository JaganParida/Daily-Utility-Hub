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
    <div className="tool-page-container">
      <ToolHeader
        title="PDF to Image Converter"
        description="Convert PDF document pages into high-resolution PNG, JPG, or WEBP images with custom scaling."
        category="PDF Tools"
        categoryPath="/search"
        icon={ImageIcon}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="High-DPI Vector Rasterizer"
        extraBadge="ZIP Archive Export"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Main Workspace Area */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card p-4 md:p-6 flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
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
                  className="flex-1 h-full w-full border-2 border-dashed border-[#c2d7fb] hover:border-[#1a73e8] rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[320px] bg-white hover:bg-[#f8fbff]"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl flex items-center justify-center text-[#1a73e8] mb-4 shadow-2xs transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] mb-2 pointer-events-none text-center">
                    {isInspecting ? 'Analyzing Document...' : 'Upload PDF to Convert to Images'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6368] text-center pointer-events-none max-w-sm leading-relaxed">
                    {isInspecting ? 'Inspecting page count and structure.' : <span>Drag & drop a PDF file here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>. Processing is fully secure.</span>}
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-3">Target Image Format</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'png', title: 'PNG Images', desc: 'Lossless crisp format with transparency support' },
                      { id: 'jpg', title: 'JPG Images', desc: 'Standard compressed format for smaller sizes' },
                      { id: 'webp', title: 'WEBP Images', desc: 'Modern high-efficiency web image compression' }
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTargetFormat(fmt.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          targetFormat === fmt.id
                            ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-2xs'
                            : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <FileImage className={targetFormat === fmt.id ? 'text-[#1a73e8]' : 'text-[#5f6368]'} size={20} />
                          <p className={`text-sm font-bold ${targetFormat === fmt.id ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>{fmt.title}</p>
                        </div>
                        <p className="text-xs text-[#5f6368] leading-relaxed">{fmt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality adjustment for images */}
                <div className="border-t border-[#dadce0] pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] mb-3">Rendering Quality & Resolution</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Standard (1.0x)', val: 1.0, desc: 'Web & screen viewing (72 DPI)' },
                      { label: 'High Resolution (1.5x)', val: 1.5, desc: 'Sharp text & illustrations (150 DPI)' },
                      { label: 'Ultra Retina (2.5x)', val: 2.5, desc: 'Print & archive fidelity (300 DPI)' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setImgQuality(opt.val)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          imgQuality === opt.val
                            ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-2xs'
                            : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                        }`}
                      >
                        <p className={`text-xs font-bold ${imgQuality === opt.val ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>{opt.label}</p>
                        <p className="text-[11px] text-[#5f6368] mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active processing progress bar */}
                {isProcessing && (
                  <div className="border-t border-[#dadce0] pt-5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#1a73e8]">
                      <span>Converting PDF pages...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#e8eaed] rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-[#1a73e8] h-2.5 rounded-full transition-all duration-300"
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
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-2">
                <FileText size={15} className="text-[#1a73e8]" /> Document Summary
              </h3>
              {file && (
                <button onClick={handleClear} className="btn-google-danger text-xs py-1 px-2.5">
                  <X size={13} /> Change
                </button>
              )}
            </div>

            {file ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] flex items-center gap-3">
                  <div className="p-2 bg-[#e8f0fe] rounded-lg text-[#1a73e8] shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-[#202124] truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-[#5f6368] mt-0.5">{totalPages} pages • {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#5f6368]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                    <p>Converts every page into an individual <span className="font-bold text-[#202124]">{targetFormat.toUpperCase()}</span> image.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                    <p>Packaged into a single clean ZIP download.</p>
                  </div>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Convert to {targetFormat.toUpperCase()} & Download ZIP
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-[#5f6368]">
                <p>Upload a PDF document to render its pages to high-resolution PNG, JPG, or WEBP images.</p>
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-[#5f6368] text-xs">
                  ⚡ 100% Client-side. High-speed local Canvas rasterization.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
