import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  UploadCloud, FileText, CheckCircle2, Type, Paintbrush, Highlighter, 
  Square, MousePointer, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Download, Undo2, X, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const hexToRgbFloat = (hex) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r, g, b };
};

const PdfEdit = () => {
  const [file, setFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  
  // Tool state
  const [selectedTool, setSelectedTool] = useState('select'); // select, text, draw, highlight, redact
  const [selectedColor, setSelectedColor] = useState('#ef4444'); // default red
  const [selectedWidth, setSelectedWidth] = useState(4);
  const [selectedFontSize, setSelectedFontSize] = useState(16);

  // Edit actions stack
  const [drawings, setDrawings] = useState({}); // pageIndex -> array of drawings
  const [texts, setTexts] = useState({}); // pageIndex -> array of text objects
  const [shapes, setShapes] = useState({}); // pageIndex -> array of shapes (highlight/redact)
  const [actionHistory, setActionHistory] = useState([]); // Array of actions for Undo

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0, pdfWidth: 0, pdfHeight: 0 });

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Drawing state tracking (refs to avoid re-renders)
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef('');
  const drawingPointsRef = useRef([]);
  const shapeStartRef = useRef(null);
  const [tempShape, setTempShape] = useState(null);
  const [currentDrawingPath, setCurrentDrawingPath] = useState(null);

  // Load PDF file
  const handleFileLoad = async (selectedFile) => {
    const toastId = toast.loading('Loading PDF document...');
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          
          setFile(selectedFile);
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setDrawings({});
          setTexts({});
          setShapes({});
          setActionHistory([]);
          
          toast.success(`PDF Loaded: ${pdf.numPages} pages`, { id: toastId });
        } catch (err) {
          console.error(err);
          toast.error('Error parsing PDF content.', { id: toastId });
        }
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load file.', { id: toastId });
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    handleFileLoad(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    handleFileLoad(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setPdfDocument(null);
    setNumPages(0);
    setCurrentPage(1);
    setDrawings({});
    setTexts({});
    setShapes({});
    setActionHistory([]);
  };

  // Render current PDF page to canvas
  useEffect(() => {
    if (!pdfDocument) return;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          setPageDimensions({
            width: viewport.width,
            height: viewport.height,
            pdfWidth: unscaledViewport.width,
            pdfHeight: unscaledViewport.height
          });
        }
      } catch (err) {
        console.error('Render error:', err);
        toast.error('Failed to render PDF page.');
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Page index helper
  const pageIdx = currentPage - 1;

  // Interaction coordinates resolver
  const getCoordinates = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    // Support touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Handle pointer down
  const handlePointerDown = (e) => {
    if (selectedTool === 'select') return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    isDrawingRef.current = true;
    
    if (selectedTool === 'draw') {
      currentPathRef.current = `M ${coords.x} ${coords.y}`;
      drawingPointsRef.current = [coords];
      setCurrentDrawingPath(currentPathRef.current);
    } else if (selectedTool === 'highlight' || selectedTool === 'redact') {
      shapeStartRef.current = coords;
      setTempShape({
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        type: selectedTool,
        color: selectedColor
      });
    } else if (selectedTool === 'text') {
      // Add text input
      const newText = {
        id: `txt_${Date.now()}`,
        x: coords.x,
        y: coords.y - (selectedFontSize / 2), // vertically centered
        text: '',
        fontSize: selectedFontSize,
        color: selectedColor,
        isEditing: true
      };
      
      setTexts(prev => ({
        ...prev,
        [pageIdx]: [...(prev[pageIdx] || []), newText]
      }));
      
      setActionHistory(prev => [...prev, { type: 'text_add', pageIdx, id: newText.id }]);
      setSelectedTool('select'); // Switch to select so user can edit it
      isDrawingRef.current = false;
    }
  };

  // Handle pointer move
  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    
    const coords = getCoordinates(e);
    
    if (selectedTool === 'draw') {
      currentPathRef.current += ` L ${coords.x} ${coords.y}`;
      drawingPointsRef.current.push(coords);
      setCurrentDrawingPath(currentPathRef.current);
    } else if ((selectedTool === 'highlight' || selectedTool === 'redact') && shapeStartRef.current) {
      const start = shapeStartRef.current;
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const width = Math.abs(start.x - coords.x);
      const height = Math.abs(start.y - coords.y);
      
      setTempShape({
        x,
        y,
        width,
        height,
        type: selectedTool,
        color: selectedColor
      });
    }
  };

  // Handle pointer up
  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (selectedTool === 'draw' && currentDrawingPath) {
      const newDrawing = {
        path: currentDrawingPath,
        color: selectedColor,
        width: selectedWidth
      };
      
      setDrawings(prev => ({
        ...prev,
        [pageIdx]: [...(prev[pageIdx] || []), newDrawing]
      }));
      
      setActionHistory(prev => [...prev, { type: 'draw', pageIdx }]);
      setCurrentDrawingPath(null);
    } else if ((selectedTool === 'highlight' || selectedTool === 'redact') && tempShape) {
      if (tempShape.width > 2 && tempShape.height > 2) {
        setShapes(prev => ({
          ...prev,
          [pageIdx]: [...(prev[pageIdx] || []), tempShape]
        }));
        setActionHistory(prev => [...prev, { type: 'shape', pageIdx }]);
      }
      setTempShape(null);
      shapeStartRef.current = null;
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    
    const history = [...actionHistory];
    const lastAction = history.pop();
    setActionHistory(history);
    
    if (lastAction.type === 'draw') {
      setDrawings(prev => {
        const pageItems = [...(prev[lastAction.pageIdx] || [])];
        pageItems.pop();
        return { ...prev, [lastAction.pageIdx]: pageItems };
      });
    } else if (lastAction.type === 'shape') {
      setShapes(prev => {
        const pageItems = [...(prev[lastAction.pageIdx] || [])];
        pageItems.pop();
        return { ...prev, [lastAction.pageIdx]: pageItems };
      });
    } else if (lastAction.type === 'text_add') {
      setTexts(prev => {
        const pageItems = (prev[lastAction.pageIdx] || []).filter(item => item.id !== lastAction.id);
        return { ...prev, [lastAction.pageIdx]: pageItems };
      });
    }
  };

  // Edit / drag text box handlers
  const handleTextChange = (e, pageIndex, id) => {
    const val = e.target.value;
    setTexts(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || []).map(item => 
        item.id === id ? { ...item, text: val } : item
      )
    }));
  };

  const handleTextBlur = (pageIndex, id) => {
    setTexts(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || []).map(item => 
        item.id === id ? { ...item, isEditing: false } : item
      ).filter(item => item.text.trim() !== '') // Remove empty texts on blur
    }));
  };

  const startTextEdit = (pageIndex, id) => {
    setTexts(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || []).map(item => 
        item.id === id ? { ...item, isEditing: true } : item
      )
    }));
  };

  const deleteText = (pageIndex, id) => {
    setTexts(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || []).filter(item => item.id !== id)
    }));
  };

  // Text box dragging states
  const dragTextRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleTextMouseDown = (e, pageIndex, id) => {
    if (selectedTool !== 'select') return;
    e.stopPropagation();
    
    const textItem = (texts[pageIndex] || []).find(item => item.id === id);
    if (!textItem || textItem.isEditing) return;
    
    const coords = getCoordinates(e);
    dragTextRef.current = { pageIndex, id };
    dragOffsetRef.current = {
      x: coords.x - textItem.x,
      y: coords.y - textItem.y
    };
    
    // Add temporary window move/up listeners to handle dragging smoothly out of boundary
    const handleWindowMove = (moveEvent) => {
      if (!dragTextRef.current) return;
      const moveCoords = getCoordinates(moveEvent);
      
      setTexts(prev => ({
        ...prev,
        [pageIndex]: (prev[pageIndex] || []).map(item => 
          item.id === id ? {
            ...item,
            x: moveCoords.x - dragOffsetRef.current.x,
            y: moveCoords.y - dragOffsetRef.current.y
          } : item
        )
      }));
    };
    
    const handleWindowUp = () => {
      dragTextRef.current = null;
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };
    
    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowUp);
  };

  // Process & Compile the Edited PDF
  const handleSave = async () => {
    if (!file) return;
    
    const totalEdits = 
      Object.values(drawings).flat().length + 
      Object.values(texts).flat().length + 
      Object.values(shapes).flat().length;
      
    if (totalEdits === 0) {
      toast.error('No changes to save!');
      return;
    }

    const toastId = toast.loading('Compiling changes into PDF...');
    setIsProcessing(true);
    
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      
      // Scale mappings: canvas pixel coordinates to unscaled PDF points
      const scaleX = pageDimensions.pdfWidth / pageDimensions.width;
      const scaleY = pageDimensions.pdfHeight / pageDimensions.height;
      const pdfHeight = pageDimensions.pdfHeight;

      // Iterate through each page of the document
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // 1. Draw shapes (Highlights and Redactions)
        const pageShapes = shapes[i] || [];
        for (const shape of pageShapes) {
          const colorFloat = hexToRgbFloat(shape.color);
          
          page.drawRectangle({
            x: shape.x * scaleX,
            y: pdfHeight - (shape.y * scaleY) - (shape.height * scaleY),
            width: shape.width * scaleX,
            height: shape.height * scaleY,
            color: rgb(colorFloat.r, colorFloat.g, colorFloat.b),
            opacity: shape.type === 'highlight' ? 0.35 : 1.0
          });
        }
        
        // 2. Draw freehand path lines
        const pageDrawings = drawings[i] || [];
        for (const drawing of pageDrawings) {
          const colorFloat = hexToRgbFloat(drawing.color);
          
          // Convert the canvas relative SVG path points to absolute PDF coordinates
          const scaledPath = drawing.path.replace(/([ML])\s*([\d.-]+)\s*([\d.-]+)/g, (match, cmd, x, y) => {
            const px = parseFloat(x) * scaleX;
            const py = pdfHeight - (parseFloat(y) * scaleY);
            return `${cmd} ${px} ${py}`;
          });
          
          page.drawSvgPath(scaledPath, {
            borderColor: rgb(colorFloat.r, colorFloat.g, colorFloat.b),
            borderWidth: drawing.width * scaleX,
            borderLineCap: 'round',
            borderLineJoin: 'round'
          });
        }
        
        // 3. Draw text objects
        const pageTexts = texts[i] || [];
        for (const textItem of pageTexts) {
          const colorFloat = hexToRgbFloat(textItem.color);
          
          page.drawText(textItem.text, {
            x: textItem.x * scaleX,
            y: pdfHeight - (textItem.y * scaleY) - (textItem.fontSize * scaleY),
            size: textItem.fontSize * scaleX,
            font: helveticaBold,
            color: rgb(colorFloat.r, colorFloat.g, colorFloat.b)
          });
        }
      }
      
      // Save and compile final PDF bytes
      const compiledBytes = await pdfDoc.save();
      const blob = new Blob([compiledBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `edited_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF compiled and downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile PDF updates.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const presetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interactive PDF Editor</h1>
          <p className="text-muted-foreground mt-1 text-sm">Draw, write text, highlight, and redact elements directly on your document online.</p>
        </div>
      </div>

      {!file ? (
        <div 
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-96 ${
            isDragging ? 'border-red-500 bg-red-500/5' : 'border-border bg-card hover:border-red-500/50 hover:bg-muted/30'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 pointer-events-none">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF to Edit</h3>
          <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm">
            Drag & drop your PDF file here or click to browse. Fully secure & processed in your browser.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full flex-1">
          
          {/* Main Editing Board */}
          <div className="flex-1 w-full flex flex-col gap-4">
            
            {/* Top Toolbar Panel */}
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0 sticky top-0 z-40 backdrop-blur-md bg-card/85">
              
              {/* Tool Selector */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedTool('select')}
                  title="Select & Move Text"
                  className={`p-2 rounded-lg transition-colors ${selectedTool === 'select' ? 'bg-background shadow text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <MousePointer size={18} />
                </button>
                <button
                  onClick={() => setSelectedTool('text')}
                  title="Insert Text"
                  className={`p-2 rounded-lg transition-colors ${selectedTool === 'text' ? 'bg-background shadow text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Type size={18} />
                </button>
                <button
                  onClick={() => setSelectedTool('draw')}
                  title="Draw / Signature"
                  className={`p-2 rounded-lg transition-colors ${selectedTool === 'draw' ? 'bg-background shadow text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Paintbrush size={18} />
                </button>
                <button
                  onClick={() => setSelectedTool('highlight')}
                  title="Translucent Highlight"
                  className={`p-2 rounded-lg transition-colors ${selectedTool === 'highlight' ? 'bg-background shadow text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Highlighter size={18} />
                </button>
                <button
                  onClick={() => setSelectedTool('redact')}
                  title="Solid Redaction Box"
                  className={`p-2 rounded-lg transition-colors ${selectedTool === 'redact' ? 'bg-background shadow text-red-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Square size={18} />
                </button>
              </div>

              {/* Toolbar Settings (Colors / Size / Sliders) */}
              <div className="flex items-center flex-wrap gap-4">
                
                {/* Color Selection */}
                {selectedTool !== 'select' && (
                  <div className="flex items-center gap-1.5 border-r border-border pr-4">
                    {presetColors.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border transition-all ${selectedColor === c ? 'border-foreground scale-125 ring-2 ring-foreground/20' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                )}

                {/* Size / Font Size Adjusters */}
                {selectedTool === 'draw' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Width:</span>
                    <input 
                      type="range" min="1" max="15" 
                      value={selectedWidth} 
                      onChange={(e) => setSelectedWidth(parseInt(e.target.value))}
                      className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-bold w-4 text-center">{selectedWidth}</span>
                  </div>
                )}

                {selectedTool === 'text' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Size:</span>
                    <select
                      value={selectedFontSize}
                      onChange={(e) => setSelectedFontSize(parseInt(e.target.value))}
                      className="bg-muted/50 border border-border text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16">16px</option>
                      <option value="20">20px</option>
                      <option value="24">24px</option>
                      <option value="32">32px</option>
                      <option value="48">48px</option>
                    </select>
                  </div>
                )}

                {/* Zoom Control */}
                <div className="flex items-center gap-2 border-l border-border pl-4">
                  <button 
                    onClick={() => setScale(s => Math.max(0.75, s - 0.25))}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-bold w-10 text-center">{Math.round(scale * 100)}%</span>
                  <button 
                    onClick={() => setScale(s => Math.min(2.0, s + 0.25))}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                {/* Undo Action */}
                <button
                  onClick={handleUndo}
                  disabled={actionHistory.length === 0}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  title="Undo Last Action"
                >
                  <Undo2 size={18} />
                </button>
              </div>

              {/* Info Indicator */}
              <div className="text-xs bg-muted/40 px-3 py-1.5 rounded-xl text-muted-foreground border border-border hidden sm:block">
                {selectedTool === 'select' && 'Select / Drag text elements.'}
                {selectedTool === 'text' && 'Click on page to type text.'}
                {selectedTool === 'draw' && 'Draw signature / lines.'}
                {selectedTool === 'highlight' && 'Click & drag to highlight.'}
                {selectedTool === 'redact' && 'Click & drag to blackout info.'}
              </div>

            </div>

            {/* Document Canvas Workspace Container */}
            <div className="bg-muted/10 border border-border rounded-3xl p-6 min-h-[500px] overflow-auto flex items-center justify-center relative select-none">
              
              {isRendering && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="text-center text-sm font-semibold flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    Rendering Page...
                  </div>
                </div>
              )}

              {/* Interactive Canvas Overlay Container */}
              <div 
                ref={containerRef}
                className="relative bg-card shadow-xl border border-border rounded-xl mx-auto overflow-hidden"
                style={{ 
                  width: `${pageDimensions.width}px`, 
                  height: `${pageDimensions.height}px` 
                }}
              >
                {/* Rendered PDF Page Canvas */}
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 z-0 pointer-events-none" 
                />
                
                {/* Mouse/Touch Interaction Overlay Board */}
                <div 
                  className="absolute inset-0 z-10"
                  style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                >
                  {/* Drawings SVG Render Board */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* Render finalized drawings */}
                    {(drawings[pageIdx] || []).map((draw, idx) => (
                      <path 
                        key={idx}
                        d={draw.path}
                        fill="none"
                        stroke={draw.color}
                        strokeWidth={draw.width}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    
                    {/* Render active drawing line */}
                    {currentDrawingPath && (
                      <path 
                        d={currentDrawingPath}
                        fill="none"
                        stroke={selectedColor}
                        strokeWidth={selectedWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Render finalized shapes */}
                    {(shapes[pageIdx] || []).map((shape, idx) => (
                      <rect 
                        key={idx}
                        x={shape.x}
                        y={shape.y}
                        width={shape.width}
                        height={shape.height}
                        fill={shape.type === 'highlight' ? `${shape.color}50` : shape.color}
                        stroke="none"
                      />
                    ))}

                    {/* Render active shape */}
                    {tempShape && (
                      <rect 
                        x={tempShape.x}
                        y={tempShape.y}
                        width={tempShape.width}
                        height={tempShape.height}
                        fill={tempShape.type === 'highlight' ? `${tempShape.color}50` : tempShape.color}
                        stroke="none"
                      />
                    )}
                  </svg>

                  {/* Render editable text overlays */}
                  {(texts[pageIdx] || []).map((textItem) => (
                    <div
                      key={textItem.id}
                      style={{
                        position: 'absolute',
                        left: `${textItem.x}px`,
                        top: `${textItem.y}px`,
                        color: textItem.color,
                        fontSize: `${textItem.fontSize}px`,
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                        zIndex: 20
                      }}
                      onMouseDown={(e) => handleTextMouseDown(e, pageIdx, textItem.id)}
                      onTouchStart={(e) => handleTextMouseDown(e, pageIdx, textItem.id)}
                    >
                      {textItem.isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={textItem.text}
                          onChange={(e) => handleTextChange(e, pageIdx, textItem.id)}
                          onBlur={() => handleTextBlur(pageIdx, textItem.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTextBlur(pageIdx, textItem.id);
                          }}
                          className="bg-background/80 border-2 border-red-500 rounded px-1.5 py-0.5 outline-none text-foreground font-bold shadow-md min-w-[120px]"
                          style={{ 
                            fontSize: `${textItem.fontSize}px`, 
                            color: textItem.color 
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className="px-1.5 py-0.5 border border-dashed border-transparent hover:border-red-500/55 hover:bg-muted/40 rounded cursor-move select-none flex items-center gap-1.5"
                          onDoubleClick={() => startTextEdit(pageIdx, textItem.id)}
                        >
                          <span>{textItem.text || 'Type...'}</span>
                          {selectedTool === 'select' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteText(pageIdx, textItem.id); }}
                              className="text-[10px] bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 ml-1 transition-all cursor-pointer font-normal"
                              title="Delete Text"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                </div>

              </div>

            </div>

            {/* Bottom Page Navigation Controls */}
            <div className="flex items-center justify-center gap-4 bg-card border border-border p-3.5 rounded-2xl shadow-sm shrink-0">
              <button
                disabled={currentPage <= 1 || isRendering}
                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                className="p-2 hover:bg-muted rounded-xl disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-foreground">
                Page {currentPage} of {numPages}
              </span>
              <button
                disabled={currentPage >= numPages || isRendering}
                onClick={() => setCurrentPage(c => Math.min(numPages, c + 1))}
                className="p-2 hover:bg-muted rounded-xl disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>

          {/* Right Action/Compile Sidebar Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Edit Details</h3>
              <div className="space-y-4 text-sm text-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <p>Changes are saved inside the browser using standard vectors.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <p>Works completely client-side. Zero server upload latency.</p>
                </div>
                <div className="flex items-start gap-3">
                  <HelpCircle className="text-blue-500 mt-0.5 shrink-0" size={16} />
                  <p className="text-xs text-muted-foreground">Double click on a text annotation block to re-edit it.</p>
                </div>
              </div>
            </div>

            {/* File info card */}
            <div className="border-t border-border pt-4 min-w-0">
              <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl min-w-0">
                <FileText className="text-red-500 shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSave}
                disabled={isProcessing}
                className="w-full py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                {isProcessing ? 'Compiling PDF...' : 'Download Edited PDF'}
              </button>
              <button
                onClick={handleClear}
                className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <X size={16} />
                Close Document
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PdfEdit;
