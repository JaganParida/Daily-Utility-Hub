import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, X, 
  RotateCw, Trash2, Copy, RefreshCw, CheckCircle2, 
  Layers, Sparkles, Move, ArrowLeftRight, Check
} from 'lucide-react';
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

const SortablePageCard = ({ page, index, onRemove, onDuplicate, onRotate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group relative bg-white border-2 rounded-2xl p-2.5 flex flex-col justify-between transition-all select-none shadow-2xs hover:shadow-md ${
        isDragging 
          ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-xl scale-105 ring-2 ring-[#1a73e8]/30' 
          : 'border-[#dadce0] hover:border-[#1a73e8]'
      }`}
    >
      {/* Top Bar with Drag Handle & Index */}
      <div className="flex items-center justify-between gap-1 mb-1.5 px-1">
        <div className="bg-[#202124]/85 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
          Page {index + 1}
        </div>

        <button 
          {...attributes} 
          {...listeners}
          className="p-1 text-[#9aa0a6] hover:text-[#202124] cursor-grab active:cursor-grabbing rounded hover:bg-[#f1f3f4]"
          title="Drag to reorder"
        >
          <Move size={14} />
        </button>
      </div>
      
      {/* Page Preview Thumbnail */}
      <div className="w-full aspect-[1/1.4] rounded-xl overflow-hidden bg-[#f8f9fa] shadow-inner border border-[#dadce0] flex items-center justify-center relative mb-2">
        <img 
          src={page.thumbnailUrl} 
          alt={`Page ${index + 1}`} 
          className="max-w-full max-h-full object-contain transition-transform duration-300 pointer-events-none"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />

        {/* Hover Quick Actions Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
            className="p-1.5 bg-white/95 hover:bg-[#1a73e8] text-[#202124] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
            title="Rotate 90°"
          >
            <RotateCw size={13} />
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
            className="p-1.5 bg-white/95 hover:bg-[#1a73e8] text-[#202124] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
            title="Duplicate Page"
          >
            <Copy size={13} />
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
            className="p-1.5 bg-white/95 hover:bg-[#d93025] text-[#d93025] hover:text-white rounded-lg shadow-xs transition-colors cursor-pointer border border-[#dadce0]"
            title="Remove Page"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="text-center pt-1 border-t border-[#dadce0]/50">
        <span className="text-[10px] text-[#5f6368] font-bold">
          {page.rotation !== 0 ? `Rotated ${page.rotation}°` : 'Original'}
        </span>
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
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadPdf = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsProcessing(true);
    const toastId = toast.loading('Rendering interactive page thumbnails...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      setPdfData(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const renderedPages = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        renderedPages.push({
          id: `page-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          originalIndex: i - 1,
          thumbnailUrl: canvas.toDataURL(),
          rotation: 0,
        });
      }

      setPages(renderedPages);
      toast.success(`Loaded ${numPages} pages ready to organize`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    toast.info('Page removed');
  };

  const handleDuplicate = (id) => {
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return;
    const pageToDup = pages[index];
    const newPage = {
      ...pageToDup,
      id: `page-${pageToDup.originalIndex + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, newPage);
    setPages(newPages);
    toast.success('Page duplicated');
  };

  const handleRotate = (id) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleRotateAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
    toast.success('All pages rotated 90°');
  };

  const handleReverseOrder = () => {
    setPages((prev) => [...prev].reverse());
    toast.success('Page order reversed');
  };

  const handleSave = async () => {
    if (!pdfData || pages.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    const toastId = toast.loading('Compiling organized PDF...');

    try {
      const srcDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        setProgress(Math.round(((i + 1) / pages.length) * 85));
        const p = pages[i];
        const [copiedPage] = await newDoc.copyPages(srcDoc, [p.originalIndex]);

        if (p.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + p.rotation) % 360));
        }

        newDoc.addPage(copiedPage);
      }

      setProgress(95);
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `${file.name.replace('.pdf', '')}_organized.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success('Organized PDF exported successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile organized PDF.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPdfData(null);
    setPages([]);
  };

  const hasPages = pages.length > 0;

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="Visual PDF Page Organizer"
        description="Reorder, rotate, duplicate, or delete PDF pages with visual drag-and-drop tiles."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Drag & Drop Organizer"
        extraBadge="Rotate & Duplicate"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {!file ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]?.type === 'application/pdf') {
                  loadPdf(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`tool-card p-8 sm:p-12 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[380px] group ${
                isDragging 
                  ? 'border-[#1a73e8] bg-[#e8f0fe]/50 scale-[0.99] shadow-inner' 
                  : 'border-[#c2d7fb] hover:border-[#1a73e8] hover:bg-[#f8fbff]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files[0] && loadPdf(e.target.files[0])} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-20 h-20 bg-[#e8f0fe] border border-[#d2e3fc] rounded-3xl flex items-center justify-center text-[#1a73e8] mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF to Organize
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. Visual thumbnail reordering.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  100% In-Browser Privacy
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  Unlimited Pages
                </span>
              </div>
            </div>
          ) : (
            /* Visual Interactive DnD Workspace */
            <div className="tool-card p-4 sm:p-6 space-y-5">
              
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>{pages.length} Pages</span>
                  </div>
                  <span className="text-xs text-[#5f6368] hidden sm:inline">&bull; Drag tiles to reorder</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleRotateAll}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    <RotateCw size={13} /> Rotate All
                  </button>
                  <button
                    onClick={handleReverseOrder}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    <ArrowLeftRight size={13} /> Reverse Order
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    <X size={13} /> Change PDF
                  </button>
                </div>
              </div>

              {/* Drag and drop grid */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 custom-scrollbar max-h-[65vh] overflow-y-auto p-1">
                    {pages.map((page, index) => (
                      <SortablePageCard
                        key={page.id}
                        page={page}
                        index={index}
                        onRemove={handleRemove}
                        onDuplicate={handleDuplicate}
                        onRotate={handleRotate}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

            </div>
          )}

        </div>

        {/* Right Sidebar Cockpit */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!hasPages ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <RefreshCw size={15} className="text-[#1a73e8]" /> Compilation Summary
            </h3>

            {file && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#5f6368]">
                  <span>Source Document:</span>
                  <span className="font-bold text-[#202124] truncate max-w-[160px]">{file.name}</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Total Output Pages:</span>
                  <span className="font-bold text-[#1a73e8]">{pages.length} Pages</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#dadce0]">
              <button
                onClick={handleSave}
                disabled={isProcessing || !hasPages}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Compiling ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Save & Export Organized PDF</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PdfOrganizer;
