import { useState } from 'react';
import { Type, Copy, Trash2, CheckCircle, Terminal, Sparkles, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MINOR_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'for', 'or', 'nor', 'in', 'on', 'at', 'to', 'by', 'of', 'with', 'from']);

const CaseConverter = () => {
  const [text, setText] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [activeCase, setActiveCase] = useState(null);

  const convertCase = (type) => {
    setActiveCase(type);
    if (!text.trim()) return;
    
    let result = '';
    const cleanText = text.trim();
    // Split words by space, hyphens, or underscores
    const words = cleanText.split(/[\s_-]+/);

    switch (type) {
      case 'UPPERCASE':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'Title Case':
        result = text
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        break;
      case 'Sentence case':
        result = text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
        break;
      case 'slugify':
        // URL slug case: e.g. "This is a title" -> "this-is-a-title"
        result = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(w => w.length > 0).join('-');
        break;
      case 'camelCase':
        result = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        break;
      case 'PascalCase':
        result = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        break;
      case 'snake_case':
        result = words.map(w => w.toLowerCase()).join('_');
        break;
      case 'kebab-case':
        result = words.map(w => w.toLowerCase()).join('-');
        break;
      case 'aLtErNaTiNg':
        result = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
        break;
      case 'InVeRsE':
        result = text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
        break;
      default:
        result = text;
    }

    setText(result);
    toast.success(`Converted to ${type}!`);
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const clearText = () => {
    setText('');
    setActiveCase(null);
    toast.success('Text cleared');
  };

  const standardCases = ['UPPERCASE', 'lowercase', 'Title Case', 'Sentence case', 'slugify'];
  const developerCases = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case'];
  const funCases = ['aLtErNaTiNg', 'InVeRsE'];

  const hasText = text.trim().length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Type size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Case Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Transform blocks of text instantly between standard, developer, and fun cases.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Editor Area */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Editor Content</span>
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
              placeholder="Paste or type your text here, then choose a case option from the sidebar..."
              className="w-full h-[calc(100vh-270px)] min-h-[300px] max-h-[500px] bg-muted/10 border border-border/50 p-4 rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-inner custom-scrollbar resize-none"
            />
          </div>
        </div>

        {/* Right: Controls Sidebar */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasText ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Sliders size={15} /> Case Converters
            </h3>

            {/* Standard Cases */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Type size={13} className="text-primary" /> Standard Formats
              </label>
              <div className="grid grid-cols-2 gap-2">
                {standardCases.map((type) => (
                  <button
                    key={type}
                    onClick={() => convertCase(type)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all active:scale-[0.97] text-center ${
                      activeCase === type
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Developer Cases */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Terminal size={13} className="text-primary" /> Developer Formats
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {developerCases.map((type) => (
                  <button
                    key={type}
                    onClick={() => convertCase(type)}
                    className={`py-2 px-3 text-[10px] font-bold rounded-lg border transition-all active:scale-[0.97] text-center ${
                      activeCase === type
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Fun Cases */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-primary" /> Stylized Formats
              </label>
              <div className="grid grid-cols-2 gap-2">
                {funCases.map((type) => (
                  <button
                    key={type}
                    onClick={() => convertCase(type)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all active:scale-[0.97] text-center ${
                      activeCase === type
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;
