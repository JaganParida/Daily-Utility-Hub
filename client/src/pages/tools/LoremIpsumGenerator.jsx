import { useState, useEffect } from 'react';
import { Copy, Type, RefreshCw, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const loremText = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.",
  "Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
  "Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula.",
  "Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.",
  "Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi.",
  "Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.",
  "Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat."
];

const LoremIpsumGenerator = () => {
  const [count, setCount] = useState(3);
  const [type, setType] = useState('paragraphs');
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLorem = () => {
    let result = [];
    const amount = parseInt(count) || 1;

    for (let i = 0; i < amount; i++) {
      if (type === 'paragraphs') {
        let pLength = Math.floor(Math.random() * 4) + 3; // 3 to 6 sentences per paragraph
        let p = [];
        for (let j = 0; j < pLength; j++) {
          p.push(loremText[Math.floor(Math.random() * loremText.length)]);
        }
        result.push(p.join(' '));
      } else if (type === 'sentences') {
        result.push(loremText[Math.floor(Math.random() * loremText.length)]);
      } else if (type === 'words') {
        let words = loremText.join(' ').split(' ');
        let wordResult = [];
        for (let j = 0; j < amount; j++) {
          wordResult.push(words[Math.floor(Math.random() * words.length)].replace(/[.,]/g, '').toLowerCase());
        }
        result = [wordResult.join(' ')];
        break; // break outer loop since we handled amount
      }
    }

    setGeneratedText(type === 'words' ? result[0] : result.join('\n\n'));
    setCopied(false);
  };

  useEffect(() => {
    generateLorem();
  }, [count, type]);

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Lorem Ipsum copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lorem Ipsum Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate dummy text for your designs and mockups.</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-6 flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Length</label>
          <input 
            type="number" 
            min="1" 
            max="100" 
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-24 p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-40 p-2.5 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>

        <button 
          onClick={generateLorem}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 h-[46px]"
        >
          <RefreshCw size={18} />
          Generate
        </button>

        <button 
          onClick={handleCopy}
          className="px-6 py-2.5 ml-auto bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 h-[46px] border border-border"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          Copy
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 min-h-[400px]">
        <div className="whitespace-pre-wrap font-sans text-foreground leading-relaxed text-lg text-justify">
          {generatedText}
        </div>
      </div>
    </div>
  );
};

export default LoremIpsumGenerator;
