import { useState } from 'react';
import { Code2, Download, Copy, CheckCircle2, Eye, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const HtmlToDocx = () => {
  const [sourceCode, setSourceCode] = useState(`<h1>Project Charter</h1>\n<p>This is a formal project document template generated in <strong>Daily Utility Hub</strong>.</p>\n<h2>1. Scope & Deliverables</h2>\n<ul>\n  <li>Client-side converters.</li>\n  <li>Responsive workspace pages.</li>\n</ul>\n<h2>2. Timelines</h2>\n<p>Project milestones are set for immediate master deployments.</p>`);
  const [isCopied, setIsCopied] = useState(false);

  const downloadDocx = () => {
    if (!sourceCode.trim()) {
      toast.error('Please enter some HTML code first!');
      return;
    }

    // Standard Office XML namespaces wrapper to make Microsoft Word parse HTML properly as a native document
    const docxContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Document Export</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; padding: 1in; }
          h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          h2 { font-size: 14pt; font-weight: bold; color: #0f172a; margin-top: 18px; }
          p { margin-bottom: 12px; }
          ul, ol { margin-left: 20px; margin-bottom: 12px; }
          strong { font-weight: bold; }
        </style>
      </head>
      <body>
        ${sourceCode}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docxContent], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exported_document_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Word Document (.doc/.docx compatible) downloaded successfully!');
  };

  const copyHTML = () => {
    navigator.clipboard.writeText(sourceCode);
    setIsCopied(true);
    toast.success('HTML code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">HTML to Word Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Convert HTML markup tags and paragraphs into native Microsoft Word (.doc/.docx compatible) files client-side.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* HTML Input Panel */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">HTML Code Input</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyHTML}
                  className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border transition-all flex items-center gap-1"
                >
                  {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  Copy Code
                </button>
                <button
                  onClick={downloadDocx}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <Download size={12} /> Download Word Doc
                </button>
              </div>
            </div>
            
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder="Enter your HTML markup here..."
            />
          </div>
        </div>

        {/* Live preview paper rendering */}
        <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[450px] overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
              <Eye size={16} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Live Output</h3>
            </div>
            
            <div className="flex-1 p-6 bg-neutral-900 overflow-y-auto custom-scrollbar flex justify-center items-center">
              <div 
                className="w-full max-w-md aspect-[1/1.4] bg-white text-slate-800 p-8 shadow-xl rounded-sm border border-slate-200 overflow-y-auto custom-scrollbar prose prose-slate max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: sourceCode }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HtmlToDocx;
