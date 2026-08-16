import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Braces, Copy, Check, AlertTriangle, Download, Trash2, 
  Search, ChevronRight, ChevronDown, Settings2, ArrowDownAZ, 
  Wand2, Minimize2, ListTree, FileJson 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ToolHeader from '../../components/ToolHeader';

// ────────────────────────────────────────────
// Helper: compute JSON statistics recursively
// ────────────────────────────────────────────
const computeStats = (value, depth = 0) => {
  const stats = {
    keys: 0,
    maxDepth: depth,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  };

  if (value === null) {
    stats.nulls = 1;
    return stats;
  }

  if (Array.isArray(value)) {
    stats.arrays = 1;
    value.forEach((item) => {
      const child = computeStats(item, depth + 1);
      stats.keys += child.keys;
      stats.maxDepth = Math.max(stats.maxDepth, child.maxDepth);
      stats.arrays += child.arrays;
      stats.objects += child.objects;
      stats.strings += child.strings;
      stats.numbers += child.numbers;
      stats.booleans += child.booleans;
      stats.nulls += child.nulls;
    });
    return stats;
  }

  if (typeof value === 'object') {
    stats.objects = 1;
    const entries = Object.entries(value);
    stats.keys = entries.length;
    entries.forEach(([, v]) => {
      const child = computeStats(v, depth + 1);
      stats.keys += child.keys;
      stats.maxDepth = Math.max(stats.maxDepth, child.maxDepth);
      stats.arrays += child.arrays;
      stats.objects += child.objects;
      stats.strings += child.strings;
      stats.numbers += child.numbers;
      stats.booleans += child.booleans;
      stats.nulls += child.nulls;
    });
    return stats;
  }

  if (typeof value === 'string') stats.strings = 1;
  else if (typeof value === 'number') stats.numbers = 1;
  else if (typeof value === 'boolean') stats.booleans = 1;

  return stats;
};

// ────────────────────────────────────────────
// Helper: recursively sort all object keys
// ────────────────────────────────────────────
const sortKeysDeep = (value) => {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = sortKeysDeep(value[key]);
      return acc;
    }, {});
};

// ────────────────────────────────────────────
// Helper: auto-fix common JSON mistakes
// ────────────────────────────────────────────
const autoFixJson = (raw) => {
  let fixed = raw.trim();
  fixed = fixed.replace(/'/g, '"');
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');
  fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  return fixed;
};

// ────────────────────────────────────────────
// Helper: get display type badge
// ────────────────────────────────────────────
const getValueType = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const typeColors = {
  string: 'text-amber-500',
  number: 'text-primary',
  boolean: 'text-purple-500',
  null: 'text-red-400',
  object: 'text-emerald-500',
  array: 'text-primary',
};

const typeBadgeBg = {
  string: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  number: 'bg-primary/10 text-blue-600 border-primary/20',
  boolean: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  null: 'bg-red-500/10 text-red-500 border-red-500/20',
  object: 'bg-primary/10 text-emerald-600 border-emerald-500/20',
  array: 'bg-primary/10 text-cyan-600 border-primary/20',
};

const TreeNode = ({ label, value, path, depth = 0, searchTerm, onSelectPath }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const childEntries = isExpandable
    ? Array.isArray(value)
      ? value.map((v, i) => [i, v])
      : Object.entries(value)
    : [];

  const labelStr = String(label).toLowerCase();
  const valueStr = !isExpandable ? String(value).toLowerCase() : '';
  const search = (searchTerm || '').toLowerCase();
  const isMatch = search && (labelStr.includes(search) || valueStr.includes(search));

  const handleClick = useCallback(() => {
    if (onSelectPath) onSelectPath(path);
  }, [path, onSelectPath]);

  return (
    <div className="select-none" style={{ paddingLeft: depth > 0 ? 18 : 0 }}>
      <div 
        onClick={handleClick}
        className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs transition-colors cursor-pointer group ${
          isMatch ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-muted/40'
        }`}
      >
        {isExpandable ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-muted rounded text-muted-foreground transition-colors cursor-pointer"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5 h-5" />
        )}

        <span className="font-mono font-bold text-foreground">{label}</span>
        <span className="text-muted-foreground/60 font-mono">:</span>

        {!isExpandable ? (
          <span className={`font-mono truncate max-w-xs ${typeColors[type] || 'text-foreground'}`}>
            {type === 'string' ? `"${value}"` : String(value)}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            {type} ({childEntries.length})
          </span>
        )}

        <span className={`ml-auto text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded-md ${typeBadgeBg[type] || 'bg-muted text-muted-foreground border-border'}`}>
          {type}
        </span>
      </div>

      <AnimatePresence>
        {isExpandable && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-l border-border/60 ml-2.5 pl-1 mt-0.5"
          >
            {childEntries.map(([k, v]) => (
              <TreeNode
                key={k}
                label={k}
                value={v}
                path={path ? `${path}.${k}` : `$..${k}`}
                depth={depth + 1}
                searchTerm={searchTerm}
                onSelectPath={onSelectPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MODES = [
  { key: 'format', label: 'Format JSON', icon: Braces },
  { key: 'minify', label: 'Minify JSON', icon: Minimize2 },
  { key: 'tree', label: 'Tree Explorer', icon: ListTree },
];

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('format');
  
  // Settings
  const [tabSize, setTabSize] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [autoFix, setAutoFix] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Parse JSON for tree explorer and stats
  const parsedData = useMemo(() => {
    if (!input.trim()) return null;
    try {
      let raw = input;
      if (autoFix) {
        raw = autoFixJson(raw);
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [input, autoFix]);

  const stats = useMemo(() => {
    if (!parsedData) return null;
    try {
      const basic = computeStats(parsedData);
      const sizeBytes = new Blob([JSON.stringify(parsedData)]).size;
      return { ...basic, size: sizeBytes };
    } catch {
      return null;
    }
  }, [parsedData]);

  // Main converter logic
  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let raw = input;
      if (autoFix) {
        raw = autoFixJson(raw);
      }

      let parsed = JSON.parse(raw);
      if (sortKeys) {
        parsed = sortKeysDeep(parsed);
      }

      setError(null);
      if (mode === 'format') {
        setOutput(JSON.stringify(parsed, null, tabSize));
      } else if (mode === 'minify') {
        setOutput(JSON.stringify(parsed));
      }
    } catch (err) {
      setError(err.message || 'Invalid JSON format');
      setOutput('');
    }
  }, [input, mode, tabSize, sortKeys, autoFix]);

  useEffect(() => {
    handleFormat();
  }, [handleFormat]);

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('JSON copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('File saved!');
  };

  const loadSample = () => {
    const sample = {
      user: {
        id: 42,
        name: 'John Doe',
        email: 'john.doe@example.com',
        active: true,
        roles: ['admin', 'developer'],
        address: {
          city: 'San Francisco',
          zip: '94103',
          coordinates: null
        }
      }
    };
    setInput(JSON.stringify(sample, null, 2));
    setError(null);
    toast.success('Sample JSON loaded!');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
    setSearchTerm('');
    setSelectedPath('');
  };

  const highlightedOutput = useMemo(() => {
    if (!output || !searchTerm.trim()) return null;
    const search = searchTerm.trim().toLowerCase();
    let remaining = output;
    const parts = [];
    let key = 0;

    while (remaining.length > 0) {
      const idx = remaining.toLowerCase().indexOf(search);
      if (idx === -1) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
      }
      parts.push(
        <mark key={key++} className="bg-amber-500/30 text-amber-900 font-bold rounded px-0.5 animate-none">
          {remaining.slice(idx, idx + search.length)}
        </mark>
      );
      remaining = remaining.slice(idx + search.length);
    }
    return parts;
  }, [output, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="tool-page-container"
    >
      <ToolHeader
        title="JSON Formatter & Validator"
        description="Beautify, validate, structure, minify, and interactively explore JSON data in your browser."
        category="Developer Tools"
        categoryPath="/search"
        icon={Braces}
        iconColor="text-[#137333] bg-[#e6f4ea] border-[#ceead6]"
        badge="Zero Server Upload"
        extraBadge="Tree Visualizer"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Main Workspace */}
        <div className="flex-1 w-full tool-card p-5 sm:p-6 flex flex-col">
          {/* Mode Switcher */}
          <div className="google-tab-group mb-6 w-full">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 google-tab-item py-2.5 ${mode === key ? 'active' : ''}`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Editors / Visualizer */}
          <div className="flex flex-col flex-1">
            {(mode === 'format' || mode === 'minify') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-[440px]">
                {/* Input Panel */}
                <div className="flex flex-col rounded-xl border border-[#dadce0] overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 border-b border-[#dadce0] bg-[#f8f9fa] flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                      <FileJson size={14} className="text-[#1a73e8]" /> Input JSON
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={loadSample}
                        className="btn-google-secondary text-xs py-1 px-2.5 font-semibold"
                      >
                        Sample
                      </button>
                      <button
                        onClick={clearAll}
                        disabled={!input.trim()}
                        className="btn-google-danger text-xs py-1 px-2.5 disabled:opacity-40"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-xs sm:text-sm text-[#202124] resize-none custom-scrollbar min-h-[360px] leading-relaxed"
                      spellCheck="false"
                      placeholder="Paste your JSON here..."
                    />
                  </div>
                </div>

                {/* Output Panel */}
                <div className="flex flex-col rounded-xl border border-[#dadce0] overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 border-b border-[#dadce0] bg-[#f8f9fa] flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
                      {mode === 'minify' ? <Minimize2 size={14} className="text-[#1a73e8]" /> : <Braces size={14} className="text-[#1a73e8]" />} Output
                      {!error && output && <Check size={13} className="text-[#137333]" />}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        disabled={!output}
                        className="btn-google-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                      >
                        {copied ? <Check size={12} className="text-[#137333]" /> : <Copy size={12} />}
                        Copy
                      </button>
                      <button
                        onClick={downloadJson}
                        disabled={!output}
                        className="btn-google-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                      >
                        <Download size={12} /> Save
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative overflow-auto custom-scrollbar min-h-[360px] bg-white">
                    {searchTerm && highlightedOutput ? (
                      <pre className="w-full h-full p-4 text-xs sm:text-sm text-[#1a73e8] font-mono whitespace-pre-wrap break-words leading-relaxed font-medium">
                        {highlightedOutput}
                      </pre>
                    ) : (
                      <textarea
                        readOnly
                        value={output}
                        className="w-full h-full bg-transparent p-4 text-xs sm:text-sm text-[#1a73e8] focus:outline-none font-mono resize-none custom-scrollbar min-h-[360px] leading-relaxed font-medium"
                        spellCheck="false"
                        placeholder="Formatted/minified JSON will appear here..."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {mode === 'tree' && (
              <div className="flex flex-col flex-1 gap-6">
                <div className="flex flex-col rounded-xl border border-border/80 overflow-hidden bg-background/30">
                  <div className="p-3.5 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileJson size={14} /> Input JSON
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={loadSample}
                        className="text-xs px-2.5 py-1 bg-muted/20 hover:bg-muted/40 border border-border/50 text-foreground rounded-lg transition-colors font-semibold cursor-pointer"
                      >
                        Sample
                      </button>
                      <button
                        onClick={clearAll}
                        disabled={!input.trim()}
                        className="text-xs px-2.5 py-1 bg-red-500/10 disabled:bg-muted/10 text-red-500 disabled:text-muted-foreground hover:bg-red-500/20 border border-red-500/20 disabled:border-border/50 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={11} /> Clear
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-transparent p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar font-medium leading-relaxed"
                    rows={5}
                    spellCheck="false"
                    placeholder="Enter JSON to visualize in Tree Explorer..."
                  />
                </div>

                <div className="rounded-xl border border-border/80 overflow-hidden bg-background/30 flex-1 min-h-[350px] flex flex-col">
                  <div className="p-3.5 border-b border-border/80 bg-muted/20 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListTree size={14} /> Tree Explorer
                    </h3>
                    {selectedPath && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Path:</span>
                        <code className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md max-w-[200px] truncate animate-none">
                          {selectedPath}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPath);
                            toast.success('Path copied!');
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-5 overflow-auto custom-scrollbar flex-1 max-h-[500px]">
                    {parsedData ? (
                      <TreeNode
                        label="root"
                        value={parsedData}
                        path="$"
                        searchTerm={searchTerm}
                        onSelectPath={setSelectedPath}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center h-full">
                        <ListTree size={32} className="opacity-45 mb-2" />
                        <p>Enter valid JSON above to explore its tree structure.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 flex items-start gap-2.5 text-sm text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20"
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Invalid JSON</p>
                  <p className="font-mono text-[11px] opacity-90 mt-1 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-2">
                <Settings2 size={16} className="text-[#1a73e8]" /> Settings
              </h3>
            </div>

            {/* Indent sizes */}
            {mode === 'format' && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#202124]">Indentation Tab Size</label>
                <div className="google-tab-group">
                  {[2, 4, 8].map((size) => (
                    <button
                      key={size}
                      onClick={() => setTabSize(size)}
                      className={`flex-1 google-tab-item ${tabSize === size ? 'active' : ''}`}
                    >
                      {size} Spaces
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#202124]">Search Keys / Values</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search in JSON..."
                  className="w-full google-input pl-9 text-xs font-mono"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
              </div>
            </div>

            {/* Sorting Toggles */}
            <div className="space-y-3.5 pt-3 border-t border-[#dadce0]">
              {/* Sort Keys */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#202124] block">Sort Object Keys</span>
                  <span className="text-[11px] text-[#5f6368] block">Sort keys alphabetically A-Z</span>
                </div>
                <button
                  onClick={() => setSortKeys(!sortKeys)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    sortKeys ? 'bg-primary' : 'bg-muted/50 border border-border'
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md animate-none"
                    style={{ left: sortKeys ? 'calc(100% - 22px)' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Auto Fix */}
              <div className="flex items-center justify-between pt-3.5 border-t border-border/50">
                <div>
                  <span className="text-sm font-semibold block text-foreground">Auto-Fix Errors</span>
                  <span className="text-xs text-muted-foreground block">Quotes, trailing commas, etc.</span>
                </div>
                <button
                  onClick={() => setAutoFix(!autoFix)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    autoFix ? 'bg-primary' : 'bg-muted/50 border border-border'
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md animate-none"
                    style={{ left: autoFix ? 'calc(100% - 22px)' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Stats details bar */}
          {stats && (
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ArrowDownAZ size={16} /> JSON Statistics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground">
                <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl">
                  <div className="text-[10px] text-muted-foreground/60 uppercase">File Size</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{stats.size} Bytes</div>
                </div>
                <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl">
                  <div className="text-[10px] text-muted-foreground/60 uppercase">Max Depth</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{stats.maxDepth} Levels</div>
                </div>
                <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl">
                  <div className="text-[10px] text-muted-foreground/60 uppercase">Object Count</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{stats.objects}</div>
                </div>
                <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl">
                  <div className="text-[10px] text-muted-foreground/60 uppercase">Array Count</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{stats.arrays}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default JsonFormatter;
