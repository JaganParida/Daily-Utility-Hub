import { useState, useEffect } from 'react';
import { Copy, Hash, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const HashGenerator = () => {
  const [text, setText] = useState('');
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
    base64: ''
  });
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!text) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '', base64: '' });
      return;
    }

    // Generate hashes in real-time
    setHashes({
      md5: CryptoJS.MD5(text).toString(),
      sha1: CryptoJS.SHA1(text).toString(),
      sha256: CryptoJS.SHA256(text).toString(),
      sha512: CryptoJS.SHA512(text).toString(),
      base64: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
    });
  }, [text]);

  const handleCopy = (hashValue, type) => {
    if (!hashValue) return;
    navigator.clipboard.writeText(hashValue);
    setCopied(type);
    toast.success(`${type.toUpperCase()} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hash Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from your text.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
        <textarea
          className="w-full h-32 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0 font-sans"
          placeholder="Enter text to hash..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {Object.entries(hashes).map(([type, value]) => (
          <div key={type} className="bg-card border border-border rounded-xl p-4 shadow-sm relative group">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{type}</h3>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all text-foreground min-h-[48px] flex items-center pr-12">
              {value || <span className="text-muted-foreground/50">Hash will appear here...</span>}
            </div>
            <button 
              onClick={() => handleCopy(value, type)}
              disabled={!value}
              className={`absolute right-6 top-1/2 mt-3 -translate-y-1/2 p-2 rounded-md transition-colors ${
                copied === type ? 'bg-green-500/20 text-green-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50'
              }`}
            >
              {copied === type ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HashGenerator;
