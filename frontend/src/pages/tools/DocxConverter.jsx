import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Upload, Copy, CheckCircle2, FileImage, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

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
  const [content, setContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.doc')) {
      toast.error('Please upload a valid Word document (.docx)');
      return;
    }

    setFile(uploadedFile);
    toast.success('Document uploaded successfully!');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        const zip = await JSZip.loadAsync(buffer);
        const docXmlFile = zip.file("word/document.xml");
        if (!docXmlFile) {
          toast.error("Invalid docx structure. Could not find word/document.xml");
          return;
        }
        
        const docXmlText = await docXmlFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXmlText, "text/xml");
        
        // Extract paragraphs to preserve layout spacing
        const paragraphNodes = xmlDoc.getElementsByTagName("w:p");
        const paragraphsText = Array.from(paragraphNodes).map(pNode => {
          const tNodes = pNode.getElementsByTagName("w:t");
          return Array.from(tNodes).map(t => t.textContent).join("");
        }).filter(text => text.trim() !== "");

        const cleaned = paragraphsText.join("\n\n");
        setContent(cleaned || "Empty document content.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Word document.");
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const exportToPDF = () => {
    if (!content) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(content, 180);
    doc.text("Daily Utility Hub - Converted Document", 15, 15);
    doc.line(15, 18, 195, 18);
    doc.text(splitText, 15, 25);
    doc.save(`${file?.name.replace('.docx', '') || 'document'}_export.pdf`);
    toast.success('Document exported to PDF successfully!');
  };

  const exportToPNG = () => {
    if (!content) return;
    // Render the preview content directly onto an image canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 24px Helvetica';
    ctx.fillText("Document Page Export", 50, 60);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(750, 80);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px Courier';
    const lines = content.split('\n');
    let y = 120;
    lines.forEach(line => {
      ctx.fillText(line, 50, y);
      y += 30;
    });

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace('.docx', '') || 'document'}_page.png`;
    link.click();
    toast.success('Document page downloaded as PNG Image!');
  };

  const copyText = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success('Copied text content to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Word to PDF / Image Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Convert Microsoft Word files into print-ready PDFs or download pages as high-resolution images.</p>
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

          {content && (
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
                {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copied Text' : 'Copy Parsed Text'}
              </button>
            </div>
          )}
        </div>

        {/* Live Document Preview Panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Sparkles size={16} className="text-primary" />
              Document Print Preview
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-12 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
            {content ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl aspect-[1/1.4] bg-white text-slate-800 p-12 shadow-2xl rounded-sm border border-slate-200 overflow-y-auto custom-scrollbar flex flex-col font-serif"
              >
                <div className="border-b-2 border-indigo-600 pb-3 mb-6 flex justify-between items-end">
                  <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Document Conversion View</span>
                  <span className="text-xs text-slate-400 font-mono">{file?.name || 'document.docx'}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{content}</p>
              </motion.div>
            ) : (
              <div className="text-center text-muted-foreground p-12 flex flex-col items-center gap-2">
                <FileText size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Document Uploaded</p>
                <p className="text-xs max-w-xs leading-normal">Upload a Word document in the side panel to generate page-rendering layouts and conversions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocxConverter;
