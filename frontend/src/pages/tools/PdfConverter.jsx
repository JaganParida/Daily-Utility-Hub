import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, CheckCircle2, FileImage, FileType, 
  Download, Loader2, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfConverter = () => {
  const location = useLocation();

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
  const [targetFormat, setTargetFormat] = useState('png'); // png, jpg, word
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

  // Convert PDF process
  const handleConvert = async () => {
    if (!file || !pdfDocument) return;
    
    setIsProcessing(true);
    setProgress(0);
    const toastId = toast.loading(`Initializing PDF conversion to ${targetFormat.toUpperCase()}...`);

    try {
      if (targetFormat === 'png' || targetFormat === 'jpg') {
        const zip = new JSZip();
        const formatExt = targetFormat;
        const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
        
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
        link.download = `${file.name.replace('.pdf', '')}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`PDF converted to images! ZIP downloaded.`, { id: toastId });
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetFormat === 'word') {
        const docxParagraphs = [];
        const escapeXml = (unsafe) => {
          return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
              case '<': return '&lt;';
              case '>': return '&gt;';
              case '&': return '&amp;';
              case '\'': return '&apos;';
              case '"': return '&quot;';
              default: return c;
            }
          });
        };

        // Extract layout texts from all pages
        for (let i = 1; i <= totalPages; i++) {
          setProgress(Math.round(((i - 1) / totalPages) * 100));
          toast.loading(`Extracting paragraphs from page ${i}...`, { id: toastId });
          
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          
          // Group text items by y coordinates (lines)
          const lines = {};
          textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lines[y]) lines[y] = [];
            lines[y].push(item);
          });
          
          // Sort lines top to bottom (descending y)
          const sortedY = Object.keys(lines).sort((a, b) => b - a);
          
          docxParagraphs.push(`--- Page ${i} ---`);
          
          let currentParagraph = '';
          sortedY.forEach(y => {
            // Sort items left to right
            const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
            const lineText = lineItems.map(item => item.str).join(' ').trim();
            
            if (lineText) {
              const isShort = lineText.length < 60;
              const endsWithPunctuation = /[.!?]$/.test(lineText);
              
              currentParagraph += (currentParagraph ? ' ' : '') + lineText;
              
              if (isShort || endsWithPunctuation) {
                docxParagraphs.push(currentParagraph);
                currentParagraph = '';
              }
            }
          });
          
          if (currentParagraph) {
            docxParagraphs.push(currentParagraph);
          }
        }
        
        setProgress(90);
        toast.loading('Compiling Word document...', { id: toastId });

        // Build OOXML document.xml content
        let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`;

        docxParagraphs.forEach(pText => {
          const escaped = escapeXml(pText);
          const isPageHeader = escaped.startsWith('--- Page');
          
          if (isPageHeader) {
            documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
        <w:rPr>
          <w:b/>
          <w:color w:val="2563EB"/>
          <w:sz w:val="24"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="2563EB"/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
          } else {
            documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="160" w:line="240" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
          }
        });

        documentXml += `
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

        const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

        const zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypesXml);
        zip.file('_rels/.rels', relsXml);
        zip.file('word/document.xml', documentXml);

        const content = await zip.generateAsync({ type: 'blob' });
        
        const downloadUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${file.name.replace('.pdf', '')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Converted PDF to editable Word (.docx) document!`, { id: toastId });
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Conversion failed. Please try again.', { id: toastId });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <RefreshCw size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced PDF Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Convert PDF documents into editable Word files or high-quality PNG/JPG images.</p>
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Select Target Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <label 
                  onClick={() => setTargetFormat('png')}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    targetFormat === 'png' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/30'
                  }`}
                >
                  <FileImage className={targetFormat === 'png' ? 'text-primary' : 'text-muted-foreground'} size={28} />
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">PNG Images</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">High-quality lossy/transparent images</p>
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
                  onClick={() => setTargetFormat('word')}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    targetFormat === 'word' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/30'
                  }`}
                >
                  <FileType className={targetFormat === 'word' ? 'text-primary' : 'text-muted-foreground'} size={28} />
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">Word Document</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fully editable text paragraphs (.doc)</p>
                  </div>
                </label>

              </div>
            </div>

            {/* Quality adjustment for images */}
            {(targetFormat === 'png' || targetFormat === 'jpg') && (
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
            )}

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

        {/* Right Action panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <RefreshCw size={16} /> Document Details
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Processing runs fully in the browser (100% private).</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>{totalPages} total pages detected.</p>
              </div>
            </div>

            {/* File info card */}
            {file && (
              <div className="border-t border-border pt-4 min-w-0">
                <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0 border border-border/50">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConvert}
                disabled={isProcessing || !file}
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
                      Converting...
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
                      <Download size={20} />
                      <span>Convert PDF</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-border disabled:opacity-50"
                >
                  <X size={16} />
                  Close Document
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
