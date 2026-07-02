import { useState, useEffect } from 'react';
import { FileText, Award, AlertCircle, RefreshCw, BarChart2, Bookmark, Copy, Trash2, Calendar, Smile, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Simple stop-words list to exclude from keyword density
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
  'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn',
  'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
]);

// Simple sentiment keywords
const POSITIVE_WORDS = new Set([
  'happy', 'good', 'love', 'great', 'amazing', 'excellent', 'beautiful', 'cool', 'nice', 'proud', 'positive',
  'perfect', 'top', 'best', 'smart', 'help', 'success', 'friendly', 'glad', 'wonderful', 'joy', 'fine', 'creative',
  'ideal', 'strong', 'active', 'clean', 'easy', 'clear', 'safe', 'worth', 'recommend'
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'bad', 'hate', 'terrible', 'worst', 'ugly', 'poor', 'failure', 'angry', 'stress', 'worry', 'dangerous',
  'toxic', 'mistake', 'fault', 'warning', 'difficult', 'slow', 'weak', 'pain', 'hard', 'broken', 'wrong', 'fail',
  'unhappy', 'boring', 'noise', 'waste', 'risk', 'scared', 'afraid', 'sick', 'hurt', 'destroy'
]);

// Syllable counter helper
const countSyllables = (word) => {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syl = word.match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
};

const TextAnalyzer = () => {
  const [text, setText] = useState('');
  const [copiedState, setCopiedState] = useState(false);

  // Analysis Metrics
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    syllables: 0,
    avgSentenceLength: 0,
    avgWordLength: 0,
    readingTime: 0, // mins
    speakingTime: 0, // mins
  });

  const [readability, setReadability] = useState({
    easeScore: 100,
    easeLabel: 'Very Easy',
    gradeLevel: '5th Grade',
    fogIndex: 0
  });

  const [sentiment, setSentiment] = useState({
    positive: 0,
    negative: 0,
    neutral: 100,
    label: 'Neutral'
  });

  const [keywords, setKeywords] = useState([]);

  // Perform Analysis
  useEffect(() => {
    if (!text.trim()) {
      setStats({
        characters: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        syllables: 0,
        avgSentenceLength: 0,
        avgWordLength: 0,
        readingTime: 0,
        speakingTime: 0
      });
      setReadability({
        easeScore: 100,
        easeLabel: 'Very Easy',
        gradeLevel: '5th Grade',
        fogIndex: 0
      });
      setSentiment({
        positive: 0,
        negative: 0,
        neutral: 100,
        label: 'Neutral'
      });
      setKeywords([]);
      return;
    }

    const characters = text.length;
    const wordsList = text.trim().split(/\s+/).filter(w => w.length > 0);
    const words = wordsList.length;

    const sentencesList = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentences = sentencesList.length || 1;

    const paragraphsList = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphs = paragraphsList.length || 1;

    // Calculate syllables
    let syllables = 0;
    wordsList.forEach(w => {
      syllables += countSyllables(w.replace(/[^a-zA-Z]/g, ''));
    });

    const avgSentenceLength = Number((words / sentences).toFixed(1));
    const avgWordLength = Number((characters / (words || 1)).toFixed(1));

    // Speaking time (avg 130 words/min) & Reading time (avg 200 words/min)
    const readingTime = Math.ceil(words / 200);
    const speakingTime = Math.ceil(words / 130);

    setStats({
      characters,
      words,
      sentences,
      paragraphs,
      syllables,
      avgSentenceLength,
      avgWordLength,
      readingTime,
      speakingTime
    });

    // Flesch Reading Ease Formula
    // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    let easeScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * (syllables / (words || 1)));
    easeScore = Math.max(0, Math.min(100, Number(easeScore.toFixed(1))));

    let easeLabel = 'Easy';
    if (easeScore > 90)      easeLabel = 'Very Easy';
    else if (easeScore > 80) easeLabel = 'Easy';
    else if (easeScore > 70) easeLabel = 'Fairly Easy';
    else if (easeScore > 60) easeLabel = 'Standard';
    else if (easeScore > 50) easeLabel = 'Fairly Difficult';
    else if (easeScore > 30) easeLabel = 'Difficult';
    else                     easeLabel = 'Very Confusing';

    // Flesch-Kincaid Grade Level Formula
    // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    let gradeLevelScore = (0.39 * avgSentenceLength) + (11.8 * (syllables / (words || 1))) - 15.59;
    gradeLevelScore = Math.max(1, Number(gradeLevelScore.toFixed(1)));

    let gradeLevel = `${Math.round(gradeLevelScore)}th Grade`;
    if (gradeLevelScore <= 5) gradeLevel = 'Elementary School';
    else if (gradeLevelScore <= 8) gradeLevel = 'Middle School';
    else if (gradeLevelScore <= 12) gradeLevel = 'High School';
    else if (gradeLevelScore <= 16) gradeLevel = 'College Level';
    else gradeLevel = 'Graduate School';

    // Gunning Fog Index: 0.4 * ( (words / sentences) + 100 * (complexWords / words) )
    // Complex words are words with 3+ syllables
    let complexWords = 0;
    wordsList.forEach(w => {
      if (countSyllables(w.replace(/[^a-zA-Z]/g, '')) >= 3) complexWords++;
    });
    const fogIndex = Number((0.4 * (avgSentenceLength + 100 * (complexWords / (words || 1)))).toFixed(1));

    setReadability({
      easeScore,
      easeLabel,
      gradeLevel,
      fogIndex
    });

    // Sentiment Analysis
    let posCount = 0;
    let negCount = 0;
    wordsList.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-zA-Z]/g, '');
      if (POSITIVE_WORDS.has(cleanWord)) posCount++;
      if (NEGATIVE_WORDS.has(cleanWord)) negCount++;
    });

    const totalSentimentWords = posCount + negCount || 1;
    const positive = Math.round((posCount / totalSentimentWords) * 100);
    const negative = Math.round((negCount / totalSentimentWords) * 100);
    const neutral = posCount === 0 && negCount === 0 ? 100 : 0;

    let sentimentLabel = 'Neutral';
    if (posCount > negCount) sentimentLabel = 'Positive';
    else if (negCount > posCount) sentimentLabel = 'Negative';

    setSentiment({
      positive,
      negative,
      neutral,
      label: sentimentLabel
    });

    // Keyword Density (excluding stop words)
    const counts = {};
    wordsList.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 2 && !STOP_WORDS.has(cleanWord)) {
        counts[cleanWord] = (counts[cleanWord] || 0) + 1;
      }
    });

    const sortedKeywords = Object.keys(counts)
      .map(k => ({ word: k, count: counts[k], pct: Number(((counts[k] / words) * 100).toFixed(1)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setKeywords(sortedKeywords);
  }, [text]);

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Copied text to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const clear = () => {
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <BarChart2 size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Advanced Readability & Text Analyzer</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Verify readability ease indices, sentence statistics, sentiment, and vocabulary density checks.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Input Editor */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paste Text Content</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!hasText}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-40"
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  onClick={clear}
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
              placeholder="Paste your essay, article, or documentation here to analyze..."
              className="w-full h-[calc(100vh-340px)] min-h-[300px] max-h-[500px] bg-muted/10 border border-border/50 p-4 rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-inner custom-scrollbar resize-none"
            />

            {/* Live statistics footer grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { name: 'Words',      value: stats.words },
                { name: 'Characters', value: stats.characters },
                { name: 'Sentences',  value: stats.sentences },
                { name: 'Paragraphs', value: stats.paragraphs }
              ].map(stat => (
                <div key={stat.name} className="bg-muted/20 border border-border/30 p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.name}</p>
                  <p className="text-base font-bold text-foreground mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Analytics */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasText ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <BarChart2 size={15} /> Text Diagnostics
            </h3>

            {/* Readability Score cards */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Award size={14} className="text-primary" /> Readability Grades
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 border border-border/50 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reading Ease</span>
                  <p className="text-xl font-black text-primary mt-1.5">{stats.words > 0 ? readability.easeScore : '—'}</p>
                  <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">{readability.easeLabel}</span>
                </div>
                <div className="bg-muted/30 border border-border/50 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Level Target</span>
                  <p className="text-sm font-bold text-foreground mt-2 truncate leading-tight">{stats.words > 0 ? readability.gradeLevel : '—'}</p>
                  <span className="text-[9px] text-muted-foreground/80 font-semibold mt-1 block">Flesch-Kincaid</span>
                </div>
              </div>

              {/* Fog Index & Times */}
              <div className="space-y-2 text-xs font-semibold text-foreground pt-1">
                {[
                  { label: 'Gunning Fog Index',  val: stats.words > 0 ? `${readability.fogIndex}` : '—' },
                  { label: 'Avg Sentence Length', val: stats.words > 0 ? `${stats.avgSentenceLength} words` : '—' },
                  { label: 'Estimated Reading',  val: stats.words > 0 ? `${stats.readingTime} min` : '—' },
                  { label: 'Estimated Speaking', val: stats.words > 0 ? `${stats.speakingTime} min` : '—' }
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center bg-background/50 border border-border/30 py-2 px-3 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase">{item.label}</span>
                    <span className="font-mono text-[11px] font-bold">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment breakdown */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Smile size={14} className="text-primary" /> Tone / Sentiment
              </label>

              {stats.words > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Positive: {sentiment.positive}%</span>
                    <span>Negative: {sentiment.negative}%</span>
                  </div>
                  {/* Progress bar split */}
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${sentiment.positive}%` }} />
                    <div className="bg-muted/80 h-full transition-all" style={{ width: `${sentiment.neutral}%` }} />
                    <div className="bg-red-500 h-full transition-all" style={{ width: `${sentiment.negative}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tone matches a predominantly <strong className="text-foreground">{sentiment.label}</strong> reading flow.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Add text to view sentiment breakdown.</p>
              )}
            </div>

            {/* Keyword Density list */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <PieChart size={14} className="text-primary" /> Vocabulary Density
              </label>

              {!keywords.length ? (
                <p className="text-xs text-muted-foreground italic">Add text to view keyword density.</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {keywords.map(kw => (
                    <div key={kw.word} className="flex justify-between items-center text-xs py-1.5 border-b border-border/35 last:border-0 px-1">
                      <span className="font-semibold text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">{kw.word}</span>
                      <div className="text-[10px] text-muted-foreground font-bold">
                        <span>{kw.count} times</span>
                        <span className="ml-1.5 text-primary">({kw.pct}%)</span>
                      </div>
                    </div>
                  ))}
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
