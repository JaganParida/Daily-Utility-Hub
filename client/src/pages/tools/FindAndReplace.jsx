import { useState } from 'react';
import { Type, Copy, Check, Search, IterationCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FindAndReplace = () => {
  const [text, setText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  // Options
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const getReplacedText = () => {
    if (!text || !findText) return text;
    
    try {
      let searchPattern;
      let flags = matchCase ? 'g' : 'gi';

      if (useRegex) {
        searchPattern = new RegExp(findText, flags);
      } else {
        // Escape special characters for string literal search
        let escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) {
          searchPattern = new RegExp(`\\b${escapedFind}\\b`, flags);
        } else {
          searchPattern = new RegExp(escapedFind, flags);
        }
      }

      return text.replace(searchPattern, replaceText);
    } catch (e) {
      // Return original text if regex is invalid while typing
      return text;
    }
  };

  const getMatchCount = () => {
    if (!text || !findText) return 0;
    try {
      let searchPattern;
      let flags = matchCase ? 'g' : 'gi';

      if (useRegex) {
        searchPattern = new RegExp(findText, flags);
      } else {
        let escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) {
          searchPattern = new RegExp(`\\b${escapedFind}\\b`, flags);
        } else {
          searchPattern = new RegExp(escapedFind, flags);
        }
      }
      
      const matches = text.match(searchPattern);
      return matches ? matches.length : 0;
    } catch (e) {
      return 0;
    }
  };

  const replacedOutput = getReplacedText();
  const currentMatches = getMatchCount();

  const handleCopy = () => {
    if (!replacedOutput) return;
    navigator.clipboard.writeText(replacedOutput);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setText('');
    setFindText('');
    setReplaceText('');
    toast.success('Fields cleared');
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg shadow-sm">
          <Search size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Find & Replace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Find and replace text with Regex support, Match Case, and Whole Word options.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_300px] gap-6 min-h-0">
        
        {/* Editor Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-4 sm:p-6 border-b border-border bg-muted/20 space-y-4 shrink-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Find</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Text to find..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Replace With</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Replacement text..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${matchCase ? 'bg-cyan-500 border-cyan-500' : 'bg-background border-border group-hover:border-cyan-500/50'}`}>
                  {matchCase && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Match Case</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${wholeWord && !useRegex ? 'bg-cyan-500 border-cyan-500' : 'bg-background border-border group-hover:border-cyan-500/50'} ${useRegex ? 'opacity-50' : ''}`}>
                  {wholeWord && !useRegex && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" disabled={useRegex} checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
                <span className={`text-sm font-medium transition-colors ${useRegex ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground group-hover:text-foreground'}`}>Whole Word</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useRegex ? 'bg-cyan-500 border-cyan-500' : 'bg-background border-border group-hover:border-cyan-500/50'}`}>
                  {useRegex && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Use Regex</span>
              </label>
            </div>
          </div>

          <div className="flex-1 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border min-h-[400px]">
             {/* Input */}
             <div className="flex flex-col relative h-full">
               <div className="absolute top-3 right-3 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-card/80 backdrop-blur px-2 py-1 rounded">Input</div>
               <textarea
                 className="w-full h-full p-6 bg-transparent resize-none text-foreground text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar"
                 placeholder="Paste your source text here..."
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 spellCheck="false"
               />
             </div>
             {/* Output */}
             <div className="flex flex-col relative h-full bg-muted/10">
               <div className="absolute top-3 right-3 text-xs font-bold text-cyan-500 uppercase tracking-wider bg-card/80 backdrop-blur px-2 py-1 rounded border border-cyan-500/20">Output</div>
               <textarea
                 className="w-full h-full p-6 bg-transparent resize-none text-foreground text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar"
                 value={replacedOutput}
                 readOnly
                 placeholder="Replaced text will appear here..."
               />
             </div>
          </div>
          
        </div>

        {/* Sidebar */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
              <IterationCcw size={14} /> Replace Stats
            </h3>
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-cyan-600 dark:text-cyan-400">{currentMatches}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-2">Occurrences Found</span>
            </div>
          </div>

          <div className="mt-auto space-y-3">
             <button onClick={handleCopy} disabled={!replacedOutput} className="w-full py-3 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none">
               {copied ? <Check size={18} /> : <Copy size={18} />} Copy Result
             </button>
             <button onClick={clearAll} className="w-full py-3 bg-red-500/10 text-red-500 font-medium rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
               Clear All
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FindAndReplace;
