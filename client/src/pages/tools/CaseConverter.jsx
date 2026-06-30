import { useState } from 'react';
import { Copy, RefreshCw, Type, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CaseConverter = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const [activeCase, setActiveCase] = useState(null);

  const handleCopy = () => {
    if (!text) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toSentenceCase = () => {
    if (!text) return;
    const result = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
    setText(result);
    setActiveCase('sentence');
  };

  const toLowerCase = () => {
    setText(text.toLowerCase());
    setActiveCase('lower');
  };
  const toUpperCase = () => {
    setText(text.toUpperCase());
    setActiveCase('upper');
  };
  const toCapitalizedCase = () => {
    setText(text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
    setActiveCase('capitalized');
  };
  const toAlternatingCase = () => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += i % 2 === 0 ? text[i].toLowerCase() : text[i].toUpperCase();
    }
    setText(result);
    setActiveCase('alternating');
  };
  const toTitleCase = () => {
    const minorWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
    const result = text.toLowerCase().replace(/\w\S*/g, (word, index) => {
      if (index !== 0 && minorWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
    setText(result);
    setActiveCase('title');
  };
  const toInverseCase = () => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += text[i] === text[i].toUpperCase() ? text[i].toLowerCase() : text[i].toUpperCase();
    }
    setText(result);
    setActiveCase('inverse');
  };

  const clearText = () => {
    setText('');
    setActiveCase(null);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setActiveCase(null);
  };

  const getBtnClass = (caseType) => {
    return `px-3 py-1.5 text-sm rounded-md transition-colors font-medium border ${
      activeCase === caseType
        ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm'
        : 'bg-background border-border text-foreground hover:bg-muted'
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Case Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert text between different letter cases.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
        <textarea
          className="w-full h-64 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0 font-sans"
          placeholder="Type or paste your text here to convert..."
          value={text}
          onChange={handleTextChange}
        />
        
        {/* Toolbar */}
        <div className="p-3 border-t border-border bg-muted/30 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={toSentenceCase} className={getBtnClass('sentence')}>Sentence case</button>
            <button onClick={toLowerCase} className={getBtnClass('lower')}>lower case</button>
            <button onClick={toUpperCase} className={getBtnClass('upper')}>UPPER CASE</button>
            <button onClick={toCapitalizedCase} className={getBtnClass('capitalized')}>Capitalized Case</button>
            <button onClick={toAlternatingCase} className={getBtnClass('alternating')}>aLtErNaTiNg cAsE</button>
            <button onClick={toTitleCase} className={getBtnClass('title')}>Title Case</button>
            <button onClick={toInverseCase} className={getBtnClass('inverse')}>InVeRsE CaSe</button>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={handleCopy}
          className="flex-1 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button 
          onClick={clearText}
          className="px-6 py-3 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCw size={18} />
          Clear
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-bold text-foreground">{text.length}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Character Count</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-bold text-foreground">{text.trim() ? text.trim().split(/\s+/).length : 0}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Word Count</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-bold text-foreground">{text.split(/\n/).length}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Line Count</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-bold text-foreground">{new Blob([text]).size}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Byte Size</span>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;
