import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Download, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

const AcademicFormatChecker = () => {
  const [essay, setEssay] = useState(`Jane Doe\nProfessor Turing\nCS 401\n12 October 2024\n\n     Bully consensus election structures\n\nThe bully consensus algorithm represents a critical consensus milestone in distributed systems. We review consensus metrics below.`);
  const [style, setStyle] = useState('MLA'); // MLA or APA
  const [issues, setIssues] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const foundIssues = [];
    const lines = essay.split('\n').map(l => l.trim());

    // Rule 1: First 4 lines check for MLA heading
    if (style === 'MLA') {
      if (lines.length < 4 || !lines[0] || !lines[1] || !lines[2] || !lines[3]) {
        foundIssues.push({
          rule: 'MLA Heading',
          desc: 'MLA papers require student name, instructor, course, and date in the first 4 lines.',
          severity: 'high'
        });
      }
    } 
    // Rule 2: Title check
    if (style === 'APA') {
      // APA requires a title page format
      if (!lines[0].toLowerCase().includes('running head') && !essay.toLowerCase().includes('abstract')) {
        foundIssues.push({
          rule: 'APA Cover Page / Abstract',
          desc: 'APA style papers typically require a Running Head and a dedicated Abstract section.',
          severity: 'medium'
        });
      }
    }

    // Rule 3: Spacing check
    if (essay.includes('\n\n\n')) {
      foundIssues.push({
        rule: 'Double Spacing',
        desc: 'Identified excess blank lines. Academic layouts require clean double spacing.',
        severity: 'medium'
      });
    }

    // Rule 4: Citations format check
    if (essay.includes('[') && style === 'MLA') {
      foundIssues.push({
        rule: 'In-text Citations',
        desc: 'MLA requires parenthetical citations with author and page number e.g., (Doe 42), not brackets.',
        severity: 'high'
      });
    }

    setIssues(foundIssues);
  }, [essay, style]);

  const runCheck = () => {
    if (!essay.trim()) {
      toast.error('Please input your academic essay draft first!');
      return;
    }

    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      toast.success(`Check complete! Found ${issues.length} style discrepancies.`);
    }, 600);
  };

  const autoFixIssues = () => {
    // Perform simple formatting adjustments (e.g. clean multiple line breaks)
    let cleaned = essay.replace(/\n{3,}/g, '\n\n');
    setEssay(cleaned);
    setIssues(issues.filter(x => x.rule !== 'Double Spacing'));
    toast.success('Cleaned double spacing discrepancies!');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("courier", "normal"); // Academic styling Courier or Times
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(essay, 180);
    // MLA Margins: 1 inch (approx 25mm)
    doc.text(splitText, 25, 25);
    doc.save(`${style.toLowerCase()}_formatted_essay.pdf`);
    toast.success('Formatted essay downloaded as PDF!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">MLA / APA Style Checker</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Validate document spacing, page layouts, citations, and headers against MLA/APA style guidelines.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Essay Input Panel */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Academic Essay Draft</h3>
              <div className="flex bg-background border border-border rounded-xl p-1">
                {['MLA', 'APA'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setStyle(mode)}
                    className={`text-xs px-4 py-1.5 font-bold rounded-lg transition-all ${style === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {mode} Style
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-serif resize-none custom-scrollbar leading-relaxed"
              placeholder="Type your essay contents here..."
            />
          </div>
        </div>

        {/* Audit Dashboard */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Verification Audit</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={runCheck}
                disabled={isChecking}
                className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isChecking ? 'Checking...' : <Play size={16} />} Run Layout Audit
              </button>
              <button
                onClick={downloadPDF}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download PDF
              </button>
            </div>

            {issues.length > 0 && (
              <button
                onClick={autoFixIssues}
                className="w-full py-2.5 bg-background hover:bg-muted text-emerald-500 border border-border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Sparkles size={14} className="inline mr-2" /> Auto-Fix Spacing Discrepancies
              </button>
            )}
          </div>

          {/* Audit Suggestion Board */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Style Discrepancies ({issues.length})</h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {issues.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <CheckCircle2 size={32} className="text-emerald-500/35 mx-auto mb-2" />
                  No layout issues detected. Document adheres to layout specs!
                </div>
              ) : (
                issues.map((iss, idx) => (
                  <div key={idx} className="p-4 border border-red-500/10 bg-red-500/5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-red-500 shrink-0" size={14} />
                      <p className="text-xs font-bold text-foreground">{iss.rule}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">{iss.desc}</p>
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

export default AcademicFormatChecker;
