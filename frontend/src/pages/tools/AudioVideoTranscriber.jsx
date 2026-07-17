import { useState, useRef, useEffect } from 'react';
import { FileAudio, Video, FileText, Download, Copy, Play, Pause, Trash2, Globe, Sliders, RefreshCw, Upload, CheckCircle, Edit, List, AlertCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [language, setLanguage] = useState('auto');
  const fileProgressMap = useRef({});
  const [engine, setEngine] = useState(() => localStorage.getItem('transcription_engine') || 'local');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  useEffect(() => {
    localStorage.setItem('transcription_engine', engine);
  }, [engine]);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);
  
  // Results
  const [segments, setSegments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [isRecordingSubtitledVideo, setIsRecordingSubtitledVideo] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

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

  const resampleTo16kMono = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    // 1. Mixdown channels to mono
    let monoData;
    if (numberOfChannels > 1) {
      monoData = new Float32Array(audioBuffer.length);
      const channels = [];
      for (let c = 0; c < numberOfChannels; c++) {
        channels.push(audioBuffer.getChannelData(c));
      }
      for (let i = 0; i < audioBuffer.length; i++) {
        let sum = 0;
        for (let c = 0; c < numberOfChannels; c++) {
          sum += channels[c][i];
        }
        monoData[i] = sum / numberOfChannels;
      }
    } else {
      monoData = audioBuffer.getChannelData(0);
    }
    
    // 2. Resample to 16000Hz
    if (sampleRate === 16000) {
      return monoData;
    }
    
    const ratio = sampleRate / 16000;
    const newLength = Math.round(monoData.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const index = Math.min(monoData.length - 1, Math.floor(i * ratio));
      result[i] = monoData[index];
    }
    return result;
  };

  // Decode audio file to 16kHz mono Float32Array for Whisper
  const getAudioBuffer = async () => {
    setProcessStep('decoding');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Resample and downmix to 16kHz Mono
    const channelData = resampleTo16kMono(audioBuffer);
    
    // Normalize volume (gain) to ensure clear signal for Whisper
    let maxVal = 0;
    for (let i = 0; i < channelData.length; i++) {
      const absVal = Math.abs(channelData[i]);
      if (absVal > maxVal) maxVal = absVal;
    }
    if (maxVal > 0 && maxVal < 0.9) {
      const gain = 0.85 / maxVal;
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= gain;
      }
    }

    return channelData;
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessStep('loading-model');
    setDownloadProgress(0);

    if (engine === 'gemini') {
      if (!apiKey) {
        toast.error('Please enter your Gemini API Key in settings');
        setIsProcessing(false);
        setProcessStep('');
        return;
      }
      setProcessStep('transcribing');
      try {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                      },
                    },
                    {
                      text: "Transcribe this media file. Output MUST be a valid JSON array of objects representing chronological subtitle segments. Each object in the array MUST have exactly three keys: 'start' (number in seconds), 'end' (number in seconds), and 'text' (string representing the spoken words during that interval). Ensure intervals are small (between 2 to 6 seconds per segment). Do not wrap the JSON in markdown code blocks or add any other text. Return ONLY the raw JSON array string.",
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            }),
          }
        );
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let parsedSegments = JSON.parse(textResponse.trim());
        if (!Array.isArray(parsedSegments)) {
          throw new Error('Invalid JSON format returned from Gemini');
        }
        
        const mappedSegments = parsedSegments.map((seg, idx) => ({
          id: idx,
          start: Number(seg.start) || 0,
          end: Number(seg.end) || (Number(seg.start) || 0) + 3,
          text: String(seg.text || '')
        }));
        
        setSegments(mappedSegments);
        toast.success('Transcription completed!');
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Gemini transcription failed');
      } finally {
        setIsProcessing(false);
        setProcessStep('');
      }
      return;
    }

    try {
      // 1. Resample & Decode audio
      const audioData = await getAudioBuffer();

      // 2. Load Pipeline dynamically from ESM CDN
      setProcessStep('loading-model');
      
      const module = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      const pipeline = module.pipeline;
      const env = module.env;
      env.allowLocalModels = false;

      fileProgressMap.current = {};
      const transcriber = await pipeline('automatic-speech-recognition', modelType, {
        progress_callback: (progress) => {
          if (progress.status === 'initiate') {
            fileProgressMap.current[progress.file] = { loaded: 0, total: 0 };
          } else if (progress.status === 'progress') {
            fileProgressMap.current[progress.file] = {
              loaded: progress.loaded || 0,
              total: progress.total || 0
            };
          } else if (progress.status === 'done' || progress.status === 'ready') {
            if (fileProgressMap.current[progress.file]) {
              fileProgressMap.current[progress.file].loaded = fileProgressMap.current[progress.file].total;
            }
          }
          
          let totalBytes = 0;
          let loadedBytes = 0;
          Object.values(fileProgressMap.current).forEach(fileInfo => {
            totalBytes += fileInfo.total || 0;
            loadedBytes += fileInfo.loaded || 0;
          });
          
          if (totalBytes > 0) {
            const percent = Math.round((loadedBytes / totalBytes) * 100);
            setDownloadProgress((prev) => Math.max(prev, percent));
          }
        }
      });
      setDownloadProgress(100);

      // 3. Transcribe
      setProcessStep('transcribing');
      const options = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        repetition_penalty: 1.25,
        no_repeat_ngram_size: 4,
        task: 'transcribe',
      };

      if (modelType === 'Xenova/whisper-tiny' && language !== 'auto') {
        options.language = language;
      }

      const output = await transcriber(audioData, options);

      // 4. Map output to structured timeline segments
      if (output) {
        let mappedSegments = [];
        if (output.chunks && output.chunks.length > 0) {
          mappedSegments = output.chunks.map((chunk, idx) => ({
            id: idx,
            start: chunk.timestamp[0] ?? 0,
            end: chunk.timestamp[1] ?? (chunk.timestamp[0] ?? 0) + 3,
            text: chunk.text
          }));
        } else if (output.text && output.text.trim()) {
          mappedSegments = [{
            id: 0,
            start: 0,
            end: mediaRef.current?.duration || 10,
            text: output.text
          }];
        }

        if (mappedSegments.length === 0) {
          mappedSegments = [{
            id: 0,
            start: 0,
            end: mediaRef.current?.duration || 10,
            text: "[No speech detected in this file]"
          }];
        }
        
        setSegments(mappedSegments);
        toast.success('Transcription completed!');
      } else {
        throw new Error('No response from transcriber.');
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
    // Scroll viewport to top on mobile after download
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Scroll viewport to top on mobile when reset
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadSubtitledVideo = () => {
    if (!mediaRef.current || fileType !== 'video') return;
    setIsRecordingSubtitledVideo(true);
    setRecordingProgress(0);
    
    const video = mediaRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    
    let combinedStream;
    let audioContext;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioContext.createMediaStreamDestination();
      const sourceNode = audioContext.createMediaElementSource(video);
      sourceNode.connect(dest);
      sourceNode.connect(audioContext.destination);
      
      const videoStream = canvas.captureStream(30); // 30 FPS
      const audioStream = dest.stream;
      
      combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
    } catch (e) {
      console.warn("Audio capture failed, downloading video track only:", e);
      const videoStream = canvas.captureStream(30);
      combinedStream = videoStream;
    }
    
    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
    const chunks = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    
    const originalTime = video.currentTime;
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.split('.')[0]}_with_captions.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsRecordingSubtitledVideo(false);
      
      if (audioContext) {
        audioContext.close();
      }
      
      toast.success('Downloaded video with captions burned in!');
    };
    
    // Play & Draw loop
    video.currentTime = 0;
    video.play();
    recorder.start();
    
    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        video.currentTime = originalTime; // restore original position
        return;
      }
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Find current subtitle
      const time = video.currentTime;
      setRecordingProgress(Math.round((time / video.duration) * 100));
      const active = segments.find(seg => time >= seg.start && time <= seg.end);
      
      if (active) {
        // Draw subtitle text background
        ctx.font = 'bold 24px sans-serif';
        const text = active.text.trim();
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(
          (canvas.width - textWidth) / 2 - 15,
          canvas.height - 70,
          textWidth + 30,
          40
        );
        
        // Draw white text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, canvas.height - 42);
      }
      
      requestAnimationFrame(drawFrame);
    };
    
    requestAnimationFrame(drawFrame);
  };

  const hasFile = file !== null;
  const hasTranscribed = segments.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-sm">
          <FileAudio size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground font-sans">AI Audio & Video Captioner</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Extract timestamped text & subtitles from audio and video files offline using browser-based AI.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left Card: Media Player & Live Captions */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]"
        >
          {!hasFile ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl p-8 bg-muted/5 min-h-[300px] transition-all">
              <div className="p-4 bg-muted/50 rounded-full border border-border/50 text-primary mb-4">
                <Upload className="w-10 h-10" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Upload Audio or Video File</p>
              <p className="text-xs text-muted-foreground mb-6 text-center max-w-[320px]">
                Supports MP3, WAV, M4A, MP4, WEBM, and MKV. Processed 100% locally.
              </p>
              <label className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl text-xs shadow-sm shadow-primary/20 transition-all active:scale-[0.98]">
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
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTranscribe}
                        className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-md hover:bg-primary/95 transition-colors"
                      >
                        Start Transcription
                      </motion.button>
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
        </motion.div>

        {/* Right Card: Transcription Configuration & Export Panel */}
        <motion.div 
          animate={{ opacity: hasFile ? 1 : 0.5 }}
          transition={{ duration: 0.25 }}
          className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 transition-all duration-300 ${!hasFile ? 'pointer-events-none grayscale-[0.5]' : ''}`}
        >
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
            
            {/* Model & Language selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Sliders size={15} /> Settings
              </h3>

              {/* Engine Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">AI Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={hasTranscribed || isProcessing}
                    onClick={() => setEngine('local')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      engine === 'local'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                    }`}
                  >
                    Local Whisper
                  </button>
                  <button
                    type="button"
                    disabled={hasTranscribed || isProcessing}
                    onClick={() => setEngine('gemini')}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      engine === 'gemini'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                    }`}
                  >
                    Gemini Cloud (AI)
                  </button>
                </div>
              </div>

              {engine === 'local' ? (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">AI Model Size</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'Xenova/whisper-tiny.en', label: 'Whisper-Tiny (English Only)', desc: 'Fastest transcription, ultra accurate for English.' },
                        { id: 'Xenova/whisper-tiny',    label: 'Whisper-Tiny (Multilingual)', desc: 'Auto-detects & translates 100+ languages.' }
                      ].map(model => (
                        <motion.button
                          key={model.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={hasTranscribed || isProcessing}
                          onClick={() => setModelType(model.id)}
                          className={`text-left p-4 rounded-xl border transition-all active:scale-[0.98] ${
                            modelType === model.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="text-xs font-bold block">{model.label}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block leading-normal">{model.desc}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {modelType === 'Xenova/whisper-tiny' && (
                    <div className="space-y-3 pt-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Globe size={14} className="text-primary" /> Speech Language
                      </label>
                      <div className="relative group">
                        <select
                          value={language}
                          disabled={hasTranscribed || isProcessing}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <option value="auto" className="bg-background text-foreground">Auto-Detect Language</option>
                          <option value="en" className="bg-background text-foreground">English</option>
                          <option value="es" className="bg-background text-foreground">Spanish (Español)</option>
                          <option value="fr" className="bg-background text-foreground">French (Français)</option>
                          <option value="de" className="bg-background text-foreground">German (Deutsch)</option>
                          <option value="it" className="bg-background text-foreground">Italian (Italiano)</option>
                          <option value="pt" className="bg-background text-foreground">Portuguese (Português)</option>
                          <option value="hi" className="bg-background text-foreground">Hindi (हिन्दी)</option>
                          <option value="zh" className="bg-background text-foreground">Chinese (中文)</option>
                          <option value="ja" className="bg-background text-foreground">Japanese (日本語)</option>
                          <option value="ko" className="bg-background text-foreground">Korean (한국어)</option>
                          <option value="ru" className="bg-background text-foreground">Russian (Русский)</option>
                          <option value="ar" className="bg-background text-foreground">Arabic (العربية)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-foreground">Gemini API Key</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Get Free Key
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your Gemini API Key..."
                    value={apiKey}
                    disabled={hasTranscribed || isProcessing}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 p-3 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Quick Tip */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3.5 space-y-1 shrink-0">
              <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-1 uppercase tracking-wider">
                <Sliders size={12} /> Optimization Tip
              </span>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                If the model gets stuck repeating a phrase, select your specific <strong>Speech Language</strong> from the dropdown, or use the <strong>English Only</strong> model for English files to prevent repetition loops.
              </p>
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
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={exportSRT}
                    className="py-3 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Download size={13} /> SRT Subs
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={exportVTT}
                    className="py-3 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Download size={13} /> VTT Subs
                  </motion.button>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportTXT}
                  className="w-full py-3 bg-muted/20 hover:bg-muted/50 border border-border/50 text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Download size={13} /> Download TXT Timeline
                </motion.button>
                {fileType === 'video' && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isRecordingSubtitledVideo}
                    onClick={handleDownloadSubtitledVideo}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    {isRecordingSubtitledVideo ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    {isRecordingSubtitledVideo ? `Generating Video (${recordingProgress}%)` : 'Download Video with Captions'}
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={copyTextOnly}
                  className="w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] active:scale-[0.98]"
                >
                  {copiedState ? <CheckCircle size={16} /> : <Copy size={16} />} Copy Full Transcript
                </motion.button>
              </div>
            )}

          </div>
        </motion.div>

      </div>
      
      {/* Overlay Modal for Burn-in Video Generation Progress */}
      {isRecordingSubtitledVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card border border-border p-8 rounded-2xl max-w-sm w-full space-y-4">
            <RefreshCw size={36} className="animate-spin text-primary mx-auto" />
            <h3 className="text-lg font-bold text-foreground">Burning Captions into Video</h3>
            <p className="text-xs text-muted-foreground">The video is playing and being re-recorded with subtitle captions drawn over the video frames. Please keep this tab open.</p>
            <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${recordingProgress}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-primary">{recordingProgress}% Completed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVideoTranscriber;
