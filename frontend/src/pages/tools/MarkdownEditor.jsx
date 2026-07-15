import { useState, useRef } from 'react';
import { 
  BookOpen, Download, Copy, CheckCircle2, Bold, Italic, Link as LinkIcon, 
  Code, List, Table, Settings, HelpCircle, Eye, EyeOff, LayoutTemplate, AlignLeft 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MARKDOWN_TEMPLATES = [
  {
    id: 'lab-report',
    name: '🔬 Lab Report',
    content: `# Lab Report: Verification of Bully Election Algorithm\n\n**Course**: CS401 Distributed Systems  \n**Student Name**: Jane Doe  \n**Date**: October 12, 2024  \n\n---\n\n## 1. Objective\nDescribe the objective of this laboratory exercise.\n\n## 2. Methodology & Algorithm Design\nExplain the design details and consensus steps of the Bully election algorithm.\n\n## 3. Results & Console Output\n\`\`\`text\n[Node 1] Active\n[Node 3] Crashed\n[Node 2] Initiating Election...\n[Node 2] Selected Leader: Node 5\n\`\`\`\n\n## 4. Conclusion\nSummarize findings and consensus validation under stress testing.\n`
  },
  {
    id: 'project-doc',
    name: '📂 Project Documentation',
    content: `# Technical Documentation: API Gateway Services\n\n## 1. Architecture Overview\nProvide a high-level description of the gateway architecture.\n\n## 2. API Endpoints\n| Method | Path | Description | Authentication |\n| ------ | ---- | ----------- | -------------- |\n| GET    | /api/v1/health | Gateway health checks | None |\n| POST   | /api/v1/users  | User registration | JWT Key |\n\n## 3. Configuration Setup\n\`\`\`yaml\nserver:\n  port: 8080\n  route:\n    path: /api/v1\n\`\`\`\n`
  },
  {
    id: 'lecture-notes',
    name: '📝 Lecture Notes',
    content: `# CS201: Data Structures - Lecture 5 Notes\n\n**Topic**: Balanced Binary Search Trees (AVL & Red-Black Trees)\n**Date**: October 12, 2024\n\n---\n\n### Key Concepts\n1. **AVL Tree Balance Factor**:\n   - Height of left subtree minus height of right subtree.\n   - Must remain in the range \\([-1, 1]\\).\n\n2. **Rotations**:\n   - Left Rotation (LL)\n   - Right Rotation (RR)\n   - Left-Right Rotation (LR)\n   - Right-Left Rotation (RL)\n`
  }
];

const MarkdownEditor = () => {
  const defaultMd = `# Welcome to the Markdown Editor! 👋\n\nThis is a **live-preview** markdown editor tailored for documentation.\n\n## Features Supported (GitHub Flavored Markdown)\n\n1. **Tables**:\n| Syntax      | Description |\n| ----------- | ----------- |\n| Header      | Title       |\n| Paragraph   | Text        |\n\n2. **Task Lists**:\n- [x] Write amazing documentation\n- [ ] Deploy the app\n- [ ] Celebrate 🎉\n\n3. **Code Blocks with Syntax Highlighting**:\n\`\`\`javascript\nfunction calculateSum(a, b) {\n  return a + b;\n}\nconsole.log(calculateSum(5, 10));\n\`\`\`\n\n4. **Blockquotes**:\n> "Documentation is a love letter that you write to your future self."\n\n5. **Links and Images**:\n[Visit Daily Utility Hub](#)\n\n---\n\nStart typing on the left to see the instant preview on the right!\n`;

  const [markdown, setMarkdown] = useState(defaultMd);
  const [isCopied, setIsCopied] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`;
    insertText(tableTemplate);
  };

  const handleTemplateSelect = (templateId) => {
    const t = MARKDOWN_TEMPLATES.find(x => x.id === templateId);
    if (t) {
      setMarkdown(t.content);
      toast.success(`Loaded ${t.name} template!`);
    }
  };

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Markdown Live Editor</h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Write beautiful documentation with instant GitHub-flavored previews and quick tools.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left pane: Editor */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6 relative"
        >
          {/* Quick controls bar */}
          <div className="flex flex-wrap gap-3 items-center bg-card border border-border p-3.5 rounded-2xl shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <LayoutTemplate size={16} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template:</span>
            </div>
            <div className="flex gap-2">
              {MARKDOWN_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors border border-primary/20"
            >
              <HelpCircle size={14} /> {showCheatSheet ? 'Hide Guide' : 'Show Guide'}
            </button>
          </div>

          <div className="flex gap-4 items-start w-full relative">
            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[600px] overflow-hidden">
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
                  Raw Editor
                </div>
              </div>
              
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none focus:ring-0 font-mono resize-none custom-scrollbar leading-relaxed min-h-[500px]"
                spellCheck="false"
                placeholder="Type your markdown here..."
              />

              <div className="p-3 bg-muted/30 border-t border-border flex justify-between items-center text-xs text-muted-foreground shrink-0">
                <span>{wordCount} Words | {charCount} Chars</span>
                <span>⏱️ {readTime} min read</span>
              </div>
            </div>

            {/* Markdown Cheat Sheet Drawer */}
            <AnimatePresence>
              {showCheatSheet && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '280px' }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  className="bg-card border border-border rounded-2xl shadow-sm p-4 h-[600px] overflow-y-auto custom-scrollbar shrink-0 space-y-4 text-xs"
                >
                  <h3 className="font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-primary" /> Markdown Guide
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-foreground">Headers</p>
                      <code className="block bg-muted p-1.5 rounded mt-1"># Header 1<br/>## Header 2</code>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Emphasis</p>
                      <code className="block bg-muted p-1.5 rounded mt-1">**Bold Text**<br/>*Italic Text*</code>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Lists</p>
                      <code className="block bg-muted p-1.5 rounded mt-1">1. First item<br/>- Bullet item</code>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Links & Images</p>
                      <code className="block bg-muted p-1.5 rounded mt-1">[Link Text](url)<br/>![Alt Text](imgUrl)</code>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Tables</p>
                      <code className="block bg-muted p-1.5 rounded mt-1">| Header | Value |<br/>| ------ | ----- |<br/>| Cell 1 | Val 1 |</code>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg my-4 !bg-[#161b22] border border-[#30363d] !text-xs"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-[#161b22] px-1.5 py-0.5 rounded text-[#e6edf3] font-mono text-[0.9em] border border-[#30363d]" {...props}>
                            {children}
                          </code>
                        )
                      },
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold border-b border-[#21262d] pb-2 mb-4 text-foreground" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold border-b border-[#21262d] pb-2 mt-6 mb-4 text-foreground" {...props} />,
                      a: ({node, ...props}) => <a className="text-[#58a6ff] hover:underline" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4 text-foreground" {...props} />,
                      img: ({node, ...props}) => <img className="inline-block mr-1 max-w-full rounded-xl shadow-md border border-border" {...props} />
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
