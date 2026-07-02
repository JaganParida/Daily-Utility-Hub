import { useState, useCallback } from 'react';
import { Hash, Copy, Trash2, CheckCircle, RefreshCw, Settings, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UuidGenerator = () => {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(10);
  const [version, setVersion] = useState('v4'); // 'v1' | 'v4' | 'v7' | 'ulid'
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [format, setFormat] = useState({ uppercase: false, noHyphens: false });
  const [copiedIndex, setCopiedIndex] = useState(null);

  // ULID Generation helper (Crockford's Base32)
  const generateULID = () => {
    const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let now = Date.now();
    let timePart = '';
    
    // 10-char timestamp part
    for (let i = 0; i < 10; i++) {
      const index = now % 32;
      timePart = ENCODING.charAt(index) + timePart;
      now = Math.floor(now / 32);
    }

    // 16-char random part
    let randomPart = '';
    for (let i = 0; i < 16; i++) {
      const rand = Math.floor(Math.random() * 32);
      randomPart += ENCODING.charAt(rand);
    }

    const val = timePart + randomPart;
    return format.uppercase ? val : val.toLowerCase();
  };

  const generateUUID = () => {
    if (version === 'ulid') {
      return generateULID();
    }

    let rawUuid = '';
    
    if (version === 'v4') {
      rawUuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    } else if (version === 'v1') {
      const time = Date.now().toString(16).padStart(12, '0');
      rawUuid = `${time.slice(4, 12)}-${time.slice(0, 4)}-1xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    } else if (version === 'v7') {
      const time = Date.now().toString(16).padStart(12, '0');
      rawUuid = `${time.slice(0, 8)}-${time.slice(8, 12)}-7xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    if (format.noHyphens) rawUuid = rawUuid.replace(/-/g, '');
    if (format.uppercase) rawUuid = rawUuid.toUpperCase();
    else rawUuid = rawUuid.toLowerCase();

    // Apply custom developer prefix and suffix
    const finalVal = `${prefix}${rawUuid}${suffix}`;
    return finalVal;
  };

  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: Math.min(Math.max(1, count), 500) }, generateUUID);
    setUuids(newUuids);
    setCopiedIndex(null);
    toast.success(`Generated ${newUuids.length} key${newUuids.length !== 1 ? 's' : ''}`);
  }, [count, version, format, prefix, suffix]);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const copyAll = () => {
    if (!uuids.length) return;
    navigator.clipboard.writeText(uuids.join('\n'));
    toast.success('All keys copied!');
  };

  const clearAll = () => {
    setUuids([]);
    toast.success('Cleared generated list');
  };

  const hasUuids = uuids.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Hash size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">Advanced Key & UUID Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate UUID v1, v4, v7, or ULID keys in batches with developer-focused custom formatting.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Results Card */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex justify-between items-center px-1 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Generated Keys</span>
              {hasUuids && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={copyAll}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy size={13} /> Copy All
                  </button>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 bg-muted/10 border border-border/40 rounded-xl p-3">
              {hasUuids ? (
                <ul className="space-y-2">
                  {uuids.map((uuid, index) => (
                    <li 
                      key={index} 
                      className="flex justify-between items-center p-3 bg-card hover:bg-muted/40 border border-border/40 rounded-lg transition-colors group"
                    >
                      <code className="text-xs sm:text-sm font-mono text-foreground break-all">{uuid}</code>
                      <button 
                        onClick={() => copyToClipboard(uuid, index)}
                        className={`p-1.5 rounded-md transition-colors shrink-0 ${
                          copiedIndex === index 
                            ? 'bg-green-500/20 text-green-600' 
                            : 'text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100'
                        }`}
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? <CheckCircle size={15} /> : <Copy size={15} />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Info className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No Keys Generated</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">Configure your generator options on the sidebar and click Generate.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
            
            {/* Version selections */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Identifier Type</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'v4', label: 'UUID v4', desc: 'Random-based' },
                  { id: 'v7', label: 'UUID v7', desc: 'Time-ordered' },
                  { id: 'v1', label: 'UUID v1', desc: 'Timestamp-based' },
                  { id: 'ulid', label: 'ULID', desc: 'Sortable Base32' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVersion(v.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                      version === v.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-muted/15 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-xs font-bold block">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground block leading-tight">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Developer Prefix/Suffix */}
            <div className="space-y-2.5 pt-3 border-t border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Custom Wrappers (Developer Keys)</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">Prefix (e.g. usr_)</label>
                  <input
                    type="text"
                    placeholder="None"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">Suffix</label>
                  <input
                    type="text"
                    placeholder="None"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Formatting */}
            <div className="space-y-2.5 pt-3 border-t border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Formatting Options</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input 
                    type="checkbox"
                    checked={format.uppercase}
                    onChange={(e) => setFormat({ ...format, uppercase: e.target.checked })}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                  />
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Force Uppercase letters</span>
                </label>
                
                {version !== 'ulid' && (
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input 
                      type="checkbox"
                      checked={format.noHyphens}
                      onChange={(e) => setFormat({ ...format, noHyphens: e.target.checked })}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer" 
                    />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Remove standard hyphens</span>
                  </label>
                )}
              </div>
            </div>

            {/* Quantity Slider */}
            <div className="space-y-2.5 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Batch Quantity</span>
                <span className="text-xs font-bold bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-md">{count}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Generate Trigger */}
            <button 
              onClick={handleGenerate}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm shadow-primary/20"
            >
              <RefreshCw size={14} /> Generate Keys
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UuidGenerator;
