import { useState, useEffect, useCallback } from 'react';
import { 
  Key, Copy, RefreshCw, Check, Settings2, 
  ChevronDown, ShieldAlert, Sparkles, Download, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const JwtSecretGenerator = () => {
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const [bitLength, setBitLength] = useState(512); // Default to 512 bits (HS512)
  const [format, setFormat] = useState('base64url'); // Default to base64url for JWT standard
  
  // Advanced features
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [batchCount, setBatchCount] = useState(1); // Generate 1-10 secrets
  const [batchSecrets, setBatchSecrets] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [history, setHistory] = useState([]);

  const generateSingleSecret = useCallback((bits, fmt, pref = '', suff = '') => {
    const byteLength = bits / 8;
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    let result = '';

    if (fmt === 'hex') {
      result = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (fmt === 'base64') {
      const binString = Array.from(array).map(b => String.fromCharCode(b)).join('');
      result = btoa(binString);
    } else if (fmt === 'base64url') {
      const binString = Array.from(array).map(b => String.fromCharCode(b)).join('');
      result = btoa(binString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } else if (fmt === 'plain') {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      const randomArray = new Uint32Array(byteLength);
      window.crypto.getRandomValues(randomArray);
      for (let i = 0; i < byteLength; i++) {
        result += charset.charAt(randomArray[i] % charset.length);
      }
    } else if (fmt === 'passphrase') {
      const wordList = [
        'correct', 'horse', 'battery', 'staple', 'quantum', 'cipher', 'crypto', 'entropy', 'token', 'secret',
        'plasma', 'galaxy', 'neon', 'matrix', 'vortex', 'shadow', 'fusion', 'cosmic', 'orbit', 'cyber',
        'kernel', 'beacon', 'vector', 'vertex', 'phantom', 'omega', 'aurora', 'nexus', 'pulse', 'sonic',
        'stellar', 'horizon', 'zenith', 'apex', 'magnet', 'gravity', 'silicon', 'binary', 'pixel', 'radar',
        'anchor', 'shield', 'helmet', 'armor', 'sword', 'castle', 'temple', 'forest', 'valley', 'canyon',
        'glacier', 'island', 'volcano', 'desert', 'oasis', 'safari', 'jungle', 'ocean', 'river', 'stream',
        'breeze', 'cyclone', 'typhoon', 'tornado', 'monsoon', 'harvest', 'winter', 'autumn', 'summer', 'spring',
        'marble', 'granite', 'crystal', 'diamond', 'emerald', 'sapphire', 'ruby', 'quartz', 'amber', 'silver',
        'copper', 'bronze', 'platinum', 'carbon', 'oxygen', 'helium', 'nitrogen', 'hydrogen', 'sodium', 'cobalt',
        'safeguard', 'fortress', 'barrier', 'sentinel', 'patrol', 'outpost', 'citadel', 'bastion', 'rampart', 'garrison',
        'cipher', 'enigma', 'cryptic', 'decode', 'encode', 'verify', 'validate', 'certify', 'authenticate', 'protocol',
        'gateway', 'firewall', 'sandbox', 'network', 'routing', 'domain', 'address', 'console', 'terminal', 'compiler',
        'database', 'query', 'indexing', 'cluster', 'node', 'client', 'server', 'request', 'response', 'payload',
        'header', 'footer', 'cookie', 'session', 'storage', 'caching', 'latency', 'bandwidth', 'packet', 'socket'
      ];
      const wordsCount = Math.max(4, Math.round(bits / 32));
      const randomArray = new Uint32Array(wordsCount);
      window.crypto.getRandomValues(randomArray);
      const chosenWords = [];
      for (let i = 0; i < wordsCount; i++) {
        chosenWords.push(wordList[randomArray[i] % wordList.length]);
      }
      result = chosenWords.join('-');
    }

    return (pref ? pref : '') + result + (suff ? suff : '');
  }, []);

  const generateSecrets = useCallback(() => {
    const secrets = [];
    for (let i = 0; i < batchCount; i++) {
      secrets.push(generateSingleSecret(bitLength, format, prefix, suffix));
    }
    
    setSecret(secrets[0]);
    setBatchSecrets(secrets);
    setCopied(false);

    if (!history.includes(secrets[0])) {
      setHistory(prev => [secrets[0], ...prev.slice(0, 9)]);
    }
  }, [batchCount, bitLength, format, prefix, suffix, generateSingleSecret, history]);

  useEffect(() => {
    generateSecrets();
  }, [bitLength, format, batchCount]);

  const handleCopySingle = (text, idx = -1) => {
    navigator.clipboard.writeText(text);
    if (idx !== -1) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(-1), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success('JWT Secret copied to clipboard!');
  };

  const getStrengthMetrics = () => {
    let entropy = bitLength;
    if (format === 'passphrase') {
      const wordsCount = Math.max(4, Math.round(bitLength / 32));
      entropy = wordsCount * 7.17; 
    }
    
    let label = 'Weak';
    let color = 'bg-red-500 text-red-500';
    if (entropy >= 256) {
      label = 'Unbreakable (Ultra Secure)';
      color = 'bg-emerald-500 text-emerald-500';
    } else if (entropy >= 128) {
      label = 'Strong';
      color = 'bg-green-500 text-green-500';
    } else {
      label = 'Weak';
      color = 'bg-amber-500 text-amber-500';
    }

    return { entropy: Math.round(entropy), label, color };
  };

  const strength = getStrengthMetrics();

  const downloadEnv = () => {
    const lines = batchSecrets.map((k, i) => `JWT_SECRET_${i + 1}=${k}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.jwt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .env.jwt file');
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
          <Key size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">JWT Secret Key Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate high-entropy, cryptographically secure secrets to sign JSON Web Tokens (JWTs) and secure user authentication.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Main Secret Display Box */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Generated JWT Secret
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
                Security Rating: <span className={`font-bold ${strength.color.split(' ')[1]}`}>{strength.label}</span>
              </span>
              <span className="font-mono text-muted-foreground font-bold">~{strength.entropy} bits entropy</span>
            </div>
            
            {/* Visual strength bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`}
                style={{ width: `${Math.min(100, (strength.entropy / 512) * 100)}%` }}
              />
            </div>
          </div>

          {/* Educational Security Recommendation */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Info size={16} />
              <span>Security Guidelines for JWT Signing</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <strong>Algorithm Requirements:</strong> The HMAC-SHA algorithms require minimum secret key lengths for cryptographic safety:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
                <li>HS256: Requires a minimum of 256 bits (32 bytes) secret.</li>
                <li>HS384: Requires a minimum of 384 bits (48 bytes) secret.</li>
                <li>HS512: Requires a minimum of 512 bits (64 bytes) secret.</li>
              </ul>
              <p className="mt-2 text-red-400 font-semibold">
                ⚠️ Weak secrets make your JWTs vulnerable to brute-force attacks by hackers using tools like Hashcat. Always generate at least 512 bits.
              </p>
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
                <Settings2 size={16} /> Generator Settings
              </h3>
            </div>

            {/* Bit length selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Bit Length (Secret Strength)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 256, label: '256-bit', desc: 'HS256 Min' },
                  { id: 384, label: '384-bit', desc: 'HS384 Min' },
                  { id: 512, label: '512-bit', desc: 'HS512 Recommended' },
                  { id: 1024, label: '1024-bit', desc: 'Ultra Strong' },
                  { id: 2048, label: '2048-bit', desc: 'Max Paranoid' }
                ].map(bits => (
                  <button
                    key={bits.id}
                    onClick={() => setBitLength(bits.id)}
                    className={`py-2 text-xs font-bold rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      bitLength === bits.id
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-border/80 text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{bits.label}</span>
                    <span className="text-[9px] opacity-75 font-normal">{bits.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Key format selector */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Format Encoding</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'base64url', label: 'Base64URL (JWT standard)' },
                  { id: 'base64', label: 'Base64 Standard' },
                  { id: 'hex', label: 'Hexadecimal' },
                  { id: 'plain', label: 'Plain Text (Secure Alphanumeric)' },
                  { id: 'passphrase', label: 'Memorable Passphrase' }
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center leading-tight ${
                      format === fmt.id
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-border/80 text-foreground hover:bg-muted'
                    } ${fmt.id === 'base64url' ? 'col-span-2' : ''}`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prefix / Suffix */}
            {format !== 'passphrase' && (
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
                  <option value={1} className="bg-background text-foreground">Generate Single Secret (1)</option>
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
                onClick={generateSecrets}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-sm"
              >
                <RefreshCw size={16} /> Generate New Secret
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
    </motion.div>
  );
};

export default JwtSecretGenerator;
