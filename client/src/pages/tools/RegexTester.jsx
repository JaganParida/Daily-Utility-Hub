import { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RegexTester = () => {
  const [regexStr, setRegexStr] = useState('[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}');
  const [flags, setFlags] = useState('gi');
  const [testString, setTestString] = useState('Hello world! Please contact support@example.com for help, or sales@example.co.uk.');
  
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(-1);

  useEffect(() => {
    try {
      if (!regexStr) {
        setMatches([]);
        setHighlightedText(testString);
        setError(null);
        return;
      }

      // Test if regex is valid
      const regex = new RegExp(regexStr, flags);
      setError(null);

      // Find matches
      let m;
      const foundMatches = [];
      const tempRegex = new RegExp(regexStr, flags.includes('g') ? flags : flags + 'g'); // Ensure global to find all
      
      while ((m = tempRegex.exec(testString)) !== null) {
        if (m.index === tempRegex.lastIndex) tempRegex.lastIndex++; // Prevent infinite loop for zero-length matches
        foundMatches.push(m[0]);
      }
      
      setMatches(flags.includes('g') ? foundMatches : (foundMatches.length > 0 ? [foundMatches[0]] : []));

      // Highlight text
      if (foundMatches.length > 0) {
        let parts = [];
        let lastIndex = 0;
        
        // Use a new regex instance for replacement to reset state
        const highlightRegex = new RegExp(regexStr, flags.includes('g') ? flags : flags + 'g');
        
        let matchResult;
        while ((matchResult = highlightRegex.exec(testString)) !== null) {
          if (matchResult[0] === '') {
            highlightRegex.lastIndex++;
            continue;
          }
          parts.push(testString.substring(lastIndex, matchResult.index));
          parts.push(`<mark class="bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 rounded px-0.5">${matchResult[0]}</mark>`);
          lastIndex = highlightRegex.lastIndex;
          
          if (!flags.includes('g')) break;
        }
        parts.push(testString.substring(lastIndex));
        setHighlightedText(parts.join(''));
      } else {
        setHighlightedText(testString);
      }

    } catch (err) {
      setError(err.message);
      setMatches([]);
      setHighlightedText(testString);
    }
  }, [regexStr, flags, testString]);

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const copyMatch = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Match copied!');
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg shadow-sm">
          <Search size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Regex Tester</h1>
          <p className="text-muted-foreground mt-1 text-sm">Write regular expressions and test them against sample text in real-time.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-[500px]">
        
        {/* Expression Input */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 shrink-0 relative overflow-hidden">
          {error && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 block">Regular Expression</label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 flex w-full bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-cyan-500/50 transition-shadow">
              <div className="px-4 py-3 text-muted-foreground border-r border-border font-mono font-bold bg-muted/30 rounded-l-xl">/</div>
              <input
                type="text"
                value={regexStr}
                onChange={(e) => setRegexStr(e.target.value)}
                className="flex-1 bg-transparent border-none px-4 py-3 text-foreground focus:outline-none font-mono text-lg"
                placeholder="pattern"
                spellCheck="false"
              />
              <div className="px-4 py-3 text-muted-foreground border-l border-border font-mono font-bold bg-muted/30">/</div>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className="w-16 bg-transparent border-none px-3 py-3 text-cyan-500 font-bold focus:outline-none font-mono tracking-widest bg-muted/10 rounded-r-xl"
                placeholder="flags"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              {['g', 'i', 'm'].map(flag => (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  className={`flex-1 md:w-12 h-12 rounded-xl text-sm font-mono font-bold border transition-all ${flags.includes(flag) ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                  title={flag === 'g' ? 'Global' : flag === 'i' ? 'Case Insensitive' : 'Multiline'}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-mono bg-red-500/10 p-3 rounded-lg">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0">
          
          {/* Test String */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0 z-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Test String</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full">
                <CheckCircle2 size={14} />
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </div>
            </div>
            
            <div className="relative flex-1 bg-background text-lg font-mono">
              {/* Highlight layer */}
              <div 
                className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap break-words"
                style={{ color: 'transparent', caretColor: 'transparent' }}
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
              {/* Actual Textarea */}
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent border-none p-6 text-foreground focus:outline-none resize-none custom-scrollbar whitespace-pre-wrap break-words"
                spellCheck="false"
                style={{ WebkitTextFillColor: 'transparent', WebkitOpacity: 1, color: 'transparent' }} // Make original text invisible so highlights show through, but still allow selection
              />
            </div>
          </div>

          {/* Matches List */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Results</h3>
            </div>
            <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
              {matches.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Search size={48} className="mb-4" />
                  <p>No matches found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-xl p-3 relative group">
                      <div className="text-xs text-muted-foreground mb-1 font-bold">Match {idx + 1}</div>
                      <div className="font-mono text-sm break-all text-cyan-600 dark:text-cyan-400">{match}</div>
                      
                      <button 
                        onClick={() => copyMatch(match, idx)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${copiedIndex === idx ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-cyan-500 hover:text-white opacity-0 group-hover:opacity-100'}`}
                      >
                        {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RegexTester;
