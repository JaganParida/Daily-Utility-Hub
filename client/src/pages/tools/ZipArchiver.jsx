import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { UploadCloud, FileText, CheckCircle2, Download, X, Library, Loader2, FolderArchive } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ZipArchiver = () => {
  const [activeTab, setActiveTab] = useState('compress'); // 'compress' or 'decompress'
  
  // Compress state
  const [compressFiles, setCompressFiles] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const compressInputRef = useRef(null);

  // Decompress state
  const [zipFile, setZipFile] = useState(null);
  const [extractedFiles, setExtractedFiles] = useState([]); // array of { name, size, blob }
  const [isDecompressing, setIsDecompressing] = useState(false);
  const decompressInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  // Drag over handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  // Compress Selects
  const handleCompressDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setCompressFiles(prev => [...prev, ...files]);
  };

  const handleCompressFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) setCompressFiles(prev => [...prev, ...files]);
  };

  const handleRemoveCompressFile = (idx) => {
    setCompressFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // ZIP Creation Process
  const handleCreateZip = async () => {
    if (compressFiles.length === 0) return;

    setIsCompressing(true);
    const toastId = toast.loading('Creating ZIP archive...');

    try {
      const zip = new JSZip();
      
      compressFiles.forEach(file => {
        zip.file(file.name, file);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `archive_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('ZIP archive created successfully!', { id: toastId });
      setCompressFiles([]);
    } catch (err) {
      console.error(err);
      toast.error('Compression failed.', { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  // Decompress Drop
  const handleDecompressDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleZipSelection(file);
    } else {
      toast.error('Only ZIP files are supported');
    }
  };

  const handleDecompressFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleZipSelection(file);
    }
  };

  const handleZipSelection = async (selectedFile) => {
    setZipFile(selectedFile);
    setIsDecompressing(true);
    const toastId = toast.loading('Reading ZIP archive...');

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(selectedFile);
      const fileList = [];

      // Extract details
      for (const [filename, fileObj] of Object.entries(loadedZip.files)) {
        if (!fileObj.dir) {
          const blob = await fileObj.async('blob');
          fileList.push({
            name: filename,
            size: blob.size,
            blob: blob
          });
        }
      }

      setExtractedFiles(fileList);
      toast.success(`Extracted: ${fileList.length} files found`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse ZIP archive.', { id: toastId });
      setZipFile(null);
    } finally {
      setIsDecompressing(false);
    }
  };

  const handleDownloadSingleFile = (fileObj) => {
    const downloadUrl = URL.createObjectURL(fileObj.blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileObj.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded: ${fileObj.name}`);
  };

  const handleExtractAll = () => {
    if (extractedFiles.length === 0) return;
    extractedFiles.forEach(fileObj => {
      handleDownloadSingleFile(fileObj);
    });
    toast.success('All files extracted!');
  };

  const handleClearDecompress = () => {
    setZipFile(null);
    setExtractedFiles([]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <FolderArchive size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ZIP & Unzip Archiver</h1>
          <p className="text-muted-foreground mt-1 text-sm">Package multiple files into a single ZIP archive, or extract files from existing ZIP archives.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted/40 p-1 rounded-2xl border border-border max-w-sm mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('compress')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'compress' ? 'bg-background shadow text-indigo-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Compress into ZIP
        </button>
        <button
          onClick={() => setActiveTab('decompress')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'decompress' ? 'bg-background shadow text-indigo-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Decompress ZIP
        </button>
      </div>

      {activeTab === 'compress' ? (
        /* Tab 1: Compress */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleCompressDrop}
            onClick={() => compressInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-80 ${
              isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-card hover:border-indigo-500/50 hover:bg-muted/30'
            }`}
          >
            <input type="file" ref={compressInputRef} onChange={handleCompressFileSelect} className="hidden" multiple />
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 pointer-events-none">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1 pointer-events-none">Drag & Drop files to compress</h3>
            <p className="text-xs text-muted-foreground text-center pointer-events-none max-w-xs">
              Upload multiple files from your device to pack them into a single .zip file.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col h-[320px]">
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Files to Compress</h3>
              <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">{compressFiles.length} files</span>
            </div>

            {compressFiles.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center text-xs text-muted-foreground">
                No files selected yet.
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-border/50 pr-2 custom-scrollbar">
                  {compressFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                        <button onClick={() => handleRemoveCompressFile(idx)} className="text-red-500 hover:text-red-600 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCreateZip}
                  disabled={isCompressing}
                  className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <FolderArchive size={18} />
                  Compress to ZIP
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Decompress */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {!zipFile ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDecompressDrop}
              onClick={() => decompressInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-80 lg:col-span-2 ${
                isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-card hover:border-indigo-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={decompressInputRef} onChange={handleDecompressFileSelect} className="hidden" accept=".zip" />
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1 pointer-events-none">Upload ZIP file to extract</h3>
              <p className="text-xs text-muted-foreground text-center pointer-events-none max-w-xs">
                Drag and drop a .zip file here. Extracted files remain secure in your browser.
              </p>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Archive Details</h3>
                  <button onClick={handleClearDecompress} className="text-xs text-red-500 hover:underline">Close File</button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0">
                    <FolderArchive className="text-indigo-500 shrink-0" size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{zipFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleExtractAll}
                      className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download size={18} />
                      Extract All Files
                    </button>
                  </div>
                </div>
              </div>

              {/* Extracted Files List */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col h-[320px]">
                <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Archived files list</h3>
                  <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">{extractedFiles.length} files</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/50 pr-2 custom-scrollbar">
                  {extractedFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                        <button 
                          onClick={() => handleDownloadSingleFile(file)} 
                          className="text-indigo-500 hover:text-indigo-600 transition-colors"
                          title="Download File"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default ZipArchiver;
