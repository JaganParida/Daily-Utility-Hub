import { useState } from 'react';
import { Braces, Copy, Check, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState(2);

  const formatJson = () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, Number(indent));
      setOutput(formatted);
      setError(null);
      toast.success('JSON successfully parsed and formatted');
    } catch (err) {
      setError(err.message);
      setOutput('');
      toast.error('Invalid JSON');
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!output) return;
    const element = document.createElement("a");
    const file = new Blob([output], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = "formatted.json";
    document.body.appendChild(element);
    element.click();
    element.remove();
    toast.success('Downloaded formatted.json');
  };

  const loadSample = () => {
    setInput('{"name":"John Doe","age":30,"isActive":true,"roles":["admin","user"],"settings":{"theme":"dark","notifications":false}}');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
            <Braces size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">JSON Formatter & Validator</h1>
            <p className="text-muted-foreground mt-1 text-sm">Beautify, validate, and structure your JSON data instantly.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select 
            value={indent} 
            onChange={(e) => setIndent(Number(e.target.value))}
            className="bg-card border border-border text-foreground px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
            <option value={8}>8 Spaces</option>
          </select>
          <button 
            onClick={formatJson}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
          >
            Format JSON
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        
        {/* Input Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden relative group">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Input JSON</h3>
            <div className="flex gap-2">
               <button onClick={loadSample} className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded transition-colors">Sample</button>
               <button onClick={() => { setInput(''); setOutput(''); setError(null); }} className="text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition-colors flex items-center gap-1"><Trash2 size={12}/> Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar"
            spellCheck="false"
            placeholder="Paste your raw, minified, or messy JSON here..."
          />
          {error && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white p-3 text-sm flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Invalid JSON</p>
                <p className="font-mono text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               Formatted Output
               {!error && output && <Check size={14} className="text-emerald-500" />}
            </h3>
            <div className="flex gap-2">
               <button 
                 onClick={copyToClipboard}
                 disabled={!output}
                 className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                 {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                 {copied ? 'Copied' : 'Copy'}
               </button>
               <button 
                 onClick={downloadJson}
                 disabled={!output}
                 className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                 <Download size={14} />
                 Save
               </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            className="w-full flex-1 bg-background border-none p-4 text-sm text-emerald-600 dark:text-emerald-400 focus:outline-none font-mono resize-none custom-scrollbar"
            spellCheck="false"
            placeholder="Formatted JSON will appear here..."
          />
        </div>

      </div>
    </div>
  );
};

export default JsonFormatter;
