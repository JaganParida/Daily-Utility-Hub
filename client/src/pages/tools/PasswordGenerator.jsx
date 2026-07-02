import { useState, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, Shield, Info, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

const words = [
  "apple", "river", "mountain", "eagle", "forest", "ocean", "desert", "storm", "winter", "summer", 
  "tiger", "lion", "dragon", "knight", "castle", "sword", "shield", "magic", "moon", "star", 
  "galaxy", "planet", "comet", "nebula", "quantum", "cyber", "neural", "pixel", "vector", "matrix", 
  "cloud", "data", "logic", "syntax", "code", "byte", "script", "hacker", "ninja", "pirate", 
  "robot", "cyborg", "mutant", "alien", "ghost", "phantom", "shadow", "specter", "spirit", "soul"
];

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('random'); // 'random' | 'passphrase' | 'pin'
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [customSymbols, setCustomSymbols] = useState('!@#$%^&*()_+~`|}{[]:;?><,./-=');
  
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [addNumber, setAddNumber] = useState(false);

  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedHistoryIdx, setCopiedHistoryIdx] = useState(null);

  const generateRandomPassword = () => {
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nums = '0123456789';
    let syms = customSymbols;

    if (excludeSimilar) {
      // Exclude i, l, I, 1, o, O, 0
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
    for (let i = 0; i < length; ++i) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return res;
  };

  const generatePassphrase = () => {
    let phraseWords = [];
    for (let i = 0; i < wordCount; i++) {
      let word = words[Math.floor(Math.random() * words.length)];
      if (capitalizeWords) word = word.charAt(0).toUpperCase() + word.slice(1);
      phraseWords.push(word);
    }
    let res = phraseWords.join(separator);
    if (addNumber) res += separator + Math.floor(Math.random() * 100);
    return res;
  };

  const generatePin = () => {
    let res = '';
    for (let i = 0; i < length; i++) {
      res += Math.floor(Math.random() * 10).toString();
    }
    return res;
  };

  // Calculate Entropy & Crack Time
  const getEntropyStats = (pwd) => {
    if (!pwd) return { entropy: 0, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500', crackTime: 'Instant' };
    
    let poolSize = 0;
    if (mode === 'pin') {
      poolSize = 10;
    } else if (mode === 'passphrase') {
      poolSize = words.length; // xkcd word pool
    } else {
      let lower = 26;
      let upper = includeUppercase ? 26 : 0;
      let nums = includeNumbers ? 10 : 0;
      let syms = includeSymbols ? customSymbols.length : 0;
      if (excludeSimilar) {
        lower -= 2;
        upper -= 2;
        nums -= 2;
      }
      poolSize = lower + upper + nums + syms;
    }

    // Entropy formula: L * log2(poolSize)
    const len = mode === 'passphrase' ? wordCount : pwd.length;
    const entropy = Math.round(len * Math.log2(poolSize || 1));

    // Crack time estimation based on 100 Billion guesses/sec (Offline high-end rig)
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
    if (entropy >= 80) {
      label = 'Very Secure';
      color = 'text-green-500';
      barColor = 'bg-green-500';
    } else if (entropy >= 50) {
      label = 'Strong';
      color = 'text-emerald-500';
      barColor = 'bg-emerald-500';
    } else if (entropy >= 35) {
      label = 'Moderate';
      color = 'text-yellow-500';
      barColor = 'bg-yellow-500';
    }

    return { entropy, label, color, barColor, crackTime };
  };

  const handleGenerate = () => {
    let newPwd = '';
    if (mode === 'random') newPwd = generateRandomPassword();
    else if (mode === 'passphrase') newPwd = generatePassphrase();
    else if (mode === 'pin') newPwd = generatePin();

    if (newPwd) {
      setPassword(newPwd);
      setHistory(prev => [newPwd, ...prev].slice(0, 10));
    }
  };

  // Regenerate automatically when inputs update
  useEffect(() => {
    handleGenerate();
  }, [mode, length, includeUppercase, includeNumbers, includeSymbols, excludeSimilar, wordCount, separator, capitalizeWords, addNumber, customSymbols]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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

  const stats = getEntropyStats(password);

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Key size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">Advanced Password Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate customizable passwords, cryptographic PINs, or memorable xkcd-style passphrases.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Card: Password Output & Diagnostics */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]">
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            
            {/* Password Display Box */}
            <div className="bg-muted/15 border border-border/40 p-6 rounded-2xl flex flex-col items-center justify-center relative shrink-0">
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
                  value={password}
                  className="w-full bg-transparent text-center text-lg sm:text-2xl md:text-3xl font-mono text-foreground focus:outline-none select-all truncate font-bold"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Cryptographic Entropy Stats */}
            <div className="bg-muted/5 border border-border/40 p-4 rounded-xl space-y-4 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cryptographic Diagnostics</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border/30 p-3 rounded-lg text-center">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Entropy strength</span>
                  <p className="text-lg font-black text-foreground mt-0.5">{stats.entropy} <span className="text-xs font-normal">bits</span></p>
                </div>
                <div className="bg-card border border-border/30 p-3 rounded-lg text-center">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Estimated crack time</span>
                  <p className="text-xs font-bold text-foreground mt-1.5 truncate leading-none">{stats.crackTime}</p>
                </div>
              </div>

              {/* Segmented Strength Bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full flex-1 transition-all ${stats.entropy > 0 ? stats.barColor : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all ${stats.entropy >= 35 ? stats.barColor : 'bg-muted'}`} />
                  <div className={`h-full flex-1 transition-all ${stats.entropy >= 50 ? stats.barColor : 'bg-muted'}`} />
                  <div className={`h-full flex-1 transition-all ${stats.entropy >= 80 ? stats.barColor : 'bg-muted'}`} />
                </div>
              </div>
            </div>

            {/* Password history log */}
            <div className="flex-1 min-h-0 flex flex-col gap-2">
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
              
              <div className="flex-1 overflow-y-auto pr-1 border border-border/40 bg-muted/15 rounded-xl p-3 space-y-2 custom-scrollbar min-h-0">
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
        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
            
            {/* Mode selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Generation Mode</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                {[
                  { id: 'random', label: 'Random' },
                  { id: 'passphrase', label: 'xkcd' },
                  { id: 'pin', label: 'PIN' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.id);
                      if (item.id === 'pin') setLength(6);
                      else if (item.id === 'random') setLength(16);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
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

            {/* Random mode controls */}
            {mode === 'random' && (
              <div className="space-y-5 animate-in fade-in zoom-in-98 duration-150">
                {/* Length */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password Length</span>
                    <span className="text-xs font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">{length} chars</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Character options */}
                <div className="space-y-2.5 pt-3 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Character Sets</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={includeUppercase}
                        onChange={(e) => setIncludeUppercase(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Include Uppercase (A-Z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={includeNumbers}
                        onChange={(e) => setIncludeNumbers(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Include Numbers (0-9)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={includeSymbols}
                        onChange={(e) => setIncludeSymbols(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Include Symbols</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={excludeSimilar}
                        onChange={(e) => setExcludeSimilar(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Exclude Lookalikes (e.g. 1, l, 0, O)</span>
                    </label>
                  </div>
                </div>

                {/* Custom Symbols config */}
                {includeSymbols && (
                  <div className="space-y-1.5 pt-3 border-t border-border/50">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Custom Symbols Set</label>
                    <input
                      type="text"
                      value={customSymbols}
                      onChange={(e) => setCustomSymbols(e.target.value)}
                      className="w-full bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Passphrase mode controls */}
            {mode === 'passphrase' && (
              <div className="space-y-5 animate-in fade-in zoom-in-98 duration-150">
                {/* Word count */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Word Count</span>
                    <span className="text-xs font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">{wordCount} words</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Separator selection */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Word Separator</label>
                  <div className="grid grid-cols-5 gap-1">
                    {['-', '_', '.', ' ', ''].map(sep => (
                      <button
                        key={sep}
                        onClick={() => setSeparator(sep)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all active:scale-[0.95] ${
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

                {/* Options checkboxes */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Options</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={capitalizeWords}
                        onChange={(e) => setCapitalizeWords(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Capitalize Words</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input 
                        type="checkbox"
                        checked={addNumber}
                        onChange={(e) => setAddNumber(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" 
                      />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Append random digit</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PIN Mode controls */}
            {mode === 'pin' && (
              <div className="space-y-5 animate-in fade-in zoom-in-98 duration-150">
                {/* Length */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PIN Length</span>
                    <span className="text-xs font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">{length} digits</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}

            {/* Trigger Button */}
            <button 
              onClick={handleGenerate}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
            >
              <RefreshCw size={14} /> Regenerate Password
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
