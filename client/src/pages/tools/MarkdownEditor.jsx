import { useState } from 'react';
import { BookOpen, Download, Copy, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';

const MarkdownEditor = () => {
  const defaultMd = `# Welcome to the Markdown Editor! 👋

This is a **live-preview** markdown editor tailored for documentation.

## Features Supported (GitHub Flavored Markdown)

1. **Tables**:
| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |

2. **Task Lists**:
- [x] Write amazing documentation
- [ ] Deploy the app
- [ ] Celebrate 🎉

3. **Code Blocks with Syntax Highlighting**:
\`\`\`javascript
function calculateSum(a, b) {
  return a + b;
}
console.log(calculateSum(5, 10));
\`\`\`

4. **Blockquotes**:
> "Documentation is a love letter that you write to your future self."

5. **Links and Images**:
[Visit Daily Utility Hub](#)

---

Start typing on the left to see the instant preview on the right!
`;

  const [markdown, setMarkdown] = useState(defaultMd);

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
    toast.success('Copied Markdown to clipboard');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Markdown Live Editor</h1>
            <p className="text-muted-foreground mt-1 text-sm">Write beautiful documentation with instant GitHub-flavored previews.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={copyMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-medium transition-colors shadow-sm"
          >
            <Copy size={18} />
            Copy MD
          </button>
          <button 
            onClick={downloadMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/20"
          >
            <Download size={18} />
            Download .md
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        
        {/* Editor */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Markdown Editor</h3>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none focus:ring-0 font-mono resize-none custom-scrollbar"
            spellCheck="false"
            placeholder="Type your markdown here..."
          />
        </div>

        {/* Live Preview */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Preview</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-background">
             <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-[#1e1e1e] prose-pre:p-0 prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-img:rounded-xl">
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
                          className="rounded-lg !m-0 !bg-[#1e1e1e]"
                          {...props}
                        />
                      ) : (
                        <code className="bg-muted px-1.5 py-0.5 rounded-md text-pink-500 font-mono text-xs" {...props}>
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
  );
};

export default MarkdownEditor;
