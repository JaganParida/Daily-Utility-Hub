import { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const ApiKeyGenerator = () => {
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState(64);
  const [format, setFormat] = useState('hex'); // hex, base64, alphanumeric, uuid

  const generateSecret = () => {
    if (format === 'uuid') {
      setSecret(uuidv4());
      return;
    }

    const charsetAlphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsetHex = '0123456789abcdef';
    
    let result = '';
    
    if (format === 'hex') {
      for (let i = 0; i < length; i++) {
        result += charsetHex.charAt(Math.floor(Math.random() * charsetHex.length));
      }
    } else if (format === 'alphanumeric') {
      for (let i = 0; i < length; i++) {
        result += charsetAlphanumeric.charAt(Math.floor(Math.random() * charsetAlphanumeric.length));
      }
    } else if (format === 'base64') {
      // Generate random bytes and base64 encode them
      const bytes = new Uint8Array(length);
      window.crypto.getRandomValues(bytes);
      result = btoa(String.fromCharCode(...bytes));
    }

    setSecret(result);
    setCopied(false);
  };

  useEffect(() => {
    generateSecret();
    // eslint-disable-next-line
  }, [length, format]);

  const handleCopy = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Key size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JWT Secret & API Key Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate secure, random strings for .env secrets, JWT signing, or API keys.</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-6">
        
        {/* Output Area */}
        <div className="relative group mb-8">
          <div className="w-full bg-muted/30 border border-border rounded-xl p-6 pr-16 min-h-[120px] flex items-center justify-center break-all font-mono text-lg md:text-xl text-foreground text-center shadow-inner">
            {secret}
          </div>
          <button 
            onClick={handleCopy}
            className="absolute top-1/2 -translate-y-1/2 right-4 p-3 bg-background border border-border rounded-lg text-muted-foreground hover:text-indigo-500 hover:border-indigo-500/50 transition-colors shadow-sm"
            title="Copy to clipboard"
          >
            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
          </button>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hex', label: 'Hex (0-9, a-f)' },
                { id: 'base64', label: 'Base64' },
                { id: 'alphanumeric', label: 'Alphanumeric' },
                { id: 'uuid', label: 'UUID v4' },
              ].map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`py-2 px-3 text-sm rounded-lg border font-medium transition-colors ${
                    format === fmt.id
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 shadow-sm'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-border pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Length (Bytes)</h3>
              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md">
                {format === 'uuid' ? 'Fixed (36)' : length}
              </span>
            </div>
            
            <div className="space-y-4">
              <input 
                type="range" 
                min="16" 
                max="256" 
                step="16"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                disabled={format === 'uuid'}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
              />
              <div className="flex gap-2">
                {[32, 64, 128, 256].map(len => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    disabled={format === 'uuid'}
                    className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors disabled:opacity-50 ${
                      length === len && format !== 'uuid'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className="flex gap-4">
        <button 
          onClick={generateSecret}
          className="flex-1 py-4 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20"
        >
          <RefreshCw size={20} />
          Generate New Secret
        </button>
      </div>

    </div>
  );
};

export default ApiKeyGenerator;
