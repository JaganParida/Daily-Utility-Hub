import { useState } from 'react';
import { Type, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CaseConverter = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const convertCase = (type) => {
    if (!text) return;
    
    let result = '';
    const words = text.split(/[\s_-]+/); // Split by space, underscore, or hyphen

    switch (type) {
      case 'UPPERCASE':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'Title Case':
        result = text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        break;
      case 'Sentence case':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
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
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearText = () => {
    setText('');
    toast.success('Text cleared');
  };

  const standardCases = ['UPPERCASE', 'lowercase', 'Title Case', 'Sentence case'];
  const developerCases = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case'];
  const funCases = ['aLtErNaTiNg', 'InVeRsE'];

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Case Converter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert text instantly between standard, developer, and fun cases.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[300px_1fr] gap-6 min-h-0">
        
        {/* Controls Sidebar */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Type size={14} /> Standard Cases
            </h3>
            <div className="flex flex-col gap-2">
              {standardCases.map((type) => (
                <button
                  key={type}
                  onClick={() => convertCase(type)}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-transparent bg-muted/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-all"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Terminal size={14} /> Developer Cases
            </h3>
            <div className="flex flex-col gap-2">
              {developerCases.map((type) => (
                <button
                  key={type}
                  onClick={() => convertCase(type)}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-transparent bg-muted/50 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all font-mono text-sm"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Sparkles size={14} /> Fun Cases
            </h3>
            <div className="flex flex-col gap-2">
              {funCases.map((type) => (
                <button
                  key={type}
                  onClick={() => convertCase(type)}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-transparent bg-muted/50 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-all"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Editor Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Editor</h3>
            <div className="flex items-center gap-2">
              <button onClick={clearText} className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition-colors">
                Clear
              </button>
              <button onClick={handleCopy} className="text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
            </div>
          </div>
          
          <textarea
            className="w-full flex-1 p-6 bg-transparent resize-none text-foreground text-lg leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar"
            placeholder="Type or paste your text here, then select a case from the sidebar..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
          />
        </div>

      </div>
    </div>
  );
};

export default CaseConverter;
