import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { UploadCloud, FileText, CheckCircle2, ChevronRight, Download, X, ListFilter, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BatchRenamer = () => {
  const [files, setFiles] = useState([]);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [casing, setCasing] = useState('original'); // original, lower, upper, title
  const [enableNumbering, setEnableNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState(1);
  const [numberPadding, setNumberPadding] = useState(2); // e.g. 01, 02

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) handleFilesSelection(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) handleFilesSelection(selectedFiles);
  };

  const handleFilesSelection = (selectedFiles) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setPrefix('');
    setSuffix('');
    setFindText('');
    setReplaceText('');
    setCasing('original');
    setEnableNumbering(false);
  };

  // Renaming function helper
  const getRenamedName = (file, idx) => {
    const dotIndex = file.name.lastIndexOf('.');
    let nameWithoutExt = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
    const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : '';

    // 1. Find & Replace
    if (findText) {
      nameWithoutExt = nameWithoutExt.split(findText).join(replaceText);
    }

    // 2. Casing conversions
    if (casing === 'lower') {
      nameWithoutExt = nameWithoutExt.toLowerCase();
    } else if (casing === 'upper') {
      nameWithoutExt = nameWithoutExt.toUpperCase();
    } else if (casing === 'title') {
      nameWithoutExt = nameWithoutExt.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    // 3. Sequential numbering
    if (enableNumbering) {
      const numStr = String(numberStart + idx).padStart(numberPadding, '0');
      nameWithoutExt = `${nameWithoutExt}_${numStr}`;
    }

    // 4. Prefix & Suffix addition
    return `${prefix}${nameWithoutExt}${suffix}${ext}`;
  };

  // Perform renaming and zip download
  const handleRenameAndDownload = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const toastId = toast.loading('Compiling and renaming files into ZIP archive...');

    try {
      const zip = new JSZip();
      
      files.forEach((file, index) => {
        const renamedName = getRenamedName(file, index);
        zip.file(renamedName, file);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `renamed_files_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('ZIP package downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Renaming operation failed.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <ListFilter size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Batch File Renamer</h1>
          <p className="text-muted-foreground mt-1 text-sm">Rename multiple files simultaneously. Configure prefixes, suffixes, search-replace, and auto-numbering.</p>
        </div>
      </div>

      {files.length === 0 ? (
        <div 
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-96 ${
            isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-card hover:border-indigo-500/50 hover:bg-muted/30'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 pointer-events-none">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Drag & Drop files to rename</h3>
          <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm">
            Select multiple files from your device. Processing is local inside your browser.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          
          {/* Left Config Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">Renaming Rules</h3>

            {/* Prefix & Suffix */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Prefix</label>
                <input 
                  type="text" placeholder="e.g. img_"
                  value={prefix} onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Suffix</label>
                <input 
                  type="text" placeholder="e.g. _v2"
                  value={suffix} onChange={(e) => setSuffix(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Find & Replace */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Find in Name</label>
                <input 
                  type="text" placeholder="e.g. copy"
                  value={findText} onChange={(e) => setFindText(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Replace With</label>
                <input 
                  type="text" placeholder="e.g. final"
                  value={replaceText} onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Casing conversions */}
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Convert Casing</label>
              <select
                value={casing}
                onChange={(e) => setCasing(e.target.value)}
                className="w-full bg-muted/30 border border-border text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none"
              >
                <option value="original">Keep Original Casing</option>
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
                <option value="title">Title Case</option>
              </select>
            </div>

            {/* Sequential numbering */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Append Auto-Numbering</label>
                <input 
                  type="checkbox" checked={enableNumbering}
                  onChange={(e) => setEnableNumbering(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </div>

              {enableNumbering && (
                <div className="grid grid-cols-2 gap-4 pt-1 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Start Number</label>
                    <input 
                      type="number"
                      value={numberStart} onChange={(e) => setNumberStart(parseInt(e.target.value) || 1)}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Padding digits</label>
                    <input 
                      type="number" min="1" max="5"
                      value={numberPadding} onChange={(e) => setNumberPadding(parseInt(e.target.value) || 2)}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleRenameAndDownload}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Download Renamed ZIP
              </button>
              <button
                onClick={handleClearAll}
                className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-all"
              >
                Clear all files
              </button>
            </div>

          </div>

          {/* Right Preview List Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Files Preview list</h3>
              <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">{files.length} Files</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground uppercase tracking-wider font-bold border-b border-border">
                    <th className="px-4 py-2.5">Original Filename</th>
                    <th className="px-4 py-2.5 text-center"><ChevronRight size={14} className="inline" /></th>
                    <th className="px-4 py-2.5">Target Filename</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground font-semibold">
                  {files.map((file, index) => {
                    const targetName = getRenamedName(file, index);
                    return (
                      <tr key={index} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 truncate max-w-[180px]" title={file.name}>{file.name}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground"><ChevronRight size={14} className="inline" /></td>
                        <td className="px-4 py-3 text-indigo-500 truncate max-w-[180px]" title={targetName}>{targetName}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default BatchRenamer;
