import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, CheckCircle2, FileImage, FileType, 
  Download, Loader2, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfConverter = () => {
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
      } else if (targetFormat === 'word') {
        let htmlBody = '';
        
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
          
          htmlBody += `<h2 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px;">Page ${i}</h2>`;
          
          let currentParagraph = '';
          sortedY.forEach(y => {
            // Sort items left to right
            const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
            const lineText = lineItems.map(item => item.str).join(' ').trim();
            
            if (lineText) {
              if (lineText.length < 55) {
                if (currentParagraph) {
                  htmlBody += `<p style="margin-bottom: 12px; line-height: 1.5;">${currentParagraph} ${lineText}</p>`;
                  currentParagraph = '';
                } else {
                  htmlBody += `<p style="margin-bottom: 12px; line-height: 1.5;">${lineText}</p>`;
                }
              } else {
                currentParagraph += (currentParagraph ? ' ' : '') + lineText;
              }
            }
          });
          
          if (currentParagraph) {
            htmlBody += `<p style="margin-bottom: 12px; line-height: 1.5;">${currentParagraph}</p>`;
          }
        }
        
        setProgress(95);
        toast.loading('Compiling Word XML...', { id: toastId });
        
        // Wrap HTML inside Microsoft Word specific HTML envelope
        const htmlEnvelope = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <title>Converted Document</title>
            <style>
              body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1f2937; margin: 1in; }
              h2 { font-size: 14pt; font-weight: bold; margin-bottom: 8px; }
              p { margin: 0 0 10px 0; text-align: justify; }
            </style>
          </head>
          <body>
            ${htmlBody}
          </body>
          </html>
        `;
        
        const blob = new Blob(['\ufeff' + htmlEnvelope], { type: 'application/msword' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${file.name.replace('.pdf', '')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Converted PDF to editable Word document!`, { id: toastId });
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
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shadow-sm">
          <RefreshCw size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced PDF Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert PDF documents into editable Word files or high-quality PNG/JPG images.</p>
        </div>
      </div>

      {!file ? (
        <div 
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => !isInspecting && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-96 ${
            isDragging ? 'border-rose-500 bg-rose-500/5' : 'border-border bg-card hover:border-rose-500/50 hover:bg-muted/30'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4 pointer-events-none">
            {isInspecting ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">
            {isInspecting ? 'Analyzing Document...' : 'Upload PDF to Convert'}
          </h3>
          <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm">
            {isInspecting ? 'Inspecting page count and structure.' : 'Drag & drop a PDF file here or click to browse. Processing is fully secure.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
          
          {/* Main settings panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            
            {/* Target format selection */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Select Target Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <label 
                  onClick={() => setTargetFormat('png')}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    targetFormat === 'png' ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border bg-muted/10 hover:bg-muted/30'
                  }`}
                >
                  <FileImage className="text-rose-500" size={28} />
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">PNG Images</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">High-quality lossy/transparent images</p>
                  </div>
                </label>

                <label 
                  onClick={() => setTargetFormat('jpg')}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    targetFormat === 'jpg' ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border bg-muted/10 hover:bg-muted/30'
                  }`}
                >
                  <FileImage className="text-orange-500" size={28} />
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">JPG Images</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Optimized compressed page images</p>
                  </div>
                </label>

                <label 
                  onClick={() => setTargetFormat('word')}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    targetFormat === 'word' ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border bg-muted/10 hover:bg-muted/30'
                  }`}
                >
                  <FileType className="text-blue-500" size={28} />
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
                        imgQuality === opt.val ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border bg-muted/10 hover:bg-muted/35'
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
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Right Action panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Document Details</h3>
              <div className="space-y-4 text-sm text-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <p>Processing runs fully in the browser (100% private).</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <p>{totalPages} total pages detected.</p>
                </div>
              </div>
            </div>

            {/* File info card */}
            <div className="border-t border-border pt-4 min-w-0">
              <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0">
                <FileText className="text-rose-500 shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full py-3 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Convert PDF
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={isProcessing}
                className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <X size={16} />
                Close Document
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PdfConverter;
