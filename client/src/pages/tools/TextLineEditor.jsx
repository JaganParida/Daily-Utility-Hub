import { useState } from 'react';
import { Layers, Copy, Trash2, CheckCircle, ArrowDownAZ, ArrowDownZA, Shuffle, Delete, Type, Plus, Filter, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TextLineEditor = () => {
  const [text, setText] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);

  // Advanced feature states
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMode, setFilterMode] = useState('keep'); // 'keep' | 'remove'
  const [joinSeparator, setJoinSeparator] = useState('comma'); // 'comma' | 'space' | 'newline' | 'custom'
  const [customSeparator, setCustomSeparator] = useState('');

  const getLineCount = () => {
    return text === '' ? 0 : text.split('\n').length;
  };

  const processLines = (action, payload = {}) => {
    if (!text.trim()) return;
    let lines = text.split('\n');

    switch (action) {
      case 'sort-asc':
        lines.sort((a, b) => caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase()));
        toast.success('Sorted lines ascending');
        break;
      case 'sort-desc':
        lines.sort((a, b) => caseSensitive ? b.localeCompare(a) : b.toLowerCase().localeCompare(a.toLowerCase()));
        toast.success('Sorted lines descending');
        break;
      case 'sort-length':
        lines.sort((a, b) => a.length - b.length);
        toast.success('Sorted lines by length');
        break;
      case 'shuffle':
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        toast.success('Shuffled lines');
        break;
      case 'remove-dupes':
        if (caseSensitive) {
          lines = [...new Set(lines)];
        } else {
          const seen = new Set();
          lines = lines.filter(line => {
            const lower = line.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
          });
        }
        toast.success('Removed duplicate lines');
        break;
      case 'remove-empty':
        lines = lines.filter(line => line.trim() !== '');
        toast.success('Removed empty lines');
        break;
      case 'trim':
        lines = lines.map(line => line.trim());
        toast.success('Trimmed whitespace');
        break;
      case 'add-prefix-suffix':
        lines = lines.map(line => `${prefix}${line}${suffix}`);
        setPrefix('');
        setSuffix('');
        toast.success('Added prefix/suffix to all lines');
        break;
      case 'filter-lines':
        if (!filterQuery) return;
        const q = filterQuery.toLowerCase();
        lines = lines.filter(line => {
          const matches = line.toLowerCase().includes(q);
          return filterMode === 'keep' ? matches : !matches;
        });
        setFilterQuery('');
        toast.success(`Filtered lines containing: "${filterQuery}"`);
        break;
      case 'join-lines':
        let sep = ', ';
        if (joinSeparator === 'space') sep = ' ';
        else if (joinSeparator === 'newline') sep = '\n';
        else if (joinSeparator === 'custom') sep = customSeparator;

        lines = [lines.join(sep)];
        toast.success('Joined lines successfully');
        break;
      default:
        break;
    }

    setText(lines.join('\n'));
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const clearText = () => {
    setText('');
    toast.success('Text cleared');
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Text Line Editor</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Clean, sort, deduplicate, filter, or join line-based data and lists instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Editor Area */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex justify-between items-center px-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Line Editor</span>
                <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  {getLineCount()} line{getLineCount() !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!hasText}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-40"
                >
                  {copiedState ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />} Copy
                </button>
                <button
                  onClick={clearText}
                  disabled={!hasText}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-40"
                >
                  <Trash2 size={13} /> Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste list here (one item per line)...&#10;Apple&#10;Banana&#10;Orange"
              className="w-full flex-1 bg-muted/10 border border-border/50 p-4 rounded-xl text-sm font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-inner custom-scrollbar resize-none min-h-0"
              spellCheck="false"
              wrap="off"
            />
          </div>
        </div>

        {/* Right: Controls Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 transition-all duration-300 ${!hasText ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            
            {/* Case Sensitive Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Case Sensitive</span>
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`w-10 h-6 rounded-full p-1 transition-all ${
                  caseSensitive ? 'bg-primary' : 'bg-muted border border-border/60'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-background rounded-full transition-all shadow-sm ${
                    caseSensitive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sort & Shuffle Operations */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ArrowDownAZ size={13} className="text-primary" /> Sort & Shuffle
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => processLines('sort-asc')} className="py-2 px-2.5 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all active:scale-[0.97]">
                  Sort A-Z
                </button>
                <button onClick={() => processLines('sort-desc')} className="py-2 px-2.5 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all active:scale-[0.97]">
                  Sort Z-A
                </button>
                <button onClick={() => processLines('sort-length')} className="py-2 px-2.5 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all active:scale-[0.97]">
                  By Length
                </button>
                <button onClick={() => processLines('shuffle')} className="py-2 px-2.5 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all active:scale-[0.97] flex items-center justify-center gap-1">
                  <Shuffle size={11} /> Shuffle
                </button>
              </div>
            </div>

            {/* Clean & Trim Operations */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Delete size={13} className="text-primary" /> Clean & Trim
              </label>
              <div className="flex flex-col gap-2">
                <button onClick={() => processLines('remove-dupes')} className="py-2 px-3 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all text-left active:scale-[0.98]">
                  Remove Duplicate Lines
                </button>
                <button onClick={() => processLines('remove-empty')} className="py-2 px-3 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all text-left active:scale-[0.98]">
                  Remove Empty Lines
                </button>
                <button onClick={() => processLines('trim')} className="py-2 px-3 text-xs font-semibold rounded-lg border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all text-left active:scale-[0.98]">
                  Trim Whitespace Borders
                </button>
              </div>
            </div>

            {/* Prefix & Suffix Insertion */}
            <div className="space-y-3.5 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Plus size={13} className="text-primary" /> Wrap Prefix / Suffix
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Prefix..."
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Suffix..."
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                />
              </div>
              <button 
                onClick={() => processLines('add-prefix-suffix')}
                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border/50 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                Apply Prefix/Suffix
              </button>
            </div>

            {/* Substring Filtering */}
            <div className="space-y-3.5 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Filter size={13} className="text-primary" /> Line Filtering
              </label>
              <input
                type="text"
                placeholder="Find substring..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
              />
              <div className="flex bg-muted/30 p-0.5 rounded-lg border border-border/50 gap-0.5">
                <button
                  onClick={() => setFilterMode('keep')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterMode === 'keep' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Keep Matching
                </button>
                <button
                  onClick={() => setFilterMode('remove')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterMode === 'remove' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Remove Matching
                </button>
              </div>
              <button 
                onClick={() => processLines('filter-lines')}
                disabled={!filterQuery}
                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border/50 transition-all flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-40"
              >
                Filter Lines
              </button>
            </div>

            {/* Line Joining */}
            <div className="space-y-3.5 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Link2 size={13} className="text-primary" /> Join All Lines
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'comma',  label: 'Comma (,)' },
                  { id: 'space',  label: 'Space ( )' },
                  { id: 'newline', label: 'Newline' },
                  { id: 'custom',  label: 'Custom' }
                ].map(sep => (
                  <button
                    key={sep.id}
                    onClick={() => setJoinSeparator(sep.id)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all active:scale-[0.97] text-center ${
                      joinSeparator === sep.id
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {sep.label}
                  </button>
                ))}
              </div>
              {joinSeparator === 'custom' && (
                <input
                  type="text"
                  placeholder="Custom separator..."
                  value={customSeparator}
                  onChange={(e) => setCustomSeparator(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                />
              )}
              <button 
                onClick={() => processLines('join-lines')}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                Join Lines
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TextLineEditor;
