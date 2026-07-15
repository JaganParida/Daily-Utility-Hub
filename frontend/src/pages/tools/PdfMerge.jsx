import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, GripVertical, Trash2, Eye, X, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { PDFDocument } from 'pdf-lib';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

const SortableItem = ({ id, file, index, removeFile, onPreview }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-3 p-3 bg-card border rounded-xl group transition-all duration-200 ${
        isDragging 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]' 
          : 'border-border/80 hover:border-primary/40 hover:bg-muted/10'
      }`}
    >
      <button 
        {...attributes} 
        {...listeners} 
        className="p-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 transition-colors"
      >
        <GripVertical size={18} />
      </button>
      <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
        <span className="font-bold text-sm">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onPreview(file)} 
          className="p-2 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
          title="Preview File"
        >
          <Eye size={18} />
        </button>
        <button 
          onClick={() => removeFile(id)} 
          className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
          title="Remove File"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const PdfMerge = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileSelect({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length === 0) { toast.error('Only PDF files are allowed'); return; }
    setFiles(prev => [...prev, ...droppedFiles.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const handlePreview = (fileObj) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(fileObj);
    setPreviewUrl(URL.createObjectURL(fileObj));
  };

  const closePreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const removeFile = (id) => {
    const fileToRemove = files.find(item => item.id === id);
    if (fileToRemove && previewFile === fileToRemove.file) {
      closePreview();
    }
    setFiles(files.filter(item => item.id !== id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please add at least two PDF files to merge');
      return;
    }

    let toastId = toast.loading('Merging PDFs locally in browser...');
    try {
      setIsProcessing(true);
      
      const mergedPdf = await PDFDocument.create();
      
      for (const item of files) {
        const fileBytes = new Uint8Array(await item.file.arrayBuffer());
        const srcPdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedBytes = await mergedPdf.save();
      
      const url = window.URL.createObjectURL(new Blob([mergedBytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDFs merged successfully!', { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to merge PDFs. One of the documents might be encrypted.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSize = files.reduce((acc, item) => acc + item.file.size, 0);
  const formattedTotalSize = (totalSize / 1024 / 1024).toFixed(2);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
        accept=".pdf,application/pdf" 
      />
      {/* Header Container */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Interactive PDF Merge</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Drag, drop, and rearrange multiple PDF files securely.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Upload & List Area */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${files.length === 0 ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {files.length === 0 ? (
              <motion.div
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full w-full flex flex-col justify-center"
              >
                <div 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' 
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 pointer-events-none shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">
                    Upload your PDF files
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm pointer-events-none leading-relaxed">
                    Drag and drop PDF files here, or <span className="text-primary font-semibold hover:underline">browse files</span>.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-3 pointer-events-none text-center">
                    Supports multiple PDF files. Files are processed securely.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="files-list"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full"
              >
                <div className="flex justify-between items-center pb-3 mb-5 border-b border-border">
                  <div>
                    <h3 className="font-bold text-foreground">Reorder Documents</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Drag handles to rearrange your merge order.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground italic hidden sm:inline">Drag the handles to sort</span>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      + Add Files
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[500px] custom-scrollbar pr-1 flex flex-col gap-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      {files.map((item, index) => (
                        <SortableItem 
                          key={item.id} 
                          id={item.id} 
                          file={item.file} 
                          index={index} 
                          removeFile={removeFile} 
                          onPreview={handlePreview} 
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Panel Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${files.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2 border-b border-border pb-3">
              <FileText size={16} /> Merge Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
                <p className="text-xs text-muted-foreground font-medium">Selected Files</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{files.length}</p>
              </div>
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
                <p className="text-xs text-muted-foreground font-medium">Total Size</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{formattedTotalSize} MB</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Order is determined from top to bottom.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Original files are untouched.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Processed securely in-memory.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] overflow-hidden ${
                isProcessing
                  ? 'bg-primary/70 text-primary-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isProcessing ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="animate-spin" size={20} />
                    Merging PDFs...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <FileText size={20} />
                    Merge {files.length} PDFs
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => { setFiles([]); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              disabled={isProcessing || files.length === 0}
              className="w-full py-3.5 bg-muted/20 hover:bg-muted/50 border border-border/50 hover:border-border text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      <AnimatePresence>
        {previewFile && previewUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-muted/20">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground truncate" title={previewFile.name}>{previewFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <a 
                    href={previewUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold animate-pulse"
                  >
                    Open in New Tab <ExternalLink size={12} />
                  </a>
                  <button 
                    onClick={closePreview}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-muted/10 p-4">
                <object 
                  data={previewUrl} 
                  type="application/pdf" 
                  className="w-full h-full rounded-xl overflow-hidden border border-border/80"
                >
                  <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                    </div>
                  </iframe>
                </object>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PdfMerge;
