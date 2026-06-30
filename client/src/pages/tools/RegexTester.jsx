import { useState, useEffect } from 'react';
import { Regex, AlertCircle, CheckCircle2 } from 'lucide-react';

const RegexTester = () => {
  const [regexStr, setRegexStr] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!regexStr) {
      setMatches([]);
      setError('');
      return;
    }

    try {
      const regex = new RegExp(regexStr, flags);
      setError('');

      if (!text) {
        setMatches([]);
        return;
      }

      // If global flag is not set, matchAll will throw an error if we try to use it, 
      // but match returns differently. Let's just use match for simplicity or matchAll if global.
      if (flags.includes('g')) {
        const results = [...text.matchAll(regex)];
        setMatches(results);
      } else {
        const result = text.match(regex);
        setMatches(result ? [result] : []);
      }
    } catch (err) {
      setError(err.message);
      setMatches([]);
    }
  }, [regexStr, flags, text]);

  const renderHighlightedText = () => {
    if (!regexStr || error || matches.length === 0 || !text) {
      return <div className="whitespace-pre-wrap font-mono text-sm">{text || 'Enter test string...'}</div>;
    }

    try {
      const regex = new RegExp(regexStr, flags);
      const parts = [];
      let lastIndex = 0;

      if (flags.includes('g')) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++; // Prevent infinite loop on zero-length matches
            continue;
          }
          
          // Push preceding text
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }
          
          // Push matched text highlighted
          parts.push(
            <span key={match.index} className="bg-primary/30 text-primary-foreground rounded-sm px-0.5 border border-primary/50">
              {match[0]}
            </span>
          );
          
          lastIndex = match.index + match[0].length;
        }
        
        // Push remaining text
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }
      } else {
        const match = text.match(regex);
        if (match) {
          parts.push(text.substring(0, match.index));
          parts.push(
            <span key={match.index} className="bg-primary/30 text-primary-foreground rounded-sm px-0.5 border border-primary/50">
              {match[0]}
            </span>
          );
          parts.push(text.substring(match.index + match[0].length));
        }
      }

      return <div className="whitespace-pre-wrap font-mono text-sm">{parts}</div>;
    } catch (e) {
      return <div className="whitespace-pre-wrap font-mono text-sm">{text}</div>;
    }
  };

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
          <Regex size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Regex Tester</h1>
          <p className="text-muted-foreground mt-1 text-sm">Test and debug regular expressions in real-time.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Regular Expression</label>
            <div className="flex items-center">
              <span className="text-xl font-mono text-muted-foreground mr-2">/</span>
              <input
                type="text"
                value={regexStr}
                onChange={(e) => setRegexStr(e.target.value)}
                placeholder="pattern..."
                className="flex-1 p-3 bg-background border border-border rounded-l-md text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-lg"
              />
              <span className="text-xl font-mono text-muted-foreground mx-2">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="flags"
                className="w-20 p-3 bg-background border border-border rounded-r-md text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-lg"
              />
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Test String</label>
            </div>
            
            <div className="relative flex-1 group">
              {/* Invisible textarea for input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-foreground resize-none outline-none font-mono text-sm z-10 whitespace-pre-wrap"
                spellCheck="false"
              />
              {/* Visible div for highlighting */}
              <div className="absolute inset-0 w-full h-full p-4 pointer-events-none z-0 overflow-hidden break-words">
                {renderHighlightedText()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Flags Reference</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-muted rounded-md transition-colors">
                <input type="checkbox" checked={flags.includes('g')} onChange={() => toggleFlag('g')} className="rounded border-border text-primary focus:ring-primary" />
                <span className="font-mono text-sm font-bold">g</span>
                <span className="text-sm text-muted-foreground">Global</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-muted rounded-md transition-colors">
                <input type="checkbox" checked={flags.includes('i')} onChange={() => toggleFlag('i')} className="rounded border-border text-primary focus:ring-primary" />
                <span className="font-mono text-sm font-bold">i</span>
                <span className="text-sm text-muted-foreground">Case Insensitive</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-muted rounded-md transition-colors">
                <input type="checkbox" checked={flags.includes('m')} onChange={() => toggleFlag('m')} className="rounded border-border text-primary focus:ring-primary" />
                <span className="font-mono text-sm font-bold">m</span>
                <span className="text-sm text-muted-foreground">Multiline</span>
              </label>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Results</h3>
              <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">
                {matches.length} Match{matches.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {matches.map((match, idx) => (
                <div key={idx} className="bg-muted p-3 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Match {idx + 1}</span>
                    <span className="text-xs font-mono text-muted-foreground">Index: {match.index}</span>
                  </div>
                  <div className="font-mono text-sm break-all">
                    {match[0]}
                  </div>
                  {match.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">Groups:</span>
                      {Array.from(match).slice(1).map((group, gIdx) => (
                        <div key={gIdx} className="font-mono text-xs flex gap-2">
                          <span className="text-primary">${gIdx + 1}:</span>
                          <span>{group || 'undefined'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {matches.length === 0 && !error && (
                <div className="text-sm text-muted-foreground flex items-center justify-center py-8">
                  No matches found
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
