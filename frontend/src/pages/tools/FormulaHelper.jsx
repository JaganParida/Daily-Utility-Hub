import { useState } from 'react';
import { Calculator, Copy, CheckCircle2, Play, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const FormulaHelper = () => {
  const [prompt, setPrompt] = useState('calculate the average of cells A1 through A20 if they are greater than 50');
  const [formula, setFormula] = useState('=AVERAGEIF(A1:A20, ">50")');
  const [explanation, setExplanation] = useState('1. AVERAGEIF evaluates a range of cells based on a criteria.\n2. A1:A20 specifies the range to check and average.\n3. ">50" is the logical condition that cell values must exceed to be included.');
  const [mode, setMode] = useState('generate'); // generate, explain
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const processFormula = () => {
    if (!prompt.trim()) return toast.error('Please enter a query or formula!');
    
    setIsProcessing(true);
    
    setTimeout(() => {
      if (mode === 'generate') {
        // Mock generation logic based on keywords
        const lower = prompt.toLowerCase();
        if (lower.includes('average') && lower.includes('if')) {
          setFormula('=AVERAGEIF(A1:A20, ">50")');
          setExplanation('Calculates the mathematical average of range A1:A20 matching conditions.');
        } else if (lower.includes('sum') && lower.includes('if')) {
          setFormula('=SUMIF(B1:B100, "Approved", C1:C100)');
          setExplanation('Sum cells in C1:C100 if corresponding cells in B1:B100 equal "Approved".');
        } else if (lower.includes('vlookup') || lower.includes('search')) {
          setFormula('=VLOOKUP(A2, Sheet2!A1:D100, 3, FALSE)');
          setExplanation('Looks up value in A2 in column 1 of Sheet2, returning match value from column 3.');
        } else {
          setFormula('=SUM(A1:A10)');
          setExplanation('Adds all numeric values in cells from A1 to A10 together.');
        }
      } else {
        // Explain mode
        const lower = prompt.toLowerCase();
        let exp = `Parsed Formula: ${prompt}\n\n`;
        if (lower.includes('vlookup')) {
          exp += `1. Function: VLOOKUP (Vertical Lookup)\n2. Purpose: Searches for a value in the first column of a table array and returns a value in the same row from another column.\n3. Breakdown:\n   - Lookup Value: The value you want to search for.\n   - Table Array: The range of cells containing the data.\n   - Col Index Num: The column number from which to retrieve the value.\n   - Range Lookup: FALSE (exact match) or TRUE (approximate match).`;
        } else if (lower.includes('sumif')) {
          exp += `1. Function: SUMIF (Conditional Sum)\n2. Purpose: Sums the values in a range that meet a specific condition.\n3. Breakdown:\n   - Range: The range of cells to evaluate with the criteria.\n   - Criteria: The condition (e.g. ">100" or "Approved") that cells must meet.\n   - Sum Range: The actual cells to add (if different from the evaluation range).`;
        } else if (lower.includes('averageif')) {
          exp += `1. Function: AVERAGEIF (Conditional Average)\n2. Purpose: Calculates the average of cells that meet a specific condition.\n3. Breakdown:\n   - Range: The range of cells to evaluate.\n   - Criteria: The condition for cells to be averaged.\n   - Average Range: The actual cells to average.`;
        } else if (lower.includes('countif')) {
          exp += `1. Function: COUNTIF (Conditional Count)\n2. Purpose: Counts the number of cells in a range that meet a specific condition.\n3. Breakdown:\n   - Range: The cells you want to count.\n   - Criteria: The condition defining which cells to count.`;
        } else if (lower.includes('sum')) {
          exp += `1. Function: SUM (Addition)\n2. Purpose: Adds all numbers in a range of cells.\n3. Breakdown:\n   - Numbers/Ranges: The list of cells or ranges to add together (e.g. A1:A10).`;
        } else if (lower.includes('average')) {
          exp += `1. Function: AVERAGE (Mean)\n2. Purpose: Calculates the mathematical average of a list of numbers or cells.\n3. Breakdown:\n   - Ranges: The cells to sum and divide by their count.`;
        } else if (lower.includes('if')) {
          exp += `1. Function: IF (Logical Test)\n2. Purpose: Checks if a condition is met, returning one value if TRUE and another if FALSE.\n3. Breakdown:\n   - Logical Test: The condition to evaluate (e.g., A1 > 100).\n   - Value If True: Output returned if test evaluates to true.\n   - Value If False: Output returned if test evaluates to false.`;
        } else {
          exp += `1. Function: General Spreadsheet Formula\n2. Purpose: Computes mathematical or logical operations.\n3. Breakdown:\n   - Evaluates ranges and operators client-side.\n   - Returns computed value directly.`;
        }
        setExplanation(exp);
      }
      setIsProcessing(false);
      toast.success('Formula query processed!');
    }, 800);
  };

  const copyFormula = () => {
    navigator.clipboard.writeText(formula);
    setIsCopied(true);
    toast.success('Formula copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Formula Generator & Explainer</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Generate advanced Excel & Google Sheets formulas using plain English, or explain complex sheet formulas line-by-line.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Editor Controls */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <div className="flex bg-background border border-border rounded-xl p-1">
                <button
                  onClick={() => { setMode('generate'); setPrompt('calculate the average of cells A1 through A20 if they are greater than 50'); }}
                  className={`text-xs px-4 py-1.5 font-bold rounded-lg transition-all ${mode === 'generate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Generate Formula
                </button>
                <button
                  onClick={() => { setMode('explain'); setPrompt('=VLOOKUP(A2, B2:D100, 3, FALSE)'); }}
                  className={`text-xs px-4 py-1.5 font-bold rounded-lg transition-all ${mode === 'explain' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Explain Formula
                </button>
              </div>
              <button
                onClick={processFormula}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Run Solver
              </button>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder={mode === 'generate' ? "e.g., sum cells B1 to B10 if column A has approved status..." : "e.g., =SUMIF(A1:A10, \">100\")"}
            />
          </div>
        </div>

        {/* Output Solver Display */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Output</h3>
              {mode === 'generate' && formula && (
                <button
                  onClick={copyFormula}
                  className={`p-1.5 rounded-lg border transition-all ${isCopied ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              )}
            </div>

            {mode === 'generate' && formula && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Formula</p>
                <p className="text-lg font-bold font-mono text-foreground mt-1 truncate">{formula}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Detail Explanation
              </p>
              <div className="p-4 bg-muted/10 border border-border/40 rounded-xl text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-mono">
                {explanation}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FormulaHelper;
