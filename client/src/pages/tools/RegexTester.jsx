import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Copy, Check, AlertTriangle, CheckCircle2, 
  Replace, Download, BookOpen, ChevronDown, ChevronRight, 
  Settings2, Zap, Code2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Categorized regular expression library
const REGEX_LIBRARY = [
  {
    category: 'Common',
    patterns: [
      { name: 'Email Address', desc: 'Validates standard email format', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'g' },
      { name: 'URL / Website', desc: 'Matches HTTP/HTTPS web URLs', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gi' },
      { name: 'Phone Number', desc: 'Matches international and US formats', pattern: '^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$', flags: 'g' },
    ]
  },
  {
    category: 'Validation & Formats',
    patterns: [
      { name: 'IPv4 Address', desc: 'Matches standard IP addresses', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', flags: 'g' },
      { name: 'HEX Color', desc: 'Matches hex colors (e.g. #fff, #a3c9f2)', pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', flags: 'g' },
      { name: 'Date (YYYY-MM-DD)', desc: 'Matches YYYY-MM-DD date format', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', flags: 'g' }
    ]
  },
  {
    category: 'HTML & Code',
    patterns: [
      { name: 'HTML Tag', desc: 'Matches basic HTML tags', pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s*\\/>)', flags: 'g' },
      { name: 'CSS Comment', desc: 'Matches CSS block comments', pattern: '\\/\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*\\/', flags: 'g' }
    ]
  }
];

// Cheat Sheet reference
const CHEAT_SHEET = [
  { char: '\\d', desc: 'Any digit [0-9]' },
  { char: '\\w', desc: 'Alphanumeric character [a-zA-Z0-9_]' },
  { char: '\\s', desc: 'Whitespace (space, tab, newline)' },
  { char: '.', desc: 'Any character except newline' },
  { char: '^ / $', desc: 'Start / End of string' },
  { char: '*', desc: '0 or more times' },
  { char: '+', desc: '1 or more times' },
  { char: '?', desc: '0 or 1 time (optional)' },
  { char: '{n,m}', desc: 'Between n and m times' },
  { char: '[abc]', desc: 'Any character in the set (a, b, or c)' },
  { char: '[^abc]', desc: 'Any character NOT in the set' },
  { char: '(x)', desc: 'Capture group (saves match)' },
  { char: '(?:x)', desc: 'Non-capturing group' }
];

const RegexTester = () => {
  // Regex Inputs
  const [regexStr, setRegexStr] = useState('[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}');
  const [flags, setFlags] = useState('gi');
  const [testString, setTestString] = useState('Hello world! Please contact support@example.com for help, or sales@example.co.uk.');
  
  // Replace Inputs
  const [replaceStr, setReplaceStr] = useState('[email]');
  const [replaceResult, setReplaceResult] = useState('');

  // Mode: 'match' | 'replace'
  const [mode, setMode] = useState('match');

  // Stats & State
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');
  const [execTime, setExecTime] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState('library'); // 'library' | 'cheatsheet'

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  useEffect(() => {
    try {
      if (!regexStr) {
        setMatches([]);
        setHighlightedText(testString);
        setReplaceResult(testString);
        setError(null);
        setExecTime(0);
        return;
      }

      const t0 = performance.now();
      const regex = new RegExp(regexStr, flags);
      setError(null);

      const replaced = testString.replace(regex, replaceStr);
      setReplaceResult(replaced);

      const foundMatches = [];
      const globalFlags = flags.includes('g') ? flags : flags + 'g';
      const tempRegex = new RegExp(regexStr, globalFlags);
      
      let matchObj;
      while ((matchObj = tempRegex.exec(testString)) !== null) {
        if (matchObj.index === tempRegex.lastIndex) {
          tempRegex.lastIndex++;
        }
        
        const groups = [];
        if (matchObj.length > 1) {
          for (let i = 1; i < matchObj.length; i++) {
            groups.push({
              index: i,
              value: matchObj[i] || '(empty)',
            });
          }
        }

        foundMatches.push({
          value: matchObj[0],
          index: matchObj.index,
          length: matchObj[0].length,
          groups,
        });
      }

      setMatches(flags.includes('g') ? foundMatches : (foundMatches.length > 0 ? [foundMatches[0]] : []));

      if (foundMatches.length > 0) {
        let parts = [];
        let lastIndex = 0;
        const highlightRegex = new RegExp(regexStr, globalFlags);
        let mResult;

        while ((mResult = highlightRegex.exec(testString)) !== null) {
          if (mResult[0] === '') {
            highlightRegex.lastIndex++;
            continue;
          }
          const matchStart = mResult.index;
          const matchEnd = matchStart + mResult[0].length;
          
          if (matchStart > lastIndex) {
            parts.push(escapeHtml(testString.slice(lastIndex, matchStart)));
          }
          
          parts.push(`<mark class="bg-primary/25 border-b-2 border-primary text-foreground px-0.5 rounded-sm animate-none">${escapeHtml(mResult[0])}</mark>`);
          lastIndex = matchEnd;
          
          if (highlightRegex.lastIndex === mResult.index) {
            highlightRegex.lastIndex++;
          }
        }
        
        if (lastIndex < testString.length) {
          parts.push(escapeHtml(testString.slice(lastIndex)));
        }
        setHighlightedText(parts.join(''));
      } else {
        setHighlightedText(escapeHtml(testString));
      }

      const t1 = performance.now();
      setExecTime(parseFloat((t1 - t0).toFixed(2)));

    } catch (err) {
      setError(err.message);
      setMatches([]);
      setHighlightedText(escapeHtml(testString));
      setReplaceResult(testString);
    }
  }, [regexStr, flags, testString, replaceStr]);

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const copyMatch = (val, idx) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(idx);
    toast.success('Copied match!');
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  const loadPreset = (preset) => {
    setRegexStr(preset.pattern);
    setFlags(preset.flags);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const exportMatches = () => {
    const list = matches.map(m => ({ value: m.value, index: m.index, length: m.length }));
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regex_matches.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Matches exported!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Search size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Regex Tester</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Write regular expressions, verify matches, and test replacement patterns in real-time.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Main Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
          
          {/* Regex Input Section */}
          <div className="mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-foreground">Regular Expression</label>
              {execTime > 0 && (
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> Took {execTime}ms
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1 flex bg-background border border-border/80 rounded-xl focus-within:ring-2 focus-within:ring-primary/45 transition-all font-mono text-base overflow-hidden">
                <span className="px-4 py-3.5 text-muted-foreground/60 border-r border-border/80 font-bold bg-muted/20 select-none">/</span>
                <input
                  type="text"
                  value={regexStr}
                  onChange={(e) => setRegexStr(e.target.value)}
                  className="flex-1 bg-transparent border-none px-4 py-3.5 text-foreground outline-none font-bold placeholder:text-muted-foreground/50"
                  placeholder="Enter pattern..."
                  spellCheck="false"
                />
                <span className="px-4 py-3.5 text-muted-foreground/60 border-l border-border/80 font-bold bg-muted/20 select-none">/</span>
                <input
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  className="w-20 bg-muted/10 border-none px-3 py-3.5 text-primary font-bold outline-none tracking-widest text-center"
                  placeholder="flags"
                />
              </div>

              {/* Flags quick select */}
              <div className="flex gap-1.5 shrink-0">
                {['g', 'i', 'm', 's', 'u'].map((flag) => {
                  const isActive = flags.includes(flag);
                  return (
                    <button
                      key={flag}
                      onClick={() => toggleFlag(flag)}
                      className={`w-11 h-11 rounded-xl text-sm font-mono font-bold border transition-all flex items-center justify-center cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                          : 'bg-background border-border/80 text-foreground hover:bg-muted'
                      }`}
                      title={`Toggle ${flag === 'g' ? 'Global' : flag === 'i' ? 'Case Insensitive' : flag === 'm' ? 'Multiline' : flag === 's' ? 'dotAll' : 'Unicode'}`}
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono flex items-center gap-2"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner mb-6 shrink-0 max-w-xs">
            {[
              { id: 'match', label: 'Match', icon: Search },
              { id: 'replace', label: 'Replace', icon: Replace }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={`flex-1 relative py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === t.id && (
                    <motion.div
                      layoutId="regex-mode-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Workspaces */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[350px]">
            {/* Input / Test String */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Test String</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {matches.length} matches
                </span>
              </div>
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-sm text-foreground resize-none custom-scrollbar min-h-[250px] leading-relaxed"
                placeholder="Enter string to test..."
                spellCheck="false"
              />
            </div>

            {/* Results Output */}
            <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-background/30 relative">
              <AnimatePresence mode="wait">
                {mode === 'match' ? (
                  <motion.div
                    key="match-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full min-h-[250px]"
                  >
                    <div className="px-4 py-3 border-b border-border bg-muted/20 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Match Highlights</span>
                      {matches.length > 0 && (
                        <button
                          onClick={exportMatches}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={12} /> Export JSON
                        </button>
                      )}
                    </div>
                    <div className="flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm leading-relaxed">
                      {highlightedText ? (
                        <div 
                          className="whitespace-pre-wrap break-all" 
                          dangerouslySetInnerHTML={{ __html: highlightedText }}
                        />
                      ) : (
                        <span className="text-muted-foreground italic">Highlight view will appear here...</span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="replace-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full min-h-[250px]"
                  >
                    <div className="px-4 py-3 border-b border-border bg-muted/20 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Replacement Output</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(replaceResult);
                          toast.success('Replaced text copied!');
                        }}
                        disabled={!replaceResult}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Copy size={12} /> Copy Output
                      </button>
                    </div>
                    <div className="p-3 border-b border-border/80 bg-muted/5 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Replace With</label>
                        <input
                          type="text"
                          value={replaceStr}
                          onChange={(e) => setReplaceStr(e.target.value)}
                          placeholder="replacement pattern (e.g. $1)"
                          className="w-full p-2 bg-background border border-border/85 rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary/50 outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm leading-relaxed">
                      <pre className="whitespace-pre-wrap break-all text-primary">
                        {replaceResult || 'Resulting text will appear here...'}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Capture Groups Details */}
          {mode === 'match' && matches.some(m => m.groups && m.groups.length > 0) && (
            <div className="mt-6 border border-border/80 rounded-xl bg-background/30 overflow-hidden">
              <div className="p-3.5 border-b border-border bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code2 size={13} /> Captured Groups Detail
                </h4>
              </div>
              <div className="p-4 max-h-48 overflow-y-auto custom-scrollbar space-y-3">
                {matches.map((m, idx) => (
                  m.groups.length > 0 && (
                    <div key={idx} className="text-xs space-y-2 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                      <span className="font-bold text-foreground block">Match {idx + 1}: <span className="font-mono text-primary">"{m.value}"</span></span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {m.groups.map((g, gIdx) => (
                          <div key={gIdx} className="bg-muted/40 p-2 rounded-lg border border-border/50 font-mono text-[11px] truncate">
                            <span className="text-muted-foreground font-bold">Group {g.index}:</span> {g.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Output match tags list */}
          {mode === 'match' && matches.length > 0 && (
            <div className="mt-6 border border-border/80 rounded-xl bg-background/30 overflow-hidden">
              <div className="p-3.5 border-b border-border bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Individual Matches ({matches.length})</h4>
              </div>
              <div className="p-4 flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-2 bg-muted/50 border border-border/80 px-2.5 py-1.5 rounded-lg font-mono text-xs text-foreground cursor-pointer hover:bg-muted transition-colors relative"
                    onClick={() => copyMatch(m.value, idx)}
                  >
                    <span className="text-[10px] text-muted-foreground font-bold">#{idx + 1}</span>
                    <span className="text-primary font-bold truncate max-w-[150px]">{m.value}</span>
                    <span className="text-[10px] text-muted-foreground/60">@{m.index}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-[10px] text-primary underline">
                      {copiedIndex === idx ? 'Copied' : 'Copy'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          
          {/* Preset / Cheatsheet tab bar */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
              {[
                { id: 'library', label: 'Preset Library', icon: BookOpen },
                { id: 'cheatsheet', label: 'Cheat Sheet', icon: Settings2 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 relative z-10 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    sidebarTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sidebarTab === tab.id && (
                    <motion.div
                      layoutId="sidebar-tab-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {sidebarTab === 'library' ? (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1"
                >
                  {REGEX_LIBRARY.map((categoryObj, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">
                        {categoryObj.category}
                      </div>
                      <div className="space-y-1.5">
                        {categoryObj.patterns.map((item, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => loadPreset(item)}
                            className="w-full text-left p-2.5 rounded-xl border border-border/50 hover:border-primary/30 bg-background/50 hover:bg-muted/30 transition-all group cursor-pointer"
                          >
                            <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="cheatsheet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 text-xs"
                >
                  {CHEAT_SHEET.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-background/50 border border-border/50 rounded-xl font-mono">
                      <span className="text-primary font-bold">{item.char}</span>
                      <span className="text-muted-foreground text-[11px] font-semibold">{item.desc}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegexTester;
