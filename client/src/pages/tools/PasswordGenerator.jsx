import { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Key, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { toast } from 'react-hot-toast';

const PasswordGenerator = () => {
  const [passwords, setPasswords] = useState([]);
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false // e.g. i, l, 1, L, o, 0, O
  });

  const generatePassword = () => {
    let charset = '';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const ambiguousChars = 'il1Lo0O';

    let currentUppercase = uppercaseChars;
    let currentLowercase = lowercaseChars;
    let currentNumbers = numberChars;
    let currentSymbols = symbolChars;

    if (options.excludeAmbiguous) {
      currentUppercase = currentUppercase.replace(/[ILO]/g, '');
      currentLowercase = currentLowercase.replace(/[ilo]/g, '');
      currentNumbers = currentNumbers.replace(/[01]/g, '');
    }

    if (options.uppercase) charset += currentUppercase;
    if (options.lowercase) charset += currentLowercase;
    if (options.numbers) charset += currentNumbers;
    if (options.symbols) charset += currentSymbols;

    if (charset === '') {
      toast.error('Please select at least one character type!');
      return '';
    }

    let result = '';
    
    // Ensure at least one character of each selected type
    if (options.uppercase) result += currentUppercase.charAt(Math.floor(Math.random() * currentUppercase.length));
    if (options.lowercase) result += currentLowercase.charAt(Math.floor(Math.random() * currentLowercase.length));
    if (options.numbers) result += currentNumbers.charAt(Math.floor(Math.random() * currentNumbers.length));
    if (options.symbols) result += currentSymbols.charAt(Math.floor(Math.random() * currentSymbols.length));

    // Fill the rest
    for (let i = result.length; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle result
    return result.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleGenerate = useCallback(() => {
    if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
      toast.error('Select at least one character type');
      return;
    }
    
    const newPasswords = [];
    for (let i = 0; i < count; i++) {
      newPasswords.push(generatePassword());
    }
    setPasswords(newPasswords);
    setCopiedIndex(null);
  }, [length, options, count]);

  // Initial generate
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line
  }, []);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStrengthDisplay = (password) => {
    if (!password) return null;
    const score = zxcvbn(password).score; // 0 to 4
    
    const strengthMap = {
      0: { label: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500', icon: ShieldAlert },
      1: { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500', icon: ShieldAlert },
      2: { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500', icon: Shield },
      3: { label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck },
      4: { label: 'Very Strong', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck },
    };

    const details = strengthMap[score];
    const Icon = details.icon;

    return (
      <div className="flex flex-col gap-1 items-end shrink-0">
        <div className={`flex items-center gap-1 text-xs font-bold ${details.color}`}>
          <Icon size={14} /> {details.label}
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3 h-1 rounded-full ${i <= score ? details.bg : 'bg-muted'}`} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
          <Key size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Password Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate secure, complex passwords in batches with real-time strength analysis.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
        
        {/* Settings Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Length</label>
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md">{length}</span>
            </div>
            <input 
              type="range" 
              min="8" 
              max="128" 
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quantity</label>
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md">{count}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-4 pt-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block border-b border-border pb-2">Characters</label>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground font-medium group-hover:text-emerald-500 transition-colors">Uppercase (A-Z)</span>
                <input type="checkbox" checked={options.uppercase} onChange={(e) => setOptions({...options, uppercase: e.target.checked})} className="w-4 h-4 text-emerald-500 border-border rounded focus:ring-emerald-500" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground font-medium group-hover:text-emerald-500 transition-colors">Lowercase (a-z)</span>
                <input type="checkbox" checked={options.lowercase} onChange={(e) => setOptions({...options, lowercase: e.target.checked})} className="w-4 h-4 text-emerald-500 border-border rounded focus:ring-emerald-500" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground font-medium group-hover:text-emerald-500 transition-colors">Numbers (0-9)</span>
                <input type="checkbox" checked={options.numbers} onChange={(e) => setOptions({...options, numbers: e.target.checked})} className="w-4 h-4 text-emerald-500 border-border rounded focus:ring-emerald-500" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground font-medium group-hover:text-emerald-500 transition-colors">Symbols (!@#$)</span>
                <input type="checkbox" checked={options.symbols} onChange={(e) => setOptions({...options, symbols: e.target.checked})} className="w-4 h-4 text-emerald-500 border-border rounded focus:ring-emerald-500" />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={options.excludeAmbiguous} 
                onChange={(e) => setOptions({...options, excludeAmbiguous: e.target.checked})} 
                className="w-4 h-4 text-amber-500 border-amber-200 rounded focus:ring-amber-500" 
              />
              <div className="text-sm text-foreground">
                <div className="font-bold text-amber-600 dark:text-amber-500 mb-0.5">Exclude Ambiguous</div>
                <div className="text-xs text-muted-foreground">Removes easily confused characters like <span className="font-mono bg-background px-1 rounded border">l</span>, <span className="font-mono bg-background px-1 rounded border">1</span>, <span className="font-mono bg-background px-1 rounded border">O</span>, <span className="font-mono bg-background px-1 rounded border">0</span></div>
              </div>
            </label>
          </div>

          <button 
            onClick={handleGenerate}
            className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
          >
            <RefreshCw size={18} /> Generate Passwords
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-full flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
            <h3 className="font-bold text-foreground">Generated Passwords</h3>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{passwords.length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[550px]">
            <ul className="space-y-3">
              {passwords.map((pass, index) => (
                <li key={index} className="flex justify-between items-center p-4 bg-muted/30 border border-border rounded-xl transition-colors hover:border-emerald-500/30 group">
                  <code className="text-sm font-mono text-foreground break-all mr-4">{pass}</code>
                  
                  <div className="flex items-center gap-4">
                    {getStrengthDisplay(pass)}
                    
                    <div className="h-8 w-px bg-border"></div>

                    <button 
                      onClick={() => copyToClipboard(pass, index)}
                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                        copiedIndex === index 
                          ? 'bg-emerald-500/20 text-emerald-600' 
                          : 'bg-background border border-border text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PasswordGenerator;
