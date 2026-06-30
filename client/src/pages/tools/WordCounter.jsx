import { useState, useEffect } from 'react';

const WordCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0
  });

  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s+/g, '').length;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0;
    const paragraphs = text.trim() ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0;

    setStats({ words, characters, charactersNoSpaces, sentences, paragraphs });
  }, [text]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Word Counter</h1>
        <p className="text-muted-foreground mt-1">Count words, characters, sentences, and paragraphs in real-time.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Words', value: stats.words },
          { label: 'Characters', value: stats.characters },
          { label: 'No Spaces', value: stats.charactersNoSpaces },
          { label: 'Sentences', value: stats.sentences },
          { label: 'Paragraphs', value: stats.paragraphs }
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-primary">{stat.value}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <textarea
          className="w-full h-64 p-4 bg-transparent border-none outline-none resize-y text-foreground placeholder:text-muted-foreground focus:ring-0"
          placeholder="Type or paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-between items-center p-3 border-t border-border bg-muted/30">
          <button 
            onClick={() => setText('')}
            className="text-sm px-4 py-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors font-medium"
          >
            Clear Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordCounter;
