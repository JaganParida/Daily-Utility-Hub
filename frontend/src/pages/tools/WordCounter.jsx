import { useState, useEffect } from 'react';
import { Type, Clock, Hash, CheckCircle, Copy, Trash2, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Syllable counter helper
const countSyllables = (word) => {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syl = word.match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
};

const WordCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    syllables: 0,
    readingTime: 0,
    speakingTime: 0
  });
  const [keywords, setKeywords] = useState([]);
  const [copiedState, setCopiedState] = useState(false);

  useEffect(() => {
    const rawWords = text.trim() ? text.trim().split(/\s+/) : [];
    const words = rawWords.length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    const sentencesList = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentences = sentencesList.length || (text.trim() ? 1 : 0);

    const paragraphsList = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphs = paragraphsList.length || (text.trim() ? 1 : 0);
    
    // Syllables
    let syllables = 0;
    rawWords.forEach(w => {
      syllables += countSyllables(w.replace(/[^a-zA-Z]/g, ''));
    });

    // Average reading speed is ~238 wpm, speaking is ~183 wpm
    const readingTime = Math.ceil(words / 238);
    const speakingTime = Math.ceil(words / 183);

    setStats({ words, characters, charactersNoSpaces, sentences, paragraphs, syllables, readingTime, speakingTime });

    // Keyword density analysis
    if (words > 0) {
      const stopWords = new Set(['the','and','a','to','of','in','i','is','that','it','on','you','this','for','but','with','are','have','be','at','or','as','was','so','if','out','not']);
      const cleanWords = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
      const counts = {};
      
      cleanWords.forEach(w => {
        if (!stopWords.has(w)) {
          counts[w] = (counts[w] || 0) + 1;
        }
      });
      
      const sortedKeywords = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([word, count]) => ({ 
          word, 
          count, 
          percentage: Number(((count / words) * 100).toFixed(1)) 
        }));
        
      setKeywords(sortedKeywords);
    } else {
      setKeywords([]);
    }
  }, [text]);

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const clearText = () => {
    setText('');
    toast.success('Text cleared');
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Type size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Word Counter</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Inspect paragraph counts, keyword density charts, reading metrics, and character stats.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Input Text Editor */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]"
        >
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex justify-between items-center px-1 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paste Document Content</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!hasText}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  onClick={clearText}
                  disabled={!hasText}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                  <Trash2 size={13} /> Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing or paste your content here..."
              className="w-full flex-1 bg-muted/10 border border-border/50 p-4 rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner custom-scrollbar resize-none min-h-0"
            />

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 shrink-0">
              {[
                { name: 'Words',      value: stats.words },
                { name: 'Characters', value: stats.characters },
                { name: 'Sentences',  value: stats.sentences },
                { name: 'Paragraphs', value: stats.paragraphs }
              ].map(stat => (
                <motion.div 
                  key={stat.name} 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-muted/20 border border-border/50 p-3.5 rounded-xl shadow-sm transition-all hover:border-primary/30 cursor-default"
                >
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.name}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Stats Sidebar */}
        <motion.div 
          animate={{ opacity: hasText ? 1 : 0.5 }}
          transition={{ duration: 0.25 }}
          className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasText ? 'pointer-events-none grayscale-[0.5]' : ''}`}
        >
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <FileText size={15} /> Document Diagnostics
            </h3>

            {/* Document Details */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Hash size={14} className="text-primary" /> Detail Metrics
              </label>

              <div className="space-y-2.5 text-xs font-semibold text-foreground">
                {[
                  { label: 'Chars (no spaces)', val: `${stats.charactersNoSpaces}` },
                  { label: 'Syllables Count',   val: `${stats.syllables}` },
                  { label: 'Avg Word Length',   val: stats.words > 0 ? `${(stats.characters / stats.words).toFixed(1)} chars` : '—' },
                  { label: 'Avg Sentence',      val: stats.words > 0 ? `${(stats.words / stats.sentences).toFixed(1)} words` : '—' }
                ].map(item => (
                  <motion.div 
                    key={item.label}
                    whileHover={{ x: 2 }}
                    className="flex justify-between items-center bg-muted/20 border border-border/50 py-2.5 px-3.5 rounded-xl shadow-sm"
                  >
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <span className="font-mono text-[11px] font-bold">{item.val}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Read / Speak Estimates */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-primary" /> Time Estimates
              </label>

              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-muted/20 border border-border/50 p-4 rounded-xl text-center shadow-sm"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reading Time</span>
                  <p className="text-lg font-bold text-foreground mt-2">{stats.words > 0 ? `${stats.readingTime} min` : '—'}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-muted/20 border border-border/50 p-4 rounded-xl text-center shadow-sm"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Speaking Time</span>
                  <p className="text-lg font-bold text-foreground mt-2">{stats.words > 0 ? `${stats.speakingTime} min` : '—'}</p>
                </motion.div>
              </div>
            </div>

            {/* Keyword Density list */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Type size={14} className="text-primary" /> Keyword Density
              </label>

              {!keywords.length ? (
                <p className="text-xs text-muted-foreground italic text-center py-2.5 bg-muted/10 rounded-xl border border-dashed border-border/50">Not enough words for analysis.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 no-scrollbar">
                  {keywords.map((kw, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-lg border border-border/50">{kw.word}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{kw.count} times ({kw.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${kw.percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }} 
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WordCounter;
