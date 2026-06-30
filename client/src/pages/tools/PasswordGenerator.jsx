import { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Check, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' });

  const generatePassword = useCallback(() => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let result = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      result += charset.charAt(Math.floor(Math.random() * n));
    }
    setPassword(result);
    setCopied(false);
  }, [length, options]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  useEffect(() => {
    // Basic strength calculation
    let score = 0;
    if (password.length > 8) score += 1;
    if (password.length > 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = 'Weak';
    let color = 'text-red-500';
    let Icon = ShieldX;

    if (score >= 5) {
      label = 'Strong';
      color = 'text-green-500';
      Icon = ShieldCheck;
    } else if (score >= 3) {
      label = 'Medium';
      color = 'text-yellow-500';
      Icon = ShieldAlert;
    }

    setStrength({ score, label, color, Icon });
  }, [password]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOptionChange = (option) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Password Generator</h1>
        <p className="text-muted-foreground mt-1">Generate strong, secure passwords instantly.</p>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm mb-6">
        
        {/* Password Display */}
        <div className="relative mb-8">
          <div className="w-full bg-muted border border-border rounded-lg p-4 pr-16 font-mono text-xl md:text-2xl break-all min-h-[64px] flex items-center text-foreground">
            {password || <span className="text-muted-foreground/50 text-base font-sans">Select at least one character type</span>}
          </div>
          <button 
            onClick={copyToClipboard}
            disabled={!password}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-md transition-colors ${
              copied ? 'bg-green-500/20 text-green-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50'
            }`}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>

        {/* Strength Indicator */}
        {password && (
          <div className="flex items-center gap-2 mb-8 bg-background border border-border p-3 rounded-lg w-fit">
            <strength.Icon className={strength.color} size={18} />
            <span className="text-sm font-medium text-foreground mr-2">Strength:</span>
            <span className={`text-sm font-bold ${strength.color}`}>{strength.label}</span>
            <div className="flex gap-1 ml-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 w-6 rounded-full ${i <= strength.score ? strength.color.replace('text-', 'bg-') : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Length Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium text-foreground">Password Length</label>
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-md text-sm">{length}</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="64" 
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'uppercase', label: 'Uppercase (A-Z)' },
              { id: 'lowercase', label: 'Lowercase (a-z)' },
              { id: 'numbers', label: 'Numbers (0-9)' },
              { id: 'symbols', label: 'Symbols (!@#$)' }
            ].map((opt) => (
              <label key={opt.id} className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={options[opt.id]} 
                  onChange={() => handleOptionChange(opt.id)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-background bg-background"
                />
                <span className="ml-3 text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={generatePassword}
          className="w-full mt-8 px-6 py-3.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-lg shadow-sm"
        >
          <RefreshCw size={20} />
          Generate New Password
        </button>
      </div>
    </div>
  );
};

export default PasswordGenerator;
