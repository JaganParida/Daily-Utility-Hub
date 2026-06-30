import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Check, Hash } from 'lucide-react';
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { toast } from 'react-hot-toast';

const UuidGenerator = () => {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState('v4');
  const [format, setFormat] = useState({ uppercase: false, noHyphens: false });
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateUUID = () => {
    let rawUuid = '';
    try {
      if (version === 'v1') rawUuid = uuidv1();
      else if (version === 'v7') rawUuid = uuidv7();
      else rawUuid = uuidv4();
    } catch (err) {
      // Fallback if uuidv7 isn't supported in current version
      rawUuid = uuidv4(); 
    }

    if (format.noHyphens) rawUuid = rawUuid.replace(/-/g, '');
    if (format.uppercase) rawUuid = rawUuid.toUpperCase();
    
    return rawUuid;
  };

  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: Math.min(Math.max(1, count), 500) }, generateUUID);
    setUuids(newUuids);
    setCopiedIndex(null);
  }, [count, version, format]);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    toast.success('All UUIDs copied!');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shadow-sm">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced UUID Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate UUID v1, v4, or v7 with custom formatting options.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">UUID Version</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'v1', label: 'v1 (Time)' },
                { id: 'v4', label: 'v4 (Random)' },
                { id: 'v7', label: 'v7 (Ordered)' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setVersion(v.id)}
                  className={`py-2 px-3 text-xs sm:text-sm rounded-lg border font-medium transition-colors ${
                    version === v.id
                      ? 'bg-purple-500/10 border-purple-500 text-purple-500 shadow-sm'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Formatting</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={format.uppercase}
                  onChange={(e) => setFormat({ ...format, uppercase: e.target.checked })}
                  className="w-4 h-4 text-purple-500 border-border rounded focus:ring-purple-500"
                />
                <span className="text-sm text-foreground">Uppercase</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={format.noHyphens}
                  onChange={(e) => setFormat({ ...format, noHyphens: e.target.checked })}
                  className="w-4 h-4 text-purple-500 border-border rounded focus:ring-purple-500"
                />
                <span className="text-sm text-foreground">Remove Hyphens</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-t border-border pt-4">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quantity</label>
              <span className="text-xs font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-md">{count}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="500" 
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <button 
            onClick={handleGenerate}
            className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-500/20"
          >
            <RefreshCw size={18} /> Generate UUIDs
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-full flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
            <h3 className="font-bold text-foreground">Generated Results</h3>
            {uuids.length > 0 && (
              <button 
                onClick={copyAll}
                className="text-xs font-medium text-purple-500 hover:bg-purple-500/10 px-3 py-1.5 rounded-md transition-colors"
              >
                Copy All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
            {uuids.length > 0 ? (
              <ul className="space-y-2">
                {uuids.map((uuid, index) => (
                  <li key={index} className="flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border rounded-lg transition-colors group">
                    <code className="text-sm font-mono text-foreground break-all">{uuid}</code>
                    <button 
                      onClick={() => copyToClipboard(uuid, index)}
                      className={`p-1.5 rounded-md transition-colors shrink-0 ${
                        copiedIndex === index 
                          ? 'bg-green-500/20 text-green-600' 
                          : 'text-muted-foreground hover:bg-background opacity-0 group-hover:opacity-100'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                Click generate to create UUIDs
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UuidGenerator;
