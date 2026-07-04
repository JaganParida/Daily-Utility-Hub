import { useState } from 'react';
import { Code2, Download, Copy, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const HtmlPresentation = () => {
  const defaultHtml = `<section style="padding: 40px; text-align: center; color: white; background: linear-gradient(135deg, #4f46e5, #6366f1); border-radius: 16px; min-height: 280px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
  <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 12px;">Interactive HTML Presentation</h1>
  <p style="font-size: 16px; opacity: 0.9;">Create stunning slide decks client-side with native HTML/CSS styling tags.</p>
</section>`;

  const [code, setCode] = useState(defaultHtml);
  const [isCopied, setIsCopied] = useState(false);

  const downloadPresentation = () => {
    if (!code.trim()) {
      toast.error('Please add HTML presentation slides first!');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Presentation Slide</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .slide-container {
      width: 100%;
      max-width: 800px;
    }
  </style>
</head>
<body>
  <div class="slide-container">
    ${code}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `html_presentation_${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Standalone presentation slide downloaded successfully!');
  };

  const copyHTML = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">HTML Presentation Sandbox</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Write, preview, and sandbox fully interactive presentation slide codes client-side and export them as standalone HTML files.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* HTML Code Editor */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Code2 size={16} /> Presentation HTML Sandbox
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copyHTML}
                  className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border transition-all flex items-center gap-1"
                >
                  {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  Copy Code
                </button>
                <button
                  onClick={downloadPresentation}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <Download size={12} /> Export Slide HTML
                </button>
              </div>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder="Write your slide markup here..."
            />
          </div>
        </div>

        {/* Live Slide Preview */}
        <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
              <Eye size={16} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interactive Output</h3>
            </div>
            
            <div className="flex-1 p-6 bg-neutral-900 overflow-y-auto custom-scrollbar flex justify-center items-center">
              <div 
                className="w-full max-w-md aspect-[4/3] bg-[#0c101a] border border-white/5 rounded-2xl p-6 shadow-2xl overflow-y-auto custom-scrollbar flex justify-center items-center"
                dangerouslySetInnerHTML={{ __html: code }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HtmlPresentation;
