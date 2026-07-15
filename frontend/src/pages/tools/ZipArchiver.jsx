import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FolderArchive, File, Download, UploadCloud, FileArchive, CheckCircle2, FileText, FileImage, FileCode, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

const ZipArchiver = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileSelect({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [mode, setMode] = useState('EXTRACT'); // 'EXTRACT' or 'COMPRESS'
  
  // Extract State
  const [zipFile, setZipFile] = useState(null);
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Compress State
  const [filesToCompress, setFilesToCompress] = useState([]);
  const [zipName, setZipName] = useState('archive');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (mode === 'EXTRACT') {
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
        processZipFile(file);
      } else {
        toast.error('Please drop a valid .zip file');
      }
    } else {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) setFilesToCompress([...filesToCompress, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e) => {
    if (mode === 'EXTRACT') {
      const file = e.target.files[0];
      if (file) processZipFile(file);
    } else {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length) setFilesToCompress([...filesToCompress, ...selectedFiles]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------- EXTRACT LOGIC ----------------

  const processZipFile = async (file) => {
    setZipFile(file);
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const filesList = [];
      
      loadedZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          filesList.push({
            name: zipEntry.name,
            originalEntry: zipEntry
          });
        }
      });
      
      setExtractedFiles(filesList);
      toast.success(`Found ${filesList.length} files in archive`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to read ZIP file. It might be corrupted.');
      setZipFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExtractedFile = async (entry, name) => {
    try {
      const blob = await entry.async("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // get just the filename without path
      a.download = name.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to extract file');
    }
  };

  const downloadAllExtracted = async () => {
    toast.success('Downloading files sequentially...');
    for (const f of extractedFiles) {
      await downloadExtractedFile(f.originalEntry, f.name);
      // tiny delay to prevent browser locking
      await new Promise(res => setTimeout(res, 100));
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <FileImage size={16} className="text-primary"/>;
    if (['js', 'jsx', 'html', 'css', 'json', 'py', 'cpp'].includes(ext)) return <FileCode size={16} className="text-blue-500"/>;
    if (['txt', 'md', 'csv'].includes(ext)) return <FileText size={16} className="text-amber-500"/>;
    return <File size={16} className="text-muted-foreground"/>;
  };

  const filteredExtracted = extractedFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // ---------------- COMPRESS LOGIC ----------------

  const handleCompress = async () => {
    if (!filesToCompress.length) return;
    
    setIsProcessing(true);
    const toastId = toast.loading('Compressing files...');

    try {
      const zip = new JSZip();
      
      filesToCompress.forEach(file => {
        // Just adding directly to root of zip
        zip.file(file.name, file);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zipName || 'archive'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('ZIP created successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create ZIP', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FolderArchive size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Zip Archiver</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compress multiple files into a single ZIP, or extract and preview contents of existing ZIPs.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Mode Switcher & Dropzone */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner">
              <button onClick={() => { setMode('EXTRACT'); setZipFile(null); setExtractedFiles([]); }} className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${mode === 'EXTRACT' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <FileArchive size={16}/> Extract
              </button>
              <button onClick={() => { setMode('COMPRESS'); setFilesToCompress([]); }} className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${mode === 'COMPRESS' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <FolderArchive size={16}/> Compress
              </button>
            </div>

            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
              }`}
            >
              <input type="file" multiple={mode === 'COMPRESS'} accept={mode === 'EXTRACT' ? '.zip,application/zip' : '*'} ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-background shadow-sm text-muted-foreground'}`}>
                {mode === 'EXTRACT' ? <FileArchive size={32} /> : <UploadCloud size={32} />}
              </div>
              <p className="text-sm font-bold text-foreground">
                {mode === 'EXTRACT' ? 'Drop a .zip file here' : 'Drop files to compress'}
              </p>
            </div>

            {mode === 'COMPRESS' && filesToCompress.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">ZIP File Name</label>
                  <div className="relative">
                    <input 
                      type="text" value={zipName} onChange={(e) => setZipName(e.target.value)}
                      placeholder="archive"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">.zip</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCompress} disabled={isProcessing}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md bg-primary hover:bg-primary text-white shadow-primary/20 ${isProcessing ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
                >
                  {isProcessing ? (
                    <>Compressing... <span className="animate-spin text-lg">⏳</span></>
                  ) : (
                    <><FolderArchive size={18}/> Create ZIP ({filesToCompress.length})</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[500px]">
          
          {mode === 'EXTRACT' ? (
            <>
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Search size={16} className="text-muted-foreground" />
                  <input 
                    type="text" placeholder="Search extracted files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground/70"
                    disabled={!extractedFiles.length}
                  />
                </h2>
                {extractedFiles.length > 0 && (
                  <button onClick={downloadAllExtracted} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary text-white shadow-sm flex items-center gap-2 transition-all active:scale-95">
                    <Download size={14} /> Download All
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4">
                <AnimatePresence>
                  {!zipFile ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all p-12"
                    >
                      <FileArchive size={48} className="mb-4 opacity-50" />
                      <p className="text-sm font-bold">Waiting for a ZIP file.</p>
                      <p className="text-xs text-center mt-1">Click here to upload a ZIP archive for extraction.</p>
                    </motion.div>
                  ) : extractedFiles.length === 0 && !isProcessing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <p className="text-sm font-bold">No files found.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-1">
                      {filteredExtracted.map((f, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getFileIcon(f.name)}
                            <span className="text-sm text-foreground truncate font-medium">{f.name}</span>
                          </div>
                          <button 
                            onClick={() => downloadExtractedFile(f.originalEntry, f.name)}
                            className="p-1.5 rounded-md bg-background border border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Extract file"
                          >
                            <Download size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            // COMPRESS PREVIEW
            <>
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
                  Files to Archive ({filesToCompress.length})
                </h2>
                {filesToCompress.length > 0 && (
                  <button onClick={() => setFilesToCompress([])} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                    <Trash2 size={12}/> Clear
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4">
                <AnimatePresence>
                  {!filesToCompress.length ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all p-12"
                    >
                      <FolderArchive size={48} className="mb-4 opacity-50" />
                      <p className="text-sm font-bold">No files added yet.</p>
                      <p className="text-xs text-center mt-1">Click here to upload source files to add to the archive.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-1">
                      {filesToCompress.map((f, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getFileIcon(f.name)}
                            <span className="text-sm text-foreground truncate font-medium">{f.name}</span>
                          </div>
                          <button 
                            onClick={() => setFilesToCompress(filesToCompress.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ZipArchiver;
