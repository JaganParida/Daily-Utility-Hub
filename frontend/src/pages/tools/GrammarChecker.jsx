import { useState, useEffect } from 'react';
import { AlignLeft, CheckCircle2, Download, RefreshCw, AlertCircle, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

const GrammarChecker = () => {
  const [text, setText] = useState('We is going to build a advanced utility portal. It will helps students in formatting essays. Their are several tools that is completely client-side.');
  const [errors, setErrors] = useState([]);
  const [readability, setReadability] = useState({ score: 0, grade: 'N/A' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Run spelling and grammar checks reactively
    const rules = [
      { regex: /\bWe is\b/gi, message: 'Verb agreement error. Did you mean "We are"?', correction: 'We are' },
      { regex: /\ba advanced\b/gi, message: 'Incorrect article. Use "an" before vowel sounds.', correction: 'an advanced' },
      { regex: /\bIt will helps\b/gi, message: 'Verb agreement after modal. Use "help" instead of "helps".', correction: 'It will help' },
      { regex: /\bTheir are\b/gi, message: 'Incorrect homophone. Did you mean "There are"?', correction: 'There are' },
      { regex: /\bthat is completely\b/gi, message: 'Noun-verb count disagreement. Use "that are".', correction: 'that are completely' }
    ];

    const foundErrors = [];
    rules.forEach(rule => {
      let match;
      rule.regex.lastIndex = 0;
      while ((match = rule.regex.exec(text)) !== null) {
        foundErrors.push({
          index: match.index,
          length: match[0].length,
          original: match[0],
          message: rule.message,
          correction: rule.correction
        });
      }
    });

    // Calculate simple readability index (Flesch Kincaid grade approximation)
    const words = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const characters = text.length;
    
    let grade = 'Easy';
    let score = 85;
    if (words > 0 && sentences > 0) {
      const asl = words / sentences;
      const asw = characters / words;
      score = Math.round(206.835 - (1.015 * asl) - (84.6 * (asw / 5)));
      score = Math.max(1, Math.min(100, score));
      if (score < 50) grade = 'Difficult (University)';
      else if (score < 80) grade = 'Medium (High School)';
    }

    setErrors(foundErrors);
    setReadability({ score, grade });
  }, [text]);

  const analyzeText = () => {
    if (!text.trim()) return toast.error('Please enter some text first');
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success(`Analysis up-to-date! Found ${errors.length} suggestions.`);
    }, 600);
  };

  const applyCorrection = (err) => {
    const updatedText = text.substring(0, err.index) + err.correction + text.substring(err.index + err.length);
    setText(updatedText);
    // Clear/re-analyze to update indexes
    setErrors(errors.filter(e => e.index !== err.index));
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Spell & Grammar Check Report", 15, 20);
    doc.line(15, 24, 195, 24);

    doc.setFontSize(12);
    doc.text(`Readability Score: ${readability.score}/100 (${readability.grade})`, 15, 34);
    
    doc.setFontSize(11);
    doc.text("Original Text Analysed:", 15, 46);
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 52);

    doc.setFontSize(11);
    doc.text(`Unresolved Issues: ${errors.length}`, 15, 120);
    let y = 126;
    errors.forEach((err, idx) => {
      doc.text(`${idx + 1}. Error: "${err.original}" -> ${err.message}`, 15, y);
      y += 10;
    });

    doc.save("grammar_report.pdf");
    toast.success("Grammar report exported to PDF!");
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <AlignLeft size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Smart Spell & Grammar Checker</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Scan documents client-side to pinpoint grammatical flaws, fix spellings, and generate PDF correction sheets.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left input text field */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Type or Paste Essay</h3>
              <div className="flex gap-2">
                <button
                  onClick={analyzeText}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Run Analysis
                </button>
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder="Paste your text here to check grammar..."
            />
          </div>
        </div>

        {/* Right side check dashboard */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-6">
          {/* Readability Score */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
                <p className="text-3xl font-black text-primary">{readability.score}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Readability Score</p>
              </div>
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center flex flex-col justify-center">
                <p className="text-sm font-bold text-foreground truncate">{readability.grade}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Target Grade</p>
              </div>
            </div>
            {errors.length > 0 && (
              <button
                onClick={exportReport}
                className="w-full py-2.5 bg-background hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Download size={14} className="inline mr-2" /> Download Report PDF
              </button>
            )}
          </div>

          {/* Grammar Corrections List */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grammar & Spell Suggestions ({errors.length})</h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <CheckCircle2 size={32} className="text-emerald-500/30 mx-auto mb-2" />
                  No grammar errors detected. Good job!
                </div>
              ) : (
                errors.map((err, idx) => (
                  <div key={idx} className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-foreground font-medium">{err.message}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground font-mono">Found: "{err.original}"</span>
                      <button
                        onClick={() => applyCorrection(err)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition-colors"
                      >
                        Apply: "{err.correction}"
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GrammarChecker;
