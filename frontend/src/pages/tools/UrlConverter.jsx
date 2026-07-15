import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Link2, ArrowRightLeft, Copy, Check, Settings2, 
  Trash2, Plus, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const UrlConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' | 'decode'
  const [scope, setScope] = useState('component'); // 'full' | 'component'
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Advanced features
  const [parsedUrl, setParsedUrl] = useState(null);
  const [queryParams, setQueryParams] = useState([]); // Array of { key, value }

  const handleConvert = useCallback((text, currentMode = mode, currentScope = scope) => {
    setInput(text);
    if (!text.trim()) {
      setOutput('');
      setError(null);
      setParsedUrl(null);
      setQueryParams([]);
      return;
    }

    try {
      if (currentMode === 'encode') {
        if (currentScope === 'full') {
          setOutput(encodeURI(text));
        } else {
          setOutput(encodeURIComponent(text));
        }
        setError(null);
      } else {
        if (currentScope === 'full') {
          setOutput(decodeURI(text));
        } else {
          setOutput(decodeURIComponent(text));
        }
        setError(null);
      }

      const trimText = text.trim();
      if (/^https?:\/\//i.test(trimText)) {
        const urlObj = new URL(trimText);
        setParsedUrl({
          protocol: urlObj.protocol,
          host: urlObj.host,
          pathname: urlObj.pathname,
          hash: urlObj.hash,
        });

        const params = [];
        urlObj.searchParams.forEach((val, key) => {
          params.push({ key, value: val });
        });
        setQueryParams(params);
      } else {
        setParsedUrl(null);
        setQueryParams([]);
      }
    } catch (err) {
      setOutput('');
      setParsedUrl(null);
      setQueryParams([]);
      setError('Invalid input encoding format');
    }
  }, [mode, scope]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    const tempOutput = output;
    if (tempOutput && !error) {
      handleConvert(tempOutput, newMode, scope);
    } else {
      handleConvert(input, newMode, scope);
    }
  };

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    handleConvert(input, mode, newScope);
  };

  const handleParamChange = (index, field, value) => {
    const updated = queryParams.map((p, idx) => {
      if (idx === index) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setQueryParams(updated);
    reconstructUrl(updated);
  };

  const addParam = () => {
    const updated = [...queryParams, { key: 'new_param', value: 'value' }];
    setQueryParams(updated);
    reconstructUrl(updated);
  };

  const deleteParam = (index) => {
    const updated = queryParams.filter((_, idx) => idx !== index);
    setQueryParams(updated);
    reconstructUrl(updated);
  };

  const reconstructUrl = (paramsList) => {
    if (!input.trim() || !parsedUrl) return;
    try {
      const urlObj = new URL(input.trim());
      const keys = [];
      urlObj.searchParams.forEach((_, key) => keys.push(key));
      keys.forEach(k => urlObj.searchParams.delete(k));

      paramsList.forEach(p => {
        if (p.key.trim()) {
          urlObj.searchParams.append(p.key.trim(), p.value);
        }
      });

      setInput(urlObj.toString());
      if (mode === 'encode') {
        setOutput(scope === 'full' ? encodeURI(urlObj.toString()) : encodeURIComponent(urlObj.toString()));
      } else {
        setOutput(scope === 'full' ? decodeURI(urlObj.toString()) : decodeURIComponent(urlObj.toString()));
      }
    } catch (e) {}
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setParsedUrl(null);
    setQueryParams([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Link2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">URL Encoder & Decoder</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Safely encode URLs and query strings, or parse and manage query parameters visually.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col relative min-h-[480px]">
          
          {/* Modes bar */}
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
                      layoutId="url-mode-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {m === 'encode' ? 'Encode URL' : 'Decode URL'}
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

          {/* Editors workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[280px]">
            {/* Input */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30">
              <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Input URL / Text</span>
                {parsedUrl && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-0.5 select-none">
                    <ShieldCheck size={11} /> Parsed URL
                  </span>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => handleConvert(e.target.value, mode, scope)}
                className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-sm text-foreground resize-none custom-scrollbar min-h-[200px] leading-relaxed"
                placeholder={mode === 'encode' ? 'Enter raw text or URL to encode...' : 'Enter encoded URL to decode...'}
                spellCheck="false"
              />
            </div>

            {/* Output */}
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

              <div className="flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm relative min-h-[200px] leading-relaxed">
                {error ? (
                  <pre className="text-red-500 font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={15} /> {error}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap break-all text-primary">
                    {output || 'Output result will appear here...'}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Query Parameter Builder (Advanced) */}
          {parsedUrl && (
            <div className="mt-6 border border-border/80 rounded-xl bg-background/30 overflow-hidden">
              <div className="p-3.5 border-b border-border bg-muted/20 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Query Builder</h4>
                <button
                  onClick={addParam}
                  className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  + Add Parameter
                </button>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar space-y-3">
                {queryParams.length > 0 ? (
                  <div className="space-y-2.5">
                    {queryParams.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-muted/10 border border-border/50 p-2.5 rounded-xl">
                        <input
                          type="text"
                          value={p.key}
                          onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                          placeholder="parameter_key"
                          className="w-1/3 p-2 bg-background border border-border/80 rounded-lg text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                        />
                        <span className="text-muted-foreground text-xs font-bold font-mono select-none">=</span>
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                          placeholder="value"
                          className="w-1/2 p-2 bg-background border border-border/80 rounded-lg text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                        />
                        <button
                          onClick={() => deleteParam(idx)}
                          className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors ml-auto cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic block text-center py-6">No query parameters parsed in the URL. Click "Add Parameter" to begin building.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> configurations
              </h3>
            </div>

            {/* Scope Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Encoding Scope</label>
              <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
                {[
                  { id: 'full', label: 'Full URL', desc: 'encodeURI' },
                  { id: 'component', label: 'Params Only', desc: 'encodeURIComponent' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleScopeChange(s.id)}
                    className={`flex-1 relative z-10 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      scope === s.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={s.desc}
                  >
                    {scope === s.id && (
                      <motion.div
                        layoutId="url-scope-active"
                        className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* URL Breakdown stats */}
            {parsedUrl && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Components</label>
                <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
                  <div className="flex justify-between border-b border-border/20 pb-1.5">
                    <span>Protocol:</span>
                    <span className="text-foreground font-bold">{parsedUrl.protocol}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/20 pb-1.5">
                    <span>Host:</span>
                    <span className="text-foreground font-bold">{parsedUrl.host}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/20 pb-1.5">
                    <span>Path:</span>
                    <span className="text-foreground font-bold truncate max-w-[200px]">{parsedUrl.pathname}</span>
                  </div>
                  {parsedUrl.hash && (
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span>Hash:</span>
                      <span className="text-foreground font-bold">{parsedUrl.hash}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UrlConverter;
