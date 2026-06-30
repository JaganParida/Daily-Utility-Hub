import { useState } from 'react';
import { Layers, Copy, Check, ArrowDownAZ, ArrowDownZA, Shuffle, Delete, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TextLineEditor = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);

  const processLines = (action) => {
    if (!text) return;
    
    let lines = text.split('\n');

    switch (action) {
      case 'sort-asc':
        lines.sort((a, b) => caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase()));
        break;
      case 'sort-desc':
        lines.sort((a, b) => caseSensitive ? b.localeCompare(a) : b.toLowerCase().localeCompare(a.toLowerCase()));
        break;
      case 'sort-length':
        lines.sort((a, b) => a.length - b.length);
        break;
      case 'shuffle':
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      case 'remove-dupes':
        if (caseSensitive) {
          lines = [...new Set(lines)];
        } else {
          const seen = new Set();
          lines = lines.filter(line => {
            const lower = line.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
          });
        }
        break;
      case 'remove-empty':
        lines = lines.filter(line => line.trim() !== '');
        break;
      case 'trim':
        lines = lines.map(line => line.trim());
        break;
      default:
        break;
    }

    setText(lines.join('\n'));
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearText = () => {
    setText('');
    toast.success('Text cleared');
  };

  const getLineCount = () => {
    return text === '' ? 0 : text.split('\n').length;
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Text Line Editor</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sort, shuffle, deduplicate, and clean up lists of text instantly.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[280px_1fr] gap-6 min-h-0">
        
        {/* Controls Sidebar */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
             <input 
               type="checkbox" 
               checked={caseSensitive}
               onChange={(e) => setCaseSensitive(e.target.checked)}
               className="w-4 h-4 text-pink-500 border-border rounded focus:ring-pink-500 cursor-pointer"
               id="caseSensitive"
             />
             <label htmlFor="caseSensitive" className="text-sm font-medium text-foreground cursor-pointer">
               Case Sensitive
             </label>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <ArrowDownAZ size={14} /> Sort Operations
            </h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => processLines('sort-asc')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-600 font-medium transition-all text-sm flex items-center justify-between">
                Sort A-Z <ArrowDownAZ size={16} className="opacity-50" />
              </button>
              <button onClick={() => processLines('sort-desc')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-600 font-medium transition-all text-sm flex items-center justify-between">
                Sort Z-A <ArrowDownZA size={16} className="opacity-50" />
              </button>
              <button onClick={() => processLines('sort-length')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-600 font-medium transition-all text-sm flex items-center justify-between">
                Sort by Length
              </button>
              <button onClick={() => processLines('shuffle')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-600 font-medium transition-all text-sm flex items-center justify-between">
                Shuffle Randomly <Shuffle size={16} className="opacity-50" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Delete size={14} /> Clean Operations
            </h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => processLines('remove-dupes')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 font-medium transition-all text-sm">
                Remove Duplicates
              </button>
              <button onClick={() => processLines('remove-empty')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 font-medium transition-all text-sm">
                Remove Empty Lines
              </button>
              <button onClick={() => processLines('trim')} className="w-full text-left px-4 py-2 rounded-lg border border-transparent bg-muted/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 font-medium transition-all text-sm">
                Trim Whitespace
              </button>
            </div>
          </div>

        </div>

        {/* Editor Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Type size={16} /> Text Editor
              <span className="bg-background border border-border px-2 py-0.5 rounded text-xs font-mono lowercase">
                {getLineCount()} line{getLineCount() !== 1 ? 's' : ''}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={clearText} className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition-colors">
                Clear
              </button>
              <button onClick={handleCopy} className="text-xs font-medium text-pink-500 hover:bg-pink-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
            </div>
          </div>
          
          <textarea
            className="w-full flex-1 p-6 bg-transparent resize-none text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar whitespace-pre"
            placeholder="Paste your list of items here...&#10;Line 1&#10;Line 2&#10;Line 3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
            wrap="off"
          />
        </div>

      </div>
    </div>
  );
};

export default TextLineEditor;
