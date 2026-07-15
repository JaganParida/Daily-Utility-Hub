import { useState, useEffect } from 'react';
import {
  Key, Copy, Check, RefreshCw, ShieldCheck, Download,
  ChevronDown, AlertTriangle, History, Settings2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const STANDARD_WORDS = [
  "apple", "river", "mountain", "eagle", "forest", "ocean", "desert", "storm", "winter", "summer",
  "tiger", "lion", "dragon", "knight", "castle", "sword", "shield", "magic", "moon", "star",
  "galaxy", "planet", "comet", "nebula", "quantum", "cyber", "neural", "pixel", "vector", "matrix",
  "cloud", "data", "logic", "syntax", "code", "byte", "script", "hacker", "ninja", "pirate",
  "robot", "cyborg", "mutant", "alien", "ghost", "phantom", "shadow", "specter", "spirit", "soul"
];

const EFF_LONG_WORDS = [
  "acorn", "avalanche", "dinosaur", "envelope", "flamingo", "goggles", "guitar", "helmet", "infinite", "jacket",
  "keyboard", "lantern", "magnet", "notebook", "octopus", "parachute", "pyramid", "rainbow", "scooter", "telescope",
  "umbrella", "volcano", "windmill", "xylophone", "yosemite", "zeppelin", "adventure", "blizzard", "champion", "dolphin",
  "emerald", "feather", "glacier", "harvest", "island", "journey", "kingdom", "lullaby", "meadow", "nomad",
  "oasis", "pilgrim", "quest", "ravine", "safari", "tempest", "universe", "victory", "whisper", "zenith",
  "amigo", "banana", "breeze", "candle", "canyon", "cradle", "dawn", "echo", "fable", "gecko",
  "haven", "indigo", "jungle", "lagoon", "maple", "nectar", "orbit", "pebble", "quartz", "rhythm",
  "summit", "timber", "velvet", "whiskey", "safari", "valley", "wilderness", "monsoon", "crater", "cavalry"
];

const CODER_JARGON = [
  "algorithm", "boolean", "compiler", "database", "encryption", "function", "garbage", "hashmap", "interface", "json",
  "kernel", "lambda", "metadata", "network", "overflow", "protocol", "queue", "recursion", "stack", "terminal",
  "unsigned", "variable", "webassembly", "xml", "yield", "zero", "asynchronous", "callback", "debugger", "ethernet",
  "framework", "git", "hexadecimal", "index", "javascript", "linux", "microservice", "node", "object", "pipeline",
  "query", "repository", "serialized", "thread", "undefined", "virtual", "websocket", "yaml", "zip", "latency"
];

const PasswordGenerator = () => {
  const [passwordList, setPasswordList] = useState([]);
  const [batchCount, setBatchCount] = useState(1);
  const [mode, setMode] = useState('random');
  const [length, setLength] = useState(16);
  const [preset, setPreset] = useState('none');
  const [wordlistType, setWordlistType] = useState('standard');

  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [customSymbols, setCustomSymbols] = useState('!@#$%^&*()_+~`|}{[]:;?><,./-=');

  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [addNumber, setAddNumber] = useState(false);

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedHistoryIdx, setCopiedHistoryIdx] = useState(null);

  const applyRecipe = (recipeName) => {
    setPreset(recipeName);
    if (recipeName === 'database') {
      setMode('random'); setLength(16); setIncludeUppercase(true);
      setIncludeNumbers(true); setIncludeSymbols(false); setExcludeSimilar(true);
    } else if (recipeName === 'ad') {
      setMode('random'); setLength(14); setIncludeUppercase(true);
      setIncludeNumbers(true); setIncludeSymbols(true); setExcludeSimilar(false);
    } else if (recipeName === 'wordpress') {
      setMode('random'); setLength(24); setIncludeUppercase(true);
      setIncludeNumbers(true); setIncludeSymbols(true); setExcludeSimilar(false);
    } else if (recipeName === 'easy') {
      setMode('random'); setLength(12); setIncludeUppercase(true);
      setIncludeNumbers(true); setIncludeSymbols(false); setExcludeSimilar(true);
    }
  };

  const getActiveWordlist = () => {
    if (wordlistType === 'eff') return EFF_LONG_WORDS;
    if (wordlistType === 'coder') return CODER_JARGON;
    return STANDARD_WORDS;
  };

  const generateSinglePassword = () => {
    if (mode === 'pin') {
      let res = '';
      for (let i = 0; i < length; i++) res += Math.floor(Math.random() * 10).toString();
      return res;
    }

    if (mode === 'passphrase') {
      const activeList = getActiveWordlist();
      let phraseWords = [];
      for (let i = 0; i < wordCount; i++) {
        let word = activeList[Math.floor(Math.random() * activeList.length)];
        if (capitalizeWords) word = word.charAt(0).toUpperCase() + word.slice(1);
        phraseWords.push(word);
      }
      let res = phraseWords.join(separator);
      if (addNumber) res += separator + Math.floor(Math.random() * 100);
      return res;
    }

    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nums = '0123456789';
    let syms = customSymbols;

    if (excludeSimilar) {
      lower = lower.replace(/[il]/g, '');
      upper = upper.replace(/[IO]/g, '');
      nums = nums.replace(/[01]/g, '');
    }

    let charset = lower;
    if (includeUppercase) charset += upper;
    if (includeNumbers) charset += nums;
    if (includeSymbols) charset += syms;

    if (!charset) return '';
    let res = '';
    for (let i = 0; i < length; ++i) res += charset.charAt(Math.floor(Math.random() * charset.length));
    return res;
  };

  const handleGenerate = () => {
    const list = Array.from({ length: batchCount }, generateSinglePassword);
    setPasswordList(list);
    setCopiedIndex(null);
    setCopiedAll(false);

    const primaryPwd = list[0];
    if (primaryPwd) {
      setHistory(prev => {
        if (prev[0] === primaryPwd) return prev;
        return [primaryPwd, ...prev].slice(0, 15);
      });
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [
    mode, length, includeUppercase, includeNumbers, includeSymbols,
    excludeSimilar, wordCount, separator, capitalizeWords, addNumber,
    customSymbols, batchCount, wordlistType
  ]);

  const getEntropyStats = (pwd) => {
    if (!pwd) return { entropy: 0, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500', crackTime: 'Instant', warnings: [] };

    let poolSize = 0;
    if (mode === 'pin') {
      poolSize = 10;
    } else if (mode === 'passphrase') {
      poolSize = getActiveWordlist().length;
    } else {
      let lower = 26;
      let upper = includeUppercase ? 26 : 0;
      let nums = includeNumbers ? 10 : 0;
      let syms = includeSymbols ? customSymbols.length : 0;
      if (excludeSimilar) { lower -= 2; upper -= 2; nums -= 2; }
      poolSize = lower + upper + nums + syms;
    }

    const len = mode === 'passphrase' ? wordCount : pwd.length;
    const entropy = Math.round(len * Math.log2(poolSize || 1));

    const guessesToFind = Math.pow(2, entropy - 1);
    const seconds = guessesToFind / 1e11;

    let crackTime = '';
    if (seconds < 1) crackTime = 'Instant (< 1 second)';
    else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
    else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
    else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
    else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`;
    else if (seconds < 3153600000) crackTime = `${Math.round(seconds / 31536000)} years`;
    else crackTime = 'Centuries / Infinite';

    let label = 'Weak';
    let color = 'text-red-500';
    let barColor = 'bg-red-500';
    if (entropy >= 85) { label = 'Cryptographically Secure'; color = 'text-green-500'; barColor = 'bg-green-500'; }
    else if (entropy >= 60) { label = 'Strong'; color = 'text-emerald-500'; barColor = 'bg-emerald-500'; }
    else if (entropy >= 40) { label = 'Moderate'; color = 'text-yellow-500'; barColor = 'bg-yellow-500'; }

    const warnings = [];
    if (pwd.length < 10 && mode !== 'pin') warnings.push("Short length (under 10 characters) is vulnerable to dictionary attacks.");
    if (/(123|abc|qwerty|asd)/i.test(pwd)) warnings.push("Contains common sequential patterns (e.g. '123' or 'abc').");
    if (/(.)\\1{2,}/.test(pwd)) warnings.push("Contains repeating characters (e.g. 'aaa').");

    return { entropy, label, color, barColor, crackTime, warnings };
  };

  const copyToClipboard = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      toast.success('Copied to clipboard!');
    }
  };

  const copyAllBatch = () => {
    if (!passwordList.length) return;
    navigator.clipboard.writeText(passwordList.join('\n'));
    setCopiedAll(true);
    toast.success('Batch copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const downloadBatch = () => {
    if (!passwordList.length) return;
    const blob = new Blob([passwordList.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passwords-batch-${mode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Passwords file downloaded');
  };

  const copyHistory = (pwd, idx) => {
    navigator.clipboard.writeText(pwd);
    setCopiedHistoryIdx(idx);
    toast.success('Copied history password!');
    setTimeout(() => setCopiedHistoryIdx(null), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success('History cleared');
  };

  const primaryPassword = passwordList[0] || '';
  const stats = getEntropyStats(primaryPassword);

  const sliderFill = (val, min, max) => `linear-gradient(to right, var(--primary) ${((val - min) / (max - min)) * 100}%, color-mix(in srgb, var(--muted) 60%, transparent) ${((val - min) / (max - min)) * 100}%)`;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Key size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Password Generator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Generate customizable passwords, cryptographic PINs, or memorable xkcd-style passphrases.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* Left Card: Password Output & Diagnostics */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm space-y-6">

          {batchCount === 1 ? (
            <>
              {/* Single Password Display */}
              <div className="bg-muted/15 border border-border/40 p-6 rounded-2xl flex flex-col items-center justify-center relative">
                <div className="absolute top-3 left-4 flex items-center gap-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${stats.color}`}>
                    {stats.label}
                  </span>
                </div>
                <button
                  onClick={handleGenerate}
                  className="absolute top-3 right-4 text-muted-foreground hover:text-primary transition-all p-1 active:rotate-45"
                  title="Regenerate"
                >
                  <RefreshCw size={14} />
                </button>

                <div className="w-full flex items-center gap-4 mt-2.5">
                  <input
                    type="text"
                    readOnly
                    value={primaryPassword}
                    className="w-full bg-transparent text-center text-lg sm:text-2xl md:text-3xl font-mono text-foreground focus:outline-none select-all truncate font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(primaryPassword)}
                    className="bg-primary text-primary-foreground p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              {/* Cryptographic Diagnostics */}
              <div className="bg-muted/5 border border-border/40 p-4 rounded-xl space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cryptographic Diagnostics</span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border/30 p-3 rounded-lg text-center shadow-sm">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Entropy strength</span>
                    <p className="text-lg font-black text-foreground mt-0.5">{stats.entropy} <span className="text-xs font-normal">bits</span></p>
                  </div>
                  <div className="bg-card border border-border/30 p-3 rounded-lg text-center shadow-sm">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Estimated crack time</span>
                    <p className="text-xs font-bold text-foreground mt-1.5 truncate leading-none">{stats.crackTime}</p>
                  </div>
                </div>

                {/* Strength Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all ${stats.entropy > 0 ? stats.barColor : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all ${stats.entropy >= 40 ? stats.barColor : 'bg-muted'}`} />
                    <div className={`h-full flex-1 transition-all ${stats.entropy >= 60 ? stats.barColor : 'bg-muted'}`} />
                    <div className={`h-full flex-1 transition-all ${stats.entropy >= 85 ? stats.barColor : 'bg-muted'}`} />
                  </div>
                </div>
              </div>

              {/* Security Warnings */}
              {stats.warnings.length > 0 && (
                <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Security Warning
                  </span>
                  <ul className="list-disc pl-4 text-[10px] space-y-1 leading-relaxed font-semibold">
                    {stats.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Batch Passwords Output */
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Batch Results ({passwordList.length})</span>
                <div className="flex items-center gap-3">
                  <button onClick={copyAllBatch} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    {copiedAll ? <Check size={13} /> : <Copy size={13} />} Copy Batch
                  </button>
                  <button onClick={downloadBatch} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar max-h-[350px] pr-1 space-y-2">
                {passwordList.map((pwd, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border border-border/50 group hover:border-primary/40 transition-colors shadow-sm"
                  >
                    <code className="text-xs sm:text-sm font-mono font-bold text-foreground break-all">{pwd}</code>
                    <button
                      onClick={() => copyToClipboard(pwd, idx)}
                      className={`p-1.5 rounded-md transition-all shrink-0 ${
                        copiedIndex === idx
                          ? 'bg-green-500/20 text-green-600'
                          : 'text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password History */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <History size={11} /> Password History
              </span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-red-500 font-bold hover:underline">
                  Clear History
                </button>
              )}
            </div>

            <div className="overflow-y-auto pr-1 border border-border/50 bg-muted/15 rounded-xl p-3 space-y-2 custom-scrollbar max-h-[200px]">
              {history.length > 0 ? (
                history.map((pwd, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 border border-border/30 bg-card rounded-lg text-xs hover:border-border transition-colors group">
                    <code className="font-mono text-foreground truncate max-w-[85%]">{pwd}</code>
                    <button
                      onClick={() => copyHistory(pwd, idx)}
                      className={`p-1 rounded hover:bg-muted text-muted-foreground transition-all group-hover:opacity-100 ${
                        copiedHistoryIdx === idx ? 'bg-green-500/20 text-green-500 opacity-100' : 'opacity-0'
                      }`}
                    >
                      {copiedHistoryIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic text-center p-4">Session history is empty.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">

            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings2 size={16} /> Generator Settings
            </h3>

            {/* Security Preset */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Security Preset</label>
              <div className="relative group">
                <select
                  value={preset}
                  onChange={(e) => applyRecipe(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="none" className="bg-background text-foreground">Custom Parameters</option>
                  <option value="database" className="bg-background text-foreground">Database Safe (Alphanumeric)</option>
                  <option value="ad" className="bg-background text-foreground">Active Directory standard</option>
                  <option value="wordpress" className="bg-background text-foreground">WordPress standard (Long)</option>
                  <option value="easy" className="bg-background text-foreground">Easy to type (No Lookalikes)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Generation Mode</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/30 rounded-xl">
                {[
                  { id: 'random', label: 'Random' },
                  { id: 'passphrase', label: 'xkcd' },
                  { id: 'pin', label: 'PIN' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.id);
                      setPreset('none');
                      if (item.id === 'pin') setLength(6);
                      else if (item.id === 'random') setLength(16);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === item.id
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Random Mode Controls */}
            {mode === 'random' && (
              <div className="space-y-6">
                {/* Length Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-foreground">Password Length</label>
                    <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{length} chars</span>
                  </div>
                  <div className="relative pt-2 pb-1">
                    <input
                      type="range" min="8" max="64" value={length}
                      onChange={(e) => { setLength(Number(e.target.value)); setPreset('none'); }}
                      className="pwd-slider w-full cursor-pointer outline-none"
                      style={{ WebkitAppearance: 'none', appearance: 'none', height: '10px', borderRadius: '999px', background: sliderFill(length, 8, 64) }}
                    />
                  </div>
                </div>

                {/* Character Sets */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-sm font-semibold text-foreground">Character Sets</label>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { label: 'Include Uppercase (A-Z)', checked: includeUppercase, set: setIncludeUppercase },
                      { label: 'Include Numbers (0-9)', checked: includeNumbers, set: setIncludeNumbers },
                      { label: 'Include Symbols', checked: includeSymbols, set: setIncludeSymbols },
                      { label: 'Exclude Lookalikes (e.g. 1, l, 0, O)', checked: excludeSimilar, set: setExcludeSimilar },
                    ].map(opt => (
                      <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox" checked={opt.checked}
                          onChange={(e) => { opt.set(e.target.checked); setPreset('none'); }}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Symbols */}
                {includeSymbols && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Custom Symbols Set</label>
                    <input
                      type="text" value={customSymbols}
                      onChange={(e) => { setCustomSymbols(e.target.value); setPreset('none'); }}
                      className="w-full bg-muted/20 border border-border/50 p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Passphrase Mode Controls */}
            {mode === 'passphrase' && (
              <div className="space-y-6">
                {/* Wordlist Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Wordlist Source</label>
                  <div className="relative group">
                    <select
                      value={wordlistType}
                      onChange={(e) => setWordlistType(e.target.value)}
                      className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value="standard" className="bg-background text-foreground">Standard Memorable words</option>
                      <option value="eff" className="bg-background text-foreground">EFF High-Entropy wordlist</option>
                      <option value="coder" className="bg-background text-foreground">Coder Jargon terms</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* Word Count Slider */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-foreground">Word Count</label>
                    <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{wordCount} words</span>
                  </div>
                  <div className="relative pt-2 pb-1">
                    <input
                      type="range" min="3" max="8" value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="pwd-slider w-full cursor-pointer outline-none"
                      style={{ WebkitAppearance: 'none', appearance: 'none', height: '10px', borderRadius: '999px', background: sliderFill(wordCount, 3, 8) }}
                    />
                  </div>
                </div>

                {/* Separator */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-sm font-semibold text-foreground">Word Separator</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['-', '_', '.', ' ', ''].map(sep => (
                      <button
                        key={sep}
                        onClick={() => setSeparator(sep)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all active:scale-[0.95] ${
                          separator === sep
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/20 hover:bg-muted text-foreground'
                        }`}
                      >
                        {sep === ' ' ? 'Space' : sep === '' ? 'None' : sep}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Passphrase Options */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-sm font-semibold text-foreground">Options</label>
                  <div className="flex flex-col gap-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <input type="checkbox" checked={capitalizeWords} onChange={(e) => setCapitalizeWords(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Capitalize Words</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <input type="checkbox" checked={addNumber} onChange={(e) => setAddNumber(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Append random digit</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PIN Mode Controls */}
            {mode === 'pin' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">PIN Length</label>
                  <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{length} digits</span>
                </div>
                <div className="relative pt-2 pb-1">
                  <input
                    type="range" min="4" max="16" value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="pwd-slider w-full cursor-pointer outline-none"
                    style={{ WebkitAppearance: 'none', appearance: 'none', height: '10px', borderRadius: '999px', background: sliderFill(length, 4, 16) }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Numeric-only codes for device locks and 2FA.</p>
              </div>
            )}

            {/* Batch Count Slider */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Batch Count</label>
                <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{batchCount}</span>
              </div>
              <div className="relative pt-2 pb-1">
                <input
                  type="range" min="1" max="50" value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                  className="pwd-slider w-full cursor-pointer outline-none"
                  style={{ WebkitAppearance: 'none', appearance: 'none', height: '10px', borderRadius: '999px', background: sliderFill(batchCount, 1, 50) }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Generate multiple passwords at once.</p>
            </div>

          </div>

          {/* Action Buttons — Outside settings card */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              className="w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] active:scale-[0.98]"
            >
              <RefreshCw size={20} /> Regenerate Password
            </motion.button>

            {batchCount > 1 && (
              <>
                <button
                  onClick={copyAllBatch}
                  className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {copiedAll ? <Check size={18} /> : <Copy size={18} />}
                  {copiedAll ? 'Copied!' : 'Copy All Batch'}
                </button>
                <button
                  onClick={downloadBatch}
                  className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Download size={18} /> Download as .txt
                </button>
              </>
            )}
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pwd-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .pwd-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .pwd-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
      `}} />
    </div>
  );
};

export default PasswordGenerator;
