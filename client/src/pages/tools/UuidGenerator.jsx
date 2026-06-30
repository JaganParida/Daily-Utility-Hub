import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';

const UuidGenerator = () => {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: Math.min(Math.max(1, count), 100) }, generateUUID);
    setUuids(newUuids);
    setCopiedIndex(null);
  }, [count]);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">UUID Generator</h1>
        <p className="text-muted-foreground mt-1">Generate version 4 UUIDs quickly and easily.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-foreground mb-2">How many UUIDs?</label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleGenerate}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Generate UUIDs
          </button>
        </div>
      </div>

      {uuids.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">Generated Results</h3>
            <span className="text-xs font-medium px-2 py-1 bg-background rounded-full border border-border text-muted-foreground">
              {uuids.length} UUID{uuids.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {uuids.map((uuid, index) => (
              <li key={index} className="flex justify-between items-center p-4 hover:bg-muted/10 transition-colors">
                <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">{uuid}</code>
                <button 
                  onClick={() => copyToClipboard(uuid, index)}
                  className={`p-2 rounded-md transition-colors ${
                    copiedIndex === index 
                      ? 'bg-green-500/20 text-green-600' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UuidGenerator;
