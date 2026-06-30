import { useState } from 'react';
import { Copy, RefreshCw, ArrowDownAZ, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SortLines = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const processLines = (input, direction) => {
    if (!input) return;
    let lines = input.split('\n');
    
    if (caseSensitive) {
      lines.sort();
    } else {
      lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }

    if (direction === 'desc') {
      lines.reverse();
    }

    setText(lines.join('\n'));
    toast.success(`Lines sorted ${direction === 'asc' ? 'A-Z' : 'Z-A'}`);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
          <ArrowDownAZ size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sort Lines</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sort text lines alphabetically (A-Z or Z-A).</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6 flex flex-col">
        <textarea
          className="w-full h-80 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0 font-mono text-sm leading-relaxed"
          placeholder="Paste your lines here to sort them..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="p-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => processLines(text, 'asc')}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sort A-Z
            </button>
            <button 
              onClick={() => processLines(text, 'desc')}
              className="px-4 py-2 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors shadow-sm"
            >
              Sort Z-A
            </button>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input 
                type="checkbox" 
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              Case Sensitive
            </label>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              Copy
            </button>
            <button 
              onClick={() => setText('')}
              className="px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortLines;
