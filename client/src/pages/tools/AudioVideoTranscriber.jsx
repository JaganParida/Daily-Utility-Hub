import { useState, useRef, useEffect } from 'react';
import { FileAudio, Video, FileText, Download, Copy, Play, Pause, Trash2, Globe, Sliders, RefreshCw, Upload, CheckCircle, Edit, List, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AudioVideoTranscriber = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState(''); // 'audio' | 'video'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(''); // 'loading-model' | 'decoding' | 'transcribing'
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Transcription configuration
  const [modelType, setModelType] = useState('Xenova/whisper-tiny.en'); // 'Xenova/whisper-tiny.en' | 'Xenova/whisper-tiny'
  const [language, setLanguage] = useState('en');
  
  // Results
  const [segments, setSegments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [copiedState, setCopiedState] = useState(false);

  // Player Sync
  const mediaRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSubtitle, setActiveSubtitle] = useState('');

  // Clean up Object URL
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  // Sync active subtitle with player time
  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const time = mediaRef.current.currentTime;
    setCurrentTime(time);
    const active = segments.find(seg => time >= seg.start && time <= seg.end);
    setActiveSubtitle(active ? active.text : '');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (fileUrl) URL.revokeObjectURL(fileUrl);

    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    setFileType(selectedFile.type.startsWith('video/') ? 'video' : 'audio');
    setSegments([]);
    setActiveSubtitle('');
    toast.success(`Loaded ${selectedFile.name}`);
  };

  // Decode audio file to 16kHz mono Float32Array for Whisper
  const getAudioBuffer = async () => {
    setProcessStep('decoding');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to Mono channel
    const channelData = audioBuffer.getChannelData(0);
    return channelData;
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessStep('loading-model');
    setDownloadProgress(0);

    try {
      // 1. Resample & Decode audio
      const audioData = await getAudioBuffer();

      // 2. Load Pipeline dynamically from ESM CDN
      setProcessStep('loading-model');
      
      const module = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      const pipeline = module.pipeline;
      const env = module.env;
      env.allowLocalModels = false;

      const transcriber = await pipeline('automatic-speech-recognition', modelType, {
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            setDownloadProgress(Math.round(progress.progress));
          }
        }
      });

      // 3. Transcribe
      setProcessStep('transcribing');
      const options = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      };

      if (modelType === 'Xenova/whisper-tiny') {
        options.language = language;
      }

      const output = await transcriber(audioData, options);

      // 4. Map output to structured timeline segments
      if (output && output.chunks) {
        const mappedSegments = output.chunks.map((chunk, idx) => ({
          id: idx,
          start: chunk.timestamp[0] ?? 0,
          end: chunk.timestamp[1] ?? (chunk.timestamp[0] ?? 0) + 3,
          text: chunk.text
        }));
        setSegments(mappedSegments);
        toast.success('Transcription completed!');
      } else {
        throw new Error('No speech detected or empty response.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to transcribe file.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // Timeline & Editing
  const seekTo = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = seconds;
      mediaRef.current.play();
    }
  };

  const saveEdit = (idx) => {
    const updated = [...segments];
    updated[idx].text = editText;
    setSegments(updated);
    setEditingIndex(-1);
    toast.success('Subtitle segment updated');
  };

  // Exporters
  const formatTime = (seconds, format = 'srt') => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');

    return format === 'srt' 
      ? `${hrs}:${mins}:${secs},${ms}` 
      : `${hrs}:${mins}:${secs}.${ms}`;
  };

  const exportSRT = () => {
    let srt = '';
    segments.forEach((seg, i) => {
      srt += `${i + 1}\n`;
      srt += `${formatTime(seg.start, 'srt')} --> ${formatTime(seg.end, 'srt')}\n`;
      srt += `${seg.text.trim()}\n\n`;
    });
    downloadFile(srt, `${file.name.split('.')[0]}.srt`, 'text/srt');
  };

  const exportVTT = () => {
    let vtt = 'WEBVTT\n\n';
    segments.forEach((seg, i) => {
      vtt += `${i + 1}\n`;
      vtt += `${formatTime(seg.start, 'vtt')} --> ${formatTime(seg.end, 'vtt')}\n`;
      vtt += `${seg.text.trim()}\n\n`;
    });
    downloadFile(vtt, `${file.name.split('.')[0]}.vtt`, 'text/vtt');
  };

  const exportTXT = () => {
    const txt = segments.map(seg => `[${formatTime(seg.start, 'vtt')}] ${seg.text}`).join('\n');
    downloadFile(txt, `${file.name.split('.')[0]}_transcript.txt`, 'text/plain');
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const copyTextOnly = () => {
    const fullText = segments.map(seg => seg.text.trim()).join(' ');
    navigator.clipboard.writeText(fullText);
    setCopiedState(true);
    toast.success('Copied full transcript');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const resetAll = () => {
    setFile(null);
    setFileUrl('');
    setFileType('');
    setSegments([]);
    setActiveSubtitle('');
    toast.success('Fields reset');
  };

  const hasFile = file !== null;
  const hasTranscribed = segments.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <FileAudio size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">AI Audio & Video Captioner</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Extract timestamped text & subtitles from audio and video files offline using browser-based AI.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left Card: Media Player & Live Captions */}
        <div className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]">
          {!hasFile ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-xl p-8 bg-muted/5 min-h-[300px]">
              <Upload className="w-12 h-12 text-primary/50 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-foreground mb-1">Upload Audio or Video File</p>
              <p className="text-xs text-muted-foreground mb-4 text-center max-w-[280px]">
                Supports MP3, WAV, M4A, MP4, WEBM, and MKV. Processed 100% locally.
              </p>
              <label className="cursor-pointer bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
                Browse File
                <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              
              {/* Media Preview Player */}
              <div className="bg-black/90 border border-border/40 rounded-xl overflow-hidden flex flex-col justify-center items-center relative flex-1 min-h-0 max-h-[320px]">
                {fileType === 'video' ? (
                  <video
                    ref={mediaRef}
                    src={fileUrl}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full max-h-[280px] object-contain"
                  />
                ) : (
                  <div className="p-8 w-full flex flex-col items-center justify-center">
                    <FileAudio size={48} className="text-primary animate-bounce mb-3" />
                    <audio
                      ref={mediaRef}
                      src={fileUrl}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      className="w-full max-w-[400px]"
                    />
                  </div>
                )}

                {/* Styled Subtitle Overlay */}
                {activeSubtitle && (
                  <div className="absolute bottom-12 left-4 right-4 text-center pointer-events-none">
                    <span className="bg-black/85 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md inline-block max-w-[85%] leading-relaxed border border-white/10">
                      {activeSubtitle}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Display */}
              {isProcessing && (
                <div className="bg-muted/20 border border-border/40 p-5 rounded-xl space-y-3.5 animate-pulse">
                  <div className="flex justify-between items-center text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin text-primary" />
                      {processStep === 'loading-model' && `Downloading AI Model (${downloadProgress}%)`}
                      {processStep === 'decoding' && 'Decoding & Resampling Audio...'}
                      {processStep === 'transcribing' && 'AI Transcribing Speech...'}
                    </span>
                    <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {processStep.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300" 
                      style={{ 
                        width: `${processStep === 'loading-model' ? downloadProgress : processStep === 'decoding' ? 50 : 85}%` 
                      }} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {processStep === 'loading-model' && "Whisper model is loading. The first download is ~75MB and will be cached for instant subsequent runs."}
                    {processStep === 'decoding' && "Converting your file's audio track to a standard mono 16kHz stream."}
                    {processStep === 'transcribing' && "Translating audio features to text. This takes only a few seconds."}
                  </p>
                </div>
              )}

              {/* File stats footer */}
              {!isProcessing && (
                <div className="flex justify-between items-center text-xs bg-muted/20 border border-border/30 px-4 py-2.5 rounded-xl shrink-0">
                  <div className="truncate font-semibold text-foreground max-w-[200px] sm:max-w-[320px]">
                    {file.name}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetAll}
                      className="text-red-500 hover:bg-red-500/10 font-bold px-2.5 py-1 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                    {!hasTranscribed && (
                      <button
                        onClick={handleTranscribe}
                        className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-md hover:bg-primary/95 transition-colors"
                      >
                        Start Transcription
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline transcript list */}
              {hasTranscribed && !isProcessing && (
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block font-sans">Timeline Segments</span>
                  <div className="flex-1 overflow-y-auto pr-1 border border-border/40 bg-muted/15 rounded-xl p-3 space-y-2.5 custom-scrollbar min-h-0">
                    {segments.map((seg, idx) => (
                      <div 
                        key={seg.id} 
                        className={`p-3 rounded-lg border transition-all text-xs flex gap-3 items-start ${
                          currentTime >= seg.start && currentTime <= seg.end
                            ? 'bg-primary/10 border-primary/45 shadow-sm'
                            : 'bg-card border-border/40 hover:border-border'
                        }`}
                      >
                        <button
                          onClick={() => seekTo(seg.start)}
                          className="bg-muted hover:bg-primary hover:text-primary-foreground text-foreground px-2 py-1 rounded font-mono font-bold shrink-0 transition-colors"
                        >
                          {formatTime(seg.start, 'vtt').slice(3, 8)}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          {editingIndex === idx ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                                autoFocus
                              />
                              <button onClick={() => saveEdit(idx)} className="text-primary font-bold hover:underline shrink-0">Save</button>
                              <button onClick={() => setEditingIndex(-1)} className="text-muted-foreground hover:underline shrink-0">Cancel</button>
                            </div>
                          ) : (
                            <p className="text-foreground leading-relaxed break-words">{seg.text}</p>
                          )}
                        </div>

                        {editingIndex !== idx && (
                          <button
                            onClick={() => {
                              setEditingIndex(idx);
                              setEditText(seg.text);
                            }}
                            className="text-muted-foreground hover:text-primary p-1 rounded transition-colors shrink-0"
                          >
                            <Edit size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Card: Transcription Configuration & Export Panel */}
        <div className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 transition-all duration-300 ${!hasFile ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
            
            {/* Model & Language selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Sliders size={15} /> Settings
              </h3>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Model Model Size</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'Xenova/whisper-tiny.en', label: 'Whisper-Tiny (English Only)', desc: 'Fastest transcription, ultra accurate for English.' },
                    { id: 'Xenova/whisper-tiny',    label: 'Whisper-Tiny (Multilingual)', desc: 'Auto-detects & translates 100+ languages.' }
                  ].map(model => (
                    <button
                      key={model.id}
                      disabled={hasTranscribed || isProcessing}
                      onClick={() => setModelType(model.id)}
                      className={`text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${
                        modelType === model.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold block">{model.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block leading-normal">{model.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {modelType === 'Xenova/whisper-tiny' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Globe size={13} className="text-primary" /> Speech Language
                  </label>
                  <select
                    value={language}
                    disabled={hasTranscribed || isProcessing}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 p-2.5 rounded-xl text-xs font-semibold text-foreground outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="it">Italian (Italiano)</option>
                    <option value="pt">Portuguese (Português)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="ja">Japanese (日本語)</option>
                    <option value="ko">Korean (한국어)</option>
                    <option value="ru">Russian (Русский)</option>
                    <option value="ar">Arabic (العربية)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Offline AI notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1 shrink-0">
              <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                <AlertCircle size={12} /> Local WASM Execution
              </span>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This utility parses audio using WebAssembly ONNX runtimes. Your files never leave your computer, ensuring complete privacy.
              </p>
            </div>

            {/* Export & Actions */}
            {hasTranscribed && (
              <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Export Outputs</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={exportSRT}
                    className="py-2.5 bg-muted/30 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Download size={13} /> SRT Subs
                  </button>
                  <button 
                    onClick={exportVTT}
                    className="py-2.5 bg-muted/30 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Download size={13} /> VTT Subs
                  </button>
                </div>
                <button 
                  onClick={exportTXT}
                  className="w-full py-2.5 bg-muted/30 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Download size={13} /> Download TXT Timeline
                </button>
                <button 
                  onClick={copyTextOnly}
                  className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm shadow-primary/25"
                >
                  {copiedState ? <CheckCircle size={14} /> : <Copy size={14} />} Copy Full Transcript
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default AudioVideoTranscriber;
