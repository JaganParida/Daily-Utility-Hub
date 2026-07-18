import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Upload, FileUp, Palette, Mic, Layers, Play, Square, Settings, Undo, Redo, Eraser, PenTool, LayoutGrid, Download, Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const extractPptxData = async (file) => {
  const zip = await JSZip.loadAsync(file);
  
  // Extract Colors
  let colors = [];
  try {
    const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
    if (themeXml) {
      const srgbMatches = [...themeXml.matchAll(/<a:srgbClr val="([0-9A-Fa-f]{6})"/g)].map(m => '#' + m[1]);
      const sysClrMatches = [...themeXml.matchAll(/lastClr="([0-9A-Fa-f]{6})"/g)].map(m => '#' + m[1]);
      colors = [...new Set([...srgbMatches, ...sysClrMatches])].slice(0, 14);
    }
  } catch(e) { console.error('Theme extraction failed', e); }

  // Extract Slides and Notes
  const slideKeys = Object.keys(zip.files).filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/));
  slideKeys.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)[1]);
    const numB = parseInt(b.match(/slide(\d+)/)[1]);
    return numA - numB;
  });

  const parsedSlides = [];
  for (let i = 0; i < slideKeys.length; i++) {
    const slideKey = slideKeys[i];
    const slideNum = slideKey.match(/slide(\d+)/)[1];
    
    // Slide text
    const slideXml = await zip.file(slideKey).async('text');
    const texts = [...slideXml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join(' ');
    
    // Find notes via rels
    let notesText = '';
    try {
      const relsKey = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      if (zip.file(relsKey)) {
        const relsXml = await zip.file(relsKey).async('text');
        const notesMatch = relsXml.match(/Target="\.\.\/notesSlides\/(notesSlide\d+\.xml)"/);
        if (notesMatch) {
          const notesFileName = notesMatch[1];
          const notesXml = await zip.file(`ppt/notesSlides/${notesFileName}`)?.async('text');
          if (notesXml) {
            notesText = [...notesXml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join(' ');
          }
        }
      }
    } catch(e) { console.error(`Notes extraction failed for slide ${slideNum}`, e); }

    parsedSlides.push({
      id: parseInt(slideNum),
      text: texts || `Slide ${slideNum} (No Text Found)`,
      notes: notesText || 'No speaker notes available for this slide.'
    });
  }

  return { colors, slides: parsedSlides };
};

const PptxStudio = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pptxData, setPptxData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('prompter');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Notes Prompter State
  const [isPlayingPrompter, setIsPlayingPrompter] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const prompterRef = useRef(null);
  const scrollInterval = useRef(null);

  // Voice Remote State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Whiteboard State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [toolMode, setToolMode] = useState('pen'); // 'pen' or 'eraser'
  const [brushColor, setBrushColor] = useState('#4f46e5');
  const [brushSize, setBrushSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [gridMode, setGridMode] = useState('dots'); // 'none', 'grid', 'dots'
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  
  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        if (transcript.includes('next') || transcript.includes('forward')) {
          handleNextSlide();
          toast.success('Voice Command: Next Slide');
        } else if (transcript.includes('back') || transcript.includes('previous')) {
          handlePrevSlide();
          toast.success('Voice Command: Previous Slide');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) recognition.start(); // Keep alive if supposed to be listening
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]); // Dependency on isListening to restart correctly if needed

  useEffect(() => {
    // Whiteboard Initialization
    if (activeTab === 'whiteboard' && canvasRef.current) {
      initCanvas();
    }
  }, [activeTab]);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || !selectedFile.name.endsWith('.pptx')) {
      toast.error('Please upload a valid .pptx file.');
      return;
    }
    
    setIsProcessing(true);
    setFile(selectedFile);
    try {
      const data = await extractPptxData(selectedFile);
      setPptxData(data);
      if (data.slides.length === 0) {
        toast.error('Could not extract any slides from this file.');
      } else {
        toast.success(`Successfully extracted ${data.slides.length} slides!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error parsing the PPTX file.');
    }
    setIsProcessing(false);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => {
      if (!pptxData || prev >= pptxData.slides.length - 1) return prev;
      return prev + 1;
    });
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => {
      if (!pptxData || prev <= 0) return prev;
      return prev - 1;
    });
  };

  // Prompter Logic
  const togglePrompter = () => {
    if (isPlayingPrompter) {
      clearInterval(scrollInterval.current);
      setIsPlayingPrompter(false);
    } else {
      setIsPlayingPrompter(true);
      scrollInterval.current = setInterval(() => {
        if (prompterRef.current) {
          prompterRef.current.scrollTop += 1;
        }
      }, 100 - scrollSpeed);
    }
  };

  // Voice Logic
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success('Voice Remote Deactivated');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Voice Remote Activated! Say "Next" or "Back".');
    }
  };

  // Whiteboard Logic
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Only fill white if it's the very first time
    if (history.length === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistoryState();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (toolMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
    }
  };

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataURL);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      restoreCanvas(history[newStep]);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      restoreCanvas(history[newStep]);
      setHistoryStep(newStep);
    }
  };

  const restoreCanvas = (dataURL) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Ensure white background since we use destination-out for eraser
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryState();
    toast.success('Whiteboard cleared!');
  };

  const exportWhiteboard = () => {
    const canvas = canvasRef.current;
    
    // We create a temporary canvas to draw the grid and the drawing together for export
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    
    // Draw white background
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw grid if active
    if (gridMode === 'grid') {
      tCtx.strokeStyle = '#e2e8f0';
      tCtx.lineWidth = 1;
      for(let x=0; x<=tempCanvas.width; x+=40) { tCtx.beginPath(); tCtx.moveTo(x,0); tCtx.lineTo(x,tempCanvas.height); tCtx.stroke(); }
      for(let y=0; y<=tempCanvas.height; y+=40) { tCtx.beginPath(); tCtx.moveTo(0,y); tCtx.lineTo(tempCanvas.width,y); tCtx.stroke(); }
    } else if (gridMode === 'dots') {
      tCtx.fillStyle = '#cbd5e1';
      for(let x=20; x<tempCanvas.width; x+=40) {
        for(let y=20; y<tempCanvas.height; y+=40) {
          tCtx.beginPath(); tCtx.arc(x, y, 2, 0, Math.PI*2); tCtx.fill();
        }
      }
    }

    // Draw the actual canvas content
    tCtx.drawImage(canvas, 0, 0);

    const url = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `slide_mockup_${Date.now()}.png`;
    link.click();
    toast.success('Mockup exported!');
  };

  if (!pptxData && !isProcessing) {
    return (
      <div className="max-w-[1000px] mx-auto w-full px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-500/20">
          <Layers size={40} />
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4 text-center">Advanced PPTX Studio</h1>
        <p className="text-muted-foreground text-center max-w-xl text-sm md:text-base mb-10 leading-relaxed">
          Upload your original PowerPoint (.pptx) file to instantly extract speaker notes for the teleprompter, retrieve native theme color swatches, voice-control your slides, and sketch ideas on a synced whiteboard.
        </p>

        <label className="relative group cursor-pointer">
          <input type="file" accept=".pptx" className="hidden" onChange={handleFileUpload} />
          <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center gap-3 transition-all transform group-hover:-translate-y-1">
            <FileUp size={20} />
            <span>Upload PPTX File</span>
          </div>
        </label>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="max-w-[1000px] mx-auto w-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-foreground">Parsing Presentation Data...</h2>
        <p className="text-muted-foreground mt-2">Extracting notes, slides, and themes.</p>
      </div>
    );
  }

  const activeSlide = pptxData.slides[currentSlideIndex];

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-8 pb-12">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl shadow-sm border border-indigo-500/20">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{file?.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">PPTX Studio Workspace • {pptxData.slides.length} Slides Extracted</p>
          </div>
        </div>

        <div className="flex bg-card p-1 rounded-xl shadow-sm border border-border">
          {[
            { id: 'prompter', icon: FileUp, label: 'Prompter' },
            { id: 'swatches', icon: Palette, label: 'Swatches' },
            { id: 'remote', icon: Mic, label: 'Voice Remote' },
            { id: 'whiteboard', icon: PenTool, label: 'Whiteboard' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Global Slide Controller */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm mb-6 flex justify-between items-center">
        <button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="text-sm font-bold text-foreground">
          Slide {currentSlideIndex + 1} of {pptxData.slides.length}
        </div>
        <button onClick={handleNextSlide} disabled={currentSlideIndex === pptxData.slides.length - 1} className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground transition-all">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: NOTES PROMPTER */}
          {activeTab === 'prompter' && (
            <motion.div key="prompter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-[350px] bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Teleprompter Controls</h3>
                  <button onClick={togglePrompter} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPlayingPrompter ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}>
                    {isPlayingPrompter ? <><Square size={18} /> Stop Scrolling</> : <><Play size={18} /> Start Prompter</>}
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Scroll Speed</label>
                  <input type="range" min="10" max="95" value={scrollSpeed} onChange={(e) => setScrollSpeed(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Slow</span><span>Fast</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-black rounded-2xl shadow-2xl border-4 border-neutral-800 overflow-hidden relative h-[600px] flex flex-col">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500/50 z-10 pointer-events-none"></div>
                <div className="absolute top-1/2 left-2 w-4 h-4 rounded-full bg-red-500 -mt-2 z-10 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                
                <div ref={prompterRef} className="flex-1 overflow-y-auto p-12 lg:p-20 scroll-smooth custom-scrollbar">
                  <div className="h-[300px]"></div>
                  <p className="text-4xl lg:text-5xl font-black text-white leading-relaxed text-center" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {activeSlide.notes || 'No notes found for this slide. Please make sure your PPTX contains speaker notes.'}
                  </p>
                  <div className="h-[300px]"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: THEME SWATCHES */}
          {activeTab === 'swatches' && (
            <motion.div key="swatches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card border border-border p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-black tracking-tight text-foreground mb-2">Native Presentation Palette</h3>
              <p className="text-muted-foreground mb-8">Extracted theme colors from the uploaded PPTX. Use these for UI mockups or whiteboard drawings to match the brand.</p>
              
              {pptxData.colors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {pptxData.colors.map((color, idx) => (
                    <div key={idx} className="group flex flex-col items-center">
                      <div className="w-full aspect-square rounded-2xl shadow-inner border border-border transition-transform transform group-hover:scale-105 mb-3 cursor-pointer" style={{ backgroundColor: color }} onClick={() => { navigator.clipboard.writeText(color); toast.success(`Copied ${color}!`); }}></div>
                      <span className="text-sm font-mono font-bold text-foreground bg-muted px-2 py-1 rounded-md">{color}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
                  <Palette size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No native theme colors could be extracted from this presentation.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: VOICE REMOTE */}
          {activeTab === 'remote' && (
            <motion.div key="remote" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6">
               <div className="w-full lg:w-[350px] bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Voice Control</h3>
                  <p className="text-sm text-muted-foreground mb-6">Activate the microphone and say <strong className="text-foreground">"Next"</strong> or <strong className="text-foreground">"Back"</strong> to control the slides hands-free.</p>
                  
                  <button onClick={toggleVoice} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${isListening ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}>
                    {isListening ? (
                      <><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div> Listening...</>
                    ) : (
                      <><Mic size={18} /> Activate Mic</>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col p-12 aspect-[16/9] max-h-[700px]">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Slide Content Extracted Text</h2>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <p className="text-3xl md:text-5xl font-black text-slate-800 leading-tight">
                    {activeSlide.text.substring(0, 300)}{activeSlide.text.length > 300 ? '...' : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: ADVANCED WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <motion.div key="whiteboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col xl:flex-row gap-6">
              
              <div className="w-full xl:w-[300px] shrink-0 space-y-4">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Drawing Tools</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setToolMode('pen')} className={`py-2 px-3 flex flex-col items-center gap-1 rounded-xl font-bold text-xs transition-all ${toolMode === 'pen' ? 'bg-indigo-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                        <PenTool size={18} /> Pen
                      </button>
                      <button onClick={() => setToolMode('eraser')} className={`py-2 px-3 flex flex-col items-center gap-1 rounded-xl font-bold text-xs transition-all ${toolMode === 'eraser' ? 'bg-indigo-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                        <Eraser size={18} /> Eraser
                      </button>
                    </div>
                  </div>

                  {toolMode === 'pen' && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Brush Color</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {['#0f172a', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', ...pptxData.colors.slice(0,3)].map(c => (
                          <button key={c} onClick={() => setBrushColor(c)} className={`w-7 h-7 rounded-full border border-black/10 transition-transform ${brushColor === c ? 'scale-125 ring-2 ring-indigo-500/50' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <span className="text-xs font-mono text-muted-foreground">Custom Color</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{toolMode === 'pen' ? 'Brush Size' : 'Eraser Size'}</h3>
                    <input 
                      type="range" min="2" max="50" 
                      value={toolMode === 'pen' ? brushSize : eraserSize} 
                      onChange={(e) => toolMode === 'pen' ? setBrushSize(parseInt(e.target.value)) : setEraserSize(parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Canvas Actions</h3>
                  <div className="flex gap-2">
                     <button onClick={undo} disabled={historyStep <= 0} className="flex-1 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-lg flex items-center justify-center text-foreground transition-all"><Undo size={16} /></button>
                     <button onClick={redo} disabled={historyStep >= history.length - 1} className="flex-1 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-lg flex items-center justify-center text-foreground transition-all"><Redo size={16} /></button>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-muted rounded-lg">
                    {['none', 'grid', 'dots'].map(mode => (
                      <button key={mode} onClick={() => setGridMode(mode)} className={`flex-1 py-1 text-xs font-bold rounded-md capitalize transition-all ${gridMode === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>{mode}</button>
                    ))}
                  </div>
                  <button onClick={clearCanvas} className="w-full py-2.5 bg-background hover:bg-muted text-red-500 border border-border font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Clear Canvas
                  </button>
                  <button onClick={exportWhiteboard} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    <Download size={16} /> Export PNG
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900 rounded-2xl shadow-inner overflow-auto custom-scrollbar flex items-center justify-center p-6 md:p-12 relative border border-border">
                {/* Visual Background Layer */}
                <div 
                  className="absolute w-[800px] h-[600px] bg-white rounded-xl shadow-2xl pointer-events-none"
                  style={{
                    backgroundImage: gridMode === 'grid' 
                      ? 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)' 
                      : gridMode === 'dots' 
                      ? 'radial-gradient(#cbd5e1 2px, transparent 2px)' 
                      : 'none',
                    backgroundSize: gridMode === 'grid' ? '40px 40px' : '40px 40px',
                    backgroundPosition: '0 0'
                  }}
                ></div>
                
                {/* Drawing Layer */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`relative z-10 w-[800px] h-[600px] touch-none ${toolMode === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
                  style={{ opacity: 0.99 /* forces a new stacking context for composite ops */ }}
                />
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default PptxStudio;
