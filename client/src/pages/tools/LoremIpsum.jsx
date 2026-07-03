import { useState } from 'react';
import { AlignLeft, Copy, CheckCircle, FileCode2, Settings2, RotateCcw, FileText, Code2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const LATIN_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", 
  "curabitur", "vel", "hendrerit", "libero", "eleifend", "blandit", "nunc", "ornare", 
  "odio", "ut", "orci", "gravida", "imperdiet", "nullam", "purus", "lacinia", "a", 
  "pretium", "quis", "congue", "praesent", "sagittis", "pellentesque", "neque", 
  "velit", "mauris", "auctor", "feugiat", "aliquam", "suspendisse", "fermentum", "magna"
];

const DEV_WORDS = [
  "const", "let", "function", "return", "class", "import", "export", "await", 
  "async", "useEffect", "useState", "flex", "grid", "border", "rounded", "shadow", 
  "api", "fetch", "response", "json", "error", "try", "catch", "null", "undefined", 
  "true", "false", "component", "render", "state", "props", "webpack", "vite", "npm", 
  "package", "repository", "commit", "push", "branch", "merge", "deploy", "server"
];

const ACADEMIC_WORDS = [
  "hypothesis", "methodology", "paradigm", "empirical", "conceptual", "framework", 
  "epistemology", "quantum", "pedagogical", "didactic", "hermeneutic", "juxtapose", 
  "hegemony", "dichotomy", "juxtaposition", "salient", "cognitive", "neurological", 
  "analytical", "phenomenon", "quantitative", "qualitative", "corroborate", 
  "discourse", "paradox", "theoretical", "substantive", "nomenclature", "taxonomy"
];

const LoremIpsum = () => {
  const [text, setText] = useState('');
  const [quantity, setQuantity] = useState(3);
  const [contentType, setContentType] = useState('latin'); // 'latin' | 'dev' | 'academic'
  const [formatType, setFormatType] = useState('paragraphs'); // 'paragraphs' | 'words' | 'sentences' | 'lists'
  const [outputFormat, setOutputFormat] = useState('plain'); // 'plain' | 'html'
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [copiedState, setCopiedState] = useState(false);

  const getWordList = () => {
    if (contentType === 'dev') return DEV_WORDS;
    if (contentType === 'academic') return ACADEMIC_WORDS;
    return LATIN_WORDS;
  };

  const generateWords = (num, forceLoremStart = false) => {
    const words = getWordList();
    let result = [];
    
    if (forceLoremStart && contentType === 'latin') {
      result.push("Lorem", "ipsum", "dolor", "sit", "amet");
      num = Math.max(0, num - 5);
    }

    for (let i = 0; i < num; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }
    return result.join(' ');
  };

  const generateSentence = (forceLoremStart = false) => {
    const numWords = Math.floor(Math.random() * 10) + 6; // 6 to 15 words
    let sentence = generateWords(numWords, forceLoremStart);
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  };

  const generateParagraph = (forceLoremStart = false) => {
    const numSentences = Math.floor(Math.random() * 4) + 3; // 3 to 6 sentences
    let p = [];
    for (let i = 0; i < numSentences; i++) {
      p.push(generateSentence(i === 0 && forceLoremStart));
    }
    return p.join(' ');
  };

  const generateList = (items, forceLoremStart = false) => {
    let list = [];
    for (let i = 0; i < items; i++) {
      list.push(generateSentence(i === 0 && forceLoremStart));
    }
    return list;
  };

  const handleGenerate = () => {
    let result = '';
    const count = parseInt(quantity) || 1;
    const forceStart = startWithLorem;

    if (formatType === 'words') {
      result = generateWords(count, forceStart);
      if (outputFormat === 'html') result = `<p>${result}</p>`;
    } else if (formatType === 'sentences') {
      let sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence(i === 0 && forceStart));
      }
      result = sentences.join(' ');
      if (outputFormat === 'html') result = `<p>${result}</p>`;
    } else if (formatType === 'lists') {
      const listItems = generateList(count, forceStart);
      if (outputFormat === 'html') {
        result = `<ul>\n${listItems.map(li => `  <li>${li}</li>`).join('\n')}\n</ul>`;
      } else {
        result = listItems.map(li => `• ${li}`).join('\n');
      }
    } else {
      // paragraphs
      let paras = [];
      for (let i = 0; i < count; i++) {
        paras.push(generateParagraph(i === 0 && forceStart));
      }
      if (outputFormat === 'html') {
        result = paras.map(p => `<p>${p}</p>`).join('\n\n');
      } else {
        result = paras.join('\n\n');
      }
    }
    setText(result);
    toast.success('Dummy text generated successfully!');
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <AlignLeft size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Lorem Ipsum Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Generate structured layout filler text, code mock snippets, or scholarly statements.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Output Preview Area */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]"
        >
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex justify-between items-center px-1 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Generated Output</span>
              <button
                onClick={handleCopy}
                disabled={!text}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-40 transition-colors"
              >
                {copiedState ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />} Copy Output
              </button>
            </div>

            {text ? (
              <textarea
                value={text}
                readOnly
                className={`w-full flex-1 bg-muted/10 border border-border/50 p-4 rounded-xl outline-none shadow-inner custom-scrollbar resize-none min-h-0 ${
                  outputFormat === 'html' ? 'font-mono text-xs text-primary' : 'text-sm font-medium text-foreground leading-relaxed'
                }`}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/60 rounded-xl bg-muted/5 min-h-0">
                <FileText size={32} className="text-muted-foreground/40 mb-2 animate-bounce" />
                <p className="text-xs text-muted-foreground">Adjust settings and click <span className="font-bold text-primary">Generate Content</span> to preview output.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Generator Settings Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings2 size={15} /> Generator Settings
            </h3>

            {/* Content Vocab Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Vocabulary Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'latin', label: 'Classic', icon: FileText },
                  { id: 'dev',   label: 'Coder',   icon: Code2 },
                  { id: 'academic', label: 'Scholar', icon: GraduationCap }
                ].map(mode => {
                  const Icon = mode.icon;
                  return (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setContentType(mode.id)}
                      className={`py-2.5 px-1 text-xs font-semibold rounded-xl border transition-all flex flex-col items-center gap-1 ${
                        contentType === mode.id
                          ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                          : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                      }`}
                    >
                      <Icon size={14} />
                      {mode.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Format Type */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Format Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'paragraphs', label: 'Paragraphs' },
                  { id: 'words',      label: 'Words' },
                  { id: 'sentences',  label: 'Sentences' },
                  { id: 'lists',      label: 'List Items' }
                ].map(format => (
                  <motion.button
                    key={format.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFormatType(format.id)}
                    className={`py-2.5 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                      formatType === format.id
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {format.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity Slider */}
            <div className="space-y-4 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Quantity</label>
                <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                  {quantity}
                </span>
              </div>
              <div className="relative pt-2 pb-1">
                <input
                  type="range"
                  min="1"
                  max={formatType === 'words' ? 300 : formatType === 'sentences' ? 30 : 15}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="lorem-quantity-slider w-full cursor-pointer outline-none"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    height: '10px',
                    borderRadius: '999px',
                    background: `linear-gradient(to right, var(--primary) ${(quantity - 1) / ((formatType === 'words' ? 300 : formatType === 'sentences' ? 30 : 15) - 1) * 100}%, color-mix(in srgb, var(--muted) 60%, transparent) ${(quantity - 1) / ((formatType === 'words' ? 300 : formatType === 'sentences' ? 30 : 15) - 1) * 100}%)`,
                  }}
                />
                <style dangerouslySetInnerHTML={{__html: `
                  .lorem-quantity-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2.5px solid var(--primary);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                  }
                  .lorem-quantity-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  }
                  .lorem-quantity-slider::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2.5px solid var(--primary);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                  }
                `}} />
              </div>
            </div>

            {/* Output Wrapper Format */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Markup Wrappers
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'plain', label: 'Plain Text' },
                  { id: 'html',  label: 'HTML Tags' }
                ].map(out => (
                  <motion.button
                    key={out.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOutputFormat(out.id)}
                    className={`py-2.5 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                      outputFormat === out.id
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {out.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Classic Lorem Ipsum Starter Toggle */}
            {contentType === 'latin' && (
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start with 'Lorem ipsum'</span>
                <button
                  onClick={() => setStartWithLorem(!startWithLorem)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${
                    startWithLorem ? 'bg-primary' : 'bg-muted border border-border/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-background rounded-full transition-all shadow-sm ${
                      startWithLorem ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-border/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                className="w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] active:scale-[0.98]"
              >
                <RotateCcw size={16} /> Generate Content
              </motion.button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoremIpsum;
