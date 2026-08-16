import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
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
      className={`flex items-center gap-3 p-3 bg-white border rounded-xl group transition-all duration-200 ${
        isDragging 
          ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-md scale-[1.01]' 
          : 'border-[#dadce0] hover:border-[#1a73e8]/40 hover:bg-[#f8f9fa]'
      }`}
    >
      <button 
        {...attributes} 
        {...listeners} 
        className="p-1.5 text-[#5f6368] hover:text-[#202124] cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="w-8 h-8 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-lg flex items-center justify-center shrink-0">
        <span className="font-bold text-xs">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-[#202124] truncate" title={file.name}>{file.name}</p>
        <p className="text-[11px] text-[#5f6368] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button 
          onClick={() => onPreview(file)} 
          className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition-colors cursor-pointer"
          title="Preview File"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={() => removeFile(id)} 
          className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors cursor-pointer"
          title="Remove File"
        >
          <Trash2 size={16} />
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
      
      const firstFileBytes = new Uint8Array(await files[0].file.arrayBuffer());
      const mergedPdf = await PDFDocument.load(firstFileBytes);
      
      for (let i = 1; i < files.length; i++) {
        const fileBytes = new Uint8Array(await files[i].file.arrayBuffer());
        const srcPdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedBytes = await mergedPdf.save({ useObjectStreams: false });
      
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
    <div className="tool-page-container">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
        accept=".pdf,application/pdf" 
      />
      {/* Header Container */}
      <ToolHeader
        title="Interactive PDF Merge"
        description="Drag, drop, and rearrange multiple PDF files securely."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#ea4335] bg-[#fce8e6] border-[#fad2cf]"
        badge="Multi-PDF Combiner"
        extraBadge="Visual Page Reorder"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Upload & List Area */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card p-4 md:p-6 flex flex-col relative transition-all duration-500 ease-out ${files.length === 0 ? 'min-h-[50vh]' : 'min-h-0'}`}
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
                  className="flex-1 h-full w-full border-2 border-dashed border-[#c2d7fb] hover:border-[#1a73e8] rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[320px] bg-white hover:bg-[#f8fbff]"
                >
                  <div className="w-16 h-16 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-2xl flex items-center justify-center mb-4 pointer-events-none shadow-2xs transition-transform duration-300 group-hover:scale-110">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] mb-2 pointer-events-none text-center">
                    Select or Drop Multiple PDF Files
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6368] text-center max-w-sm pointer-events-none leading-relaxed">
                    Drag and drop PDF files here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>.
                  </p>
                  <p className="text-[11px] text-[#5f6368] mt-3 pointer-events-none text-center">
                    Supports 2 to 50+ PDF files. Files are merged safely inside your browser.
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
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#dadce0]">
                  <div>
                    <h3 className="font-bold text-[#202124] text-sm sm:text-base">Document Sequence</h3>
                    <p className="text-xs text-[#5f6368] mt-0.5">Drag to rearrange the sequence before merging.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="btn-google-secondary text-xs py-1.5 px-3"
                    >
                      + Add More
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
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-2 border-b border-[#dadce0] pb-3">
              <FileText size={15} className="text-[#1a73e8]" /> Merge Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#f8f9fa] border border-[#dadce0] rounded-xl text-center">
                <p className="text-[11px] text-[#5f6368] font-medium">Selected Files</p>
                <p className="text-xl font-extrabold text-[#202124] mt-0.5">{files.length}</p>
              </div>
              <div className="p-3.5 bg-[#f8f9fa] border border-[#dadce0] rounded-xl text-center">
                <p className="text-[11px] text-[#5f6368] font-medium">Total Size</p>
                <p className="text-xl font-extrabold text-[#202124] mt-0.5">{formattedTotalSize} MB</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>Merged in exact sequence from top to bottom.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>100% private in-browser client-side merging.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dadce0] flex flex-col gap-2.5">
              <button 
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Merging PDFs...
                  </>
                ) : (
                  <>
                    <FileText size={16} /> Merge {files.length} PDFs
                  </>
                )}
              </button>

              {files.length > 0 && (
                <button 
                  onClick={() => { setFiles([]); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={isProcessing}
                  className="w-full btn-google-secondary text-xs py-2 justify-center"
                >
                  <Trash2 size={13} /> Clear All
                </button>
              )}
            </div>
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
