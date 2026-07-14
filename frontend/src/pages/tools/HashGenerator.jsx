import { useState, useEffect, useRef } from 'react';
import {
  Copy, Hash, Check, Key, Upload, File, AlertCircle, CheckCircle,
  ChevronDown, RefreshCw, X, Settings2, ShieldCheck, Lock, Unlock, Zap, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

const HASH_ALGOS = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'sha512', label: 'SHA-512' },
  { key: 'sha3', label: 'SHA-3' },
  { key: 'ripemd160', label: 'RIPEMD-160' },
];

const HashGenerator = () => {
  const [hashMode, setHashMode] = useState('standard'); // 'standard' | 'bcrypt'

  // Standard Hash States
  const [inputMode, setInputMode] = useState('text');
  const [text, setText] = useState('');

  // File state
  const [file, setFile] = useState(null);
  const [fileDataWords, setFileDataWords] = useState(null);
  const [fileProgress, setFileProgress] = useState(null);
  const fileInputRef = useRef(null);

  const [secretKey, setSecretKey] = useState('');
  const [useHmac, setUseHmac] = useState(false);

  // Salt
  const [useSalt, setUseSalt] = useState(false);
  const [saltPrefix, setSaltPrefix] = useState('');
  const [saltSuffix, setSaltSuffix] = useState('');

  // Output
  const [outputRepr, setOutputRepr] = useState('hex');
  const [compareHash, setCompareHash] = useState('');

  const [hashes, setHashes] = useState({
    md5: '', sha1: '', sha256: '', sha512: '', sha3: '', ripemd160: ''
  });

  const [copied, setCopied] = useState(null);

  // Bcrypt States
  const [bcryptPlain, setBcryptPlain] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [bcryptHash, setBcryptHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [genTime, setGenTime] = useState(0);

  const [bcryptComparePlain, setBcryptComparePlain] = useState('');
  const [bcryptCompareHash, setBcryptCompareHash] = useState('');
  const [bcryptCompareResult, setBcryptCompareResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const [bcryptCopied, setBcryptCopied] = useState(false);
  const [bcryptMode, setBcryptMode] = useState('generate'); // 'generate' | 'compare'

  const generateBcryptHash = async () => {
    if (!bcryptPlain) return;
    setIsHashing(true);
    
    setTimeout(() => {
      try {
        const t0 = performance.now();
        const salt = bcrypt.genSaltSync(saltRounds);
        const result = bcrypt.hashSync(bcryptPlain, salt);
        const t1 = performance.now();
        
        setBcryptHash(result);
        setGenTime(Math.round(t1 - t0));
        toast.success('Bcrypt hash generated!');
      } catch (error) {
        toast.error('Error generating hash');
      } finally {
        setIsHashing(false);
      }
    }, 60);
  };

  const handleBcryptCompare = () => {
    if (!bcryptComparePlain || !bcryptCompareHash) return;
    setIsComparing(true);

    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(bcryptComparePlain, bcryptCompareHash.trim());
        setBcryptCompareResult(match);
        if (match) {
          toast.success('Password matches the hash!');
        } else {
          toast.error('Password does not match.');
        }
      } catch (err) {
        setBcryptCompareResult(false);
        toast.error('Invalid hash format. Make sure it starts with $2a$ or $2b$');
      } finally {
        setIsComparing(false);
      }
    }, 60);
  };

  const handleBcryptCopy = () => {
    if (!bcryptHash) return;
    navigator.clipboard.writeText(bcryptHash);
    setBcryptCopied(true);
    toast.success('Hash copied to clipboard!');
    setTimeout(() => setBcryptCopied(false), 2000);
  };

  const getPasswordStrength = () => {
    if (!bcryptPlain) return { score: 0, label: 'None', color: 'bg-muted' };
    let score = 0;
    if (bcryptPlain.length >= 8) score++;
    if (bcryptPlain.length >= 12) score++;
    if (/[A-Z]/.test(bcryptPlain)) score++;
    if (/[0-9]/.test(bcryptPlain)) score++;
    if (/[^A-Za-z0-9]/.test(bcryptPlain)) score++;

    let label = 'Weak';
    let color = 'bg-red-500 text-red-500';
    if (score >= 4) {
      label = 'Strong';
      color = 'bg-emerald-500 text-emerald-500';
    } else if (score >= 2) {
      label = 'Medium';
      color = 'bg-amber-500 text-amber-500';
    }

    return { score, label, color };
  };

  const pwdStrength = getPasswordStrength();

  // Convert ArrayBuffer to CryptoJS WordArray
  const arrayBufferToWordArray = (ab) => {
    const i8a = new Uint8Array(ab);
    const a = [];
    for (let i = 0; i < i8a.length; i += 4) {
      a.push(
        (i8a[i] << 24) |
        ((i8a[i + 1] || 0) << 16) |
        ((i8a[i + 2] || 0) << 8) |
        (i8a[i + 3] || 0)
      );
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileDataWords(null);
    setFileProgress('Reading...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const words = arrayBufferToWordArray(arrayBuffer);
        setFileDataWords(words);
        setFileProgress(null);
        toast.success('File parsed successfully');
      } catch (err) {
        toast.error('Error reading file');
        setFileProgress(null);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearFile = () => {
    setFile(null);
    setFileDataWords(null);
    setFileProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate hashes
  useEffect(() => {
    let sourceWords = null;

    if (inputMode === 'text') {
      if (!text) {
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '', sha3: '', ripemd160: '' });
        return;
      }
      const saltedText = `${useSalt ? saltPrefix : ''}${text}${useSalt ? saltSuffix : ''}`;
      sourceWords = saltedText;
    } else {
      if (!fileDataWords) {
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '', sha3: '', ripemd160: '' });
        return;
      }
      sourceWords = fileDataWords;
    }

    try {
      const getHash = (algoName) => {
        let resWords;
        if (useHmac && secretKey) {
          if (algoName === 'md5') resWords = CryptoJS.HmacMD5(sourceWords, secretKey);
          else if (algoName === 'sha1') resWords = CryptoJS.HmacSHA1(sourceWords, secretKey);
          else if (algoName === 'sha256') resWords = CryptoJS.HmacSHA256(sourceWords, secretKey);
          else if (algoName === 'sha512') resWords = CryptoJS.HmacSHA512(sourceWords, secretKey);
          else if (algoName === 'sha3') resWords = CryptoJS.HmacSHA3(sourceWords, secretKey);
          else if (algoName === 'ripemd160') resWords = CryptoJS.HmacRIPEMD160(sourceWords, secretKey);
        } else {
          if (algoName === 'md5') resWords = CryptoJS.MD5(sourceWords);
          else if (algoName === 'sha1') resWords = CryptoJS.SHA1(sourceWords);
          else if (algoName === 'sha256') resWords = CryptoJS.SHA256(sourceWords);
          else if (algoName === 'sha512') resWords = CryptoJS.SHA512(sourceWords);
          else if (algoName === 'sha3') resWords = CryptoJS.SHA3(sourceWords);
          else if (algoName === 'ripemd160') resWords = CryptoJS.RIPEMD160(sourceWords);
        }

        if (outputRepr === 'base64') {
          return resWords.toString(CryptoJS.enc.Base64);
        }
        return resWords.toString();
      };

      setHashes({
        md5: getHash('md5'),
        sha1: getHash('sha1'),
        sha256: getHash('sha256'),
        sha512: getHash('sha512'),
        sha3: getHash('sha3'),
        ripemd160: getHash('ripemd160')
      });
    } catch (e) {
      toast.error('Error generating hash');
    }
  }, [text, fileDataWords, secretKey, useHmac, useSalt, saltPrefix, saltSuffix, outputRepr, inputMode]);

  const handleCopy = (hashValue, type) => {
    if (!hashValue) return;
    navigator.clipboard.writeText(hashValue);
    setCopied(type);
    toast.success(`${type.toUpperCase()} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  // Checksum comparison
  const getMatchInfo = () => {
    if (!compareHash) return null;
    const cleanCompare = compareHash.trim().toLowerCase();
    for (const [algo, value] of Object.entries(hashes)) {
      if (value && value.toLowerCase() === cleanCompare) {
        return { matched: true, algo: algo.toUpperCase() };
      }
    }
    return { matched: false };
  };

  const matchResult = getMatchInfo();

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Hash size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Hash Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD-160 and secure Bcrypt hashes client-side.</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 self-start gap-1 shrink-0 mb-6 max-w-sm">
        <button
          onClick={() => setHashMode('standard')}
          className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            hashMode === 'standard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Checksums & Signatures
        </button>
        <button
          onClick={() => setHashMode('bcrypt')}
          className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            hashMode === 'bcrypt' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Bcrypt Generator & Verifier
        </button>
      </div>

      {hashMode === 'standard' ? (
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start animate-in fade-in duration-200">
          {/* Left Card — Input */}
          <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-310px)] lg:max-h-[620px] lg:min-h-[520px]">
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Segmented Control */}
              <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 self-start gap-1 shrink-0">
                <button
                  onClick={() => { setInputMode('text'); clearFile(); }}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors ${
                    inputMode === 'text' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hash Text
                </button>
                <button
                  onClick={() => { setInputMode('file'); setText(''); }}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors ${
                    inputMode === 'file' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hash File
                </button>
              </div>

              {/* Input Area */}
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  {inputMode === 'text' ? (
                    <motion.div
                      key="text-input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <textarea
                        className="w-full h-full bg-muted/20 border border-border/50 p-4 rounded-xl resize-none text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all custom-scrollbar"
                        placeholder="Enter text to hash..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full flex flex-col items-center justify-center"
                    >
                      {!file ? (
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="w-full h-full border-2 border-dashed border-border rounded-2xl bg-card/50 hover:bg-muted hover:border-primary/50 flex flex-col items-center justify-center transition-all cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="w-16 h-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
                            <Upload className="w-7 h-7" />
                          </div>
                          <p className="text-xl font-semibold text-foreground mb-1">Verify File Checksum</p>
                          <p className="text-sm text-muted-foreground text-center max-w-[340px]">
                            Drag & drop a file here, or click to browse. Supports any file type and size.
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-6 border border-border/50 rounded-2xl bg-muted/15 flex flex-col items-center justify-center space-y-4 w-full max-w-sm shadow-sm relative"
                        >
                          <button
                            onClick={clearFile}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={15} />
                          </button>
                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                            <File className="w-12 h-12" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-sm font-bold text-foreground truncate max-w-[240px]">{file.name}</h4>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          {fileProgress && (
                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                              <RefreshCw size={13} className="animate-spin" /> {fileProgress}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-6">
            {/* Card 1: Hash Settings */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Settings2 size={16} /> Hash Settings
              </h3>

              {/* Representation & Mode */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Representation</label>
                <div className="relative group">
                  <select
                    value={outputRepr}
                    onChange={(e) => setOutputRepr(e.target.value)}
                    className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                  >
                    <option value="hex" className="bg-background text-foreground">Hexadecimal (0-9a-f)</option>
                    <option value="base64" className="bg-background text-foreground">Base64 Format</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Hashing Mode</label>
                <div className="relative group">
                  <select
                    value={useHmac ? 'hmac' : 'standard'}
                    onChange={(e) => setUseHmac(e.target.value === 'hmac')}
                    disabled={inputMode === 'file'}
                    className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="standard" className="bg-background text-foreground">Standard Checksum</option>
                    <option value="hmac" className="bg-background text-foreground">HMAC Signature</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* HMAC Secret Key */}
              <AnimatePresence>
                {useHmac && inputMode === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <label className="text-sm font-semibold text-foreground">Secret Key</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Enter HMAC secret key..."
                          className="w-full bg-muted/20 border border-border/50 p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                        <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Salt Toggle */}
              <AnimatePresence>
                {inputMode === 'text' && !useHmac && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">Salt Prefix / Suffix</label>
                        <button
                          onClick={() => setUseSalt(!useSalt)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-all ${
                            useSalt ? 'bg-primary' : 'bg-muted border border-border/60'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-background rounded-full transition-all shadow-sm ${
                            useSalt ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {useSalt && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="grid grid-cols-2 gap-3"
                          >
                            <input
                              type="text"
                              placeholder="Salt Prefix..."
                              value={saltPrefix}
                              onChange={(e) => setSaltPrefix(e.target.value)}
                              className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                            />
                            <input
                              type="text"
                              placeholder="Salt Suffix..."
                              value={saltSuffix}
                              onChange={(e) => setSaltSuffix(e.target.value)}
                              className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checksum Comparator */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Expected Checksum</label>
                  {matchResult && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 leading-none ${
                      matchResult.matched ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {matchResult.matched ? (
                        <><CheckCircle size={10} /> Verified {matchResult.algo}</>
                      ) : (
                        <><AlertCircle size={10} /> No Match</>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste expected checksum to compare..."
                  value={compareHash}
                  onChange={(e) => setCompareHash(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Card 2: Generated Hashes */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Hash size={16} /> Generated Hashes
              </h3>

              <div className="space-y-4">
                {HASH_ALGOS.map(({ key, label }) => {
                  const value = hashes[key];
                  const isCompareMatch = compareHash && value && value.toLowerCase() === compareHash.trim().toLowerCase();

                  return (
                    <div key={key} className="group">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {useHmac ? `HMAC-${label}` : label}
                        </span>
                        {isCompareMatch && (
                          <span className="text-[9px] font-black text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <CheckCircle size={9} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className={`p-3 pr-12 rounded-xl font-mono text-xs break-all border transition-colors flex items-center min-h-[44px] ${
                          isCompareMatch
                            ? 'bg-green-500/5 border-green-500/30 text-foreground'
                            : 'bg-muted/20 border-border/50 text-foreground'
                        }`}>
                          {value || <span className="text-muted-foreground/40 italic text-xs">Awaiting input...</span>}
                        </div>
                        <button
                          onClick={() => handleCopy(value, key)}
                          disabled={!value}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                            copied === key
                              ? 'bg-green-500/20 text-green-600 opacity-100'
                              : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-muted text-muted-foreground'
                          }`}
                          title="Copy hash"
                        >
                          {copied === key ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start animate-in fade-in duration-200">
          {/* Left Workspace */}
          <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[440px]">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner mb-6 shrink-0 max-w-xs">
              {[
                { id: 'generate', label: 'Generate Hash', icon: Lock },
                { id: 'compare', label: 'Compare Hash', icon: Unlock }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBcryptMode(t.id)}
                  className={`flex-1 relative py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    bcryptMode === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {bcryptMode === t.id && (
                    <motion.div
                      layoutId="bcrypt-mode-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Core Panel Content */}
            <div className="flex-grow flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {bcryptMode === 'generate' ? (
                  <motion.div
                    key="gen-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Plain Text Password</label>
                        <input 
                          type="text"
                          value={bcryptPlain}
                          onChange={(e) => setBcryptPlain(e.target.value)}
                          placeholder="Type password to hash..."
                          className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all shadow-inner text-foreground"
                        />
                      </div>

                      {bcryptPlain && (
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-semibold">
                              Strength: <span className="font-bold">{pwdStrength.label}</span>
                            </span>
                            <span className="text-muted-foreground font-bold">{pwdStrength.score}/5 Criteria</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all ${pwdStrength.color.split(' ')[0]}`} style={{ width: `${(pwdStrength.score/5)*100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {bcryptHash && (
                      <div className="pt-5 border-t border-border/80 mt-5 animate-in fade-in">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Bcrypt Hash</label>
                          {genTime > 0 && (
                            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                              <Zap size={11} className="text-amber-500" /> Hashing took {genTime}ms
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="w-full bg-background/40 border border-border/80 rounded-xl p-4 pr-12 break-all font-mono text-sm text-foreground shadow-inner leading-relaxed">
                            {bcryptHash}
                          </div>
                          <button 
                            onClick={handleBcryptCopy}
                            className="absolute top-1/2 -translate-y-1/2 right-3 p-2 bg-background border border-border/80 hover:border-primary hover:text-primary rounded-lg text-muted-foreground transition-all shadow-sm cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {bcryptCopied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="comp-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Plain Text Password</label>
                        <input 
                          type="text"
                          value={bcryptComparePlain}
                          onChange={(e) => {
                            setBcryptComparePlain(e.target.value);
                            setBcryptCompareResult(null);
                          }}
                          placeholder="e.g. mysecretpassword"
                          className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-inner font-mono text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Bcrypt Hash</label>
                        <input 
                          type="text"
                          value={bcryptCompareHash}
                          onChange={(e) => {
                            setBcryptCompareHash(e.target.value);
                            setBcryptCompareResult(null);
                          }}
                          placeholder="e.g. $2a$10$..."
                          className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-inner text-foreground"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {bcryptCompareResult !== null && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className={`p-4.5 rounded-xl border flex items-center justify-center gap-2 mt-4 font-bold text-sm ${
                            bcryptCompareResult 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {bcryptCompareResult ? (
                            <>
                              <Check size={18} /> Match! The plain text password matches the hash.
                            </>
                          ) : (
                            <>
                              <Unlock size={18} /> Does not match. The password and hash do not match.
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Settings Sidebar */}
          <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Settings2 size={16} /> Configurations
                </h3>
              </div>

              {/* Salt rounds slider */}
              {bcryptMode === 'generate' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-sm font-semibold text-foreground">Salt Rounds</label>
                    <span className="font-bold font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{saltRounds}</span>
                  </div>
                  <input 
                    type="range" 
                    min="4" 
                    max="14" 
                    step="1"
                    value={saltRounds}
                    onChange={(e) => setSaltRounds(Number(e.target.value))}
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                    style={{
                      background: `linear-gradient(to right, var(--primary) ${Math.round(((saltRounds-4)/(14-4))*100)}%, var(--muted) ${Math.round(((saltRounds-4)/(14-4))*100)}%)`
                    }}
                  />
                  
                  {saltRounds > 12 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>Warning: Salt rounds &gt; 12 take significantly longer to generate (up to several seconds on typical machines).</span>
                    </div>
                  )}
                </div>
              )}

              {/* Execute Buttons */}
              <div className="pt-2">
                {bcryptMode === 'generate' ? (
                  <button
                    onClick={generateBcryptHash}
                    disabled={!bcryptPlain || isHashing}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm"
                  >
                    {isHashing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
                    Generate Bcrypt Hash
                  </button>
                ) : (
                  <button
                    onClick={handleBcryptCompare}
                    disabled={!bcryptComparePlain || !bcryptCompareHash || isComparing}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm"
                  >
                    {isComparing ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    Verify Match
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default HashGenerator;
