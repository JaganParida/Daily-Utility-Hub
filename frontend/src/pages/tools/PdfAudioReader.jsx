import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Play, Pause, Square, Settings, Volume2, Type, FastForward, SkipBack, X, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Helper for Bionic Reading
const bionifyText = (text) => {
  return text.split(' ').map((word, i) => {
    if (word.length <= 1) return <span key={i}>{word} </span>;
    const splitPoint = Math.ceil(word.length / 2);
    const boldPart = word.substring(0, splitPoint);
    const regularPart = word.substring(splitPoint);
    return (
      <span key={i}>
        <b className="font-extrabold">{boldPart}</b>{regularPart}{' '}
      </span>
    );
  });
};

const PdfAudioReader = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [bionicMode, setBionicMode] = useState(false);

  const fileInputRef = useRef(null);
  const synth = window.speechSynthesis;

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // default to first english voice or just first voice
        const engVoice = availableVoices.find(v => v.lang.includes('en')) || availableVoices[0];
        setSelectedVoice(engVoice.name);
      }
    };
    
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.cancel();
    };
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      await extractText(droppedFile);
    } else {
      toast.error('Only PDF files are supported.');
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      await extractText(selectedFile);
    }
  };

  const extractText = async (selectedFile) => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(' ') + '\n\n';
      }
      
      if (!fullText.trim()) {
        toast.error('No readable text found. This might be a scanned image.');
      } else {
        setText(fullText);
        setFile(selectedFile);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to extract text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlay = () => {
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    
    if (synth.speaking) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = voices.find(v => v.name === selectedVoice);
    }
    utterance.rate = rate;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utterance.onerror = (e) => {
      console.error(e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (synth.speaking) {
      synth.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleClear = () => {
    handleStop();
    setFile(null);
    setText('');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Volume2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">PDF Audio Reader</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Listen to PDFs like an audiobook with bionic reading mode.</p>
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
                    {isProcessing ? 'Analyzing Document...' : 'Upload PDF to Read & Listen'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm leading-relaxed">
                    {isProcessing ? 'Extracting text layer...' : <span>Drag & drop a PDF file here, or <span className="text-primary font-semibold hover:underline">browse files</span>. Processing is fully secure.</span>}
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
                className="flex flex-col h-[70vh] w-full"
              >
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Study Mode Viewer</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-semibold text-muted-foreground">Bionic Reading</span>
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={bionicMode}
                      onChange={(e) => setBionicMode(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
                  </label>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-muted/10 rounded-xl border border-border/50 text-foreground text-lg leading-loose font-serif">
                  {text.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">
                      {bionicMode ? bionifyText(paragraph) : paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Action panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Settings size={16} /> Audio Controls
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Voice</label>
                <select 
                  value={selectedVoice || ''}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-muted/50 border border-border text-foreground text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  {voices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Speed ({rate}x)</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
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
                    <p className="text-xs text-muted-foreground">{text.split(/\s+/).length} words</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handlePlay}
                  disabled={isPlaying || !file}
                  className={`h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] ${
                    isPlaying ? 'bg-primary/50 text-primary-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
                  }`}
                >
                  <Play size={20} /> Play
                </button>
                <button 
                  onClick={handlePause}
                  disabled={!isPlaying || !file}
                  className={`h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98] ${
                    !isPlaying ? 'bg-amber-500/50 text-white cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white hover:shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  <Pause size={20} /> Pause
                </button>
              </div>

              <button 
                onClick={handleStop}
                disabled={(!isPlaying && !isPaused) || !file}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:hover:bg-red-500"
              >
                <Square size={16} fill="currentColor" /> Stop Reading
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
                  className="w-full py-3.5 mt-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-border"
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

export default PdfAudioReader;
