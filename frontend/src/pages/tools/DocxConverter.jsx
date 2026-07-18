import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Upload, CheckCircle2, FileImage, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import * as htmlToImage from 'html-to-image';

const DocxConverter = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileUpload({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [rawText, setRawText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);
  const documentRef = useRef(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.doc')) {
      toast.error('Please upload a valid Word document (.docx)');
      return;
    }

    setFile(uploadedFile);
    toast.success('Document uploaded successfully!');

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      // Use Mammoth to extract rich HTML and Raw Text
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      
      const cleanHtml = DOMPurify.sanitize(result.value);
      
      setHtmlContent(cleanHtml || '<p>Empty document content.</p>');
      setRawText(textResult.value || 'Empty document content.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse document. File might be corrupted.');
    }
  };

  // Common function to slice the massive high-res image into A4 pages
  const generatePaginatedImages = async () => {
    if (!documentRef.current) return [];
    toast.loading('Rendering high-fidelity document pages...', { id: 'render-doc' });

    try {
      // Scale by 3 for crisp original quality
      const scale = 3;
      const docElement = documentRef.current;
      
      const dataUrl = await htmlToImage.toPng(docElement, {
        quality: 1.0,
        pixelRatio: scale,
        backgroundColor: '#ffffff'
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // A4 aspect ratio is 1:1.414 (210x297mm)
      const pageHeight = Math.floor(img.width * 1.414);
      const totalPages = Math.ceil(img.height / pageHeight);
      
      const pages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = pageHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the specific slice of the image
        ctx.drawImage(img, 0, -(i * pageHeight));
        
        const pageDataUrl = canvas.toDataURL('image/png', 1.0);
        pages.push(pageDataUrl);
      }
      
      toast.success('Document successfully rendered!', { id: 'render-doc' });
      return pages;
    } catch (error) {
      console.error(error);
      toast.error('Failed to render document.', { id: 'render-doc' });
      return [];
    }
  };

  const exportToPDF = async () => {
    if (!htmlContent) return;
    const pages = await generatePaginatedImages();
    if (pages.length === 0) return;

    toast.loading('Generating PDF...', { id: 'pdf-export' });
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    pages.forEach((pageDataUrl, index) => {
      if (index > 0) doc.addPage();
      doc.addImage(pageDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    });

    doc.save(`${file?.name.replace('.docx', '') || 'document'}_export.pdf`);
    toast.success('High-Quality PDF downloaded successfully!', { id: 'pdf-export' });
  };

  const exportToPNG = async () => {
    if (!htmlContent) return;
    const pages = await generatePaginatedImages();
    if (pages.length === 0) return;

    toast.loading('Packaging PNG images...', { id: 'png-export' });
    const zip = new JSZip();

    pages.forEach((pageDataUrl, index) => {
      const base64Data = pageDataUrl.split(',')[1];
      zip.file(`page_${index + 1}.png`, base64Data, { base64: true });
    });

    const contentZip = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(contentZip);
    link.download = `${file?.name.replace('.docx', '') || 'document'}_images.zip`;
    link.click();
    toast.success('Document pages downloaded as a ZIP of PNGs!', { id: 'png-export' });
  };

  const copyText = () => {
    navigator.clipboard.writeText(rawText);
    setIsCopied(true);
    toast.success('Copied text content to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Word to PDF / Image</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Convert Microsoft Word files into original-quality PDFs or high-resolution images.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* File Upload Panel */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upload Document</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload Word File</p>
              <p className="text-xs text-muted-foreground">Supports .docx and .doc documents</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.doc" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <FileText className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {htmlContent && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversion Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportToPDF}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export to PDF
                </button>
                <button
                  onClick={exportToPNG}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <FileImage size={16} /> Download PNG
                </button>
              </div>
              <button
                onClick={copyText}
                className={`w-full py-3 px-4 font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-foreground hover:bg-muted/50'}`}
              >
                {isCopied ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                {isCopied ? 'Copied Raw Text' : 'Copy Raw Text'}
              </button>
            </div>
          )}
        </div>

        {/* Live Document Preview Panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Sparkles size={16} className="text-primary" />
              High-Fidelity Document Preview
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-12 bg-neutral-900 flex justify-center items-start overflow-auto custom-scrollbar relative">
            {htmlContent ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white shadow-2xl overflow-hidden"
              >
                {/* The rendering container is explicitly sized to standard A4 ratio width to preserve layout during html-to-image */}
                <div 
                  ref={documentRef}
                  className="w-[794px] min-h-[1123px] bg-white text-black p-[72px]"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.6'
                  }}
                >
                  <style>{`
                    .doc-content h1 { font-size: 28px; font-weight: bold; margin-bottom: 24px; margin-top: 32px; }
                    .doc-content h2 { font-size: 24px; font-weight: bold; margin-bottom: 20px; margin-top: 28px; }
                    .doc-content h3 { font-size: 20px; font-weight: bold; margin-bottom: 16px; margin-top: 24px; }
                    .doc-content p { font-size: 16px; margin-bottom: 16px; text-align: justify; }
                    .doc-content ul, .doc-content ol { padding-left: 24px; margin-bottom: 16px; }
                    .doc-content li { font-size: 16px; margin-bottom: 8px; }
                    .doc-content strong { font-weight: bold; }
                    .doc-content em { font-style: italic; }
                    .doc-content table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    .doc-content th, .doc-content td { border: 1px solid #cbd5e1; padding: 12px; }
                    .doc-content img { max-width: 100%; height: auto; display: block; margin: 16px auto; }
                  `}</style>
                  <div 
                    className="doc-content"
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground p-12">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={48} className="text-muted-foreground/35" />
                  <p className="text-sm font-bold">No Document Uploaded</p>
                  <p className="text-xs max-w-xs text-center leading-normal">Upload a Word document to generate a high-fidelity rendering for PDF or PNG export.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocxConverter;
