import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  FileText, UploadCloud, Download, Loader2, Trash2, Eye, X, 
  Plus, CheckCircle2, ArrowRight, ArrowUp, ArrowDown, GripVertical, 
  Layers, RefreshCw, Sparkles, Check, ArrowDownAZ
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

const SortablePdfCard = ({ item, index, total, onRemove, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md ${
        isDragging 
          ? 'border-[#1a73e8] bg-[#e8f0fe] shadow-lg scale-105 ring-2 ring-[#1a73e8]/30' 
          : 'border-[#dadce0] hover:border-[#1a73e8]'
      }`}
    >
      {/* Top Header in Card */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#e8f0fe] text-[#1a73e8] font-bold text-xs flex items-center justify-center border border-[#d2e3fc]">
            {index + 1}
          </div>
          <span className="text-[11px] font-bold text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
            {item.pageCount ? `${item.pageCount} pgs` : 'PDF'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-[#9aa0a6] hover:text-[#202124] cursor-grab active:cursor-grabbing rounded hover:bg-[#f1f3f4]"
            title="Drag to reorder"
          >
            <GripVertical size={15} />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors cursor-pointer"
            title="Remove document"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Center Icon & Name */}
      <div className="py-3 flex flex-col items-center text-center">
        <div className="w-12 h-14 bg-[#fce8e6] border border-[#fad2cf] rounded-xl flex items-center justify-center text-[#ea4335] mb-2 shadow-2xs group-hover:scale-105 transition-transform">
          <FileText size={26} />
        </div>
        <p className="text-xs font-bold text-[#202124] truncate w-full px-1" title={item.file.name}>
          {item.file.name}
        </p>
        <span className="text-[11px] text-[#5f6368] mt-0.5">
          {(item.file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>

      {/* Card Footer controls */}
      <div className="flex items-center justify-between pt-2 border-t border-[#dadce0]/60 mt-1">
        <span className="text-[10px] text-[#9aa0a6] font-semibold">Position {index + 1} of {total}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            className="p-1 text-[#5f6368] hover:text-[#202124] disabled:opacity-20 cursor-pointer"
            title="Move Earlier"
          >
            <ArrowUp size={12} className="-rotate-90" />
          </button>
          <button
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            className="p-1 text-[#5f6368] hover:text-[#202124] disabled:opacity-20 cursor-pointer"
            title="Move Later"
          >
            <ArrowDown size={12} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PdfMerge = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      addFiles([initialFile]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [items, setItems] = useState([]); // [{ id, file, pageCount }]
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [mergedFileName, setMergedFileName] = useState('');
  const [outputDocName, setOutputDocName] = useState('merged_document.pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    };
  }, [mergedPdfUrl]);

  const addFiles = async (filesList) => {
    if (!filesList || !filesList.length) return;
    const newFiles = Array.from(filesList).filter(f => f.type === 'application/pdf');
    if (newFiles.length === 0) {
      toast.error('Only PDF documents are supported.');
      return;
    }

    const loadedItems = [];
    for (const f of newFiles) {
      let pageCount = null;
      try {
        const buffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
      } catch (err) {
        console.warn('Could not read page count', err);
      }
      loadedItems.push({
        id: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        pageCount
      });
    }

    setItems(prev => [...prev, ...loadedItems]);
    setMergedPdfUrl(null);
    toast.success(`Added ${loadedItems.length} PDF file${loadedItems.length > 1 ? 's' : ''}`);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setMergedPdfUrl(null);
  };

  const moveFile = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    setItems(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(i => i.id === active.id);
        const newIndex = currentItems.findIndex(i => i.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  const sortAlphabetical = () => {
    setItems(prev => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name)));
    toast.success('Sorted files alphabetically');
  };

  const clearAll = () => {
    setItems([]);
    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
  };

  const totalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);
  const totalSize = items.reduce((acc, curr) => acc + curr.file.size, 0);

  const handleMerge = async () => {
    if (items.length < 2) {
      toast.error('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setMergedPdfUrl(null);
    const toastId = toast.loading('Combining and merging PDF documents...');

    try {
      await new Promise(r => setTimeout(r, 100));
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < items.length; i++) {
        setProgress(Math.round(((i + 1) / items.length) * 85));
        const fileBuffer = await items[i].file.arrayBuffer();
        const currentDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(currentDoc, currentDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      setProgress(95);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const targetFileName = outputDocName.endsWith('.pdf') ? outputDocName : `${outputDocName}.pdf`;
      setMergedPdfUrl(url);
      setMergedFileName(targetFileName);
      setProgress(100);

      toast.success('PDFs merged successfully!', { id: toastId });

      // Auto trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = targetFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Merge error:', err);
      toast.error('Failed to merge PDFs. One of the documents may be password protected.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasFiles = items.length > 0;

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="Merge PDF Files"
        description="Combine multiple PDF documents into a single organized file with customizable order and fast in-browser assembly."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Multi-Document Merger"
        extraBadge="Instant Assembly"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {!hasFiles ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
                onChange={(e) => addFiles(e.target.files)} 
                className="hidden" 
                accept=".pdf,application/pdf" 
                multiple 
              />
              <div className="w-20 h-20 bg-[#e8f0fe] border border-[#d2e3fc] rounded-3xl flex items-center justify-center text-[#1a73e8] mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF Files to Merge
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop 2 or more PDF documents here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. Reorder seamlessly before merging.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  100% Private In-Browser
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  No File Size Limit
                </span>
              </div>
            </div>
          ) : (
            /* Multi-File Studio Gallery with DnD */
            <div className="tool-card p-4 sm:p-6 space-y-5">
              
              {/* Studio Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>{items.length} Documents</span>
                  </div>
                  <span className="text-xs text-[#5f6368] hidden sm:inline">
                    &bull; {totalPages > 0 ? `${totalPages} Total Pages` : ''} &bull; {(totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={sortAlphabetical}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                    title="Sort files alphabetically"
                  >
                    <ArrowDownAZ size={14} /> Sort A-Z
                  </button>
                  <button
                    onClick={() => addMoreInputRef.current?.click()}
                    className="btn-google-primary text-xs py-1.5 px-3 shadow-2xs"
                  >
                    <Plus size={14} /> Add More PDFs
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors cursor-pointer"
                    title="Clear all files"
                  >
                    <Trash2 size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={addMoreInputRef} 
                    onChange={(e) => addFiles(e.target.files)} 
                    className="hidden" 
                    accept=".pdf,application/pdf" 
                    multiple 
                  />
                </div>
              </div>

              {/* Draggable Document Grid */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 custom-scrollbar max-h-[65vh] overflow-y-auto p-1">
                    {items.map((item, idx) => (
                      <SortablePdfCard
                        key={item.id}
                        item={item}
                        index={idx}
                        total={items.length}
                        onRemove={removeFile}
                        onMove={moveFile}
                      />
                    ))}

                    {/* Add More Tile */}
                    <div
                      onClick={() => addMoreInputRef.current?.click()}
                      className="min-h-[160px] border-2 border-dashed border-[#c2d7fb] hover:border-[#1a73e8] bg-white hover:bg-[#f8fbff] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                      </div>
                      <span className="text-xs font-bold text-[#1a73e8]">Add More</span>
                      <span className="text-[10px] text-[#5f6368]">PDF Documents</span>
                    </div>
                  </div>
                </SortableContext>
              </DndContext>

            </div>
          )}

        </div>

        {/* Right Sidebar Cockpit */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!hasFiles ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <RefreshCw size={15} className="text-[#1a73e8]" /> Assembly Cockpit
            </h3>

            {/* Custom Output Document Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider block">Output File Name</label>
              <input 
                type="text"
                value={outputDocName}
                onChange={(e) => setOutputDocName(e.target.value)}
                placeholder="merged_document.pdf"
                className="google-input w-full text-xs font-semibold"
              />
            </div>

            {/* Merge Stats Summary */}
            <div className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs space-y-2">
              <div className="flex justify-between text-[#5f6368]">
                <span>Documents:</span>
                <span className="font-bold text-[#202124]">{items.length} Files</span>
              </div>
              <div className="flex justify-between text-[#5f6368]">
                <span>Total Combined Pages:</span>
                <span className="font-bold text-[#1a73e8]">{totalPages > 0 ? `${totalPages} Pages` : 'Ready'}</span>
              </div>
              <div className="flex justify-between text-[#5f6368]">
                <span>Total Size:</span>
                <span className="font-bold text-[#202124]">{(totalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            {/* Merge Action CTA */}
            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleMerge}
                disabled={isProcessing || items.length < 2}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Merging ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Merge {items.length} PDF Files</span>
                  </>
                )}
              </button>

              {mergedPdfUrl && !isProcessing && (
                <a
                  href={mergedPdfUrl}
                  download={mergedFileName}
                  className="w-full btn-google-secondary text-xs py-2 justify-center border-[#34a853] text-[#137333] bg-[#e6f4ea] hover:bg-[#ceead6]"
                >
                  <CheckCircle2 size={14} className="text-[#34a853]" /> Download Merged PDF
                </a>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PdfMerge;
