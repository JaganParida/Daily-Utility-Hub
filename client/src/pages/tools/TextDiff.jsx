import { useState } from 'react';
import { FileDiff, SplitSquareHorizontal, CheckCircle2 } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';

const TextDiff = () => {
  const [oldText, setOldText] = useState('function calculateSum(a, b) {\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 10));');
  const [newText, setNewText] = useState('function calculateSum(a, b) {\n  // Added validation\n  if (typeof a !== "number" || typeof b !== "number") return 0;\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 10));');
  const [splitView, setSplitView] = useState(true);

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shadow-sm">
            <FileDiff size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Text & Code Diff Checker</h1>
            <p className="text-muted-foreground mt-1 text-sm">Compare two pieces of text or code to see exactly what changed.</p>
          </div>
        </div>
        <button 
          onClick={() => setSplitView(!splitView)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${splitView ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-muted text-foreground hover:bg-muted/80'}`}
        >
          <SplitSquareHorizontal size={18} />
          {splitView ? 'Split View' : 'Unified View'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6 shrink-0">
        {/* Original Text */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col h-64">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Original Text</h3>
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            className="w-full flex-1 bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-mono resize-none custom-scrollbar"
            placeholder="Paste your original text or code here..."
            spellCheck="false"
          />
        </div>

        {/* Modified Text */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col h-64">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Modified Text</h3>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full flex-1 bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-mono resize-none custom-scrollbar"
            placeholder="Paste your modified text or code here..."
            spellCheck="false"
          />
        </div>
      </div>

      {/* Diff Result */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Difference View</h3>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#fdd8d5] border border-[#f4c6c2] block rounded-sm"></span> Deletions</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#e6ffed] border border-[#ccffd8] block rounded-sm"></span> Additions</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0d1117] text-black dark:text-white p-2">
           <ReactDiffViewer 
             oldValue={oldText} 
             newValue={newText} 
             splitView={splitView} 
             useDarkTheme={document.documentElement.classList.contains('dark')}
             styles={{
               variables: {
                 dark: {
                   diffViewerBackground: '#0d1117',
                   diffViewerTitleBackground: '#161b22',
                   diffViewerColor: '#c9d1d9',
                   addedBackground: '#04260f',
                   addedColor: '#c9d1d9',
                   removedBackground: '#3fb950', // Note: Using GitHub dark colors loosely
                   removedColor: '#c9d1d9',
                   wordAddedBackground: '#2ea043',
                   wordRemovedBackground: '#f85149',
                   addedGutterBackground: '#04260f',
                   removedGutterBackground: '#3fb950',
                   gutterBackground: '#0d1117',
                   gutterColor: '#484f58',
                   emptyLineBackground: '#0d1117',
                 }
               }
             }}
           />
        </div>
      </div>

    </div>
  );
};

export default TextDiff;
