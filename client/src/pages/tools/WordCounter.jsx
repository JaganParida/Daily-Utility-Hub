import { useState, useEffect } from 'react';
import { Type, Clock, Hash, Check, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

const WordCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0
  });
  const [keywords, setKeywords] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Basic stats
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
    
    // Average reading speed is ~238 wpm, speaking is ~183 wpm
    const readingTime = Math.ceil(words / 238);
    const speakingTime = Math.ceil(words / 183);

    setStats({ words, characters, charactersNoSpaces, sentences, paragraphs, readingTime, speakingTime });

    // Keyword density
    if (words > 0) {
      const stopWords = new Set(['the','and','a','to','of','in','i','is','that','it','on','you','this','for','but','with','are','have','be','at','or','as','was','so','if','out','not']);
      const wordList = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
      const counts = {};
      
      wordList.forEach(w => {
        if (!stopWords.has(w)) {
          counts[w] = (counts[w] || 0) + 1;
        }
      });
      
      const sortedKeywords = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count, percentage: ((count / words) * 100).toFixed(1) }));
        
      setKeywords(sortedKeywords);
    } else {
      setKeywords([]);
    }
  }, [text]);

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

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Word Counter</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time statistics, reading time estimation, and keyword density analysis.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_350px] gap-6 min-h-0">
        
        {/* Input Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Text</h3>
            <div className="flex items-center gap-2">
              <button onClick={clearText} className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition-colors">
                Clear
              </button>
              <button onClick={handleCopy} className="text-xs font-medium text-blue-500 hover:bg-blue-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
            </div>
          </div>
          <textarea
            className="w-full flex-1 p-6 bg-transparent resize-none text-foreground text-lg leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar"
            placeholder="Start typing or paste your document here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
          />
        </div>

        {/* Stats Sidebar */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.words}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Words</span>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{stats.characters}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Characters</span>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Hash size={14} /> Document Details
            </h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sentences</span>
                <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">{stats.sentences}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paragraphs</span>
                <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">{stats.paragraphs}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chars (no spaces)</span>
                <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">{stats.charactersNoSpaces}</span>
              </li>
            </ul>
          </div>

          {/* Time Estimates */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Clock size={14} /> Time Estimates
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border border-border">
                <span className="text-sm font-medium text-foreground">Reading Time</span>
                <span className="text-sm font-bold text-emerald-500">{stats.readingTime} min</span>
              </div>
              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border border-border">
                <span className="text-sm font-medium text-foreground">Speaking Time</span>
                <span className="text-sm font-bold text-orange-500">{stats.speakingTime} min</span>
              </div>
            </div>
          </div>

          {/* Keyword Density */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Type size={14} /> Keyword Density
            </h4>
            {keywords.length > 0 ? (
              <ul className="space-y-3">
                {keywords.map((kw, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{kw.word}</span>
                      <span className="text-muted-foreground">{kw.count} ({kw.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kw.percentage}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground italic text-center py-4">Not enough words for analysis</div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default WordCounter;
