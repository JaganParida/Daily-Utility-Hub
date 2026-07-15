import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, UploadCloud, Copy, Check, Download, 
  Settings, Key, AlertCircle, Sparkles, Code, Play, 
  Maximize2, Cpu, BarChart2, Eye, Trash2, ArrowRight, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAi, ALL_MODELS } from '../../hooks/useAi';

const AiImageToMarkdown = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      processFile(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const {
    geminiKey,
    openaiKey,
    saveGeminiKey,
    saveOpenaiKey,
    isGeminiConfigured,
    isOpenaiConfigured,
    callAi,
    loading
  } = useAi();

  // Component states
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/png');
  const [isDragging, setIsDragging] = useState(false);
  const [outputFormat, setOutputFormat] = useState('markdown'); // 'markdown' | 'html' | 'react' | 'mermaid'
  const [modelId, setModelId] = useState('gemini-2.5-flash');
  const [customPrompt, setCustomPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code' | 'stats'
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // API key inputs (for the settings form)
  const [geminiInput, setGeminiInput] = useState(geminiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiKey);

  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);

  // Update inputs if keys change from hook
  useEffect(() => {
    setGeminiInput(geminiKey);
    setOpenaiInput(openaiKey);
  }, [geminiKey, openaiKey]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Determine current active provider
  const selectedModel = ALL_MODELS.find(m => m.id === modelId);
  const isSelectedProviderConfigured = selectedModel?.provider === 'google' ? isGeminiConfigured : isOpenaiConfigured;

  // File Handling
  const processFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files (PNG, JPEG, WEBP) are supported.');
      return;
    }

    setFile(selectedFile);
    setImageMimeType(selectedFile.type);
    
    // Revoke old URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result.split(',')[1];
      setImageBase64(base64Str);
    };
    reader.readAsDataURL(selectedFile);
    toast.success(`Loaded image: ${selectedFile.name}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setFile(null);
    setPreviewUrl('');
    setImageBase64('');
    toast.success('Image cleared.');
  };

  // Trigger conversion
  const handleConvert = async () => {
    if (!imageBase64) {
      toast.error('Please upload an image first.');
      return;
    }

    if (!isSelectedProviderConfigured) {
      toast.error(`Please configure your ${selectedModel?.provider === 'google' ? 'Gemini' : 'OpenAI'} API Key first.`);
      setShowSettings(true);
      return;
    }

    // Build system instructions and prompt
    let systemInstruction = "You are an expert developer assistant specialized in OCR, code generation, and UI specifications conversion.";
    let prompt = "";

    if (outputFormat === 'markdown') {
      systemInstruction += " Your task is to inspect the uploaded image (sketch, whiteboard design, UI mockup, flow diagram, or handwritten developer note) and translate it into clear, well-structured, formatted Markdown code. Follow semantic header nesting, write clean list blocks, include mock Markdown code snippet placeholders where relevant, and structure tables beautifully. Do not include a surrounding markdown block (` ```markdown `) containing the entire response, just return the direct markdown code. Make it highly professional and complete.";
      prompt = `Analyze the uploaded image and convert it into fully formatted Markdown. ${
        customPrompt ? `Special instructions: ${customPrompt}` : ''
      }`;
    } else if (outputFormat === 'html') {
      systemInstruction += " Your task is to convert the uploaded screenshot or mockup design into a single-file, highly modern HTML page styled entirely with Tailwind CSS (import Tailwind CSS via its standard CDN script). Use Google Fonts (Outfit or Inter) for elegant typography. Ensure it is fully responsive, interactive with minimal inline Javascript (like mobile menus, toggle states), and uses Lucide Icons (imported via CDN) or inline SVG icons. Return ONLY the raw code. Do NOT wrap it in any markdown backticks or text blocks (like \` ```html \` or similar). Start directly with <!DOCTYPE html>.";
      prompt = `Generate a fully functional, pixel-perfect, interactive Tailwind HTML page mirroring this visual design mockup. ${
        customPrompt ? `Special instructions: ${customPrompt}` : ''
      }`;
    } else if (outputFormat === 'react') {
      systemInstruction += " Your task is to write a single-file React component using functional code and standard hooks, styled with Tailwind CSS, that mirrors the visual layout in the uploaded image. Include placeholder state handlers for clicks and forms. Return ONLY the raw React code (no markdown backticks, no wrap text, just the direct Javascript/JSX code starting with imports).";
      prompt = `Write a gorgeous React functional component with inline Tailwind styles that reproduces the layout and design of the uploaded UI mockup image. ${
        customPrompt ? `Special instructions: ${customPrompt}` : ''
      }`;
    } else if (outputFormat === 'mermaid') {
      systemInstruction += " Your task is to identify flowcharts, architecture diagrams, sequence logs, or database relationships inside the image and translate them into valid, clean Mermaid diagram syntax. Output ONLY the raw Mermaid diagram script (e.g. starting with flowchart TD or graph LR). Do NOT surround it in markdown wrappers.";
      prompt = `Generate a valid Mermaid diagram that represents the structure shown in the uploaded design image. ${
        customPrompt ? `Special instructions: ${customPrompt}` : ''
      }`;
    }

    const toastId = toast.loading('AI is analyzing your image and writing code...');
    try {
      const result = await callAi({
        prompt,
        systemInstruction,
        modelId,
        imageBase64,
        imageMimeType
      });

      // Clean up markdown block headers if the model returned them anyway
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```') && cleanText.endsWith('```')) {
        // Strip out code block wrappers
        cleanText = cleanText.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '');
      }

      setOutput(cleanText);
      setStats({
        latency: result.latency,
        usage: result.usage,
        cost: result.cost
      });
      setActiveTab('preview');
      toast.success('Successfully generated!', { id: toastId });
    } catch (err) {
      toast.error('AI Analysis failed. See console.', { id: toastId });
    }
  };

  // Utilities
  const handleCopyCode = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const extensions = {
      markdown: 'md',
      html: 'html',
      react: 'jsx',
      mermaid: 'mmd'
    };
    const ext = extensions[outputFormat] || 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendered_design.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded rendered_design.${ext}`);
  };

  const handleSaveKeys = (e) => {
    e.preventDefault();
    saveGeminiKey(geminiInput);
    saveOpenaiKey(openaiInput);
    setShowSettings(false);
  };

  // Safe Sandboxed HTML Iframe source
  const [iframeSrc, setIframeSrc] = useState('');
  useEffect(() => {
    if (output && outputFormat === 'html' && activeTab === 'preview') {
      const blob = new Blob([output], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setIframeSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setIframeSrc('');
    }
  }, [output, outputFormat, activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8 relative"
    >
      {/* Top Banner / API key alert */}
      {!isGeminiConfigured && !isOpenaiConfigured && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-between gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span><strong>API Key Required:</strong> Setup your Gemini or OpenAI API Key to start converting images. Google AI Studio keys are 100% free.</span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 font-bold rounded-lg border border-yellow-500/30 transition-all cursor-pointer shrink-0"
          >
            Setup Key
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl shadow-sm shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">AI Image to Code & Markdown</h1>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm">
              Convert design wireframes, whiteboard flowcharts, or app screenshots into structured clean documentation or code.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => setShowSettings(true)}
            className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              isSelectedProviderConfigured 
                ? 'bg-muted/30 border-border/80 text-foreground hover:bg-muted/55' 
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
            }`}
          >
            <Key size={14} />
            {isSelectedProviderConfigured ? 'API Key Configured' : 'Configure API Key'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Control Column: Input / Settings */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Dropzone Container */}
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> 1. Upload Input Image
            </h3>

            {!previewUrl ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all hover:bg-muted/10 min-h-[220px] ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border/80'
                }`}
              >
                <div className="p-3 bg-muted/40 text-muted-foreground rounded-2xl border border-border/50 shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Drag & Drop visual image here</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP formats allowed (Max 5MB)</p>
                </div>
                <button className="mt-2 text-xs font-semibold px-4 py-2 bg-primary text-white rounded-xl shadow transition-colors">
                  Browse File
                </button>
              </div>
            ) : (
              <div className="relative border border-border/50 rounded-2xl overflow-hidden bg-muted/20 flex items-center justify-center p-2 group max-h-[360px]">
                <img 
                  src={previewUrl} 
                  alt="Source UI Mockup" 
                  className="max-h-[300px] w-auto object-contain rounded-xl shadow-md"
                />
                
                {/* Clear button */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={handleClearImage}
                    className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {/* AI Settings box */}
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Cpu size={16} /> 2. AI Model & Output Settings
            </h3>

            <div className="space-y-4">
              {/* Output format picker */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-2">Target Code Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'markdown', label: 'Markdown Documentation' },
                    { id: 'html', label: 'Tailwind HTML Page' },
                    { id: 'react', label: 'React Component' },
                    { id: 'mermaid', label: 'Mermaid Diagram' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutputFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                        outputFormat === fmt.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/80 text-foreground bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Select LLM Engine</label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 cursor-pointer"
                >
                  <optgroup label="Google Gemini (Free tier available)">
                    {ALL_MODELS.filter(m => m.provider === 'google').map((m) => (
                      <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI API">
                    {ALL_MODELS.filter(m => m.provider === 'openai').map((m) => (
                      <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Custom Prompt (Optional)</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full p-3 bg-background border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 resize-none h-16 shadow-inner custom-scrollbar"
                  placeholder="e.g. 'Use a dark mode color scheme', 'Extract all written text exactly', 'Add button functionality for navigation'"
                />
              </div>

              {/* Action trigger */}
              <button
                onClick={handleConvert}
                disabled={loading || !imageBase64}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white disabled:bg-muted/80 disabled:text-muted-foreground font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Converting Image...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Render Image to {outputFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Column: Preview & Editor */}
        <div className="lg:col-span-7 w-full flex flex-col min-h-[580px]">
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[520px]">
            {/* Upper Tab Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-border/80 bg-muted/10 shrink-0 flex-wrap gap-3">
              <div className="flex p-1 bg-muted/40 border border-border/50 rounded-xl shadow-inner">
                {[
                  { id: 'preview', label: 'Live Rendering', icon: Eye },
                  { id: 'code', label: 'Raw Code', icon: Code },
                  { id: 'stats', label: 'Token Metrics', icon: BarChart2 }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-card text-foreground shadow-sm border border-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              {output && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    Copy Code
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col bg-background/25">
              {!output ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 my-auto opacity-55 animate-pulse">
                  <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground border border-border/40">
                    <Sparkles size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Awaiting Generation</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                      Upload an image, configure your parameters, and click convert. The generated code will render here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* PREVIEW TAB */}
                  {activeTab === 'preview' && (
                    <div className="flex-1 flex flex-col">
                      {outputFormat === 'markdown' && (
                        <div className="p-5 bg-card border border-border/80 rounded-xl prose dark:prose-invert max-w-full text-sm leading-relaxed custom-markdown-renderer overflow-x-auto">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-black text-primary mt-6 mb-3 border-b border-border/60 pb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-foreground mt-5 mb-2.5 border-b border-border/40 pb-1" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-foreground mt-4 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-3 text-foreground/80 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-foreground/80" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-foreground/80" {...props} />,
                              li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                              code: ({node, inline, className, children, ...props}) => {
                                return (
                                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-pink-500 border border-border" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              pre: ({node, ...props}) => <pre className="bg-muted/30 border border-border p-4 rounded-xl overflow-x-auto my-4 font-mono text-xs leading-relaxed" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 py-1 italic text-muted-foreground bg-muted/10 my-4 rounded-r-lg" {...props} />,
                              table: ({node, ...props}) => (
                                <div className="overflow-x-auto w-full border border-border rounded-xl my-4">
                                  <table className="w-full border-collapse text-xs" {...props} />
                                </div>
                              ),
                              th: ({node, ...props}) => <th className="border-b border-border bg-muted/40 p-2.5 text-left font-bold text-foreground" {...props} />,
                              td: ({node, ...props}) => <td className="border-b border-border p-2.5 text-foreground/80" {...props} />
                            }}
                          >
                            {output}
                          </ReactMarkdown>
                        </div>
                      )}

                      {outputFormat === 'html' && (
                        <div className="flex-1 flex flex-col border border-border/80 rounded-xl overflow-hidden bg-white shadow-inner min-h-[420px]">
                          {iframeSrc ? (
                            <iframe
                              ref={iframeRef}
                              src={iframeSrc}
                              title="Rendered Sandbox"
                              className="w-full flex-1 border-0 bg-white"
                              sandbox="allow-scripts allow-popups allow-forms"
                            />
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                              Loading sandbox preview...
                            </div>
                          )}
                        </div>
                      )}

                      {outputFormat === 'react' && (
                        <div className="p-5 bg-card border border-border/80 rounded-xl text-center flex flex-col items-center justify-center my-auto py-12 gap-3">
                          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <Code size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">React Component Generated</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[360px] mx-auto">
                              React rendering requires a compiling build step. View and copy the full react syntax on the <strong>Raw Code</strong> tab.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('code')}
                            className="mt-3 text-xs font-semibold px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg cursor-pointer"
                          >
                            View JSX Code
                          </button>
                        </div>
                      )}

                      {outputFormat === 'mermaid' && (
                        <div className="p-5 bg-card border border-border/80 rounded-xl overflow-x-auto font-mono text-xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Play size={12} /> Mermaid Script
                          </h4>
                          <pre className="bg-muted/40 p-4 rounded-lg border border-border overflow-x-auto text-foreground">
                            {output}
                          </pre>
                          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] text-blue-500 leading-normal">
                            Tip: You can copy this script and paste it into Mermaid visualizer apps or view it natively inside Markdown editors that support Mermaid rendering.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CODE TAB */}
                  {activeTab === 'code' && (
                    <div className="flex-1 flex flex-col">
                      <textarea
                        value={output}
                        readOnly
                        className="w-full flex-1 p-4 bg-muted/20 border border-border/80 rounded-xl resize-none font-mono text-xs text-foreground focus:outline-none custom-scrollbar min-h-[400px] leading-relaxed shadow-inner"
                      />
                    </div>
                  )}

                  {/* STATS TAB */}
                  {activeTab === 'stats' && stats && (
                    <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 max-w-[600px] mx-auto w-full">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/80 pb-2">
                        <BarChart2 size={16} /> AI Execution Metrics
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Response Latency</div>
                          <div className="text-2xl font-black text-foreground mt-1">{(stats.latency / 1000).toFixed(2)}s</div>
                        </div>
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Total Cost (Est)</div>
                          <div className="text-2xl font-black text-emerald-500 mt-1">${stats.cost.toFixed(5)}</div>
                        </div>
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Input Tokens (Est)</div>
                          <div className="text-xl font-bold text-foreground mt-1">{stats.usage.promptTokens.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Output Tokens (Est)</div>
                          <div className="text-xl font-bold text-foreground mt-1">{stats.usage.completionTokens.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-muted-foreground leading-normal flex items-start gap-2">
                        <Cpu size={14} className="shrink-0 text-indigo-500 mt-0.5" />
                        <span>Estimations are calculated based on average characters per word and standard pricing lists for {selectedModel?.name}. Actual token bills may vary depending on the model provider.</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full relative"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">AI Configuration Settings</h3>
                  <p className="text-xs text-muted-foreground">Keys are stored locally in your browser only.</p>
                </div>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5 flex justify-between items-center">
                    <span>Google Gemini API Key</span>
                    <a 
                      href="https://aistudio.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      Get Free Key <ArrowRight size={10} />
                    </a>
                  </label>
                  <input
                    type="password"
                    value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    placeholder={geminiKey ? "••••••••••••••••" : "Paste your Gemini API Key"}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5 flex justify-between items-center">
                    <span>OpenAI API Key</span>
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      Get OpenAI Key <ArrowRight size={10} />
                    </a>
                  </label>
                  <input
                    type="password"
                    value={openaiInput}
                    onChange={(e) => setOpenaiInput(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    placeholder={openaiKey ? "••••••••••••••••" : "Paste your OpenAI API Key"}
                  />
                </div>

                <div className="p-3 bg-muted/30 border border-border/50 rounded-xl text-[10px] text-muted-foreground leading-normal">
                  <strong>Security Note:</strong> These keys never leave your browser. Direct network requests are made straight from your IP address to Google/OpenAI endpoints. No third-party servers compile or proxy your files.
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiInput(geminiKey);
                      setOpenaiInput(openaiKey);
                      setShowSettings(false);
                    }}
                    className="px-4 py-2 border border-border/80 rounded-xl text-xs font-bold text-foreground bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Save Keys
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AiImageToMarkdown;
