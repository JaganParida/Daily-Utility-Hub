import { useState, useRef } from 'react';
import { Braces, Copy, RefreshCw, Check, AlertCircle, FileJson2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const textareaRef = useRef(null);

  const formatJson = (spaces = 2) => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, spaces));
      setError(null);
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  };

  const minifyJson = () => {
    formatJson(0);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCopy = () => {
    if (!output) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shadow-sm">
          <Braces size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JSON Formatter & Validator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Instantly format messy JSON, minify, or validate syntax errors.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
        
        {/* Input Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileJson2 size={16} /> Input JSON
            </h3>
            <button 
              onClick={clear}
              className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto clear error if empty
              if (!e.target.value.trim()) {
                setError(null);
                setOutput('');
              }
            }}
            placeholder='Paste your JSON here...&#10;&#10;{&#10;  "example": true&#10;}'
            className="flex-1 w-full p-4 bg-transparent border-none outline-none resize-none text-foreground font-mono text-sm placeholder:text-muted-foreground focus:ring-0 custom-scrollbar"
            spellCheck="false"
          />
          
          <div className="p-4 border-t border-border bg-muted/30 shrink-0 flex gap-3">
            <button 
              onClick={() => formatJson(2)}
              className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
            >
              Format JSON
            </button>
            <button 
              onClick={minifyJson}
              className="flex-1 py-2.5 bg-background border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors shadow-sm"
            >
              Minify
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Result
            </h3>
            <button 
              onClick={handleCopy}
              disabled={!output}
              className="text-xs font-medium text-amber-500 hover:bg-amber-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          
          {error ? (
            <div className="flex-1 p-6 flex items-start bg-red-500/5 custom-scrollbar overflow-auto">
              <div className="flex gap-3 text-red-500">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">Invalid JSON</h4>
                  <p className="text-sm font-mono whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="Formatted output will appear here..."
              className="flex-1 w-full p-4 bg-transparent border-none outline-none resize-none text-foreground font-mono text-sm placeholder:text-muted-foreground/50 focus:ring-0 custom-scrollbar"
              spellCheck="false"
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default JsonFormatter;
