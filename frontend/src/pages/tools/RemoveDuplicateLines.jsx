import { useState } from 'react';
import { Copy, RefreshCw, Layers, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RemoveDuplicateLines = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ original: 0, removed: 0, current: 0 });

  const processLines = (input) => {
    if (!input) {
      setStats({ original: 0, removed: 0, current: 0 });
      return;
    }
    const lines = input.split('\n');
    const uniqueLines = [...new Set(lines)];
    
    setStats({
      original: lines.length,
      current: uniqueLines.length,
      removed: lines.length - uniqueLines.length
    });
    
    setText(uniqueLines.join('\n'));
    toast.success(`${lines.length - uniqueLines.length} duplicate lines removed.`);
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
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Remove Duplicate Lines</h1>
          <p className="text-muted-foreground mt-1 text-sm">Clean up your text lists by instantly removing duplicate lines.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center shadow-sm">
          <span className="text-2xl font-bold text-foreground">{stats.original}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Original Lines</span>
        </div>
        <div className="bg-card border border-red-500/30 p-4 rounded-xl flex flex-col items-center shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 z-0" />
          <span className="text-2xl font-bold text-red-500 z-10">{stats.removed}</span>
          <span className="text-xs text-red-500/80 font-bold uppercase tracking-wider mt-1 z-10">Duplicates Removed</span>
        </div>
        <div className="bg-card border border-green-500/30 p-4 rounded-xl flex flex-col items-center shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-green-500/5 z-0" />
          <span className="text-2xl font-bold text-green-500 z-10">{stats.current}</span>
          <span className="text-xs text-green-500/80 font-bold uppercase tracking-wider mt-1 z-10">Unique Lines</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
        <textarea
          className="w-full h-80 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0 font-mono text-sm leading-relaxed"
          placeholder="Paste your list here... duplicate lines will be removed."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <button 
            onClick={() => processLines(text)}
            className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            Remove Duplicates
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              Copy
            </button>
            <button 
              onClick={() => { setText(''); setStats({original:0, removed:0, current:0}); }}
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

export default RemoveDuplicateLines;
