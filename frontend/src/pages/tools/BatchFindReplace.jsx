import { useState, useRef } from 'react';
import { Search, Download, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

const BatchFindReplace = () => {
  const [files, setFiles] = useState([]);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const readPromises = uploadedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            originalContent: event.target.result,
            currentContent: event.target.result,
            size: file.size
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readPromises).then(results => {
      setFiles(prev => [...prev, ...results]);
      toast.success(`Successfully uploaded ${results.length} files!`);
    });
    e.target.value = null;
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const executeFindReplace = () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file first!');
      return;
    }
    if (!findQuery) {
      toast.error('Please specify the query to find!');
      return;
    }

    const flags = isCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(findQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), flags);

    let replacedCount = 0;
    const updatedFiles = files.map(file => {
      const matchCount = (file.originalContent.match(regex) || []).length;
      replacedCount += matchCount;
      const content = file.originalContent.replace(regex, replaceQuery);
      return {
        ...file,
        currentContent: content
      };
    });

    setFiles(updatedFiles);
    toast.success(`Batch replace complete! Replaced ${replacedCount} matches.`);
  };

  const downloadAllAsZip = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    
    files.forEach(file => {
      zip.file(file.name, file.currentContent);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_replaced_files_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('ZIP package downloaded successfully!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Search size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Multi-File Find & Replace</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Perform search-and-replace queries across multiple uploaded files at once, exporting them as a ZIP package.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Editor controls panel */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Text to Find</label>
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  placeholder="e.g. TODO"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Replace with</label>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  placeholder="e.g. DONE"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={isCaseSensitive}
                  onChange={(e) => setIsCaseSensitive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Match Case Case-Sensitive</span>
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={executeFindReplace}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Run Replace
                </button>
                <button
                  onClick={downloadAllAsZip}
                  disabled={files.length === 0}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} /> Download ZIP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded File List Dashboard */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Uploaded Workspace Files ({files.length})
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-colors"
            >
              Add Files
            </button>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept=".txt,.js,.jsx,.ts,.tsx,.json,.html,.css,.md" onChange={handleFileUpload} />
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {files.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all"
              >
                <Upload size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Files Loaded</p>
                <p className="text-xs max-w-xs leading-normal">Click here to upload source code files or text notes to execute batch keyword search-and-replace routines.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {files.map((file, idx) => (
                  <div key={idx} className="p-4 border border-border bg-muted/20 rounded-xl relative group flex flex-col justify-between min-h-[100px]">
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-4 right-4 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-foreground truncate pr-6">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                      <CheckCircle2 size={12} /> Ready for Batch
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BatchFindReplace;
