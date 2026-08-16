import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
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
      className={`relative group bg-[#f8f9fa] border-2 rounded-xl p-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'border-[#1a73e8] shadow-lg bg-[#e8f0fe] opacity-90 scale-105' : 'border-[#dadce0] hover:border-[#1a73e8]/60 bg-white shadow-2xs'
      }`}
    >
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#202124]/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-md z-10 pointer-events-none">
        Page {index + 1}
      </div>
      
      <div className="w-full aspect-[1/1.4] rounded-lg overflow-hidden bg-white shadow-inner border border-[#dadce0] flex items-center justify-center relative">
        <img 
          src={page.thumbnailUrl} 
          alt={`Page ${index + 1}`} 
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{ transform: `rotate(${page.rotation}deg)` }}
          draggable={false}
        />
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
          className="p-1.5 bg-[#d93025] hover:bg-[#b3261e] text-white rounded-md shadow-xs transition-colors cursor-pointer"
          title="Remove Page"
        >
          <Trash2 size={13} />
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
          className="p-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md shadow-xs transition-colors cursor-pointer"
          title="Duplicate Page"
        >
          <Copy size={13} />
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
          className="p-1.5 bg-[#137333] hover:bg-[#0d5926] text-white rounded-md shadow-xs transition-colors cursor-pointer"
          title="Rotate Page"
        >
          <RotateCw size={13} />
        </button>
      </div>
    </div>
  );
};

const PdfOrganizer = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadPdf = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsProcessing(true);
    const toastId = toast.loading('Rendering page thumbnails...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      setPdfData(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const renderedPages = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        renderedPages.push({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i - 1,
          thumbnailUrl: canvas.toDataURL(),
          rotation: 0,
        });
      }

      setPages(renderedPages);
      toast.success('Document pages loaded!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load PDF pages. Password-protected files are not supported here.', { id: toastId });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      loadPdf(selectedFile);
    } else {
      toast.error('Please select a valid PDF file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      loadPdf(droppedFile);
    } else {
      toast.error('Please drop a valid PDF file.');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removePage = (id) => {
    setPages(pages.filter((p) => p.id !== id));
    toast.info('Page removed');
  };

  const duplicatePage = (id) => {
    const pageIndex = pages.findIndex((p) => p.id === id);
    if (pageIndex !== -1) {
      const pageToDup = pages[pageIndex];
      const newPage = {
        ...pageToDup,
        id: `page-${pageToDup.originalIndex}-${Date.now()}`,
      };
      const newPages = [...pages];
      newPages.splice(pageIndex + 1, 0, newPage);
      setPages(newPages);
      toast.success('Page duplicated');
    }
  };

  const rotatePage = (id) => {
    setPages(
      pages.map((p) => {
        if (p.id === id) {
          return { ...p, rotation: (p.rotation + 90) % 360 };
        }
        return p;
      })
    );
  };

  const handleExport = async () => {
    if (!pdfData || pages.length === 0) return;
    setIsProcessing(true);
    const toastId = toast.loading('Compiling organized PDF...');

    try {
      const srcDoc = await PDFDocument.load(pdfData);
      const newDoc = await PDFDocument.create();

      for (const p of pages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [p.originalIndex]);
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(currentRotation + p.rotation));
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

      toast.success('PDF organized and saved!', { id: toastId });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPdfData(null);
    setPages([]);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF Visual Page Organizer"
        description="Drag and drop to reorder, delete, duplicate, or rotate PDF pages visually."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Visual Page Organizer"
        extraBadge="Rotate, Delete, Duplicate"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Workspace Area */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card p-4 md:p-6 flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
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
                  className="flex-1 h-full w-full border-2 border-dashed border-[#c2d7fb] bg-white hover:border-[#1a73e8] hover:bg-[#f8fbff] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[300px]"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl flex items-center justify-center text-[#1a73e8] mb-4 shadow-2xs transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] mb-2 pointer-events-none text-center">
                    {isProcessing ? 'Analyzing Document Pages...' : 'Upload PDF to Organize'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6368] text-center pointer-events-none max-w-sm leading-relaxed">
                    {isProcessing ? 'Generating page previews...' : <span>Drag & drop a PDF file here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>. 100% private in-browser.</span>}
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
                className="flex flex-col min-h-0 w-full space-y-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#dadce0] pb-3 gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Document Pages ({pages.length})</h3>
                    <p className="text-xs text-[#5f6368] mt-0.5">Drag tiles to reorder &bull; Hover or tap controls to rotate or duplicate</p>
                  </div>
                </div>

                {pages.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 custom-scrollbar max-h-[60vh] overflow-y-auto p-1">
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
                  <div className="py-20 flex flex-col items-center justify-center text-[#5f6368]">
                    <Trash2 size={40} className="mb-4 opacity-30 text-[#d93025]" />
                    <p className="font-semibold text-sm">All pages removed.</p>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Action panel */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <RefreshCw size={15} className="text-[#1a73e8]" /> Document Summary
            </h3>
            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Drag pages to reorder them in the compiled final PDF.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Hover over pages to rotate 90°, duplicate, or delete.</p>
              </div>
            </div>

            {file && (
              <div className="border-t border-[#dadce0] pt-3 min-w-0">
                <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl min-w-0 border border-[#dadce0]">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-lg shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-[#202124] truncate" title={file.name}>{file.name}</p>
                    <p className="text-[11px] text-[#5f6368]">Will export with {pages.length} pages</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#dadce0] flex flex-col gap-2.5">
              <button 
                onClick={handleExport}
                disabled={isProcessing || !file || pages.length === 0}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Exporting PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export & Download PDF</span>
                  </>
                )}
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full btn-google-secondary text-xs py-2 justify-center"
                >
                  <X size={14} /> Clear Document
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
