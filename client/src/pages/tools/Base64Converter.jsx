import { useState } from 'react';
import { Binary, ArrowRightLeft, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Base64Converter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // encode, decode
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleConvert = (text, currentMode) => {
    setInput(text);
    if (!text) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (currentMode === 'encode') {
        // Handle utf-8 encoding safely
        const encoded = btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g,
          function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
          }));
        setOutput(encoded);
        setError(null);
      } else {
        // Decode
        const decoded = decodeURIComponent(atob(text).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        setOutput(decoded);
        setError(null);
      }
    } catch (err) {
      setOutput('');
      setError(currentMode === 'decode' ? 'Invalid Base64 string' : 'Conversion error');
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // Swap input and output
    const prevOutput = output;
    if (prevOutput && !error) {
      handleConvert(prevOutput, newMode);
    } else {
      handleConvert(input, newMode);
    }
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

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-teal-500/10 text-teal-500 rounded-lg shadow-sm">
          <Binary size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Base64 Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Encode strings to Base64 or decode Base64 back to text instantly.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm mb-6 p-6">
        
        {/* Toggle Mode */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-xl flex gap-1 border border-border/50">
            <button
              onClick={() => handleModeChange('encode')}
              className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'encode'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 border border-transparent'
              }`}
            >
              Encode to Base64
            </button>
            <button
              onClick={() => handleModeChange('decode')}
              className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'decode'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 border border-transparent'
              }`}
            >
              Decode from Base64
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          
          {/* Input */}
          <div className="flex flex-col gap-2 h-full">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>{mode === 'encode' ? 'Plain Text' : 'Base64 String'}</span>
              <button onClick={clear} className="text-xs text-red-500 hover:underline capitalize">Clear</button>
            </label>
            <textarea
              value={input}
              onChange={(e) => handleConvert(e.target.value, mode)}
              placeholder={mode === 'encode' ? "Enter text to encode..." : "Paste Base64 string to decode..."}
              className="w-full flex-1 min-h-[200px] p-4 bg-background border border-border rounded-xl resize-none text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 custom-scrollbar"
            />
          </div>

          {/* Icon */}
          <div className="hidden md:flex flex-col items-center justify-center p-4 text-teal-500 bg-teal-500/10 rounded-full h-12 w-12 mx-auto">
            <ArrowRightLeft size={20} />
          </div>
          <div className="md:hidden flex justify-center text-muted-foreground py-2">
            <ArrowRightLeft size={20} className="rotate-90" />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2 h-full">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>{mode === 'encode' ? 'Base64 String' : 'Plain Text'}</span>
            </label>
            <div className="relative flex-1 w-full flex">
              <textarea
                readOnly
                value={error ? error : output}
                placeholder={mode === 'encode' ? "Encoded result..." : "Decoded result..."}
                className={`w-full flex-1 min-h-[200px] p-4 bg-muted/30 border border-border rounded-xl resize-none font-mono text-sm focus:outline-none custom-scrollbar ${
                  error ? 'text-red-500' : 'text-foreground'
                }`}
              />
              <button 
                onClick={handleCopy}
                disabled={!output || !!error}
                className="absolute top-4 right-4 p-2 bg-background border border-border rounded-md text-muted-foreground hover:text-teal-500 hover:border-teal-500/50 transition-colors shadow-sm disabled:opacity-50"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Base64Converter;
