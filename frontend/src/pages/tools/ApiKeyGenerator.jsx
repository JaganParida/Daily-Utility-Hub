import { useState, useEffect, useCallback } from 'react';
import { 
  Key, Copy, RefreshCw, Check, Settings2, 
  ChevronDown, ShieldAlert, Sparkles, Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ApiKeyGenerator = () => {
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState(64);
  const [format, setFormat] = useState('hex'); // 'hex' | 'base64' | 'alphanumeric' | 'uuid'
  
  // Advanced features
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [batchCount, setBatchCount] = useState(1); // Generate 1-10 keys
  const [batchSecrets, setBatchSecrets] = useState([]);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [history, setHistory] = useState([]);

  const generateSingleKey = useCallback((len, fmt, pref = '', suff = '', exclude = false) => {
    let result = '';
    
    if (fmt === 'uuid') {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      return (pref ? pref : '') + uuid + (suff ? suff : '');
    }

    let charset = '';
    if (fmt === 'hex') {
      charset = '0123456789abcdef';
    } else if (fmt === 'alphanumeric') {
      charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    } else if (fmt === 'base64') {
      charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    }

    if (exclude) {
      // Exclude ambiguous characters: 0, O, o, l, 1, I, i, +, /
      charset = charset.replace(/[0Oo1lIi+/]/g, '');
    }

    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < len; i++) {
      result += charset.charAt(array[i] % charset.length);
    }

    return (pref ? pref : '') + result + (suff ? suff : '');
  }, []);

  const generateKeys = useCallback(() => {
    const keys = [];
    for (let i = 0; i < batchCount; i++) {
      keys.push(generateSingleKey(length, format, prefix, suffix, excludeAmbiguous));
    }
    
    setSecret(keys[0]);
    setBatchSecrets(keys);
    setCopied(false);

    if (!history.includes(keys[0])) {
      setHistory(prev => [keys[0], ...prev.slice(0, 9)]);
    }
  }, [batchCount, length, format, prefix, suffix, excludeAmbiguous, generateSingleKey, history]);

  useEffect(() => {
    generateKeys();
  }, [length, format, batchCount, excludeAmbiguous]);

  const handleCopySingle = (text, idx = -1) => {
    navigator.clipboard.writeText(text);
    if (idx !== -1) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(-1), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success('Key copied to clipboard!');
  };

  const getStrengthMetrics = () => {
    if (format === 'uuid') return { entropy: 122, label: 'Very Strong', color: 'bg-primary text-emerald-500' };
    
    let entropyPerChar = 4; // Hex = log2(16)
    if (format === 'alphanumeric') entropyPerChar = 5.95; // log2(62)
    if (format === 'base64') entropyPerChar = 6; // log2(64)
    
    if (excludeAmbiguous) entropyPerChar -= 0.5;

    const totalEntropy = Math.round(length * entropyPerChar);
    
    let label = 'Weak';
    let color = 'bg-red-500 text-red-500';
    if (totalEntropy > 120) {
      label = 'Very Strong';
      color = 'bg-emerald-500 text-emerald-500';
    } else if (totalEntropy > 80) {
      label = 'Strong';
      color = 'bg-green-500 text-green-500';
    } else if (totalEntropy > 60) {
      label = 'Moderate';
      color = 'bg-amber-500 text-amber-500';
    }

    return { entropy: totalEntropy, label, color };
  };

  const strength = getStrengthMetrics();

  const downloadEnv = () => {
    const lines = batchSecrets.map((k, i) => `API_KEY_${i + 1}=${k}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.keys';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .env.keys file');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Key size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">API Key & Secret Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate secure, cryptographically random strings for API credentials, JWT secrets, and salt values.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Main Key Display Box */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Generated Credential
              </h3>
            </div>
            
            <div className="relative group">
              <div className="w-full bg-background/40 border border-border/80 rounded-xl p-5 pr-14 min-h-[90px] flex items-center justify-center break-all font-mono text-sm md:text-base text-foreground text-center shadow-inner leading-relaxed">
                {secret}
              </div>
              <button
                onClick={() => handleCopySingle(secret)}
                className="absolute top-1/2 -translate-y-1/2 right-4.5 p-2 bg-background border border-border/80 hover:border-primary hover:text-primary rounded-lg text-muted-foreground transition-all shadow-sm cursor-pointer"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Strength metrics */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                Strength: <span className={`font-bold ${strength.color.split(' ')[1]}`}>{strength.label}</span>
              </span>
              <span className="font-mono text-muted-foreground font-bold">~{strength.entropy} bits entropy</span>
            </div>
            
            {/* Visual strength bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`}
                style={{ width: `${Math.min(100, (strength.entropy / 256) * 100)}%` }}
              />
            </div>
          </div>

          {/* Batch list view */}
          {batchCount > 1 && (
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Batch ({batchSecrets.length})</h3>
                <button
                  onClick={downloadEnv}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} /> Export .env
                </button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {batchSecrets.map((k, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-background/50 border border-border/80 px-4 py-3 rounded-xl font-mono text-xs text-foreground group">
                    <span className="text-[10px] text-muted-foreground font-bold bg-muted/65 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                    <span className="truncate flex-1 leading-relaxed">{k}</span>
                    <button
                      onClick={() => handleCopySingle(k, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-background hover:bg-muted border border-border/80 text-muted-foreground rounded-lg cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> generator settings
              </h3>
            </div>

            {/* Key format selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Format Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'hex', label: 'Hexadecimal' },
                  { id: 'base64', label: 'Base64' },
                  { id: 'alphanumeric', label: 'Alphanumeric' },
                  { id: 'uuid', label: 'UUID v4' }
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      format === fmt.id
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-border/80 text-foreground hover:bg-muted'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Key length slider */}
            {format !== 'uuid' && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-sm font-semibold text-foreground">Length (Characters)</label>
                  <span className="font-bold font-mono bg-muted/60 px-2 py-0.5 rounded">{length}</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="8"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${Math.round(((length-16)/(128-16))*100)}%, var(--muted) ${Math.round(((length-16)/(128-16))*100)}%)`
                  }}
                />
              </div>
            )}

            {/* Advanced configurations */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Prefix / Suffix</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="prefix_"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-1/2 p-3 bg-background border border-border/80 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-foreground"
                />
                <input
                  type="text"
                  placeholder="_suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-1/2 p-3 bg-background border border-border/80 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-foreground"
                />
              </div>
            </div>

            {/* Exclude ambiguous characters */}
            {format !== 'uuid' && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-muted-foreground" />
                  <div>
                    <label className="text-sm font-semibold text-foreground block">Exclude Ambiguous</label>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Avoid 0, O, o, l, 1, I
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExcludeAmbiguous(!excludeAmbiguous)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    excludeAmbiguous ? 'bg-primary' : 'bg-muted/50 border border-border'
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md animate-none"
                    style={{ left: excludeAmbiguous ? 'calc(100% - 22px)' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            )}

            {/* Batch count selector */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Batch Generation</label>
              <div className="relative group">
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3.5 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/45 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value={1} className="bg-background text-foreground">Generate Single Key (1)</option>
                  <option value={5} className="bg-background text-foreground">Generate Batch of 5</option>
                  <option value={10} className="bg-background text-foreground">Generate Batch of 10</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                onClick={generateKeys}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-sm"
              >
                <RefreshCw size={16} /> Generate New Key
              </button>
            </div>
          </div>

          {/* History */}
          {history.length > 1 && (
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">History</h3>
              <div className="space-y-1.5">
                {history.map((hKey, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSecret(hKey);
                      toast.success('Loaded from history');
                    }}
                    className="p-2 border border-border/40 hover:bg-muted/30 rounded-lg text-[11px] font-mono truncate text-foreground cursor-pointer transition-colors"
                  >
                    {hKey}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        input[type=range]:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
      ` }} />
    </motion.div>
  );
};

export default ApiKeyGenerator;
