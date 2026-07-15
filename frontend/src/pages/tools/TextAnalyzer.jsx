import { useState, useMemo } from 'react';
import { FileText, Copy, Type, BookOpen, Clock, AlignLeft, Hash, WholeWord, Activity, Settings2, Scissors, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TextAnalyzer = () => {
  const [text, setText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Analysis logic
  const stats = useMemo(() => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return {
        words: 0, chars: 0, charsNoSpace: 0, sentences: 0, paragraphs: 0, 
        readingTime: 0, speakingTime: 0, readability: 0, topWords: []
      };
    }

    const words = trimmedText.split(/\s+/).filter(w => w.length > 0);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s+/g, '').length;
    const sentences = trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = trimmedText.split(/\n+/).filter(p => p.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length || 1;
    const syllableCount = words.reduce((acc, word) => {
      word = word.toLowerCase();
      if(word.length <= 3) return acc + 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const syls = word.match(/[aeiouy]{1,2}/g);
      return acc + (syls ? syls.length : 1);
    }, 0);

    // Flesch-Kincaid Reading Ease (0-100, higher is easier)
    let readability = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      readability = 206.835 - (1.015 * (wordCount / sentenceCount)) - (84.6 * (syllableCount / wordCount));
      readability = Math.max(0, Math.min(100, Math.round(readability)));
    }

    // Keyword density
    const stopwords = new Set(['the','and','a','to','of','in','i','is','that','it','on','you','this','for','but','with','are','have','be','at','or','as','was','so','if','out','not']);
    const wordMap = {};
    words.forEach(w => {
      const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanW && !stopwords.has(cleanW) && cleanW.length > 2) {
        wordMap[cleanW] = (wordMap[cleanW] || 0) + 1;
      }
    });
    const topWords = Object.entries(wordMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
      words: wordCount,
      chars,
      charsNoSpace,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      readingTime: Math.ceil(wordCount / 200), // ~200 wpm reading
      speakingTime: Math.ceil(wordCount / 130), // ~130 wpm speaking
      readability,
      topWords
    };
  }, [text]);

  const copyToClipboard = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Text copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleFormat = (type) => {
    if (!text) return;
    let newText = text;
    switch (type) {
      case 'upper': newText = text.toUpperCase(); break;
      case 'lower': newText = text.toLowerCase(); break;
      case 'title': 
        newText = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        break;
      case 'sentence': 
        newText = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
        break;
      case 'spaces': 
        newText = text.replace(/\s+/g, ' ').trim();
        break;
      case 'clear': newText = ''; break;
      default: break;
    }
    setText(newText);
  };

  const getReadabilityLabel = (score) => {
    if (score === 0) return { label: 'Not enough text', color: 'text-muted-foreground' };
    if (score >= 90) return { label: 'Very Easy (5th Grade)', color: 'text-emerald-500' };
    if (score >= 80) return { label: 'Easy (6th Grade)', color: 'text-emerald-500' };
    if (score >= 70) return { label: 'Fairly Easy (7th Grade)', color: 'text-primary' };
    if (score >= 60) return { label: 'Standard (8th-9th Grade)', color: 'text-primary' };
    if (score >= 50) return { label: 'Fairly Difficult (10th-12th Grade)', color: 'text-amber-500' };
    if (score >= 30) return { label: 'Difficult (College)', color: 'text-orange-500' };
    return { label: 'Very Difficult (College Graduate)', color: 'text-rose-500' };
  };

  const readInfo = getReadabilityLabel(stats.readability);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Text Analyzer</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Real-time word counts, reading time, readability scores, and quick formatting.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Main Editor Space */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[600px]"
        >
          {/* Editor Header / Formatting Toolbar */}
          <div className="p-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => handleFormat('upper')} className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-lg text-xs font-bold text-foreground transition-colors shadow-sm">UPPERCASE</button>
              <button onClick={() => handleFormat('lower')} className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-lg text-xs font-bold text-foreground transition-colors shadow-sm">lowercase</button>
              <button onClick={() => handleFormat('title')} className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-lg text-xs font-bold text-foreground transition-colors shadow-sm">Title Case</button>
              <button onClick={() => handleFormat('sentence')} className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-lg text-xs font-bold text-foreground transition-colors shadow-sm">Sentence case</button>
              <div className="w-px h-4 bg-border mx-1"></div>
              <button onClick={() => handleFormat('spaces')} className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-lg text-xs font-bold text-foreground transition-colors shadow-sm flex items-center gap-1"><Scissors size={12}/> Clean Spaces</button>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => handleFormat('clear')} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-wider">Clear</button>
              <button 
                onClick={copyToClipboard}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isCopied ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-sm shadow-primary/20'}`}
              >
                {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {isCopied ? 'Copied' : 'Copy All'}
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your essay, document, or text here to analyze..."
            className="flex-1 w-full bg-transparent p-6 text-foreground resize-none focus:outline-none custom-scrollbar text-base leading-relaxed"
            spellCheck="false"
          />
        </motion.div>

        {/* Right: Analysis Dashboard */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          
          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <WholeWord size={20} className="text-primary mb-2 opacity-80" />
              <span className="text-3xl font-black text-foreground">{stats.words.toLocaleString()}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Words</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <Type size={20} className="text-primary mb-2 opacity-80" />
              <span className="text-3xl font-black text-foreground">{stats.chars.toLocaleString()}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Characters</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <AlignLeft size={20} className="text-primary mb-2 opacity-80" />
              <span className="text-3xl font-black text-foreground">{stats.sentences.toLocaleString()}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Sentences</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <BookOpen size={20} className="text-primary mb-2 opacity-80" />
              <span className="text-3xl font-black text-foreground">{stats.paragraphs.toLocaleString()}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Paragraphs</span>
            </div>
          </div>

          {/* Time & Readability */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Settings2 size={16} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Insights</h3>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><BookOpen size={14}/></div>
                  <span className="text-sm font-semibold text-muted-foreground">Reading Time</span>
                </div>
                <span className="text-sm font-bold text-foreground">{stats.readingTime} min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Clock size={14}/></div>
                  <span className="text-sm font-semibold text-muted-foreground">Speaking Time</span>
                </div>
                <span className="text-sm font-bold text-foreground">{stats.speakingTime} min</span>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">Readability Score</span>
                  <span className={`text-sm font-black ${readInfo.color}`}>{stats.readability}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.readability}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${readInfo.color.replace('text-', 'bg-')}`}
                  />
                </div>
                <p className="text-xs text-right mt-2 text-muted-foreground">{readInfo.label}</p>
              </div>

            </div>
          </div>

          {/* Keyword Density */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Hash size={16} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Keyword Density (Top 5)</h3>
            </div>
            <div className="p-2">
              {stats.topWords.length > 0 ? (
                <div className="flex flex-col">
                  {stats.topWords.map(([word, count], idx) => (
                    <div key={word} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                      <span className="text-sm font-semibold text-foreground capitalize">{word}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">{((count / stats.words) * 100).toFixed(1)}%</span>
                        <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-md">{count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground font-medium">
                  Add more text to see keyword density.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TextAnalyzer;
