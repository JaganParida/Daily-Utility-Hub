import { useState, useCallback } from 'react';
import { 
  Hash, Copy, Trash2, CheckCircle, RefreshCw, Download, 
  ChevronDown, Settings2, Info 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import ToolHeader from '../../components/ToolHeader';

const NAMESPACES = {
  dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
};

const UuidGenerator = () => {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(10);
  const [version, setVersion] = useState('v4');
  
  const [namespaceType, setNamespaceType] = useState('dns');
  const [customNamespace, setCustomNamespace] = useState('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  const [v3v5Name, setV3v5Name] = useState('example.com');

  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeMs, setCustomTimeMs] = useState(Date.now());

  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [format, setFormat] = useState({ uppercase: false, noHyphens: false });
  
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copyFormat, setCopyFormat] = useState('raw');

  const uuidToBytes = (uuidStr) => {
    const clean = uuidStr.replace(/-/g, '');
    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.slice(i, i + 2), 16));
    }
    return bytes;
  };

  const bytesToWords = (bytes) => {
    const words = [];
    for (let i = 0; i < bytes.length; i++) {
      words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, bytes.length);
  };

  const generateV3orV5 = (nsUuid, name, isV5 = true) => {
    try {
      const nsBytes = uuidToBytes(nsUuid);
      const nameBytes = Array.from(new TextEncoder().encode(name));
      const combinedBytes = nsBytes.concat(nameBytes);
      const combinedWords = bytesToWords(combinedBytes);
      const hash = isV5 ? CryptoJS.SHA1(combinedWords) : CryptoJS.MD5(combinedWords);
      const hashBytes = [];
      for (let i = 0; i < 16; i++) {
        hashBytes.push((hash.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
      }
      hashBytes[6] = (hashBytes[6] & 0x0f) | (isV5 ? 0x50 : 0x30);
      hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80;
      let uuid = '';
      for (let i = 0; i < 16; i++) {
        if (i === 4 || i === 6 || i === 8 || i === 10) uuid += '-';
        uuid += hashBytes[i].toString(16).padStart(2, '0');
      }
      return uuid;
    } catch {
      return '00000000-0000-0000-0000-000000000000';
    }
  };

  const generateULID = (timeOverride) => {
    const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let now = useCustomTime ? timeOverride : Date.now();
    let timePart = '';
    for (let i = 0; i < 10; i++) {
      timePart = ENCODING.charAt(now % 32) + timePart;
      now = Math.floor(now / 32);
    }
    let randomPart = '';
    for (let i = 0; i < 16; i++) {
      randomPart += ENCODING.charAt(Math.floor(Math.random() * 32));
    }
    const val = timePart + randomPart;
    return format.uppercase ? val : val.toLowerCase();
  };

  const generateUUID = () => {
    if (version === 'ulid') return generateULID(customTimeMs);

    let rawUuid = '';
    
    if (version === 'v4') {
      rawUuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    } else if (version === 'v1') {
      const time = (useCustomTime ? customTimeMs : Date.now()).toString(16).padStart(12, '0');
      rawUuid = `${time.slice(4, 12)}-${time.slice(0, 4)}-1xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    } else if (version === 'v7') {
      const time = (useCustomTime ? customTimeMs : Date.now()).toString(16).padStart(12, '0');
      rawUuid = `${time.slice(0, 8)}-${time.slice(8, 12)}-7xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    } else if (version === 'v8') {
      const time = useCustomTime ? customTimeMs : Date.now();
      const bytes = new Uint8Array(16);
      bytes[0] = (time >>> 40) & 0xff;
      bytes[1] = (time >>> 32) & 0xff;
      bytes[2] = (time >>> 24) & 0xff;
      bytes[3] = (time >>> 16) & 0xff;
      bytes[4] = (time >>> 8) & 0xff;
      bytes[5] = time & 0xff;
      for (let i = 6; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
      bytes[6] = (bytes[6] & 0x0f) | 0x80;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      for (let i = 0; i < 16; i++) {
        if (i === 4 || i === 6 || i === 8 || i === 10) rawUuid += '-';
        rawUuid += bytes[i].toString(16).padStart(2, '0');
      }
    } else if (version === 'v3' || version === 'v5') {
      const selectedNs = namespaceType === 'custom' ? customNamespace : NAMESPACES[namespaceType];
      rawUuid = generateV3orV5(selectedNs, v3v5Name, version === 'v5');
    }

    if (format.noHyphens && version !== 'ulid') rawUuid = rawUuid.replace(/-/g, '');
    if (format.uppercase) rawUuid = rawUuid.toUpperCase();
    else rawUuid = rawUuid.toLowerCase();

    return `${prefix}${rawUuid}${suffix}`;
  };

  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: Math.min(Math.max(1, count), 500) }, generateUUID);
    setUuids(newUuids);
    setCopiedIndex(null);
    setCopiedAll(false);
    toast.success(`Generated ${newUuids.length} key${newUuids.length !== 1 ? 's' : ''}`);
  }, [count, version, namespaceType, customNamespace, v3v5Name, useCustomTime, customTimeMs, format, prefix, suffix]);

  const getFormattedOutput = (fmt, list) => {
    if (fmt === 'json') return JSON.stringify(list, null, 2);
    if (fmt === 'csv') return list.join(',');
    if (fmt === 'sql') return `INSERT INTO keys_table (id) VALUES\n` + list.map(i => `('${i}')`).join(',\n') + ';';
    if (fmt === 'javascript') return `const keys = [\n` + list.map(i => `  "${i}"`).join(',\n') + `\n];`;
    return list.join('\n');
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast.success('Copied!');
  };

  const handleCopyAll = () => {
    if (!uuids.length) return;
    navigator.clipboard.writeText(getFormattedOutput(copyFormat, uuids));
    setCopiedAll(true);
    toast.success('Batch copied!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    if (!uuids.length) return;
    const formatted = getFormattedOutput(copyFormat, uuids);
    const ext = copyFormat === 'json' ? 'json' : copyFormat === 'csv' ? 'csv' : 'txt';
    const blob = new Blob([formatted], { type: copyFormat === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keys-${version}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded .${ext} file`);
  };

  const clearAll = () => {
    setUuids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="UUID & Unique Key Generator"
        description="Generate cryptographically secure v1–v8 UUIDs or sortable ULIDs in batches with customizable output formats."
        category="Developer Tools"
        categoryPath="/search"
        icon={Hash}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="RFC 9562 Standard"
        extraBadge="v1, v4, v7 & ULID"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* Left: Results */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card flex flex-col relative transition-all duration-500 ease-out ${
            hasUuids ? 'min-h-0 p-4 md:p-6 space-y-4' : 'min-h-[420px] items-stretch p-6'
          }`}
        >
          {hasUuids ? (
            <>
              <div className="flex items-center justify-between px-1 border-b border-[#dadce0] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-2">
                  <span>Generated Keys</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-[11px] font-bold border border-[#d2e3fc]">
                    {uuids.length}
                  </span>
                </h3>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <select 
                      value={copyFormat}
                      onChange={(e) => setCopyFormat(e.target.value)}
                      className="google-select text-xs py-1.5 pl-3 pr-7"
                    >
                      <option value="raw">Raw Text</option>
                      <option value="json">JSON Array</option>
                      <option value="csv">CSV Format</option>
                      <option value="sql">SQL IN (...)</option>
                      <option value="javascript">JS Array</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5f6368]" />
                  </div>
                  <button onClick={handleCopyAll} className="btn-google-secondary text-xs py-1.5 px-3">
                    {copiedAll ? <CheckCircle size={13} className="text-[#34a853]" /> : <Copy size={13} />} Copy All
                  </button>
                  <button onClick={handleDownload} className="btn-google-secondary text-xs py-1.5 px-3">
                    <Download size={13} /> Export
                  </button>
                  <button onClick={clearAll} className="btn-google-danger text-xs py-1.5 px-3">Clear</button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar min-h-0">
                <AnimatePresence mode="popLayout">
                  {uuids.map((uuid, index) => (
                    <motion.div 
                      layout
                      key={index}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ delay: Math.min(index * 0.015, 0.25) }}
                      className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl border border-[#dadce0] group hover:border-[#1a73e8] hover:bg-white transition-all shadow-2xs"
                    >
                      <span className="text-[11px] font-mono text-[#9aa0a6] select-none w-6 text-right">{index + 1}.</span>
                      <code className="flex-1 text-xs sm:text-sm font-mono text-[#202124] break-all font-semibold">{uuid}</code>
                      <button 
                        onClick={() => copyToClipboard(uuid, index)}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          copiedIndex === index 
                            ? 'text-[#137333] bg-[#e6f4ea]' 
                            : 'text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] opacity-80 group-hover:opacity-100'
                        }`}
                      >
                        {copiedIndex === index ? <CheckCircle size={15} /> : <Copy size={15} />}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] shadow-2xs">
                <Hash size={30} />
              </div>
              <h3 className="text-lg font-bold text-[#202124] mb-1">Ready to Generate Unique Keys</h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-sm leading-relaxed">
                Choose your UUID version or ULID options on the right, specify quantity, and click Generate.
              </p>
            </div>
          )}
        </motion.div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Settings2 size={16} className="text-[#1a73e8]" /> Generation Settings
            </h3>

            {/* Version Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Identifier Type</label>
              <div className="relative group">
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="v4" className="bg-background text-foreground">UUID v4 — Random</option>
                  <option value="v7" className="bg-background text-foreground">UUID v7 — Time-ordered</option>
                  <option value="v1" className="bg-background text-foreground">UUID v1 — Timestamp</option>
                  <option value="v5" className="bg-background text-foreground">UUID v5 — SHA-1 Name-based</option>
                  <option value="v3" className="bg-background text-foreground">UUID v3 — MD5 Name-based</option>
                  <option value="v8" className="bg-background text-foreground">UUID v8 — Custom Experimental</option>
                  <option value="ulid" className="bg-background text-foreground">ULID — Sortable Base32</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* v3/v5 Name-based Parameters */}
            {(version === 'v3' || version === 'v5') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-border/50"
              >
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Namespace</label>
                  <div className="relative group">
                    <select
                      value={namespaceType}
                      onChange={(e) => setNamespaceType(e.target.value)}
                      className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value="dns" className="bg-background text-foreground">DNS Namespace</option>
                      <option value="url" className="bg-background text-foreground">URL Namespace</option>
                      <option value="oid" className="bg-background text-foreground">OID Namespace</option>
                      <option value="x500" className="bg-background text-foreground">X500 Namespace</option>
                      <option value="custom" className="bg-background text-foreground">Custom UUID…</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
                {namespaceType === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                    value={customNamespace}
                    onChange={(e) => setCustomNamespace(e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                )}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Name String</label>
                  <input
                    type="text"
                    placeholder="e.g. example.com"
                    value={v3v5Name}
                    onChange={(e) => setV3v5Name(e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Timestamp Override */}
            {(version === 'v1' || version === 'v7' || version === 'v8' || version === 'ulid') && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Custom Timestamp</label>
                  <button
                    onClick={() => setUseCustomTime(!useCustomTime)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all ${useCustomTime ? 'bg-primary' : 'bg-muted border border-border/60'}`}
                  >
                    <div className={`w-4 h-4 bg-background rounded-full transition-all shadow-sm ${useCustomTime ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                {useCustomTime && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    <input
                      type="datetime-local"
                      value={new Date(customTimeMs - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setCustomTimeMs(new Date(e.target.value).getTime())}
                      className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Prefix / Suffix */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Key Prefix / Suffix</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="e.g. usr_"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 p-3 pl-4 rounded-xl text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Formatting Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-sm font-semibold text-foreground">Formatting</label>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input 
                    type="checkbox" checked={format.uppercase}
                    onChange={(e) => setFormat({ ...format, uppercase: e.target.checked })}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" 
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Uppercase letters</span>
                </label>
                {version !== 'ulid' && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input 
                      type="checkbox" checked={format.noHyphens}
                      onChange={(e) => setFormat({ ...format, noHyphens: e.target.checked })}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer" 
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Remove hyphens</span>
                  </label>
                )}
              </div>
            </div>

            {/* Quantity Slider */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Quantity</label>
                <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{count}</span>
              </div>
              <div className="relative pt-2 pb-1">
                <input 
                  type="range" min="1" max="100" value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="uuid-slider w-full cursor-pointer outline-none"
                  style={{
                    WebkitAppearance: 'none', appearance: 'none',
                    height: '10px', borderRadius: '999px',
                    background: `linear-gradient(to right, var(--primary) ${(count - 1) / 99 * 100}%, color-mix(in srgb, var(--muted) 60%, transparent) ${(count - 1) / 99 * 100}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              className="w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] active:scale-[0.98]"
            >
              <RefreshCw size={18} /> Generate Keys
            </motion.button>
            <button 
              onClick={clearAll}
              disabled={!hasUuids}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Clear Results
            </button>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .uuid-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: #ffffff; border: 2.5px solid var(--primary);
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .uuid-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2); box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .uuid-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #ffffff; border: 2.5px solid var(--primary);
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
      `}} />
    </div>
  );
};

export default UuidGenerator;
