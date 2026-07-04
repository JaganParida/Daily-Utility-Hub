import { useState } from 'react';
import { Layers, CheckCircle2, Download, Copy, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

const SimilarityChecker = () => {
  const [textA, setTextA] = useState('Design patterns are typical solutions to common problems in software design. Each pattern is like a blueprint that you can customize to solve a particular design problem in your code.');
  const [textB, setTextB] = useState('Software design patterns represent typical solutions to recurring challenges in program design. Every pattern operates like a template which you customize to resolve specific engineering issues in your source code.');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);

  const checkSimilarity = () => {
    if (!textA.trim() || !textB.trim()) {
      toast.error('Please input text in both fields to compare!');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      // Clean and split words
      const wordsA = textA.toLowerCase().match(/\b\w+\b/g) || [];
      const wordsB = textB.toLowerCase().match(/\b\w+\b/g) || [];
      
      const setA = new Set(wordsA);
      const setB = new Set(wordsB);
      
      // Calculate Jaccard similarity index
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      
      let percentage = 0;
      if (union.size > 0) {
        percentage = Math.round((intersection.size / union.size) * 100);
      }

      // Generate a detailed mock analysis report
      setReport({
        score: percentage,
        matchedWordsCount: intersection.size,
        totalWordsCount: union.size,
        matchingSentences: [
          'Pattern customisation to solve design problems in source code.',
          'Identified semantic mapping on "blueprint" vs "template".'
        ]
      });

      setIsProcessing(false);
      toast.success(`Similarity evaluation complete: ${percentage}% match.`);
    }, 1000);
  };

  const exportPDFReport = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Similarity & Plagiarism Analysis", 15, 20);
    doc.line(15, 24, 195, 24);

    doc.setFontSize(12);
    doc.text(`Overall Similarity Score: ${report.score}%`, 15, 34);
    doc.text(`Matched Distinct Words: ${report.matchedWordsCount} of ${report.totalWordsCount}`, 15, 42);

    doc.setFontSize(11);
    doc.text("Document A Source Text:", 15, 54);
    const splitA = doc.splitTextToSize(textA, 180);
    doc.text(splitA, 15, 60);

    doc.text("Document B Target Text:", 15, 120);
    const splitB = doc.splitTextToSize(textB, 180);
    doc.text(splitB, 15, 126);

    doc.save("similarity_comparison_report.pdf");
    toast.success("Similarity report saved as PDF!");
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Plagiarism & Similarity Checker</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Compare two pieces of text side-by-side client-side to calculate matching indexes and download verification reports.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Side-by-side input fields */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-72">
              <div className="p-3 border-b border-border bg-muted/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Document (Text A)</h3>
              </div>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
                placeholder="Paste original text..."
              />
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-72">
              <div className="p-3 border-b border-border bg-muted/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comparison Document (Text B)</h3>
              </div>
              <textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
                placeholder="Paste target text to compare..."
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={checkSimilarity}
              disabled={isProcessing}
              className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
              Compute Similarity Score
            </button>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Similarity Dashboard</h3>
            
            {report ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
                  <p className={`text-4xl font-black ${report.score > 50 ? 'text-red-500' : 'text-emerald-500'}`}>{report.score}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Similarity Index</p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Distinct Matched Words:</span>
                    <span className="font-bold text-foreground">{report.matchedWordsCount}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Total Unique Words:</span>
                    <span className="font-bold text-foreground">{report.totalWordsCount}</span>
                  </p>
                </div>

                <button
                  onClick={exportPDFReport}
                  className="w-full py-2.5 bg-background hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Download size={14} className="inline mr-2" /> Download Report PDF
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <AlertTriangle size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                Run comparison to calculate similarity metrics.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimilarityChecker;
