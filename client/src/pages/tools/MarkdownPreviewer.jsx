import { useState } from 'react';
import { 
  FileText, Eye, Download, Printer, Bold, Italic, 
  List, Quote, Code, Heading, Trash2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownPreviewer = () => {
  const [markdown, setMarkdown] = useState(`# Markdown Notes Builder

Welcome to the live Markdown Editor! Type markdown text on the left, and see it render on the right in real-time.

## Key Markdown Features:
- **Bold Text** and *Italic Text*
- Custom Lists:
  1. Item one
  2. Item two
- Live Code Blocks:
\`\`\`javascript
const greeting = "Hello Developers & Students!";
console.log(greeting);
\`\`\`

> "The best way to learn code is by doing it."

Use the helper buttons to format notes easily!`);

  const [copied, setCopied] = useState(false);

  const insertHelper = (syntax, placeholder = '') => {
    setMarkdown(prev => prev + '\n' + syntax + placeholder);
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('Markdown copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setMarkdown('');
    toast.success('Workspace cleared');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded document.md');
  };

  const downloadHtml = () => {
    // Generate simple html shell wrapping compiled content
    const previewArea = document.getElementById('md-preview-content');
    const innerHtml = previewArea ? previewArea.innerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Markdown Document</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; background: #060608; color: #f4f4f5; }
    h1, h2, h3 { color: #818cf8; }
    code { background: #1e1b4b; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #1c1c21; pading: 16px; border-radius: 8px; overflow-x: auto; padding: 15px; }
    blockquote { border-left: 4px solid #4f46e5; margin: 0; padding-left: 15px; color: #a1a1aa; font-style: italic; }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded compiled document.html');
  };

  const printDocument = () => {
    window.print();
  };

  const isInputEmpty = !markdown.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8 print:p-0"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0 print:hidden">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Markdown Notes Builder</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Write markdown notes, compile rich assignments, preview structure, and print to PDF instantly.</p>
        </div>
      </div>

      {/* Editor & Previewer split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        
        {/* Editor Box */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[520px] print:hidden">
          <div className="flex justify-between items-center mb-5 border-b border-border/80 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText size={16} /> Markdown Editor
            </h3>
            
            <button
              onClick={clear}
              disabled={isInputEmpty}
              className="text-xs px-3.5 py-2 bg-red-500/10 disabled:bg-muted/10 text-red-500 disabled:text-muted-foreground hover:bg-red-500/20 border border-red-500/20 disabled:border-border/50 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Quick Helper toolbar */}
          <div className="flex flex-wrap gap-1.5 mb-4 p-1.5 bg-muted/20 border border-border/50 rounded-xl">
            <button 
              onClick={() => insertHelper('# ', 'Header 1')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Heading"
            >
              <Heading size={14} />
            </button>
            <button 
              onClick={() => insertHelper('**', 'bold text**')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button 
              onClick={() => insertHelper('*', 'italic text*')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button 
              onClick={() => insertHelper('- ', 'List Item')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Bullet List"
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => insertHelper('> ', 'Quote text')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Blockquote"
            >
              <Quote size={14} />
            </button>
            <button 
              onClick={() => insertHelper('\n```\n', 'code snippet\n```')} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all cursor-pointer"
              title="Code Block"
            >
              <Code size={14} />
            </button>
          </div>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full flex-1 p-4 bg-background/40 border border-border/80 rounded-xl resize-none font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 custom-scrollbar min-h-[320px] leading-relaxed shadow-inner"
            placeholder="Start typing markdown syntax..."
            spellCheck="false"
          />
        </div>

        {/* Preview & Exporter Box */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[520px] justify-between print:border-none print:bg-transparent print:p-0">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/80 pb-3 print:hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Eye size={16} /> Rich Document Preview
              </h3>
              
              <button
                onClick={handleCopy}
                disabled={isInputEmpty}
                className="text-xs bg-muted/20 hover:bg-muted/40 text-foreground px-2.5 py-1.5 border border-border/50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Copy Markdown
              </button>
            </div>

            {/* Markdown rendered output */}
            <div 
              id="md-preview-content"
              className="p-5 bg-background/20 border border-border/80 rounded-xl overflow-y-auto custom-scrollbar prose prose-invert max-w-full text-foreground/90 font-sans leading-relaxed text-sm min-h-[360px]"
            >
              {markdown.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic text-center py-12">Rendering output will show here...</p>
              )}
            </div>
          </div>

          {/* Document export footer */}
          <div className="pt-6 border-t border-border/50 mt-6 flex gap-3 print:hidden flex-wrap">
            <button
              onClick={downloadMarkdown}
              disabled={isInputEmpty}
              className="flex-1 py-3 bg-muted/40 hover:bg-muted/65 border border-border/85 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm text-foreground disabled:opacity-40"
            >
              <Download size={15} /> Download .MD
            </button>
            <button
              onClick={downloadHtml}
              disabled={isInputEmpty}
              className="flex-1 py-3 bg-muted/40 hover:bg-muted/65 border border-border/85 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm text-foreground disabled:opacity-40"
            >
              <Download size={15} /> Export HTML
            </button>
            <button
              onClick={printDocument}
              disabled={isInputEmpty}
              className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-40"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default MarkdownPreviewer;
