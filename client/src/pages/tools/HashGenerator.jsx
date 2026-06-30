import { useState, useEffect } from 'react';
import { Copy, Hash, Check, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const HashGenerator = () => {
  const [text, setText] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [useHmac, setUseHmac] = useState(false);
  
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
    sha3: '',
    ripemd160: ''
  });
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!text) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '', sha3: '', ripemd160: '' });
      return;
    }

    try {
      if (useHmac && secretKey) {
        // HMAC Mode
        setHashes({
          md5: CryptoJS.HmacMD5(text, secretKey).toString(),
          sha1: CryptoJS.HmacSHA1(text, secretKey).toString(),
          sha256: CryptoJS.HmacSHA256(text, secretKey).toString(),
          sha512: CryptoJS.HmacSHA512(text, secretKey).toString(),
          sha3: CryptoJS.HmacSHA3(text, secretKey).toString(),
          ripemd160: CryptoJS.HmacRIPEMD160(text, secretKey).toString()
        });
      } else {
        // Standard Hash Mode
        setHashes({
          md5: CryptoJS.MD5(text).toString(),
          sha1: CryptoJS.SHA1(text).toString(),
          sha256: CryptoJS.SHA256(text).toString(),
          sha512: CryptoJS.SHA512(text).toString(),
          sha3: CryptoJS.SHA3(text).toString(),
          ripemd160: CryptoJS.RIPEMD160(text).toString()
        });
      }
    } catch (e) {
      toast.error('Error generating hash');
    }
  }, [text, secretKey, useHmac]);

  const handleCopy = (hashValue, type) => {
    if (!hashValue) return;
    navigator.clipboard.writeText(hashValue);
    setCopied(type);
    toast.success(`${type.toUpperCase()} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Hash Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate standard hashes or HMAC cryptographic signatures.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        
        {/* Input Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Input Text</label>
            <textarea
              className="w-full h-32 p-4 bg-background border border-border rounded-xl resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 custom-scrollbar"
              placeholder="Enter text to hash..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <label className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={useHmac} 
                onChange={(e) => setUseHmac(e.target.checked)} 
                className="w-4 h-4 text-indigo-500 border-indigo-200 rounded focus:ring-indigo-500" 
              />
              <div className="text-sm text-foreground">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-0.5 flex items-center gap-2">
                  <Key size={14} /> Use HMAC (Key-Hash Message Authentication)
                </div>
                <div className="text-xs text-muted-foreground">Requires a secret key to generate a cryptographic signature.</div>
              </div>
            </label>

            {useHmac && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Secret Key</label>
                <input 
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your secret key..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
            <h3 className="font-bold text-foreground">Generated Hashes</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(hashes).map(([type, value]) => (
              <div key={type} className="group relative">
                <div className="flex justify-between items-end mb-1">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {useHmac ? `HMAC-${type}` : type}
                  </h4>
                </div>
                <div className="relative">
                  <div className="bg-muted/50 border border-border p-3 pr-12 rounded-lg font-mono text-xs break-all text-foreground min-h-[44px] flex items-center">
                    {value || <span className="text-muted-foreground/50">Awaiting input...</span>}
                  </div>
                  <button 
                    onClick={() => handleCopy(value, type)}
                    disabled={!value}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                      copied === type 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-background border border-border text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/30 disabled:opacity-0 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copied === type ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HashGenerator;
