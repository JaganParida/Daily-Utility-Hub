import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  FileText, UploadCloud, Copy, Check, Download, 
  Settings, Key, AlertCircle, Sparkles, Code, Play, 
  Cpu, BarChart2, Eye, Trash2, ArrowRight, RefreshCw,
  Layers, Terminal, FileDown, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as pdfjsLib from 'pdfjs-dist';
import { useAi, ALL_MODELS } from '../../hooks/useAi';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const AiPdfToMarkdown = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadPdf(initialFile);
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

  // File and Parsing State
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('1');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Formatting / AI Settings
  const [modelId, setModelId] = useState('gemini-2.5-flash');
  const [styleGuide, setStyleGuide] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code' | 'logs' | 'stats'
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Key configurations for Settings Modal
  const [geminiInput, setGeminiInput] = useState(geminiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiKey);

  const fileInputRef = useRef(null);

  // Sync settings inputs with hook keys
  useEffect(() => {
    setGeminiInput(geminiKey);
    setOpenaiInput(openaiKey);
  }, [geminiKey, openaiKey]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const clearWorkspace = () => {
    setFile(null);
    setTotalPages(0);
    setStartPage('1');
    setEndPage('1');
    setLogs([]);
    setOutput('');
    setStats(null);
    toast.success('Workspace cleared.');
  };

  // PDF File handling
  const handleFile = async (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF document.');
      return;
    }

    setFile(selectedFile);
    setLogs([]);
    setOutput('');
    setStats(null);
    addLog(`Loading file: ${selectedFile.name}`);

    try {
      setIsParsingPdf(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setStartPage('1');
      setEndPage(Math.min(pdf.numPages, 5).toString()); // Default to first 5 pages or less
      addLog(`Loaded PDF document successfully. Total pages: ${pdf.numPages}`);
      toast.success(`PDF Loaded: ${pdf.numPages} pages.`);
    } catch (err) {
      console.error(err);
      addLog(`Error parsing PDF structure: ${err.message}`);
      toast.error('Failed to parse PDF file structure.');
    } finally {
      setIsParsingPdf(false);
    }
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error('Please select a PDF file first.');
      return;
    }

    const selectedModel = ALL_MODELS.find(m => m.id === modelId);
    const isSelectedProviderConfigured = selectedModel?.provider === 'google' ? isGeminiConfigured : isOpenaiConfigured;
    if (!isSelectedProviderConfigured) {
      toast.error(`Please configure your ${selectedModel?.provider === 'google' ? 'Gemini' : 'OpenAI'} API Key first.`);
      setShowSettings(true);
      return;
    }

    const start = Math.max(1, parseInt(startPage) || 1);
    const end = Math.min(totalPages, parseInt(endPage) || totalPages);

    if (start > end) {
      toast.error('Start page cannot be greater than end page.');
      return;
    }

    // Token limit check warnings (client-side safety)
    const pageRange = end - start + 1;
    if (pageRange > 20 && modelId.includes('gpt-4o-mini')) {
      toast.loading('Warning: Large page range. Processing may run out of token context.');
    }

    setLogs([]);
    setOutput('');
    setActiveTab('logs');
    addLog(`Initiating text extraction from page ${start} to ${end}...`);

    try {
      setIsParsingPdf(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';

      for (let pageNum = start; pageNum <= end; pageNum++) {
        addLog(`Extracting text from page ${pageNum}/${totalPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Group items by line height to preserve layout spacing
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item.str);
        });

        const sortedY = Object.keys(lines).sort((a, b) => b - a);
        const pageString = sortedY.map(y => lines[y].join(' ')).join('\n');

        extractedText += `\n\n--- START PDF PAGE ${pageNum} ---\n\n${pageString}\n\n--- END PDF PAGE ${pageNum} ---\n\n`;
      }

      addLog(`Text extraction complete. Total character count: ${extractedText.length.toLocaleString()} chars.`);
      addLog(`Formatting prompt for AI model: ${selectedModel.name}...`);
      setIsParsingPdf(false);

      // Instruct AI to restructure raw PDF dump
      const systemInstruction = 
        "You are an expert technical editor. Your job is to take raw, unformatted text extracted from a PDF document " +
        "and convert it into clean, well-structured, valid Markdown. Remove running page numbers, header titles, and footer legal text. " +
        "Repair words split by line-breaks (hyphenations). Use appropriate header nesting (H1, H2, H3) based on text emphasis. " +
        "If you see program code blocks, structure them inside standard markdown code tags with the correct language syntax (e.g. ```javascript). " +
        "Format lists, table headers, and blocks beautifully. " +
        "Do NOT write wrapping ```markdown and ``` blocks around the entire output; directly output the markdown text.";

      const prompt = `Here is the raw text extracted from PDF page ${start} to ${end}. Reformat and clean this into structured Markdown:

${extractedText}

${styleGuide ? `Additional Formatting Requirements: ${styleGuide}` : ''}`;

      addLog(`Sending content payload to AI model (Estimated ${Math.ceil(prompt.length / 4)} tokens)...`);
      
      const result = await callAi({
        prompt,
        systemInstruction,
        modelId
      });

      // Strip potential wrapper code blocks
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```') && cleanText.endsWith('```')) {
        cleanText = cleanText.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '');
      }

      setOutput(cleanText);
      setStats({
        latency: result.latency,
        usage: result.usage,
        cost: result.cost
      });
      setActiveTab('preview');
      addLog('Successfully completed! Markdown rendered.');
      toast.success('PDF successfully converted to Markdown!');
    } catch (err) {
      console.error(err);
      addLog(`Extraction/AI error occurred: ${err.message}`);
      toast.error('Failed to convert PDF pages.');
      setIsParsingPdf(false);
    }
  };

  const handleCopyCode = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied Markdown code!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_converted.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded Markdown file.');
  };

  const handleSaveKeys = (e) => {
    e.preventDefault();
    saveGeminiKey(geminiInput);
    saveOpenaiKey(openaiInput);
    setShowSettings(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8 relative"
    >
      {/* Settings Alert banner */}
      {!isGeminiConfigured && !isOpenaiConfigured && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-between gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span><strong>Setup API Keys:</strong> Configure your client API key to convert PDF docs. Gemini Studio keys are free.</span>
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
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shadow-sm shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">AI PDF to Markdown Parser</h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              Convert raw PDF reports, specs, and reference manuals into beautiful clean Markdown documentation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => setShowSettings(true)}
            className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              (ALL_MODELS.find(m => m.id === modelId)?.provider === 'google' ? isGeminiConfigured : isOpenaiConfigured)
                ? 'bg-muted/30 border-border/80 text-foreground hover:bg-muted/55' 
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
            }`}
          >
            <Key size={14} />
            Configure API Key
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Control Column */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Upload Card */}
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <FileText size={16} /> 1. Upload PDF Document
            </h3>

            {!file ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all hover:bg-muted/10 min-h-[200px] ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border/80'
                }`}
              >
                <div className="p-3 bg-muted/40 text-muted-foreground rounded-2xl border border-border/50 shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Drag & Drop PDF file here</p>
                  <p className="text-xs text-muted-foreground mt-1">Files are processed entirely inside your browser</p>
                </div>
                <button className="mt-2 text-xs font-semibold px-4 py-2 bg-primary text-white rounded-xl shadow transition-colors">
                  Browse File
                </button>
              </div>
            ) : (
              <div className="border border-border/50 rounded-2xl p-4 bg-muted/20 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} Pages</p>
                  </div>
                  <button 
                    onClick={clearWorkspace}
                    className="p-1.5 bg-background border border-border/80 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Page range configuration */}
                <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">Start Page</label>
                    <input 
                      type="number"
                      min="1"
                      max={totalPages}
                      value={startPage}
                      onChange={(e) => setStartPage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border/80 rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">End Page</label>
                    <input 
                      type="number"
                      min={startPage}
                      max={totalPages}
                      value={endPage}
                      onChange={(e) => setEndPage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border/80 rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  * Limit page range to manage AI token constraints. Best results: 1-5 pages per call.
                </p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf"
            />
          </div>

          {/* Model & Formatting */}
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Cpu size={16} /> 2. Restructuring Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Select LLM Engine</label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 cursor-pointer"
                >
                  <optgroup label="Google Gemini">
                    {ALL_MODELS.filter(m => m.provider === 'google').map((m) => (
                      <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI">
                    {ALL_MODELS.filter(m => m.provider === 'openai').map((m) => (
                      <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Formatting Guideline (Optional)</label>
                <textarea
                  value={styleGuide}
                  onChange={(e) => setStyleGuide(e.target.value)}
                  className="w-full p-3 bg-background border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 resize-none h-16 shadow-inner custom-scrollbar"
                  placeholder="e.g. 'Format tables as GFM tables', 'Only output code snippets', 'Maintain mathematical equations in LaTeX style'"
                />
              </div>

              <button
                onClick={handleConvert}
                disabled={loading || isParsingPdf || !file}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white disabled:bg-muted/80 disabled:text-muted-foreground font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {loading || isParsingPdf ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Processing Document...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Restructure PDF to Markdown
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 w-full flex flex-col min-h-[580px]">
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[520px]">
            {/* Tab Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-border/80 bg-muted/10 shrink-0 flex-wrap gap-3">
              <div className="flex p-1 bg-muted/40 border border-border/50 rounded-xl shadow-inner">
                {[
                  { id: 'preview', label: 'Markdown Preview', icon: Eye },
                  { id: 'code', label: 'Raw Markdown', icon: Code },
                  { id: 'logs', label: 'Console Logs', icon: Terminal },
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

              {/* Actions */}
              {output && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <FileDown size={12} />
                    Download .MD
                  </button>
                </div>
              )}
            </div>

            {/* Console and Outputs */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col bg-background/25">
              {activeTab === 'logs' ? (
                <div className="flex-1 flex flex-col bg-black/95 text-green-400 p-4 rounded-xl font-mono text-xs overflow-y-auto custom-scrollbar min-h-[360px] border border-border/60 shadow-inner select-text">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-white/60 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Terminal size={12} /> Live PDF Extraction Console
                    </span>
                    <button 
                      onClick={() => setLogs([])}
                      className="text-[10px] text-white/40 hover:text-white px-2 py-0.5 border border-white/10 rounded cursor-pointer"
                    >
                      Clear Log
                    </button>
                  </div>
                  {logs.length === 0 ? (
                    <span className="text-white/30 italic">Console ready. Upload PDF and click run to print diagnostic statements.</span>
                  ) : (
                    <div className="space-y-1.5 leading-normal">
                      {logs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">{log}</div>
                      ))}
                      {(loading || isParsingPdf) && (
                        <div className="flex items-center gap-2 text-white/50 pt-1.5 animate-pulse">
                          <RefreshCw className="animate-spin" size={10} />
                          <span>Streaming content pages...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : !output ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 my-auto opacity-55 animate-pulse">
                  <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground border border-border/40">
                    <Sparkles size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Awaiting Execution</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                      Upload your document, specify target page range, and execute the conversion. Output files render here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* PREVIEW */}
                  {activeTab === 'preview' && (
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

                  {/* RAW CODE */}
                  {activeTab === 'code' && (
                    <textarea
                      value={output}
                      readOnly
                      className="w-full flex-1 p-4 bg-muted/20 border border-border/80 rounded-xl resize-none font-mono text-xs text-foreground focus:outline-none custom-scrollbar min-h-[400px] leading-relaxed shadow-inner"
                    />
                  )}

                  {/* METRICS */}
                  {activeTab === 'stats' && stats && (
                    <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 max-w-[600px] mx-auto w-full">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/80 pb-2">
                        <BarChart2 size={16} /> API Performance Metrics
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
                        <span>Metrics show estimated call overheads based on PDF layout complexity. Token pricing matches vendor rates.</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Settings */}
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
                  <strong>Security Note:</strong> Keys remain encrypted locally inside localStorage. Network requests are serverless and direct to Google or OpenAI.
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

export default AiPdfToMarkdown;
