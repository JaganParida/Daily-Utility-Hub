import { useState, useRef } from 'react';
import { BookOpen, Download, Copy, CheckCircle2, Bold, Italic, Link as LinkIcon, Code, List, Table, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const MarkdownEditor = () => {
  const defaultMd = `# Welcome to the Markdown Editor! 👋\n\nThis is a **live-preview** markdown editor tailored for documentation.\n\n## Features Supported (GitHub Flavored Markdown)\n\n1. **Tables**:\n| Syntax      | Description |\n| ----------- | ----------- |\n| Header      | Title       |\n| Paragraph   | Text        |\n\n2. **Task Lists**:\n- [x] Write amazing documentation\n- [ ] Deploy the app\n- [ ] Celebrate 🎉\n\n3. **Code Blocks with Syntax Highlighting**:\n\`\`\`javascript\nfunction calculateSum(a, b) {\n  return a + b;\n}\nconsole.log(calculateSum(5, 10));\n\`\`\`\n\n4. **Blockquotes**:\n> "Documentation is a love letter that you write to your future self."\n\n5. **Links and Images**:\n[Visit Daily Utility Hub](#)\n\n---\n\nStart typing on the left to see the instant preview on the right!\n`;

  const [markdown, setMarkdown] = useState(defaultMd);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef(null);

  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([markdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "documentation.md";
    document.body.appendChild(element);
    element.click();
    element.remove();
    toast.success('Downloaded documentation.md');
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    toast.success('Copied Markdown to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const insertText = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + prefix + selectedText + suffix + markdown.substring(end);
    
    setMarkdown(newText);

    // Reset cursor position inside the wrapper
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`;
    insertText(tableTemplate);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Markdown Live Editor</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Write beautiful documentation with instant GitHub-flavored previews and quick tools.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left pane: Editor */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6 relative"
        >
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[600px] overflow-hidden">
            {/* Toolbar */}
            <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
              <div className="flex bg-background border border-border rounded-lg shadow-sm">
                <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-muted text-foreground transition-colors border-r border-border" title="Bold">
                  <Bold size={16} />
                </button>
                <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-muted text-foreground transition-colors border-r border-border" title="Italic">
                  <Italic size={16} />
                </button>
                <button onClick={() => insertText('[', '](url)')} className="p-2 hover:bg-muted text-foreground transition-colors border-r border-border" title="Link">
                  <LinkIcon size={16} />
                </button>
                <button onClick={() => insertText('`', '`')} className="p-2 hover:bg-muted text-foreground transition-colors border-r border-border" title="Inline Code">
                  <Code size={16} />
                </button>
                <button onClick={() => insertText('- ')} className="p-2 hover:bg-muted text-foreground transition-colors border-r border-border" title="Unordered List">
                  <List size={16} />
                </button>
                <button onClick={insertTable} className="p-2 hover:bg-muted text-foreground transition-colors" title="Table">
                  <Table size={16} />
                </button>
              </div>
              <div className="ml-auto text-xs text-muted-foreground uppercase font-bold tracking-wider px-2">
                Raw Markdown
              </div>
            </div>
            
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none focus:ring-0 font-mono resize-none custom-scrollbar leading-relaxed"
              spellCheck="false"
              placeholder="Type your markdown here..."
            />
          </div>
        </motion.div>

        {/* Right pane: Action Panel & Live Preview */}
        <div className="w-full lg:w-[450px] xl:w-[550px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={copyMarkdown}
              className={`py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] ${
                isCopied ? 'bg-primary/10 text-primary border border-primary/50 shadow-none' : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
              }`}
            >
              {isCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {isCopied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={downloadMarkdown}
              className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] hover:shadow-primary/30"
            >
              <Download size={18} />
              Download .md
            </button>
          </div>

          <div className="bg-[#0d1117] border border-border rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 border-b border-border/10 bg-[#161b22] flex justify-between items-center shrink-0">
              <h2 className="font-semibold flex items-center gap-2 text-[#e6edf3] text-sm uppercase tracking-wider">
                <BookOpen size={16} className="text-primary" />
                Live Preview
              </h2>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-background">
               <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-[#1e1e1e] prose-pre:p-0 prose-a:text-primary hover:prose-a:text-primary/90 prose-img:rounded-xl">
                 <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            children={String(children).replace(/\n$/, '')}
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !m-0 !bg-[#1e1e1e] !text-xs"
                            {...props}
                          />
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded-md text-pink-500 font-mono text-xs border border-border/50" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                 >
                   {markdown}
                 </ReactMarkdown>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
