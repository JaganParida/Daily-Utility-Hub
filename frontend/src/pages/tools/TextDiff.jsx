import { useState, useRef } from 'react';
import { FileDiff, SplitSquareHorizontal, Upload, FileText, Settings, Type } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { motion } from 'framer-motion';
import Tesseract from 'tesseract.js';
import { toast } from 'react-hot-toast';

const TextDiff = () => {
  const [oldText, setOldText] = useState('function calculateSum(a, b) {\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 10));');
  const [newText, setNewText] = useState('function calculateSum(a, b) {\n  // Added validation\n  if (typeof a !== "number" || typeof b !== "number") return 0;\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 10));');
  
  const [oldFileName, setOldFileName] = useState('Original Text');
  const [newFileName, setNewFileName] = useState('Modified Text');

  const [splitView, setSplitView] = useState(true);
  
  const oldFileRef = useRef(null);
  const newFileRef = useRef(null);

  const handleFileUpload = async (e, isOld) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isOld) setOldFileName(file.name);
    else setNewFileName(file.name);

    if (file.type.startsWith('image/')) {
      const toastId = toast.loading('Running OCR to extract text from image...');
      try {
        const result = await Tesseract.recognize(file, 'eng');
        const extractedText = result.data.text || '';
        if (isOld) {
          setOldText(extractedText);
          setOldFileName(file.name + ' (Extracted)');
        } else {
          setNewText(extractedText);
          setNewFileName(file.name + ' (Extracted)');
        }
        toast.success('Text extracted from image successfully!', { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error('Failed to extract text from image.', { id: toastId });
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (isOld) setOldText(text);
        else setNewText(text);
      };
      reader.readAsText(file);
    }
    
    // reset input
    e.target.value = null;
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileDiff size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Text & Code Diff Checker</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compare two files or texts instantly to see exactly what changed.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left pane: Text Editors & Diff View */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6"
        >
          {/* Text Input Areas */}
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Original Text */}
            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-72 overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 truncate">
                  <FileText size={16} className="text-rose-500 shrink-0" />
                  <span className="truncate">{oldFileName}</span>
                </h3>
                <button 
                  onClick={() => oldFileRef.current?.click()}
                  className="p-1.5 hover:bg-muted rounded text-foreground transition-colors"
                  title="Upload File"
                >
                  <Upload size={16} />
                </button>
                <input type="file" ref={oldFileRef} className="hidden" onChange={(e) => handleFileUpload(e, true)} />
              </div>
              <textarea
                value={oldText}
                onChange={(e) => { setOldText(e.target.value); setOldFileName('Original Text (Edited)'); }}
                className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
                placeholder="Paste your original text or code here..."
                spellCheck="false"
              />
            </div>

            {/* Modified Text */}
            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-72 overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 truncate">
                  <FileText size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{newFileName}</span>
                </h3>
                <button 
                  onClick={() => newFileRef.current?.click()}
                  className="p-1.5 hover:bg-muted rounded text-foreground transition-colors"
                  title="Upload File"
                >
                  <Upload size={16} />
                </button>
                <input type="file" ref={newFileRef} className="hidden" onChange={(e) => handleFileUpload(e, false)} />
              </div>
              <textarea
                value={newText}
                onChange={(e) => { setNewText(e.target.value); setNewFileName('Modified Text (Edited)'); }}
                className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
                placeholder="Paste your modified text or code here..."
                spellCheck="false"
              />
            </div>

          </div>

          {/* Diff Result */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Difference View</h3>
              <div className="flex gap-4 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#fdd8d5] dark:bg-[#3fb950] border border-[#f4c6c2] dark:border-[#2ea043] block rounded-[2px]"></span> Deletions</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#e6ffed] dark:bg-[#04260f] border border-[#ccffd8] dark:border-transparent block rounded-[2px]"></span> Additions</div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0d1117] text-black dark:text-white p-2">
               <ReactDiffViewer 
                 oldValue={oldText} 
                 newValue={newText} 
                 splitView={splitView} 
                 useDarkTheme={document.documentElement.classList.contains('dark')}
                 leftTitle={splitView ? oldFileName : undefined}
                 rightTitle={splitView ? newFileName : undefined}
                 styles={{
                   variables: {
                     dark: {
                       diffViewerBackground: '#0d1117',
                       diffViewerTitleBackground: '#161b22',
                       diffViewerTitleColor: '#c9d1d9',
                       diffViewerTitleBorderColor: '#30363d',
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
        </motion.div>

        {/* Right pane: Action Panel */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings size={16} /> Diff Settings
            </h3>
            
            <div className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-foreground mb-3">View Mode</label>
                <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => setSplitView(true)} 
                    className={`flex-1 text-sm py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${splitView ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    <SplitSquareHorizontal size={16} />
                    Split View
                  </button>
                  <button 
                    onClick={() => setSplitView(false)} 
                    className={`flex-1 text-sm py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${!splitView ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    <Type size={16} />
                    Unified
                  </button>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm text-foreground">
                <p className="mb-2"><strong>Tips:</strong></p>
                <ul className="space-y-1 text-muted-foreground list-disc pl-4 text-xs">
                  <li>Click the upload icons above the text areas to compare files directly (e.g. .txt, .js, .py).</li>
                  <li>Use Split View on larger screens for side-by-side comparison.</li>
                  <li>Use Unified View on mobile for a single-column patch view.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    setOldText(''); setNewText('');
                    setOldFileName('Original Text'); setNewFileName('Modified Text');
                  }}
                  className="w-full py-3 bg-background hover:bg-primary/10 text-primary font-bold rounded-xl border border-primary/20 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TextDiff;
