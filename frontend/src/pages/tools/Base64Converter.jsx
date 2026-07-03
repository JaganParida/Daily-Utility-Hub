import { useState } from 'react';
import { 
  Binary, ArrowRightLeft, Copy, Check, RefreshCw, 
  Trash2, UploadCloud, FileImage, ShieldAlert, Settings2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Base64Converter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' | 'decode'
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Advanced features
  const [urlSafe, setUrlSafe] = useState(false);
  const [lineWrap, setLineWrap] = useState(false); // 76-char wraps
  const [isImagePreview, setIsImagePreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const base64Encode = (str, isUrlSafe = false, wrap = false) => {
    try {
      let encoded = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode('0x' + p1);
      }));

      if (isUrlSafe) {
        encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }

      if (wrap) {
        encoded = encoded.replace(/(.{76})/g, '$1\n');
      }

      return encoded;
    } catch (e) {
      throw new Error('Encoding failed');
    }
  };

  const base64Decode = (str, isUrlSafe = false) => {
    try {
      let cleaned = str.trim();
      if (isUrlSafe) {
        cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
        while (cleaned.length % 4) {
          cleaned += '=';
        }
      }

      if (cleaned.startsWith('data:image')) {
        setIsImagePreview(true);
        setImagePreviewUrl(cleaned);
        cleaned = cleaned.replace(/^data:image\/[a-z]+;base64,/, '');
      } else {
        setIsImagePreview(false);
        setImagePreviewUrl('');
      }

      const decoded = decodeURIComponent(atob(cleaned).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      if (/^[\u0089]PNG/.test(decoded) || /^GIF8[79]a/.test(decoded) || /^\u00ff\u00d8\u00ff/.test(decoded)) {
        setIsImagePreview(true);
        setImagePreviewUrl(`data:image/png;base64,${cleaned}`);
      }

      return decoded;
    } catch (e) {
      try {
        const cleaned = str.trim();
        const decodedRaw = atob(cleaned.replace(/-/g, '+').replace(/_/g, '/'));
        if (decodedRaw) {
          setIsImagePreview(true);
          setImagePreviewUrl(`data:image/png;base64,${cleaned}`);
          return '[Binary Image Data - Previewing on the right]';
        }
      } catch (innerErr) {}
      
      setIsImagePreview(false);
      setImagePreviewUrl('');
      throw new Error('Invalid Base64 string');
    }
  };

  const handleConvert = (text, currentMode, isUrlSafe = urlSafe, wrap = lineWrap) => {
    setInput(text);
    if (!text.trim()) {
      setOutput('');
      setError(null);
      setIsImagePreview(false);
      setImagePreviewUrl('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        const res = base64Encode(text, isUrlSafe, wrap);
        setOutput(res);
        setError(null);
      } else {
        const res = base64Decode(text, isUrlSafe);
        setOutput(res);
        setError(null);
      }
    } catch (err) {
      setOutput('');
      setError(err.message);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    const tempOutput = output;
    if (tempOutput && !error) {
      handleConvert(tempOutput, newMode);
    } else {
      handleConvert(input, newMode);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      if (mode === 'encode') {
        if (file.type.startsWith('image/')) {
          handleConvert(result, 'encode');
          const base64Data = result.split(',')[1];
          setOutput(base64Data);
          setIsImagePreview(true);
          setImagePreviewUrl(result);
          toast.success(`Image "${file.name}" encoded!`);
        } else {
          const text = result;
          handleConvert(text, 'encode');
          toast.success(`Text file "${file.name}" loaded!`);
        }
      } else {
        const base64Str = result.trim();
        handleConvert(base64Str, 'decode');
        toast.success(`Loaded Base64 string from "${file.name}"!`);
      }
    };

    if (file.type.startsWith('image/') && mode === 'encode') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setIsImagePreview(false);
    setImagePreviewUrl('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Binary size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Base64 Encoder / Decoder</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Encode plain text or images to Base64, or decode strings with auto image detection.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col relative min-h-[480px]">
          
          {/* Mode Switcher */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4 shrink-0">
            <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner">
              {['encode', 'decode'].map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold capitalize transition-all cursor-pointer relative ${
                    mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="base64-mode-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {m === 'encode' ? 'Encode Text' : 'Decode Base64'}
                </button>
              ))}
            </div>

            <button
              onClick={clear}
              disabled={!input.trim()}
              className="text-xs px-3.5 py-2 bg-red-500/10 disabled:bg-muted/10 text-red-500 disabled:text-muted-foreground hover:bg-red-500/20 border border-red-500/20 disabled:border-border/50 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Editors Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[350px]">
            {/* Input Side */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30">
              <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
                </span>
                
                <label className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
                  <UploadCloud size={13} /> Load File
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept={mode === 'encode' ? 'text/*,image/*' : 'text/*'}
                  />
                </label>
              </div>

              <textarea
                value={input}
                onChange={(e) => handleConvert(e.target.value, mode)}
                className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-sm text-foreground resize-none custom-scrollbar min-h-[250px] leading-relaxed"
                placeholder={mode === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 encoded string here...'}
                spellCheck="false"
              />
            </div>

            {/* Output Side */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30 relative">
              <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output Result</span>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="text-xs bg-muted/20 hover:bg-muted/40 text-foreground px-2.5 py-1.5 border border-border/50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                  Copy
                </button>
              </div>

              <div className="flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm relative min-h-[250px] leading-relaxed">
                {isImagePreview && imagePreviewUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted/10 border border-border/40 rounded-xl space-y-2.5">
                    <img
                      src={imagePreviewUrl}
                      alt="Base64 Preview"
                      className="max-h-[200px] max-w-full object-contain rounded-lg shadow-md border border-border/80"
                    />
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                      <FileImage size={12} /> Detected Image Preview
                    </span>
                  </div>
                ) : error ? (
                  <pre className="text-red-500 font-semibold flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Error: {error}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap break-all text-primary">
                    {output || 'Output will appear here...'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> settings
              </h3>
            </div>

            {/* URL-Safe Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-muted-foreground" />
                <div>
                  <span className="text-sm font-semibold block text-foreground">URL-Safe Base64</span>
                  <span className="text-xs text-muted-foreground block">Swap +// to -_ and strip =</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setUrlSafe(!urlSafe);
                  handleConvert(input, mode, !urlSafe, lineWrap);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                  urlSafe ? 'bg-primary' : 'bg-muted/50 border border-border'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md animate-none"
                  style={{ left: urlSafe ? 'calc(100% - 22px)' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Line Wrap Toggle (Encode only) */}
            {mode === 'encode' && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Binary size={16} className="text-muted-foreground" />
                  <div>
                    <span className="text-sm font-semibold block text-foreground">MIME Line Wrap</span>
                    <span className="text-xs text-muted-foreground block">Wrap lines at 76 characters</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLineWrap(!lineWrap);
                    handleConvert(input, mode, urlSafe, !lineWrap);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    lineWrap ? 'bg-primary' : 'bg-muted/50 border border-border'
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md animate-none"
                    style={{ left: lineWrap ? 'calc(100% - 22px)' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Base64Converter;
