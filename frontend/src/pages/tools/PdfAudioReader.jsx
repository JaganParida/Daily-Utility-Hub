import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
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
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
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

  const autoSelectVoice = (textData, currentVoices) => {
    if (!textData || currentVoices.length === 0) return;
    
    const hasOdia = /[\u0B00-\u0B7F]/.test(textData);
    let matchedVoice = null;
    
    if (hasOdia) {
      matchedVoice = currentVoices.find(v => 
        v.lang.toLowerCase().includes('or') || 
        v.name.toLowerCase().includes('odia') || 
        v.name.toLowerCase().includes('oriya')
      );
      if (!matchedVoice) {
        matchedVoice = currentVoices.find(v => v.lang.toLowerCase().includes('hi'));
      }
    }
    
    if (matchedVoice) {
      setSelectedVoice(matchedVoice.name);
    } else {
      const engVoice = currentVoices.find(v => v.lang.includes('en')) || currentVoices[0];
      setSelectedVoice(engVoice.name);
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        autoSelectVoice(text, availableVoices);
      }
    };
    
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.cancel();
    };
  }, [text]);

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
        autoSelectVoice(fullText, voices);
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to extract text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sentencesRef = useRef([]);
  const [currentUtteranceIndex, setCurrentUtteranceIndex] = useState(0);
  
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    isPausedRef.current = isPaused;
  }, [isPlaying, isPaused]);

  const speakSentence = (index) => {
    if (!isPlayingRef.current) return;
    
    if (index >= sentencesRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtteranceIndex(0);
      return;
    }

    const sentenceText = sentencesRef.current[index].trim();
    if (!sentenceText) {
      setCurrentUtteranceIndex(index + 1);
      speakSentence(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentenceText);
    if (selectedVoice) {
      utterance.voice = voices.find(v => v.name === selectedVoice);
    }
    utterance.rate = rate;

    utterance.onend = () => {
      if (isPlayingRef.current) {
        setCurrentUtteranceIndex(index + 1);
        speakSentence(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.error(e);
      if (isPlayingRef.current) {
        setCurrentUtteranceIndex(index + 1);
        speakSentence(index + 1);
      }
    };

    synth.speak(utterance);
  };

  const handlePlay = () => {
    if (isPaused) {
      synth.resume();
      isPlayingRef.current = true;
      isPausedRef.current = false;
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    
    if (synth.speaking) synth.cancel();

    // Split text into sentences using standard punctuation and Odia danda (।)
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
    sentencesRef.current = sentences;
    
    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    speakSentence(currentUtteranceIndex);
  };

  const handlePause = () => {
    if (synth.speaking) {
      synth.pause();
      isPlayingRef.current = false;
      isPausedRef.current = true;
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    synth.cancel();
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentUtteranceIndex(0);
  };

  const handleClear = () => {
    handleStop();
    setFile(null);
    setText('');
    setCurrentUtteranceIndex(0);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF Audio Reader"
        description="Listen to PDFs like an audiobook with bionic reading mode."
        category="PDF Tools"
        categoryPath="/search"
        icon={Volume2}
        iconColor="text-[#f29900] bg-[#fef7e0] border-[#feefc3]"
        badge="PDF Audio Player"
        extraBadge="Text-to-Speech Audiobook"
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
                  <div className="w-16 h-16 bg-[#fef7e0] border border-[#feefc3] rounded-2xl flex items-center justify-center text-[#f29900] mb-4 shadow-2xs transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] mb-2 pointer-events-none text-center">
                    {isProcessing ? 'Analyzing Document...' : 'Upload PDF to Read & Listen'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6368] text-center pointer-events-none max-w-sm leading-relaxed">
                    {isProcessing ? 'Extracting text layer...' : <span>Drag & drop a PDF file here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>. 100% private in-browser.</span>}
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
                className="flex flex-col h-[65vh] w-full space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#dadce0] pb-3 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">Document Reader Viewer</h3>
                    <p className="text-xs text-[#5f6368] mt-0.5">Read along or follow spoken sentences</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#f8f9fa] border border-[#dadce0] px-3 py-1.5 rounded-xl hover:bg-[#f1f3f4] transition-colors">
                    <span className="text-xs font-bold text-[#202124]">Bionic Reading</span>
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={bionicMode}
                      onChange={(e) => setBionicMode(e.target.checked)}
                    />
                    <div className="w-8 h-4.5 bg-[#dadce0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#1a73e8] relative"></div>
                  </label>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-[#202124] text-base sm:text-lg leading-relaxed font-serif">
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
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Settings size={15} className="text-[#1a73e8]" /> Speech Controls
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Narrator Voice</label>
                <select 
                  value={selectedVoice || ''}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="google-select w-full text-xs font-semibold"
                >
                  {voices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">Reading Speed</label>
                  <span className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded">{rate}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none bg-[#e8eaed] accent-[#1a73e8]"
                />
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
                    <p className="text-[11px] text-[#5f6368]">{text.split(/\s+/).length} words extracted</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#dadce0] flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={handlePlay}
                  disabled={isPlaying || !file}
                  className="btn-google-primary text-xs sm:text-sm py-2.5 justify-center shadow-xs disabled:opacity-50"
                >
                  <Play size={16} /> Play Audio
                </button>
                <button 
                  onClick={handlePause}
                  disabled={!isPlaying || !file}
                  className="btn-google-secondary text-xs sm:text-sm py-2.5 justify-center disabled:opacity-50"
                >
                  <Pause size={16} /> Pause
                </button>
              </div>

              <button 
                onClick={handleStop}
                disabled={(!isPlaying && !isPaused) || !file}
                className="w-full btn-google-danger text-xs sm:text-sm py-2.5 justify-center disabled:opacity-50"
              >
                <Square size={14} fill="currentColor" /> Stop Reading
              </button>
              
              {file && (
                <button
                  onClick={handleClear}
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

export default PdfAudioReader;
