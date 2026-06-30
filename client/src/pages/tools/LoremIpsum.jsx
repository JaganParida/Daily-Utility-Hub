import { useState } from 'react';
import { AlignLeft, Copy, Check, FileCode2, Settings2, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LoremIpsum = () => {
  const [text, setText] = useState('');
  const [paragraphs, setParagraphs] = useState(3);
  const [type, setType] = useState('paragraphs'); // paragraphs, words, sentences, lists
  const [format, setFormat] = useState('plain'); // plain, html
  const [copied, setCopied] = useState(false);

  const wordsList = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur",
    "adipiscing", "elit", "curabitur", "vel", "hendrerit", "libero",
    "eleifend", "blandit", "nunc", "ornare", "odio", "ut",
    "orci", "gravida", "imperdiet", "nullam", "purus", "lacinia",
    "a", "pretium", "quis", "congue", "praesent", "sagittis", 
    "pellentesque", "neque", "velit", "mauris", "auctor", "feugiat",
    "aliquam", "suspendisse", "fermentum", "magna"
  ];

  const generateWords = (num) => {
    let result = [];
    for (let i = 0; i < num; i++) {
      result.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
    }
    return result.join(' ');
  };

  const generateSentence = () => {
    const numWords = Math.floor(Math.random() * 10) + 5; // 5 to 15 words
    let sentence = generateWords(numWords);
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  };

  const generateParagraph = () => {
    const numSentences = Math.floor(Math.random() * 4) + 3; // 3 to 7 sentences
    let p = [];
    for (let i = 0; i < numSentences; i++) {
      p.push(generateSentence());
    }
    return p.join(' ');
  };

  const generateList = (items) => {
    let list = [];
    for (let i = 0; i < items; i++) {
      list.push(generateSentence());
    }
    return list;
  };

  const handleGenerate = () => {
    let result = '';
    const count = parseInt(paragraphs) || 1;

    if (type === 'words') {
      result = generateWords(count);
      if (format === 'html') result = `<p>${result}</p>`;
    } else if (type === 'sentences') {
      let sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      result = sentences.join(' ');
      if (format === 'html') result = `<p>${result}</p>`;
    } else if (type === 'lists') {
      const listItems = generateList(count);
      if (format === 'html') {
        result = `<ul>\n${listItems.map(li => `  <li>${li}</li>`).join('\n')}\n</ul>`;
      } else {
        result = listItems.map(li => `• ${li}`).join('\n');
      }
    } else {
      // paragraphs
      let paras = [];
      for (let i = 0; i < count; i++) {
        paras.push(generateParagraph());
      }
      if (format === 'html') {
        result = paras.map(p => `<p>${p}</p>`).join('\n\n');
      } else {
        result = paras.join('\n\n');
      }
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

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shadow-sm">
          <AlignLeft size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Lorem Ipsum</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate dummy text with advanced formatting and HTML wrappers.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[300px_1fr] gap-6 min-h-0">
        
        {/* Settings Sidebar */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Settings2 size={14} /> Generator Settings
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Format Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setType('paragraphs')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${type === 'paragraphs' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Paragraphs
                  </button>
                  <button 
                    onClick={() => setType('words')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${type === 'words' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Words
                  </button>
                  <button 
                    onClick={() => setType('sentences')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${type === 'sentences' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Sentences
                  </button>
                  <button 
                    onClick={() => setType('lists')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${type === 'lists' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    List Items
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Quantity</label>
                  <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">{paragraphs}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={paragraphs}
                  onChange={(e) => setParagraphs(e.target.value)}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
              <FileCode2 size={14} /> Output Format
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setFormat('plain')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${format === 'plain' ? 'bg-zinc-500/10 border-zinc-500/30 text-zinc-600 dark:text-zinc-400' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
              >
                Plain Text
              </button>
              <button 
                onClick={() => setFormat('html')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1 ${format === 'html' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
              >
                HTML Tags
              </button>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            className="w-full mt-auto py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20"
          >
            <RotateCcw size={18} /> Generate Text
          </button>

        </div>

        {/* Output Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Output</h3>
            <button onClick={handleCopy} disabled={!text} className="text-xs font-medium text-orange-500 hover:bg-orange-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50">
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy
            </button>
          </div>
          
          {text ? (
            <textarea
              className={`w-full flex-1 p-6 bg-transparent resize-none focus:outline-none custom-scrollbar ${format === 'html' ? 'font-mono text-sm text-blue-600 dark:text-blue-400' : 'text-foreground text-lg leading-relaxed'}`}
              value={text}
              readOnly
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
              Click generate to create text...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoremIpsum;
