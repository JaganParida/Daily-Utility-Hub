import { useState, useEffect } from 'react';
import { Volume2, Play, Pause, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PresentationRemote = () => {
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [recognition, setRecognition] = useState(null);

  const slides = [
    { title: 'Introduction to Distributed Web Applications', bullets: ['Browser APIs are highly advanced.', 'Client-side processing avoids network latency.'] },
    { title: 'Vite Compilation Architecture', bullets: ['ES Modules allow instant loading.', 'Rollup compiles clean production bundles.'] },
    { title: 'Conclusion', bullets: ['Local sandboxing guarantees absolute data safety.'] }
  ];

  useEffect(() => {
    // Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const command = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
        handleVoiceCommand(command);
      };

      rec.onerror = (err) => {
        console.error(err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleVoiceCommand = (command) => {
    setLogs(prev => [`[Voice] Detected: "${command}"`, ...prev].slice(0, 15));
    
    if (command.includes('next') || command.includes('forward')) {
      setSlideIdx(prev => {
        const next = Math.min(slides.length - 1, prev + 1);
        if (next !== prev) toast.success('Navigated to next slide!');
        return next;
      });
    } 
    else if (command.includes('back') || command.includes('previous') || command.includes('go back')) {
      setSlideIdx(prev => {
        const back = Math.max(0, prev - 1);
        if (back !== prev) toast.success('Navigated to previous slide!');
        return back;
      });
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Web Speech API is not supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.success('Speech recognition stopped.');
    } else {
      recognition.start();
      setIsListening(true);
      setLogs(prev => ['[System] Voice Remote Active. Say "Next" or "Back".', ...prev]);
      toast.success('Listening for commands: "Next" or "Back"...');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Volume2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Voice Slide Remote</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Rehearse slideshow transitions using voice-activated speech recognition commands ("next", "back", "previous").</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Remote control panel */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Voice Controller</h3>
            
            <button
              onClick={toggleListening}
              className={`w-full py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-white ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
            >
              {isListening ? <Pause size={18} /> : <Play size={18} />}
              {isListening ? 'Deactivate Voice' : 'Activate Voice Remote'}
            </button>
            <p className="text-[10px] text-muted-foreground text-center leading-normal">
              Note: Permissions must be granted to access the microphone. Supported in Chrome/Edge browsers.
            </p>
          </div>

          {/* Voice logs */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Command Logs</h3>
              {logs.length > 0 && (
                <button onClick={clearLogs} className="text-xs text-muted-foreground hover:text-red-500 font-semibold">
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 font-mono text-[11px] text-muted-foreground leading-relaxed">
              {logs.length === 0 ? (
                <p className="text-center py-4">Waiting for voice triggers...</p>
              ) : (
                logs.map((log, idx) => <p key={idx}>{log}</p>)
              )}
            </div>
          </div>
        </div>

        {/* Slide presentation preview */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Slides Preview Screen
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-12 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIdx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-xl aspect-[4/3] bg-slate-950 text-slate-100 p-10 shadow-2xl rounded-2xl border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-2xl font-black border-b border-white/10 pb-3 mb-6">{slides[slideIdx].title}</h2>
                  <ul className="space-y-4 pl-2">
                    {slides[slideIdx].bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                        <span className="text-indigo-400 mt-1">&bull;</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Slide {slideIdx + 1} of {slides.length}</span>
                  <span>VOICE ACTIVE CONSOLE</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PresentationRemote;
