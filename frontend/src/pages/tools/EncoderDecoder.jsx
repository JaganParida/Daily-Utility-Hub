import { useState, useMemo } from 'react';
import { 
  Key, Copy, Check, RefreshCw, Trash2, Lock, 
  Unlock, Eye, EyeOff, Settings2, ShieldCheck, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const EncoderDecoder = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [algo, setAlgo] = useState('AES'); // 'AES' | 'DES' | 'Rabbit' | 'RC4'
  const [mode, setMode] = useState('encrypt'); // 'encrypt' | 'decrypt'
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Benchmarking
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    if (!secretKey) {
      setError('Secret Key is required for encryption/decryption.');
      return;
    }

    try {
      const t0 = performance.now();
      let result = '';

      if (mode === 'encrypt') {
        if (algo === 'AES') {
          result = CryptoJS.AES.encrypt(input, secretKey).toString();
        } else if (algo === 'DES') {
          result = CryptoJS.TripleDES.encrypt(input, secretKey).toString();
        } else if (algo === 'Rabbit') {
          result = CryptoJS.Rabbit.encrypt(input, secretKey).toString();
        } else if (algo === 'RC4') {
          result = CryptoJS.RC4.encrypt(input, secretKey).toString();
        }
        setOutput(result);
        setError(null);
        toast.success(`${algo} Encryption successful!`);
      } else {
        // Decrypt
        let bytes;
        if (algo === 'AES') {
          bytes = CryptoJS.AES.decrypt(input.trim(), secretKey);
        } else if (algo === 'DES') {
          bytes = CryptoJS.TripleDES.decrypt(input.trim(), secretKey);
        } else if (algo === 'Rabbit') {
          bytes = CryptoJS.Rabbit.decrypt(input.trim(), secretKey);
        } else if (algo === 'RC4') {
          bytes = CryptoJS.RC4.decrypt(input.trim(), secretKey);
        }

        const decoded = bytes.toString(CryptoJS.enc.Utf8);
        if (!decoded) {
          throw new Error('Decryption failed. Please check the secret key and algorithm.');
        }
        setOutput(decoded);
        setError(null);
        toast.success(`${algo} Decryption successful!`);
      }

      const t1 = performance.now();
      setElapsedTime(Math.round(t1 - t0));
    } catch (err) {
      setOutput('');
      setError(err.message || 'Invalid ciphertext or incorrect key');
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
    setElapsedTime(0);
  };

  // Secret key strength assessment
  const keyStrength = useMemo(() => {
    if (!secretKey) return { label: 'Empty', color: 'text-muted-foreground bg-muted' };
    if (secretKey.length < 6) return { label: 'Weak', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    if (secretKey.length < 12) return { label: 'Medium', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Strong', color: 'text-primary bg-primary/10 border-primary/20' };
  }, [secretKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-3.5">
        <div className="p-2 bg-primary/10 text-primary rounded-xl shadow-sm">
          <Lock size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Symmetric Encryption Encoder / Decoder</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Encrypt plain text or decrypt ciphertext with various standards like AES, Triple DES, Rabbit, or RC4.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col relative min-h-[480px]">
          
          {/* Mode Tabs */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4 shrink-0">
            <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner">
              {['encrypt', 'decrypt'].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    const tempOutput = output;
                    if (tempOutput && !error) {
                      setInput(tempOutput);
                      setOutput('');
                    }
                  }}
                  className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold capitalize transition-all cursor-pointer relative ${
                    mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="enc-dec-mode-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {m === 'encrypt' ? 'Encrypt Text' : 'Decrypt Cipher'}
                </button>
              ))}
            </div>

            <button
              onClick={clear}
              className="text-xs px-3.5 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Textareas Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[280px]">
            {/* Input Side */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30">
              <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {mode === 'encrypt' ? 'Plain Text Input' : 'Ciphertext Input'}
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-sm text-foreground resize-none custom-scrollbar min-h-[200px] leading-relaxed"
                placeholder={mode === 'encrypt' ? 'Enter string to encrypt...' : 'Enter base64 ciphertext to decrypt...'}
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

              <div className="flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm relative min-h-[200px] leading-relaxed">
                {error ? (
                  <pre className="text-red-500 font-semibold whitespace-pre-wrap">{error}</pre>
                ) : (
                  <pre className="whitespace-pre-wrap break-all text-primary">
                    {output || 'Output result will appear here...'}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Stats details bar */}
          {elapsedTime > 0 && (
            <div className="mt-4 p-3 bg-muted/20 border border-border/50 rounded-xl flex justify-between items-center text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" /> Execution Speed: {elapsedTime}ms
              </span>
              <span>Input size: {input.length} chars | Output size: {output.length} chars</span>
            </div>
          )}
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> settings
              </h3>
            </div>

            {/* Secret key config */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Key size={13} /> Secret Key
                </label>
                {secretKey && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-md shadow-sm transition-all ${keyStrength.color}`}>
                    {keyStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter secret passphrase..."
                  className="w-full p-4 pr-10 bg-background border border-border/80 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all shadow-inner text-foreground"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Algorithm picker */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Symmetric Algorithm</label>
              <div className="grid grid-cols-2 gap-2">
                {['AES', 'DES', 'Rabbit', 'RC4'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAlgo(a)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      algo === a
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-border/80 text-foreground hover:bg-muted'
                    }`}
                  >
                    {a === 'DES' ? 'Triple DES' : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                onClick={handleConvert}
                disabled={!input.trim() || !secretKey}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm"
              >
                {mode === 'encrypt' ? (
                  <>
                    <Lock size={18} /> Encrypt Code
                  </>
                ) : (
                  <>
                    <Unlock size={18} /> Decrypt Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EncoderDecoder;
