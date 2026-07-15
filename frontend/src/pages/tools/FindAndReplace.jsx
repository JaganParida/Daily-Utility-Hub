import { useState } from 'react';
import { Search, Copy, Trash2, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const FindAndReplace = () => {
  const [text, setText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  // Search Options
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  
  const [copied, setCopied] = useState(false);

  const getReplacedText = () => {
    if (!text) return '';
    if (!findText) return text;
    
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

      return text.replace(searchPattern, replaceText);
    } catch (e) {
      return text; // Return original text if regex is invalid while typing
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
    toast.success('Copied output to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (presetName) => {
    if (!text) return;
    let newText = text;
    let message = '';

    switch (presetName) {
      case 'double-spaces':
        newText = text.replace(/ +/g, ' ');
        message = 'Removed double spaces';
        break;
      case 'html-tags':
        newText = text.replace(/<[^>]*>/g, '');
        message = 'Stripped HTML tags';
        break;
      case 'emails':
        newText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
        message = 'Stripped email addresses';
        break;
      case 'linebreaks':
        newText = text.replace(/\r?\n|\r/g, ' ');
        message = 'Collapsed line breaks';
        break;
      case 'numbers':
        newText = text.replace(/\d+/g, '');
        message = 'Removed all digits';
        break;
      case 'punctuation':
        newText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        message = 'Removed punctuation';
        break;
      default:
        break;
    }

    setText(newText);
    toast.success(message);
  };

  const clearAll = () => {
    setText('');
    setFindText('');
    setReplaceText('');
    toast.success('Cleared all fields');
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Search size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Find & Replace</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Find and replace patterns in real-time, supporting Case Sensitivity, Whole Words, and Regular Expressions (Regex).</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Input/Output Split Editor Area */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]"
        >
          
          {/* Find & Replace Controls inside Left Card (Shrink-0) */}
          <div className="p-4 md:p-5 border-b border-border bg-muted/20 space-y-4 shrink-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Find Text / Pattern</label>
                <input
                  type="text"
                  disabled={!hasText}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 px-4 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                  placeholder={useRegex ? "Enter regex (e.g. \\d+)" : "Search term..."}
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Replace With</label>
                <input
                  type="text"
                  disabled={!hasText}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 px-4 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                  placeholder="Substitution term..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                />
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className={`flex items-center gap-2 cursor-pointer group select-none ${!hasText ? 'opacity-45' : ''}`}>
                <input 
                  type="checkbox" 
                  disabled={!hasText}
                  checked={matchCase} 
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed" 
                />
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Match Case</span>
              </label>
              
              <label className={`flex items-center gap-2 cursor-pointer group select-none ${!hasText || useRegex ? 'opacity-40' : ''}`}>
                <input 
                  type="checkbox" 
                  disabled={!hasText || useRegex}
                  checked={wholeWord} 
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed" 
                />
                <span className={`text-xs font-semibold transition-colors ${useRegex ? 'line-through' : 'group-hover:text-foreground text-muted-foreground'}`}>Whole Word</span>
              </label>

              <label className={`flex items-center gap-2 cursor-pointer group select-none ${!hasText ? 'opacity-45' : ''}`}>
                <input 
                  type="checkbox" 
                  disabled={!hasText}
                  checked={useRegex} 
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed" 
                />
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Use Regex</span>
              </label>
            </div>
          </div>

          {/* Input & Output Textareas split */}
          <div className="flex-1 min-h-0 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Input column */}
            <div className="flex flex-col relative h-full min-h-0">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-card/90 border border-border/40 px-2 py-0.5 rounded shadow-sm z-10 select-none">
                Input Text
              </div>
              <textarea
                className="w-full h-full p-5 bg-transparent resize-none text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar min-h-0"
                placeholder="Paste your source text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck="false"
              />
            </div>
            
            {/* Output column */}
            <div className="flex flex-col relative h-full bg-muted/10 min-h-0">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-primary uppercase tracking-wider bg-card/90 border border-primary/20 px-2 py-0.5 rounded shadow-sm z-10 select-none">
                Replaced Output
              </div>
              <textarea
                className="w-full h-full p-5 bg-transparent resize-none text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar min-h-0"
                value={replacedOutput}
                readOnly
                placeholder="Replaced output will be generated here in real-time..."
                spellCheck="false"
              />
            </div>
          </div>
          
        </motion.div>

        {/* Right: Sidebar Panel */}
        <motion.div 
          animate={{ opacity: hasText ? 1 : 0.75 }}
          transition={{ duration: 0.25 }}
          className="w-full lg:w-[320px] xl:w-[350px] shrink-0 transition-all duration-300"
        >
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
            
            {/* Occurrences Stats */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Matches Found</span>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <span className={`text-4xl font-extrabold transition-all duration-200 ${currentMatches > 0 ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {currentMatches}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  Occurrences
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <RefreshCw size={13} className="text-primary" /> Quick Presets
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'double-spaces', label: 'Strip Double Spaces' },
                  { id: 'html-tags',     label: 'Strip HTML Tags' },
                  { id: 'emails',        label: 'Remove Email Addresses' },
                  { id: 'linebreaks',    label: 'Collapse Line Breaks' },
                  { id: 'numbers',       label: 'Remove All Digits' },
                  { id: 'punctuation',   label: 'Strip Punctuation' }
                ].map(preset => (
                  <motion.button
                    key={preset.id}
                    whileHover={hasText ? { scale: 1.02 } : {}}
                    whileTap={hasText ? { scale: 0.98 } : {}}
                    onClick={() => applyPreset(preset.id)}
                    disabled={!hasText}
                    className="w-full text-left py-2.5 px-3.5 text-xs font-semibold rounded-xl border border-border/50 bg-muted/20 hover:bg-muted text-foreground transition-all active:bg-primary/10 active:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-border/50 space-y-2.5">
              <motion.button 
                whileHover={replacedOutput && replacedOutput !== text ? { scale: 1.02 } : {}}
                whileTap={replacedOutput && replacedOutput !== text ? { scale: 0.98 } : {}}
                onClick={handleCopy} 
                disabled={!replacedOutput || replacedOutput === text} 
                className="w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] disabled:opacity-40 active:scale-[0.98]"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />} Copy Replaced Text
              </motion.button>
              <motion.button 
                whileHover={hasText ? { scale: 1.02 } : {}}
                whileTap={hasText ? { scale: 0.98 } : {}}
                onClick={clearAll} 
                disabled={!hasText}
                className="w-full py-3 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30 text-destructive font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:bg-destructive/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} /> Clear All
              </motion.button>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default FindAndReplace;
