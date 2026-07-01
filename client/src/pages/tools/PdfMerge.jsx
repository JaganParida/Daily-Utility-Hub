import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, GripVertical, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, file, index, removeFile }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-card border ${isDragging ? 'border-red-500 shadow-lg' : 'border-border'} hover:border-red-500/50 rounded-xl group transition-all`}>
      <button {...attributes} {...listeners} className="p-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVertical size={18} />
      </button>
      <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center shrink-0">
        <span className="font-bold">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button onClick={() => removeFile(id)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 size={18} />
      </button>
    </div>
  );
};

const PdfMerge = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length === 0) { toast.error('Only PDF files are allowed'); return; }
    // Attach unique ID for sortable functionality
    setFiles(prev => [...prev, ...droppedFiles.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const removeFile = (id) => {
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
      toast.error('Please add at least 2 PDFs to merge');
      return;
    }

    const formData = new FormData();
    files.forEach(item => {
      formData.append('pdfs', item.file);
    });

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Merging PDFs securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/merge', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDFs merged successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const backendMsg = error.response?.data?.message || 'Failed to merge PDFs.';
      const details = error.response?.data?.details ? ` (${error.response.data.details})` : '';
      toast.error(backendMsg + details, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-0">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shadow-sm">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interactive PDF Merge</h1>
          <p className="text-muted-foreground mt-1 text-sm">Drag, drop, and rearrange multiple PDF files securely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        
        {/* Upload & List Area */}
        <div className="flex flex-col gap-6 w-full min-h-0">
          
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging ? 'border-red-500 bg-red-500/5' : 'border-border bg-card hover:border-red-500/50 hover:bg-muted/30'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".pdf,application/pdf" />
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 pointer-events-none">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload PDFs</h3>
            <p className="text-sm text-muted-foreground text-center pointer-events-none">
              Drag & drop PDF files here or click to browse.
            </p>
          </div>

          {/* Interactive Drag List */}
          {files.length > 0 && (
            <div className="bg-muted/20 border border-border rounded-2xl p-4 flex flex-col min-h-0 flex-1">
              <div className="flex justify-between items-center mb-4 shrink-0 px-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Reorder Files ({files.length})</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground italic hidden sm:inline">Drag the handles to sort</span>
                  <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline font-bold">Clear All</button>
                </div>
              </div>
              <div className="overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {files.map((item, index) => (
                      <SortableItem key={item.id} id={item.id} file={item.file} index={index} removeFile={removeFile} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Merge Details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Order is determined from top to bottom.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Original files are 100% untouched.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Processed securely; we delete all files after merging.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className="w-full py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={18} />
            {isProcessing ? 'Merging...' : `Merge ${files.length} PDFs`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfMerge;
