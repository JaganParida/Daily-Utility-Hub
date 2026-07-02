import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Download, Trash2, Copy, Play, Pause, RefreshCw, ChevronDown, CheckCircle, Award, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const VoiceHelper = () => {
  const [text, setText] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [activeTab, setActiveTab] = useState('stt'); // 'stt' (speech to text) | 'tts' (text to speech)

  // STT (Speech to Text) States
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const recognitionRef = useRef(null);

  // TTS (Text to Speech) States
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate] = useState(1); // Speed: 0.5 - 2
  const [pitch, setPitch] = useState(1); // Pitch: 0.5 - 2
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setText(prev => prev + finalTranscript);
      }
    };

    rec.onerror = (e) => {
      console.error(e);
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied!');
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  // Initialize Voices for TTS
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      if (allVoices.length > 0) {
        // Default to first English voice or first voice in list
        const defaultVoice = allVoices.find(v => v.lang.startsWith('en')) || allVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const toggleListening = () => {
    if (!recognitionSupported) {
      toast.error('Voice Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success('Dictation stopped.');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Listening... Start speaking!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeak = () => {
    if (!text.trim()) {
      toast.error('Enter some text to read!');
      return;
    }

    // If currently reading, pause/resume
    if (synthRef.current.speaking) {
      if (isPlaying) {
        synthRef.current.pause();
        setIsPlaying(false);
      } else {
        synthRef.current.resume();
        setIsPlaying(true);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    synthRef.current.speak(utterance);
  };

  const handleStopSpeaking = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleDownload = () => {
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictated_text_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded!');
  };

  const clearText = () => {
    setText('');
    handleStopSpeaking();
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <Volume2 size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Voice Assistant & Reader</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Transcribe your voice into text in real-time, or listen to written documents using neural speech synthesis.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Text Input / Dictation Area */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative">
          <div className="flex flex-col gap-3">
            {/* Tool Mode selector Tabs */}
            <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 self-start gap-1">
              {[
                { id: 'stt', label: 'Speech to Text (Dictation)', icon: Mic },
                { id: 'tts', label: 'Text to Speech (Reader)',    icon: Volume2 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    handleStopSpeaking();
                  }}
                  className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all relative ${
                    activeTab === tab.id ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="voice-tab-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10"
                    />
                  )}
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Input Textarea with animated soundwaves */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  activeTab === 'stt'
                    ? 'Click the record button and speak, or start typing here...'
                    : 'Paste or type text here to hear it read aloud...'
                }
                className="w-full h-[calc(100vh-320px)] min-h-[300px] max-h-[500px] bg-muted/10 border border-border/50 p-4 rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-inner custom-scrollbar resize-none"
              />

              {/* Soundwaves for Mic recording or TTS speaking */}
              <AnimatePresence>
                {(isListening || isPlaying) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-950/80 border border-border/50 py-1.5 px-3 rounded-full backdrop-blur-md shadow-md"
                  >
                    <span className="text-[10px] text-white/80 font-bold mr-1.5 uppercase tracking-wider">
                      {isListening ? 'Listening' : 'Reading'}
                    </span>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        style={{ height: 16 }}
                        animate={{
                          height: [6, 20, 6],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Controls Sidebar */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Sliders size={15} /> Voice Settings
            </h3>

            <AnimatePresence mode="wait">
              {activeTab === 'stt' ? (
                <motion.div
                  key="stt-settings"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="p-3.5 bg-muted/30 border border-border/50 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mic size={14} className="text-primary" /> Speech to Text Guide
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Make sure your browser has microphone permission enabled. Once you click the mic, you can speak continuously and see the translated text appear instantly.
                    </p>
                  </div>

                  {/* Micro action button */}
                  <button
                    onClick={toggleListening}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 ring-4 ring-red-500/10'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff size={18} /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic size={18} /> Start Recording
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="tts-settings"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Select Voice */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Choose Speaker Voice</label>
                    <div className="relative">
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full appearance-none bg-muted/20 border border-border/50 p-2.5 pr-10 rounded-xl text-xs font-semibold text-foreground outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
                      >
                        {voices.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                    </div>
                  </div>

                  {/* Rate (Speed) slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reading Speed</label>
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="v-slider w-full cursor-pointer outline-none"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '8px',
                        borderRadius: '999px',
                        background: `linear-gradient(to right, var(--primary) ${((rate - 0.5) / 1.5) * 100}%, var(--muted) ${((rate - 0.5) / 1.5) * 100}%)`,
                      }}
                    />
                  </div>

                  {/* Pitch slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Voice Pitch</label>
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{pitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(Number(e.target.value))}
                      className="v-slider w-full cursor-pointer outline-none"
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '8px',
                        borderRadius: '999px',
                        background: `linear-gradient(to right, var(--primary) ${((pitch - 0.5) / 1.5) * 100}%, var(--muted) ${((pitch - 0.5) / 1.5) * 100}%)`,
                      }}
                    />
                  </div>

                  {/* Action buttons (Play/Pause + Stop) */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={handleSpeak}
                      className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={16} /> Pause Voice
                        </>
                      ) : (
                        <>
                          <Play size={16} /> Speak Text
                        </>
                      )}
                    </button>
                    {synthRef.current?.speaking && (
                      <button
                        onClick={handleStopSpeaking}
                        className="py-3 px-4 bg-muted/30 hover:bg-muted/60 border border-border text-foreground font-bold rounded-xl transition-all flex items-center justify-center active:scale-[0.98]"
                      >
                        <VolumeX size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom slider CSS */}
            <style dangerouslySetInnerHTML={{__html: `
              .v-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid var(--primary);
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: transform 0.1s ease;
              }
              .v-slider::-webkit-slider-thumb:hover {
                transform: scale(1.25);
              }
              .v-slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid var(--primary);
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              }
            `}} />
          </div>

          {/* Global Operations Card */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopy}
                disabled={!text.trim()}
                className="py-3 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98]"
              >
                {copiedState ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                Copy Text
              </button>
              <button
                onClick={handleDownload}
                disabled={!text.trim()}
                className="py-3 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98]"
              >
                <Download size={16} />
                Download TXT
              </button>
            </div>
            <button
              onClick={clearText}
              disabled={!text.trim()}
              className="w-full py-3.5 bg-muted/20 hover:bg-red-500/10 hover:text-red-500 border border-border/50 hover:border-red-500/30 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
            >
              <Trash2 size={16} /> Clear Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceHelper;
