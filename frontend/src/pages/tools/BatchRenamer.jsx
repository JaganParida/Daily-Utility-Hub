import { useState, useRef, useMemo } from 'react';
import { Type, FolderArchive, ArrowRight, Download, Trash2, Settings2, File as FileIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

const BatchRenamer = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [numberingStart, setNumberingStart] = useState(1);
  const [useNumbering, setUseNumbering] = useState(false);
  const [extensionBehavior, setExtensionBehavior] = useState('keep'); // 'keep', 'lowercase', 'uppercase'

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) setFiles([...files, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length) setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const clearAll = () => setFiles([]);

  // Generate previews dynamically
  const previews = useMemo(() => {
    return files.map((file, index) => {
      let name = file.name;
      const lastDotIndex = name.lastIndexOf('.');
      
      let baseName = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
      let ext = lastDotIndex !== -1 ? name.substring(lastDotIndex) : '';

      // Find/Replace
      if (findStr) {
        // Simple string replace globally
        baseName = baseName.split(findStr).join(replaceStr);
      }

      // Add Prefix/Suffix
      baseName = `${prefix}${baseName}${suffix}`;

      // Numbering
      if (useNumbering) {
        const num = (Number(numberingStart) + index).toString().padStart(3, '0');
        baseName = `${baseName}_${num}`;
      }

      // Extension Behavior
      if (extensionBehavior === 'lowercase') ext = ext.toLowerCase();
      else if (extensionBehavior === 'uppercase') ext = ext.toUpperCase();

      const newName = `${baseName}${ext}`;
      
      return {
        originalFile: file,
        oldName: file.name,
        newName: newName || 'unnamed_file'
      };
    });
  }, [files, prefix, suffix, findStr, replaceStr, numberingStart, useNumbering, extensionBehavior]);

  const handleDownloadZip = async () => {
    if (!previews.length) return;

    setIsZipping(true);
    const toastId = toast.loading('Generating renamed ZIP archive...');

    try {
      const zip = new JSZip();
      
      // Add all renamed files to ZIP
      previews.forEach(preview => {
        zip.file(preview.newName, preview.originalFile);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renamed_files_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Files renamed and downloaded!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create ZIP', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Type size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Batch Renamer</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Rename hundreds of files instantly with prefixes, find/replace, and auto-numbering. Downloads as a ZIP.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Settings Panel */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs flex items-center gap-2"><Settings2 size={14}/> Rename Rules</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Prefix</label>
                  <input 
                    type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. img_"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Suffix</label>
                  <input 
                    type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. _v2"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Find Text</label>
                  <input 
                    type="text" value={findStr} onChange={(e) => setFindStr(e.target.value)}
                    placeholder="Text to replace..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Replace With</label>
                  <input 
                    type="text" value={replaceStr} onChange={(e) => setReplaceStr(e.target.value)}
                    placeholder="Replacement text..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={useNumbering} onChange={(e) => setUseNumbering(e.target.checked)} className="sr-only" />
                    <div className={`w-8 h-4 rounded-full transition-colors ${useNumbering ? 'bg-primary' : 'bg-muted border border-border'}`}></div>
                    <div className={`absolute left-0.5 w-3 h-3 rounded-full bg-background transition-transform ${useNumbering ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-bold text-foreground">Auto-numbering</span>
                </label>
                
                {useNumbering && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Start:</span>
                    <input 
                      type="number" value={numberingStart} onChange={(e) => setNumberingStart(Number(e.target.value))}
                      className="w-16 bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Extensions</label>
                <select 
                  value={extensionBehavior} onChange={(e) => setExtensionBehavior(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                >
                  <option value="keep">Keep Original</option>
                  <option value="lowercase">Force lowercase (.jpg)</option>
                  <option value="uppercase">Force UPPERCASE (.JPG)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleDownloadZip} disabled={!previews.length || isZipping}
              className={`w-full py-3 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                !previews.length 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary text-white shadow-primary/20 active:scale-95'
              }`}
            >
              {isZipping ? (
                <>Zipping... <span className="animate-spin text-lg">⏳</span></>
              ) : (
                <><Download size={18}/> Download ZIP</>
              )}
            </button>

          </div>
        </div>

        {/* Right: File List Preview */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {/* Dropzone */}
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:bg-muted/30 hover:border-primary/50'
            }`}
          >
            <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <div className={`p-3 rounded-full mb-2 transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <FolderArchive size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">Add files to rename</p>
          </div>

          {/* List */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
                Live Preview ({previews.length})
              </h2>
              {previews.length > 0 && (
                <button onClick={clearAll} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                  <Trash2 size={12}/> Clear All
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              <AnimatePresence>
                {previews.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all p-12"
                  >
                    <FileIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-bold">No files added yet.</p>
                    <p className="text-xs text-center mt-1">Click here to upload files to begin batch renaming.</p>
                  </motion.div>
                ) : (
                  previews.map((preview, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-blue-500/30 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0">{index + 1}</span>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1 overflow-hidden">
                          <span className="text-sm text-muted-foreground truncate w-full md:w-1/2 line-through decoration-rose-500/50">{preview.oldName}</span>
                          <ArrowRight size={14} className="text-muted-foreground hidden md:block shrink-0" />
                          <span className="text-sm font-bold text-foreground truncate w-full md:w-1/2 text-blue-500">{preview.newName}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="text-muted-foreground hover:text-rose-500 transition-colors shrink-0 md:opacity-0 group-hover:opacity-100 p-1"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BatchRenamer;
