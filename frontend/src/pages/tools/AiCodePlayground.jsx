import { useState, useEffect, useRef } from 'react';
import { 
  Code, Settings, Key, AlertCircle, Sparkles, Play, 
  Cpu, BarChart2, Eye, Trash2, ArrowRight, RefreshCw,
  FileCode, SplitSquareHorizontal, Check, Copy, HelpCircle,
  FileCheck2, ShieldAlert, Sparkle, ArrowRightLeft, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer-continued';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAi, ALL_MODELS } from '../../hooks/useAi';

const PRESETS = [
  { 
    id: 'optimize', 
    name: 'Optimize Performance', 
    desc: 'Improve execution speed, memory usage, and algorithm complexity.',
    systemPrompt: 'Optimize the execution efficiency, memory footprints, and resource usage of the user\'s code. Maintain exactly the same external APIs and functionalities. Format your output strictly using [CODE]...[/CODE] for the refactored code and [EXPLANATION]...[/EXPLANATION] for the detailed optimization audit listing big-O changes and enhancements.'
  },
  { 
    id: 'bugs', 
    name: 'Find Bugs & Security Flaws', 
    desc: 'Check logic leaks, validation checks, and security holes.',
    systemPrompt: 'Inspect the user\'s code for edge-case errors, memory leaks, security vulnerabilities, or logical bugs. Rectify them in the code. Format your output strictly using [CODE]...[/CODE] for the corrected code and [EXPLANATION]...[/EXPLANATION] for the list of security flaws and bugs identified.'
  },
  { 
    id: 'clean', 
    name: 'Refactor Clean Code', 
    desc: 'Apply SOLID design, dry principles, and clear names.',
    systemPrompt: 'Refactor the user\'s code to enforce clean code paradigms, better variable namings, smaller functional units, and DRY patterns. Format your output strictly using [CODE]...[/CODE] for the clean refactored code and [EXPLANATION]...[/EXPLANATION] for the explanation of design patterns and clean improvements introduced.'
  },
  { 
    id: 'tests', 
    name: 'Generate Unit Tests', 
    desc: 'Write complete mock test cases (Jest, PyTest).',
    systemPrompt: 'Write robust, complete unit tests covering typical cases, edge failures, and boundary inputs for the provided code. Identify the programming language and use its standard test framework (e.g. Jest for JS, PyTest for Python, JUnit for Java). Format your output strictly using [CODE]...[/CODE] for the test suite code and [EXPLANATION]...[/EXPLANATION] for instructions on running the test suite.'
  },
  { 
    id: 'docs', 
    name: 'Generate JSDoc / Comments', 
    desc: 'Add descriptive inline docstrings and block annotations.',
    systemPrompt: 'Add detailed block docstrings (e.g. JSDoc for JS/TS, PEP 257 docstrings for Python) explaining parameters, returns, and execution logic. Add comments for complex inner blocks. Format your output strictly using [CODE]...[/CODE] for the annotated code and [EXPLANATION]...[/EXPLANATION] for a brief summary of the annotations added.'
  },
  { 
    id: 'explain', 
    name: 'Explain Code Logic', 
    desc: 'Walkthrough structural routines line-by-line.',
    systemPrompt: 'Analyze the user\'s code and write a comprehensive line-by-line explanation of its algorithms, libraries used, and general execution flow. Format your output strictly using [CODE]...[/CODE] (which should just duplicate the original code, as we are not refactoring it) and [EXPLANATION]...[/EXPLANATION] for the detailed logic explanation.'
  }
];

const AiCodePlayground = () => {
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

  // Core Editor State
  const [inputCode, setInputCode] = useState('// Paste code to refactor here\nfunction calculateFactorial(num) {\n  if (num === 0 || num === 1) {\n    return 1;\n  }\n  let result = 1;\n  for (let i = 2; i <= num; i++) {\n    result = result * i;\n  }\n  return result;\n}');
  const [outputCode, setOutputCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [activePreset, setActivePreset] = useState('optimize');
  const [customPrompt, setCustomPrompt] = useState('');

  // UI state
  const [modelId, setModelId] = useState('gemini-2.5-flash');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showSettings, setShowSettings] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'explanation' | 'stats'
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedModified, setCopiedModified] = useState(false);
  const [stats, setStats] = useState(null);

  // Settings inputs
  const [geminiInput, setGeminiInput] = useState(geminiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiKey);

  // Sync API Keys
  useEffect(() => {
    setGeminiInput(geminiKey);
    setOpenaiInput(openaiKey);
  }, [geminiKey, openaiKey]);

  // Monitor theme changes for Diff Viewer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handlePresetChange = (presetId) => {
    setActivePreset(presetId);
  };

  const handleRefactor = async () => {
    if (!inputCode.trim()) {
      toast.error('Please input some code first.');
      return;
    }

    const selectedModel = ALL_MODELS.find(m => m.id === modelId);
    const isSelectedProviderConfigured = selectedModel?.provider === 'google' ? isGeminiConfigured : isOpenaiConfigured;
    if (!isSelectedProviderConfigured) {
      toast.error(`Please configure your ${selectedModel?.provider === 'google' ? 'Gemini' : 'OpenAI'} API Key first.`);
      setShowSettings(true);
      return;
    }

    const preset = PRESETS.find(p => p.id === activePreset);
    const toastId = toast.loading('AI is processing your code...');
    setOutputCode('');
    setExplanation('');

    try {
      const prompt = `Here is the code to process:
\`\`\`
${inputCode}
\`\`\`

${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Remember to return your response strictly using [CODE]...[/CODE] and [EXPLANATION]...[/EXPLANATION] delimiters.`;

      const result = await callAi({
        prompt,
        systemInstruction: preset.systemPrompt,
        modelId
      });

      const responseText = result.text;

      // Extract CODE and EXPLANATION blocks
      const codeRegex = /\[CODE\]([\s\S]*?)\[\/CODE\]/i;
      const explanationRegex = /\[EXPLANATION\]([\s\S]*?)\[\/EXPLANATION\]/i;

      const codeMatch = responseText.match(codeRegex);
      const explanationMatch = responseText.match(explanationRegex);

      let parsedCode = '';
      let parsedExplanation = '';

      if (codeMatch) {
        parsedCode = codeMatch[1].trim();
      } else {
        // Fallback if delimiters were omitted, try code blocks
        const codeBlockRegex = /```[a-zA-Z0-9]*\n([\s\S]*?)\n```/;
        const blockMatch = responseText.match(codeBlockRegex);
        if (blockMatch) {
          parsedCode = blockMatch[1].trim();
        } else {
          parsedCode = responseText;
        }
      }

      if (explanationMatch) {
        parsedExplanation = explanationMatch[1].trim();
      } else {
        // Fallback explanation
        parsedExplanation = responseText.replace(codeRegex, '').replace(explanationRegex, '').replace(/```[\s\S]*?```/g, '').trim();
      }

      setOutputCode(parsedCode);
      setExplanation(parsedExplanation || 'Code refactoring completed. No additional textual comments were provided.');
      setStats({
        latency: result.latency,
        usage: result.usage,
        cost: result.cost
      });
      setActiveTab('diff');
      toast.success('Code updated successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to process code. Try again.', { id: toastId });
    }
  };

  const handleCopy = (isOriginal) => {
    const textToCopy = isOriginal ? inputCode : outputCode;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedModified(true);
      setTimeout(() => setCopiedModified(false), 2000);
    }
    toast.success('Code copied to clipboard!');
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refactored_code.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded refactored code.');
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
      {/* Settings warning bar */}
      {!isGeminiConfigured && !isOpenaiConfigured && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-between gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span><strong>Setup API Keys:</strong> Configure your client API key to run refactorings. Gemini AI Studio keys are free.</span>
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
          <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-xl shadow-sm shrink-0">
            <Code size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">AI Code Playground & Diff Editor</h1>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm">
              Refactor, optimize, debug, translate, or annotate your source snippets with interactive comparative code changes.
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
        {/* Left Control / Code Input Column */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Input Editor Card */}
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex flex-col min-h-[460px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileCode size={16} /> 1. Paste Source Code
              </h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleCopy(true)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors"
                  title="Copy Input"
                >
                  {copiedOriginal ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => setInputCode('')}
                  className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded transition-colors"
                  title="Clear Input"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full flex-1 p-4 bg-background border border-border/80 rounded-xl resize-none font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 custom-scrollbar min-h-[220px] leading-relaxed shadow-inner"
              placeholder="Paste your original code block here..."
              spellCheck="false"
            />

            {/* Presets and options */}
            <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
              {/* Presets Slider */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-2">Select Optimization Task</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-0.5 cursor-pointer ${
                        activePreset === preset.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/80 text-foreground bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-[9px] text-muted-foreground font-normal leading-tight truncate w-full">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Prompt adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">Select Engine</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {ALL_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">Custom Prompts</label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground focus:outline-none placeholder-muted-foreground"
                    placeholder="e.g. 'Use ES6 format', 'Write comments in Spanish'"
                  />
                </div>
              </div>

              <button
                onClick={handleRefactor}
                disabled={loading || !inputCode.trim()}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white disabled:bg-muted/80 disabled:text-muted-foreground font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> Processing Code Changes...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Run Refactoring Engine
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Comparative Column */}
        <div className="lg:col-span-7 w-full flex flex-col min-h-[580px]">
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[520px]">
            {/* Header Tabs */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-border/80 bg-muted/10 shrink-0 flex-wrap gap-3">
              <div className="flex p-1 bg-muted/40 border border-border/50 rounded-xl shadow-inner">
                {[
                  { id: 'diff', label: 'Comparative Diff', icon: ArrowRightLeft },
                  { id: 'explanation', label: 'AI Review & Details', icon: Eye },
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

              {/* Options & Action buttons */}
              {outputCode && (
                <div className="flex items-center gap-2">
                  {activeTab === 'diff' && (
                    <button
                      onClick={() => setSplitView(!splitView)}
                      className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Toggle Split / Unified View"
                    >
                      <SplitSquareHorizontal size={12} />
                      {splitView ? 'Unified' : 'Split View'}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(false)}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    {copiedModified ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    Copy Code
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 bg-muted/30 border border-border/80 text-foreground hover:bg-muted/65 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <FileDown size={12} />
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* Results Screen */}
            <div className="flex-1 overflow-auto custom-scrollbar flex flex-col bg-background/25">
              {!outputCode ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 my-auto opacity-55 animate-pulse">
                  <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground border border-border/40">
                    <Sparkles size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Awaiting Refactoring</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                      Paste your original code on the left, pick your task preset, and trigger the engine. Diffs compile here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DIFF VIEW */}
                  {activeTab === 'diff' && (
                    <div className="flex-1 min-h-[380px] bg-[#0d1117] font-mono text-[11px] rounded-xl overflow-hidden border border-border">
                      <ReactDiffViewer
                        oldValue={inputCode}
                        newValue={outputCode}
                        splitView={splitView}
                        leftTitle="Original Source"
                        rightTitle="Modified Source"
                        useDarkTheme={isDark}
                        styles={{
                          variables: {
                            dark: {
                              diffViewerBackground: '#09090b',
                              diffViewerTitleBackground: '#18181b',
                              diffViewerTitleColor: '#e4e4e7',
                              diffViewerTitleBorderColor: '#27272a',
                              diffViewerColor: '#a1a1aa',
                              addedBackground: '#064e3b',
                              addedColor: '#ecfdf5',
                              removedBackground: '#7f1d1d',
                              removedColor: '#fef2f2',
                              wordAddedBackground: '#059669',
                              wordRemovedBackground: '#dc2626',
                              addedGutterBackground: '#064e3b',
                              removedGutterBackground: '#7f1d1d',
                              gutterBackground: '#09090b',
                              gutterColor: '#52525b',
                              emptyLineBackground: '#09090b',
                            },
                            light: {
                              diffViewerBackground: '#ffffff',
                              diffViewerTitleBackground: '#f4f4f5',
                              diffViewerTitleColor: '#18181b',
                              diffViewerTitleBorderColor: '#e4e4e7',
                              diffViewerColor: '#3f3f46',
                              addedBackground: '#d1fae5',
                              addedColor: '#064e3b',
                              removedBackground: '#fee2e2',
                              removedColor: '#7f1d1d',
                              wordAddedBackground: '#a7f3d0',
                              wordRemovedBackground: '#fca5a5',
                              addedGutterBackground: '#d1fae5',
                              removedGutterBackground: '#fee2e2',
                              gutterBackground: '#ffffff',
                              gutterColor: '#a1a1aa',
                              emptyLineBackground: '#ffffff',
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* EXPLANATION */}
                  {activeTab === 'explanation' && explanation && (
                    <div className="p-5 bg-card border border-border/80 rounded-xl prose dark:prose-invert max-w-full text-sm leading-relaxed custom-markdown-renderer overflow-x-auto">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-black text-primary mt-6 mb-3 border-b border-border/60 pb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2.5 border-b border-border/40 pb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-foreground mt-4 mb-2" {...props} />,
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
                        {explanation}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* METRICS */}
                  {activeTab === 'stats' && stats && (
                    <div className="p-5 bg-card border border-border/80 rounded-xl space-y-4 max-w-[600px] mx-auto w-full">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/80 pb-2">
                        <BarChart2 size={16} /> Performance & Complexity Audit
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Response Latency</div>
                          <div className="text-2xl font-black text-foreground mt-1">{(stats.latency / 1000).toFixed(2)}s</div>
                        </div>
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                          <div className="text-xs text-muted-foreground font-semibold">Execution Cost</div>
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
                        <span>Estimations are generated from character tokens. The target optimizer preset attempts to minimize algorithmic complexity (e.g. reduction in nested loops or memory objects).</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
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

export default AiCodePlayground;
