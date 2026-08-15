import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight, UploadCloud, X, ChevronDown, Zap, Shield, Cpu,
  FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay,
  FolderArchive, Music, Layers, Search, ChevronLeft, ChevronRight, Heart, Pin, Sparkles, Terminal, Activity,
  Lock, CheckCircle2, Sliders, RefreshCw, Key, FileCheck
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

// ─── DATA ───

const SOURCE_FORMATS = [
  { id: "pdf", label: "PDF Document", icon: FileText },
  { id: "image", label: "Image (PNG/JPG)", icon: ImageIcon },
  { id: "spreadsheet", label: "Spreadsheet (XLSX/CSV)", icon: Table2 },
  { id: "document", label: "Word Document (DOCX)", icon: FileSpreadsheet },
  { id: "code", label: "Code & JSON", icon: Code2 },
  { id: "text", label: "Plain Text & MD", icon: Type },
  { id: "presentation", label: "PowerPoint Slides", icon: MonitorPlay },
  { id: "archive", label: "Archive & ZIP", icon: FolderArchive },
  { id: "media", label: "Audio & Media", icon: Music },
];

const OPERATIONS_MAP = {
  pdf: [
    { label: "Compress PDF", result: "Smaller PDF", to: "/tools/pdf-compressor" },
    { label: "Convert to Word (DOCX)", result: "Editable Word Doc", to: "/tools/pdf-to-word" },
    { label: "Convert to Images", result: "PNG / JPG Images", to: "/tools/pdf-converter" },
    { label: "Extract Text", result: "Plain Text", to: "/tools/pdf-to-text" },
    { label: "Merge PDF Files", result: "Combined PDF", to: "/tools/pdf-merge" },
    { label: "Split PDF Pages", result: "Individual PDFs", to: "/tools/pdf-split" },
    { label: "Visual PDF Editor", result: "Edited PDF", to: "/tools/pdf-edit" },
    { label: "Add Watermark", result: "Stamped PDF", to: "/tools/pdf-watermark" },
    { label: "Lock & Encrypt", result: "Secured PDF", to: "/tools/pdf-lock" },
    { label: "Unlock PDF", result: "Open PDF", to: "/tools/pdf-unlock" },
    { label: "Edit Metadata", result: "Clean PDF Properties", to: "/tools/pdf-metadata" },
    { label: "Organize & Reorder", result: "Reordered PDF", to: "/tools/pdf-organizer" },
    { label: "Read Aloud Audio", result: "Voice Stream", to: "/tools/pdf-audio-reader" },
    { label: "AI PDF → Markdown", result: "Markdown Doc", to: "/tools/ai-pdf-to-markdown" },
  ],
  image: [
    { label: "Compress Image", result: "Optimized File", to: "/tools/image-compressor" },
    { label: "Resize Dimensions", result: "Custom Resolution", to: "/tools/image-resizer" },
    { label: "Crop & Rotate", result: "Cropped Image", to: "/tools/image-cropper" },
    { label: "Format Converter", result: "WebP/PNG/JPG", to: "/tools/image-converter" },
    { label: "Add Watermark", result: "Watermarked Image", to: "/tools/image-watermark" },
    { label: "Collage Maker", result: "Photo Collage", to: "/tools/image-collage" },
    { label: "Extract Color Palette", result: "HEX Swatches", to: "/tools/image-color-extractor" },
    { label: "Convert to PDF", result: "PDF Document", to: "/tools/image-to-pdf" },
    { label: "OCR Text Extractor", result: "Extracted Text", to: "/tools/image-to-text" },
    { label: "AI Image → Markdown", result: "Markdown Code", to: "/tools/ai-image-to-markdown" },
  ],
  spreadsheet: [
    { label: "Merge & Split Excel", result: "Processed Sheets", to: "/tools/excel-merge-split" },
    { label: "Formula Assistant", result: "Excel Formula", to: "/tools/formula-helper" },
    { label: "Pivot Table Generator", result: "Pivot View", to: "/tools/pivot-table-builder" },
    { label: "Clean & Format Data", result: "Clean Dataset", to: "/tools/data-cleaner" },
    { label: "SQL on CSV Runner", result: "Query Results", to: "/tools/csv-sql-runner" },
    { label: "Mock Data Generator", result: "Test Dataset", to: "/tools/test-data-generator" },
    { label: "Amortization Calculator", result: "Payment Schedule", to: "/tools/amortization-scheduler" },
  ],
  document: [
    { label: "Convert DOCX to PDF", result: "PDF / Image", to: "/tools/docx-converter" },
    { label: "Document Template Builder", result: "Doc Template", to: "/tools/doc-template-builder" },
    { label: "Strip Document Metadata", result: "Clean Document", to: "/tools/doc-metadata-cleaner" },
    { label: "Grammar & Spell Check", result: "Polished Copy", to: "/tools/grammar-checker" },
    { label: "Compare Document Versions", result: "Similarity Diff", to: "/tools/similarity-checker" },
    { label: "Batch Find & Replace", result: "Modified Archive", to: "/tools/batch-find-replace" },
    { label: "Academic Margin Checker", result: "Compliant Doc", to: "/tools/academic-format-checker" },
    { label: "HTML to Word Exporter", result: "DOCX File", to: "/tools/html-to-docx" },
    { label: "README Generator", result: "Markdown File", to: "/tools/readme-generator" },
    { label: "Citation Formatter", result: "APA/MLA/Chicago", to: "/tools/citation-generator" },
    { label: "Developer Profile Tree", result: "Portfolio Card", to: "/tools/developer-profile" },
  ],
  code: [
    { label: "Format & Beautify JSON", result: "Formatted JSON", to: "/tools/json-formatter" },
    { label: "Interactive Regex Tester", result: "Regex Matches", to: "/tools/regex-tester" },
    { label: "Decode & Inspect JWT", result: "JWT Payload", to: "/tools/jwt-decoder" },
    { label: "UUID / GUID Batch Gen", result: "Batch UUIDs", to: "/tools/uuid-generator" },
    { label: "Cron Expression Parser", result: "Schedule Times", to: "/tools/cron-parser" },
    { label: "Live HTML / CSS Sandbox", result: "Rendered View", to: "/tools/html-previewer" },
    { label: "Code to Beautiful Image", result: "Syntax Card", to: "/tools/code-to-image" },
    { label: "AI Code Optimizer", result: "Refactored Code", to: "/tools/ai-code-playground" },
    { label: "Password Generator", result: "High-Entropy Key", to: "/tools/password-generator" },
    { label: "Cryptographic Hash Gen", result: "SHA256/MD5", to: "/tools/hash-generator" },
    { label: "Color Palette & Contrast", result: "WCAG Checker", to: "/tools/color-picker" },
    { label: "CSS Gradient Generator", result: "CSS Rules", to: "/tools/gradient-generator" },
    { label: "JWT Secret Key Generator", result: "256-bit Secret", to: "/tools/jwt-secret-generator" },
    { label: "Base64 Encoder / Decoder", result: "Converted Text", to: "/tools/base64-converter" },
    { label: "URL Encoder / Decoder", result: "Decoded URL", to: "/tools/url-converter" },
    { label: "Markdown Live Previewer", result: "Rendered HTML", to: "/tools/markdown-previewer" },
    { label: "JSON to TypeScript/Python", result: "Type Definitions", to: "/tools/type-converter" },
    { label: "Google Dork Builder", result: "Search Query", to: "/tools/google-search-builder" },
  ],
  text: [
    { label: "Markdown Editor & Notes", result: "Formatted MD", to: "/tools/markdown-editor" },
    { label: "Text Difference Checker", result: "Side-by-Side Diff", to: "/tools/text-diff" },
    { label: "Word & Character Counter", result: "Text Stats", to: "/tools/word-counter" },
    { label: "Find & Replace Engine", result: "Transformed Text", to: "/tools/find-replace" },
    { label: "Lorem Ipsum Generator", result: "Dummy Copy", to: "/tools/lorem-ipsum" },
    { label: "Case Converter", result: "camelCase/UPPER", to: "/tools/case-converter" },
    { label: "Font & Unicode Styler", result: "Stylized Text", to: "/tools/font-converter" },
    { label: "Line Deduplicator", result: "Sorted Lines", to: "/tools/text-line-editor" },
    { label: "Readability Analyzer", result: "Grade Score", to: "/tools/text-analyzer" },
  ],
  presentation: [
    { label: "Convert PPTX to PDF", result: "PDF Deck", to: "/tools/ppt-to-pdf" },
    { label: "Markdown to Slide Deck", result: "HTML Presentation", to: "/tools/md-to-slides" },
    { label: "Edit PPTX Properties", result: "Clean Presentation", to: "/tools/pptx-metadata-editor" },
    { label: "Interactive HTML Slides", result: "Slide Runner", to: "/tools/html-presentation" },
    { label: "Notes & Prompter Studio", result: "Teleprompter", to: "/tools/pptx-studio" },
  ],
  archive: [
    { label: "Create ZIP Archive", result: "Compressed ZIP", to: "/tools/zip-archiver" },
    { label: "Client Encrypted Vault", result: "Encrypted Locker", to: "/tools/file-vault" },
    { label: "Temporary Local Share", result: "P2P Stream", to: "/tools/temp-share" },
    { label: "Batch File Renamer", result: "Pattern Renamer", to: "/tools/batch-renamer" },
  ],
  media: [
    { label: "Transcribe Audio / Video", result: "Text Transcript", to: "/tools/audio-video-transcriber" },
    { label: "Voice Synthesizer", result: "Speech Audio", to: "/tools/voice-helper" },
    { label: "Read Aloud Audio Stream", result: "Audio Player", to: "/tools/pdf-audio-reader" },
    { label: "EMI Loan Calculator", result: "Monthly Breakdown", to: "/tools/emi-calculator" },
    { label: "SIP & Compound Growth", result: "Wealth Matrix", to: "/tools/sip-calculator" },
    { label: "GST Tax Breakdown", result: "CGST & SGST", to: "/tools/gst-calculator" },
    { label: "Income Tax Regime", result: "Old vs New Regimes", to: "/tools/tax-calculator" },
  ],
};

const CATEGORY_TABS = [
  { id: "pdf", label: "PDF", icon: FileText, count: 14 },
  { id: "image", label: "Image Studio", icon: ImageIcon, count: 10 },
  { id: "code", label: "Developer", icon: Code2, count: 18 },
  { id: "text", label: "Text & Copy", icon: Type, count: 9 },
  { id: "spreadsheet", label: "Sheets", icon: Table2, count: 7 },
  { id: "document", label: "Documents", icon: FileSpreadsheet, count: 11 },
  { id: "presentation", label: "Presentations", icon: MonitorPlay, count: 5 },
  { id: "archive", label: "Files & Vault", icon: FolderArchive, count: 4 },
  { id: "media", label: "Media & Math", icon: Music, count: 7 },
];

const QUICK_SCENARIOS = [
  { label: "Merge 2 PDFs", icon: FileText, ext: "PDF", format: "pdf", op: "/tools/pdf-merge", sampleName: "financial_report_2026.pdf", sampleSize: "2.4 MB" },
  { label: "Compress 4K Image", icon: ImageIcon, ext: "JPG", format: "image", op: "/tools/image-compressor", sampleName: "hero_banner_4k.jpg", sampleSize: "6.8 MB" },
  { label: "Format Messy JSON", icon: Code2, ext: "JSON", format: "code", op: "/tools/json-formatter", sampleName: "api_response_raw.json", sampleSize: "142 KB" },
  { label: "Encrypt Security Vault", icon: Lock, ext: "ZIP", format: "archive", op: "/tools/file-vault", sampleName: "confidential_project.zip", sampleSize: "8.1 MB" },
  { label: "SQL Query on CSV", icon: Table2, ext: "CSV", format: "spreadsheet", op: "/tools/csv-sql-runner", sampleName: "sales_q3_raw.csv", sampleSize: "512 KB" },
];

const EXT_TO_SOURCE = {
  pdf: "pdf",
  png: "image", jpg: "image", jpeg: "image", webp: "image", svg: "image", gif: "image", bmp: "image",
  xlsx: "spreadsheet", xls: "spreadsheet", csv: "spreadsheet",
  docx: "document", doc: "document",
  pptx: "presentation", ppt: "presentation",
  js: "code", jsx: "code", ts: "code", tsx: "code", py: "code", html: "code", css: "code", json: "code",
  zip: "archive", tar: "archive", gz: "archive", rar: "archive",
  mp3: "media", wav: "media", mp4: "media", mkv: "media",
  txt: "text", md: "text",
};

// ─── Custom Dark Dropdown ───
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false, 
  icon: Icon
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full h-11 flex items-center justify-between gap-2 px-3.5 rounded-xl border text-xs font-bold transition-all select-none ${
          disabled
            ? "bg-[#111420]/50 border-[#1e2235] text-slate-500 opacity-60 cursor-not-allowed"
            : open
              ? "bg-[#181b28] border-indigo-500 text-white ring-2 ring-indigo-500/20"
              : "bg-[#141722] border-[#1e2235] text-slate-200 hover:border-[#2f354f] hover:bg-[#181b28] cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className="text-indigo-400 shrink-0" />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </div>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[210px] max-h-[260px] overflow-hidden bg-[#0f1118] border border-[#1e2235] rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {options.length > 5 && (
              <div className="p-2 border-b border-[#1e2235]">
                <input
                  type="text"
                  placeholder="Filter options..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#141722] border border-[#1e2235] text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                    opt.value === value
                      ? "bg-indigo-600/20 text-indigo-400 font-bold"
                      : "text-slate-300 hover:bg-[#181b28] hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <CheckCircle2 size={13} className="text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, toggleFavorite, togglePin } = useAuth();
  
  const [source, setSource] = useState("");
  const [operations, setOperations] = useState([]);
  const [activeOp, setActiveOp] = useState(null);
  const [selectedOpTo, setSelectedOpTo] = useState("");
  const [droppedFile, setDroppedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf");
  const [searchFilter, setSearchFilter] = useState("");
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);

  const fileInputRef = useRef(null);
  const tabsRef = useRef(null);

  // Handle actual file drop or upload
  const handleFileDrop = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const detectedSource = EXT_TO_SOURCE[ext] || "document";

    setDroppedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      ext: ext.toUpperCase(),
      mime: file.type || "application/octet-stream",
      isSample: false,
    });
    setRawFile(file);

    setSource(detectedSource);
    const availableOps = OPERATIONS_MAP[detectedSource] || [];
    setOperations(availableOps);

    if (availableOps.length > 0) {
      setActiveOp(availableOps[0]);
      setSelectedOpTo(availableOps[0].to);
    }
  };

  const handleApplyScenario = (scenario) => {
    setDroppedFile({
      name: scenario.sampleName,
      size: scenario.sampleSize,
      ext: scenario.ext,
      mime: "application/sample-file",
      isSample: true,
    });
    setRawFile(null);
    setSource(scenario.format);
    const availableOps = OPERATIONS_MAP[scenario.format] || [];
    setOperations(availableOps);
    const target = availableOps.find(o => o.to === scenario.op) || availableOps[0];
    if (target) {
      setActiveOp(target);
      setSelectedOpTo(target.to);
    }
  };

  const handleSourceChange = (newSource) => {
    setSource(newSource);
    const availableOps = OPERATIONS_MAP[newSource] || [];
    setOperations(availableOps);
    if (availableOps.length > 0) {
      setActiveOp(availableOps[0]);
      setSelectedOpTo(availableOps[0].to);
    } else {
      setActiveOp(null);
      setSelectedOpTo("");
    }
  };

  const handleOperationChange = (opTo) => {
    setSelectedOpTo(opTo);
    const found = operations.find((o) => o.to === opTo);
    if (found) setActiveOp(found);
  };

  const handleLaunch = () => {
    if (!activeOp) return;
    navigate(activeOp.to, { state: { initialFile: rawFile } });
  };

  const clearFile = (e) => {
    e?.stopPropagation();
    setDroppedFile(null);
    setRawFile(null);
    setSource("");
    setOperations([]);
    setActiveOp(null);
    setSelectedOpTo("");
  };

  const sourceOptions = SOURCE_FORMATS.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  const operationOptions = operations.map((item) => ({
    value: item.to,
    label: item.label,
  }));

  const tabOps = (OPERATIONS_MAP[activeTab] || []).filter(op => 
    searchFilter.trim() === "" ||
    op.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    op.result.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const pinnedResolved = (currentUser?.pinnedTools || [])
    .map((path) => {
      for (const cat of Object.values(OPERATIONS_MAP)) {
        const found = cat.find((op) => op.to === path);
        if (found) return found;
      }
      return null;
    })
    .filter(Boolean);

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#08090d] text-[#f8fafc] pb-24 relative overflow-hidden">
        
        {/* Ambient Top Rim Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-indigo-600/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-cyan-500/10 blur-[130px] pointer-events-none" />

        {/* Global Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#08090d]/90 backdrop-blur-md border-3 border-dashed border-indigo-500 flex flex-col items-center justify-center gap-3"
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
              }}
            >
              <UploadCloud size={56} className="text-indigo-400 animate-bounce" />
              <p className="text-xl font-black text-white">Drop file to stage in Cockpit</p>
              <p className="text-xs text-slate-400">Automatic format detection and suggested tools</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        >
          
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ═══ 1. SPLIT-SCREEN NEXT-GEN HERO & PROCESSING COCKPIT ═══ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-14">
            
            {/* Left Column: Headline & Scenarios */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Privacy Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141722] border border-[#1e2235] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[11px] font-bold text-slate-300 tracking-tight">100% Client-Side Engine • Zero Server Uploads</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Process Files <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
                  Locally & Privately.
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                Daily Utility Hub provides 90+ lightning-fast developer, document, and media tools that execute directly on your device CPU with zero latency.
              </p>

              {/* Interactive Quick Scenario Pills */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                  Try Instant Scenarios:
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {QUICK_SCENARIOS.map((sc) => {
                    const ScIcon = sc.icon;
                    return (
                      <button
                        key={sc.label}
                        onClick={() => handleApplyScenario(sc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141722] hover:bg-[#1c2030] border border-[#1e2235] hover:border-indigo-500/50 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <ScIcon size={13} className="text-indigo-400" />
                        <span>{sc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Telemetry Bar */}
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-white font-bold">90+</span> Tools
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-400" />
                  <span className="text-white font-bold">100%</span> Offline
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <div className="flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" />
                  <span className="text-white font-bold">0.00s</span> Latency
                </div>
              </div>

            </div>

            {/* Right Column: Processing Studio Cockpit */}
            <div className="lg:col-span-6">
              <div className="cockpit-surface rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
                
                {/* Radar Grid Line Animation */}
                <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />
                
                <div className="relative z-10 space-y-5">
                  
                  {/* Cockpit Header */}
                  <div className="flex items-center justify-between border-b border-[#1e2235] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">Interactive Processing Studio</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ENGINE v2.4</span>
                  </div>

                  {/* Drop Canvas */}
                  <AnimatePresence mode="wait">
                    {droppedFile ? (
                      <motion.div
                        key="file-staged"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-2xl bg-[#141722] border border-indigo-500/30 flex items-center justify-between gap-3 shadow-lg"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                            {droppedFile.ext}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white truncate">{droppedFile.name}</p>
                              {droppedFile.isSample && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{droppedFile.size} • {droppedFile.mime}</p>
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1e2235] transition-colors cursor-pointer shrink-0"
                          title="Clear staged file"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative p-6 sm:p-8 rounded-2xl border-2 border-dashed border-[#23273c] hover:border-indigo-500/60 bg-[#141722]/50 hover:bg-[#181b28]/60 transition-all text-center cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#1e2235] text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-bold text-white">Click or drag a file to process</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, Images, Word, Sheets, JSON, Code, ZIP, Audio</p>
                      </div>
                    )}
                  </AnimatePresence>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); e.target.value = ''; }}
                    className="hidden"
                  />

                  {/* Flow Connection Visualizer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5 block">
                        Detected Category
                      </label>
                      <CustomDropdown
                        value={source}
                        onChange={handleSourceChange}
                        options={sourceOptions}
                        placeholder="Select Format"
                        icon={Layers}
                        disabled={true}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5 block">
                        Target Operation
                      </label>
                      <CustomDropdown
                        value={selectedOpTo || (operations[0]?.to || "")}
                        onChange={handleOperationChange}
                        options={operationOptions}
                        placeholder={droppedFile ? "Select Action" : "Waiting for File..."}
                        icon={Zap}
                        disabled={!droppedFile || !source}
                      />
                    </div>
                  </div>

                  {/* Launch Studio Button */}
                  <button
                    onClick={handleLaunch}
                    disabled={!droppedFile || !activeOp}
                    className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                      !droppedFile || !activeOp
                        ? "bg-[#181b28] text-slate-500 border border-[#1e2235] cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.98]"
                    }`}
                  >
                    <span>Launch Utility Studio</span>
                    <ArrowRight size={16} />
                  </button>

                </div>
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ═══ 2. BENTO STUDIO HIGHLIGHTS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Studio Spotlights</h2>
                <p className="text-xs text-slate-400 mt-0.5">Quickly jump into dedicated client-side utility engines</p>
              </div>
              <Link to="/search" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View all 90+ tools <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Bento 1: PDF Studio */}
              <div className="card-elevated p-5 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Smart PDF Suite</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Merge, split, compress, watermark, and lock PDF files right in your browser.
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-[#1e2235] flex items-center justify-between text-xs font-semibold text-rose-400">
                  <Link to="/tools/pdf-merge" className="hover:underline">Quick Merge</Link>
                  <Link to="/tools/pdf-compressor" className="hover:underline">Compress</Link>
                </div>
              </div>

              {/* Bento 2: Image Lab */}
              <div className="card-elevated p-5 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <ImageIcon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Image Studio</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Convert WebP/PNG/JPG, extract palettes, crop, and compress with zero quality loss.
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-[#1e2235] flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <Link to="/tools/image-converter" className="hover:underline">Converter</Link>
                  <Link to="/tools/image-color-extractor" className="hover:underline">Palettes</Link>
                </div>
              </div>

              {/* Bento 3: Dev Sandbox */}
              <div className="card-elevated p-5 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Code2 size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Developer Sandboxes</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Format JSON, decode JWT, test regex expressions, generate UUIDs and cryptographic hashes.
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-[#1e2235] flex items-center justify-between text-xs font-semibold text-indigo-400">
                  <Link to="/tools/json-formatter" className="hover:underline">JSON</Link>
                  <Link to="/tools/jwt-decoder" className="hover:underline">JWT</Link>
                </div>
              </div>

              {/* Bento 4: Security Vault */}
              <div className="card-elevated p-5 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Security & Vault</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Client-side AES file encryption, high-entropy password generation, and secret vaults.
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-[#1e2235] flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <Link to="/tools/file-vault" className="hover:underline">Vault</Link>
                  <Link to="/tools/password-generator" className="hover:underline">Pass Gen</Link>
                </div>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ═══ 3. PINNED WORKSPACES ACCORDION ═══ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentUser && pinnedResolved.length > 0 && (
            <div className="mb-12">
              <button
                onClick={() => setIsPinnedOpen(!isPinnedOpen)}
                className="w-full px-5 py-3 rounded-2xl bg-[#0f1118] border border-[#1e2235] hover:border-indigo-500/40 flex items-center justify-between transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                    <Pin size={15} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Pinned Workspaces</h3>
                    <p className="text-[10px] text-slate-400">{pinnedResolved.length} tools pinned for rapid access</p>
                  </div>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isPinnedOpen ? "rotate-180 text-indigo-400" : ""}`} />
              </button>

              <AnimatePresence>
                {isPinnedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {pinnedResolved.map((tool) => (
                        <div key={tool.to} className="card-elevated p-3.5 flex items-center justify-between gap-3">
                          <Link to={tool.to} className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#141722] text-indigo-400 flex items-center justify-center shrink-0">
                              <Zap size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{tool.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{tool.result}</p>
                            </div>
                          </Link>
                          <button
                            onClick={() => togglePin(tool.to)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#181b28] transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ═══ 4. COMPLETE ALL-TOOLS MATRIX & CATEGORY TABS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            
            {/* Category Navigation & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#1e2235] pb-5">
              
              {/* Category Pills Slider */}
              <div 
                ref={tabsRef}
                className="overflow-x-auto hide-scrollbar flex items-center gap-1.5 flex-nowrap py-1 scroll-smooth"
              >
                {CATEGORY_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 select-none ${
                        isActive
                          ? "text-white bg-indigo-600 shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-white bg-[#141722] hover:bg-[#181b28] border border-[#1e2235]"
                      }`}
                    >
                      <TabIcon size={14} />
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#1e2235] text-slate-400"}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Filter Search */}
              <div className="w-full md:w-64 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141722] border border-[#1e2235] focus-within:border-indigo-500 transition-colors">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter current tab..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchFilter && (
                    <button onClick={() => setSearchFilter("")} className="text-slate-400 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Operations Tool Matrix Cards Grid */}
            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + searchFilter}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
                >
                  {tabOps.length > 0 ? (
                    tabOps.map((op, i) => (
                      <motion.div
                        key={op.to}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
                        className="group relative flex items-center justify-between p-3.5 bg-[#0f1118] border border-[#1e2235] hover:border-indigo-500/50 hover:bg-[#141722] transition-all rounded-2xl shadow-md overflow-hidden"
                      >
                        <Link
                          to={op.to}
                          className="flex-1 flex items-center gap-3 min-w-0 pr-2"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#141722] group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 flex items-center justify-center transition-colors shrink-0 shadow-xs">
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                              {op.label}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {op.result}
                            </p>
                          </div>
                        </Link>

                        {/* Favorite & Pin Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (!currentUser) {
                                toast.error("Please sign in to save favorites");
                              } else {
                                toggleFavorite(op.to);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.favoriteTools?.includes(op.to)
                                ? "text-rose-400 bg-rose-500/15"
                                : "text-slate-500 hover:text-rose-400 hover:bg-[#181b28]"
                            }`}
                            title="Save to favorites"
                          >
                            <Heart size={13} fill={currentUser?.favoriteTools?.includes(op.to) ? "currentColor" : "none"} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (!currentUser) {
                                toast.error("Please sign in to pin tools");
                              } else {
                                togglePin(op.to);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.pinnedTools?.includes(op.to)
                                ? "text-indigo-400 bg-indigo-500/15"
                                : "text-slate-500 hover:text-indigo-400 hover:bg-[#181b28]"
                            }`}
                            title="Pin to workspace"
                          >
                            <Pin size={13} fill={currentUser?.pinnedTools?.includes(op.to) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                      No tools found matching your filter in this category.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
