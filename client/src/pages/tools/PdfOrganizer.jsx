import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Download, Loader2, X, RefreshCw, LayoutGrid, RotateCw, Trash2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Sortable Thumbnail Component
const SortablePage = ({ page, index, onRemove, onDuplicate, onRotate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`relative group bg-muted/20 border-2 rounded-xl p-2 cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'border-primary shadow-2xl opacity-80' : 'border-border/50 hover:border-primary/50'}`}
    >
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-lg z-10 transition-opacity pointer-events-none">
        Page {index + 1}
      </div>
      
      <div className="w-full aspect-[1/1.4] rounded-lg overflow-hidden bg-background shadow-inner border border-border/50 flex items-center justify-center relative">
        <img 
          src={page.thumbnailUrl} 
          alt={`Page ${index + 1}`} 
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{ transform: `rotate(${page.rotation}deg)` }}
          draggable={false}
        />
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onRemove(page.id); }}
          className="p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-md shadow-sm transition-colors"
          title="Remove Page"
        >
          <Trash2 size={14} />
        </button>
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
          className="p-1.5 bg-blue-500/90 hover:bg-blue-500 text-white rounded-md shadow-sm transition-colors"
          title="Duplicate Page"
        >
          <Copy size={14} />
        </button>
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onRotate(page.id); }}
          className="p-1.5 bg-green-500/90 hover:bg-green-500 text-white rounded-md shadow-sm transition-colors"
          title="Rotate Page"
        >
          <RotateCw size={14} />
        </button>
      </div>
    </div>
  );
};

const PdfOrganizer = () => {
  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null); // original array buffer
  const [pages, setPages] = useState([]); // { id, originalIndex, rotation, thumbnailUrl }
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      await loadPdf(droppedFile);
    } else {
      toast.error('Only PDF files are supported.');
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      await loadPdf(selectedFile);
    }
  };

  const loadPdf = async (selectedFile) => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      setPdfData(arrayBuffer);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // lower scale for thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        loadedPages.push({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i - 1, // 0-indexed for pdf-lib
          rotation: 0,
          thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8)
        });
      }
      setPages(loadedPages);
      setFile(selectedFile);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removePage = (id) => {
    setPages(pages.filter(p => p.id !== id));
  };

  const rotatePage = (id) => {
    setPages(pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const duplicatePage = (id) => {
    const pageIndex = pages.findIndex(p => p.id === id);
    if (pageIndex === -1) return;
    const pageToDup = pages[pageIndex];
    const newPage = {
      ...pageToDup,
      id: `page-${pageToDup.originalIndex}-${Date.now()}`
    };
    const newPages = [...pages];
    newPages.splice(pageIndex + 1, 0, newPage);
    setPages(newPages);
  };

  const handleExport = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 1. Yield for UI update
      await new Promise(r => setTimeout(r, 100));

      const originalDoc = await PDFDocument.load(pdfData);
      const newDoc = await PDFDocument.create();

      // We need to copy pages. Since pages can be duplicated, we can just copy them all one by one or batch
      for (const p of pages) {
        const [copiedPage] = await newDoc.copyPages(originalDoc, [p.originalIndex]);
        if (p.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + p.rotation));
        }
        newDoc.addPage(copiedPage);
      }

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_organized.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('PDF organized successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to organize PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPdfData(null);
    setPages([]);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <LayoutGrid size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">PDF Visual Organizer</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Drag and drop to reorder, delete, duplicate, or rotate PDF pages visually.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Workspace Area */}
        <motion.div 
          layout
          className={`flex-1 w-full bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!file ? (
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
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`flex-1 h-full w-full border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px] ${
                    isDragging ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 pointer-events-none text-center">
                    {isProcessing ? 'Analyzing Document...' : 'Upload PDF to Organize'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm leading-relaxed">
                    {isProcessing ? 'Generating thumbnails...' : <span>Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>. Processing is fully secure.</span>}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Pages ({pages.length})</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">Drag to reorder • Hover for actions</p>
                  </div>
                </div>

                {pages.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 custom-scrollbar max-h-[60vh] overflow-y-auto p-2">
                        {pages.map((page, idx) => (
                          <SortablePage 
                            key={page.id} 
                            page={page} 
                            index={idx}
                            onRemove={removePage}
                            onDuplicate={duplicatePage}
                            onRotate={rotatePage}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                    <Trash2 size={40} className="mb-4 opacity-20" />
                    <p className="font-semibold">All pages removed.</p>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Action panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <RefreshCw size={16} /> Document Details
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Drag pages to reorder them in the final document.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Hover over a page to rotate, duplicate, or delete it.</p>
              </div>
            </div>

            {file && (
              <div className="border-t border-border pt-4 min-w-0">
                <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0 border border-border/50">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">Will export with {pages.length} pages</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleExport}
                disabled={isProcessing || !file || pages.length === 0}
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
                      Exporting...
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
                      <Download size={20} />
                      <span>Export PDF</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-border disabled:opacity-50"
                >
                  <X size={16} />
                  Clear Document
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfOrganizer;
