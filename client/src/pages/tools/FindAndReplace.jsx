import { useState } from 'react';
import { Copy, RefreshCw, Search, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FindAndReplace = () => {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [copied, setCopied] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleReplace = () => {
    if (!text || !find) return;

    try {
      let flags = 'g';
      if (!caseSensitive) flags += 'i';
      
      let searchPattern;
      if (useRegex) {
        searchPattern = new RegExp(find, flags);
      } else {
        // Escape regex characters if not using regex mode
        const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPattern = new RegExp(escapedFind, flags);
      }

      const matches = text.match(searchPattern);
      const count = matches ? matches.length : 0;
      setMatchCount(count);

      if (count > 0) {
        const newText = text.replace(searchPattern, replace);
        setText(newText);
        toast.success(`Replaced ${count} occurrence(s)`);
      } else {
        toast.error('No matches found');
      }
    } catch (err) {
      toast.error('Invalid Regular Expression');
    }
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setText('');
    setFind('');
    setReplace('');
    setMatchCount(0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg">
          <Search size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Find and Replace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Easily find and replace text, with support for Regular Expressions.</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-foreground mb-2">Find</label>
          <input 
            type="text" 
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Text to find..."
            className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
          />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-foreground mb-2">Replace With</label>
          <input 
            type="text" 
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Replacement text..."
            className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
          />
        </div>

        <button 
          onClick={handleReplace}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 h-[42px] shadow-sm"
        >
          Replace All
        </button>
      </div>

      <div className="flex flex-wrap gap-6 mb-6 px-2">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer group">
          <input 
            type="checkbox" 
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <span className="group-hover:text-primary transition-colors">Case Sensitive</span>
        </label>
        
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer group">
          <input 
            type="checkbox" 
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <span className="group-hover:text-primary transition-colors">Use Regular Expression (Regex)</span>
        </label>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6 flex flex-col">
        <textarea
          className="w-full h-80 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0 font-mono text-sm leading-relaxed"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="p-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-medium text-muted-foreground">
            {matchCount > 0 ? <span className="text-primary">{matchCount} replaced in last operation</span> : "Ready"}
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
              onClick={clearAll}
              className="px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindAndReplace;
