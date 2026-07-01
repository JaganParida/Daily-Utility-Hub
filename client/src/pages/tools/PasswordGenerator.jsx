import { useState, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const words = ["apple", "river", "mountain", "eagle", "forest", "ocean", "desert", "storm", "winter", "summer", "tiger", "lion", "dragon", "knight", "castle", "sword", "shield", "magic", "moon", "star", "galaxy", "planet", "comet", "nebula", "quantum", "cyber", "neural", "pixel", "vector", "matrix", "cloud", "data", "logic", "syntax", "code", "byte", "script", "hacker", "ninja", "pirate", "robot", "cyborg", "mutant", "alien", "ghost", "phantom", "shadow", "specter", "spirit", "soul"];

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('random'); // 'random' or 'passphrase'
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [addNumber, setAddNumber] = useState(false);

  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'text-red-500' });

  const generateRandomPassword = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let res = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      res += charset.charAt(Math.floor(Math.random() * n));
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

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length > 8) score += 1;
    if (pwd.length > 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'text-red-500', icon: ShieldAlert };
    if (score <= 4) return { score, label: 'Good', color: 'text-yellow-500', icon: Shield };
    return { score, label: 'Strong', color: 'text-emerald-500', icon: ShieldCheck };
  };

  const handleGenerate = () => {
    const newPwd = mode === 'random' ? generateRandomPassword() : generatePassphrase();
    setPassword(newPwd);
    setStrength(calculateStrength(newPwd));
  };

  // Generate on initial load and when options change
  useEffect(() => {
    handleGenerate();
  }, [mode, length, includeUppercase, includeNumbers, includeSymbols, wordCount, separator, capitalizeWords, addNumber]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const StrengthIcon = strength.icon || Shield;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-140px)] items-center justify-center py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl shadow-sm mb-4">
          <Key size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Password Generator</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-lg">Generate highly secure, unpredictable passwords or memorable xkcd-style passphrases to keep your accounts safe.</p>
      </div>

      <div className="w-full bg-card border border-border rounded-3xl shadow-xl overflow-hidden relative">
        
        {/* Result Display */}
        <div className="bg-muted/30 p-8 border-b border-border relative">
           <div className="flex justify-between items-center mb-2">
             <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${strength.color}`}>
               <StrengthIcon size={14} />
               {strength.label} Password
             </div>
             <button onClick={handleGenerate} className="text-muted-foreground hover:text-indigo-500 transition-colors p-1" title="Regenerate">
               <RefreshCw size={16} />
             </button>
           </div>
           
           <div className="relative group mt-2">
             <input
               type="text"
               readOnly
               value={password}
               className="w-full bg-transparent text-center text-3xl sm:text-4xl lg:text-5xl font-mono text-foreground focus:outline-none truncate px-12"
             />
             <button 
               onClick={copyToClipboard}
               className={`absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110' : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white hover:scale-105'}`}
             >
               {copied ? <Check size={20} /> : <Copy size={20} />}
             </button>
           </div>
        </div>

        {/* Controls */}
        <div className="p-8">
          <div className="flex bg-muted/50 p-1 rounded-xl w-fit mx-auto mb-8">
            <button 
              onClick={() => setMode('random')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'random' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Random String
            </button>
            <button 
              onClick={() => setMode('passphrase')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'passphrase' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Passphrase (Words)
            </button>
          </div>

          <div className="max-w-lg mx-auto transition-all">
            {mode === 'random' ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <div className="flex justify-between mb-2 text-sm font-medium">
                    <label>Password Length</label>
                    <span className="text-indigo-500">{length} characters</span>
                  </div>
                  <input 
                    type="range" min="8" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <input type="checkbox" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                    <span className="text-sm font-medium">Uppercase Letters</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                    <span className="text-sm font-medium">Numbers (0-9)</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors sm:col-span-2">
                    <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                    <span className="text-sm font-medium">Symbols (!@#$%)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <div className="flex justify-between mb-2 text-sm font-medium">
                    <label>Number of Words</label>
                    <span className="text-indigo-500">{wordCount} words</span>
                  </div>
                  <input 
                    type="range" min="3" max="8" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Word Separator</label>
                  <div className="flex gap-2">
                    {['-', '_', '.', ' ', ''].map(sep => (
                      <button 
                        key={sep} onClick={() => setSeparator(sep)}
                        className={`w-12 h-12 rounded-xl text-lg font-bold border transition-colors ${separator === sep ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                      >
                        {sep === ' ' ? 'Space' : sep === '' ? 'None' : sep}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <input type="checkbox" checked={capitalizeWords} onChange={(e) => setCapitalizeWords(e.target.checked)} className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                    <span className="text-sm font-medium">Capitalize Words</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <input type="checkbox" checked={addNumber} onChange={(e) => setAddNumber(e.target.checked)} className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                    <span className="text-sm font-medium">Add Number at End</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PasswordGenerator;
