import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight, UploadCloud, X, FileCheck, ChevronDown, Zap, Shield, Cpu,
  FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay,
  FolderArchive, Music, Layers
} from "lucide-react";
import PageTransition from "../components/PageTransition";

// ─── DATA ───

const SOURCE_FORMATS = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "spreadsheet", label: "Spreadsheet", icon: Table2 },
  { id: "document", label: "Word Doc", icon: FileSpreadsheet },
  { id: "code", label: "Code", icon: Code2 },
  { id: "text", label: "Text", icon: Type },
  { id: "presentation", label: "Slides", icon: MonitorPlay },
  { id: "archive", label: "Archive", icon: FolderArchive },
  { id: "media", label: "Audio / Video", icon: Music },
];

const OPERATIONS_MAP = {
  pdf: [
    { label: "Compress", result: "Smaller PDF", to: "/tools/pdf-compressor" },
    { label: "Convert to Word / Image", result: "Word / Image", to: "/tools/pdf-converter" },
    { label: "Extract Text", result: "Plain Text", to: "/tools/pdf-to-text" },
    { label: "Merge Files", result: "Combined PDF", to: "/tools/pdf-merge" },
    { label: "Split Pages", result: "Individual PDFs", to: "/tools/pdf-split" },
    { label: "Edit Content", result: "Edited PDF", to: "/tools/pdf-edit" },
    { label: "Add Watermark", result: "Stamped PDF", to: "/tools/pdf-watermark" },
    { label: "Lock & Encrypt", result: "Secured PDF", to: "/tools/pdf-lock" },
    { label: "Unlock", result: "Open PDF", to: "/tools/pdf-unlock" },
    { label: "Read Aloud", result: "Audio Stream", to: "/tools/pdf-audio-reader" },
    { label: "AI → Markdown", result: "Markdown Doc", to: "/tools/ai-pdf-to-markdown" },
  ],
  image: [
    { label: "Compress", result: "Optimized Image", to: "/tools/image-compressor" },
    { label: "Resize", result: "Resized Image", to: "/tools/image-resizer" },
    { label: "Crop", result: "Cropped Image", to: "/tools/image-cropper" },
    { label: "Convert Format", result: "Converted File", to: "/tools/image-converter" },
    { label: "Add Watermark", result: "Watermarked", to: "/tools/image-watermark" },
    { label: "Make Collage", result: "Photo Collage", to: "/tools/image-collage" },
    { label: "Extract Colors", result: "Color Palette", to: "/tools/image-color-extractor" },
    { label: "Convert to PDF", result: "PDF Document", to: "/tools/image-to-pdf" },
    { label: "OCR Text", result: "Extracted Text", to: "/tools/image-to-text" },
    { label: "AI → Markdown", result: "Markdown Doc", to: "/tools/ai-image-to-markdown" },
  ],
  spreadsheet: [
    { label: "Merge / Split", result: "Processed Sheets", to: "/tools/excel-merge-split" },
    { label: "Formula Helper", result: "Generated Formula", to: "/tools/formula-helper" },
    { label: "Pivot Table", result: "Pivot View", to: "/tools/pivot-table-builder" },
    { label: "Clean Data", result: "Clean File", to: "/tools/sheet-cleaner" },
  ],
  document: [
    { label: "Convert to PDF / Image", result: "PDF / Image", to: "/tools/docx-converter" },
    { label: "Build Template", result: "Doc Template", to: "/tools/doc-template-builder" },
    { label: "Strip Metadata", result: "Clean Document", to: "/tools/doc-metadata-cleaner" },
  ],
  code: [
    { label: "Format JSON", result: "Pretty JSON", to: "/tools/json-formatter" },
    { label: "Test Regex", result: "Regex Matches", to: "/tools/regex-tester" },
    { label: "Decode JWT", result: "JWT Payload", to: "/tools/jwt-decoder" },
    { label: "Generate UUID", result: "UUID Batch", to: "/tools/uuid-generator" },
    { label: "Parse Cron", result: "Cron Schedule", to: "/tools/cron-parser" },
    { label: "Preview HTML", result: "Rendered Page", to: "/tools/html-previewer" },
    { label: "Code → Image", result: "Code Screenshot", to: "/tools/code-to-image" },
    { label: "AI Optimize", result: "Refactored Code", to: "/tools/ai-code-playground" },
  ],
  text: [
    { label: "Edit Markdown", result: "Formatted MD", to: "/tools/markdown-editor" },
    { label: "Compare Diff", result: "Diff Report", to: "/tools/text-diff" },
    { label: "Count Words", result: "Word Stats", to: "/tools/word-counter" },
    { label: "Find & Replace", result: "Modified Text", to: "/tools/find-and-replace" },
    { label: "Generate Lorem", result: "Placeholder Text", to: "/tools/lorem-ipsum" },
    { label: "Change Case", result: "Cased Text", to: "/tools/case-converter" },
  ],
  presentation: [
    { label: "Convert to PDF", result: "PDF Slides", to: "/tools/ppt-to-pdf" },
    { label: "MD → Slides", result: "Slide Deck", to: "/tools/md-to-slides" },
    { label: "Edit Metadata", result: "Clean PPTX", to: "/tools/pptx-metadata-editor" },
  ],
  archive: [
    { label: "Create Archive", result: "ZIP File", to: "/tools/zip-archiver" },
    { label: "Encrypt Vault", result: "Secured Vault", to: "/tools/file-vault" },
    { label: "Temp Share", result: "Share Link", to: "/tools/temp-share" },
    { label: "Batch Rename", result: "Renamed Files", to: "/tools/batch-renamer" },
  ],
  media: [
    { label: "Transcribe", result: "Text Transcript", to: "/tools/audio-video-transcriber" },
    { label: "Voice Helper", result: "Voice Output", to: "/tools/voice-helper" },
    { label: "Read Aloud", result: "Audio Stream", to: "/tools/pdf-audio-reader" },
  ],
};

const CATEGORY_TABS = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "code", label: "Developer", icon: Code2 },
  { id: "text", label: "Text", icon: Type },
  { id: "spreadsheet", label: "Sheets", icon: Table2 },
  { id: "document", label: "Docs", icon: FileSpreadsheet },
  { id: "presentation", label: "Slides", icon: MonitorPlay },
  { id: "archive", label: "Files", icon: FolderArchive },
  { id: "media", label: "Media", icon: Music },
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

// ─── Custom Dropdown Component ───
const CustomDropdown = ({ value, onChange, options, placeholder, disabled = false, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full h-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`w-full h-full flex items-center gap-2 px-3 sm:px-4 text-left cursor-pointer transition-colors ${
          disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#ffffff06]"
        }`}
      >
        {Icon && <Icon size={13} className="text-[#5a5a6a] shrink-0" />}
        <span className={`text-xs font-bold truncate ${selected ? "text-white" : "text-[#5a5a6a]"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={11} className={`ml-auto text-[#5a5a6a] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[180px] max-h-[240px] overflow-y-auto bg-[#1a1a22] border border-[#2a2a35] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[200] py-1 custom-scrollbar"
          >
            {options.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                    opt.value === value
                      ? "bg-[#7C5CFC]/10 text-[#7C5CFC]"
                      : "text-[#b0b0bc] hover:bg-[#ffffff08] hover:text-white"
                  }`}
                >
                  {OptIcon && <OptIcon size={13} className="shrink-0 opacity-60" />}
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <svg className="w-3 h-3 ml-auto text-[#7C5CFC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Animated Counter ───
const AnimatedCounter = ({ end, suffix = "" }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(end / 40));
    const interval = 1200 / (end / step);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, interval);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{count}{suffix}</span>;
};

// ─── Interactive Hub Graphic ───
const InteractiveHubGraphic = () => {
  const fileTypes = [
    { label: "PDF", color: "from-red-500 to-rose-600", x: -95, y: -45, delay: 0 },
    { label: "PNG", color: "from-emerald-400 to-teal-500", x: 95, y: -45, delay: 1 },
    { label: "JSON", color: "from-amber-400 to-orange-500", x: -95, y: 45, delay: 2 },
    { label: "ZIP", color: "from-blue-500 to-indigo-600", x: 95, y: 45, delay: 3 },
  ];

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center overflow-hidden">
      <div className="absolute w-[180px] h-[180px] rounded-full bg-[#7C5CFC]/10 blur-[60px]" />
      <div className="absolute w-[240px] h-[240px] rounded-full border border-[#222230]/40 border-dashed animate-[spin_40s_linear_infinite]" />
      <div className="absolute w-[160px] h-[160px] rounded-full border border-[#222230]/60 animate-[spin_25s_linear_infinite_reverse]" />
      <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-[#7C5CFC] to-[#A78BFA] p-[1.5px] shadow-[0_0_30px_rgba(124,92,252,0.3)]">
        <div className="w-full h-full rounded-2xl bg-[#0b0b0f] flex items-center justify-center">
          <Cpu className="text-[#7C5CFC] animate-pulse" size={24} />
        </div>
      </div>
      {fileTypes.map((type) => (
        <motion.div
          key={type.label}
          className="absolute z-20"
          style={{ x: type.x, y: type.y }}
          animate={{
            y: [type.y - 4, type.y + 4, type.y - 4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: type.delay,
          }}
        >
          <div className="px-3 py-1.5 rounded-lg bg-[#141419]/90 border border-[#222230] hover:border-[#7C5CFC]/50 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.4)] flex items-center gap-1.5 cursor-default group">
            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${type.color}`} />
            <span className="text-[10px] font-black text-white group-hover:text-[#A78BFA] transition-colors">{type.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [source, setSource] = useState("");
  const [operationIdx, setOperationIdx] = useState(0);
  const [droppedFile, setDroppedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf");

  const operations = source ? (OPERATIONS_MAP[source] || []) : [];
  const activeOp = operations[operationIdx] || null;
  const tabOps = OPERATIONS_MAP[activeTab] || [];

  const handleSourceChange = (val) => { setSource(val); setOperationIdx(0); };
  const handleLaunch = () => { if (activeOp) navigate(activeOp.to); };

  const handleFileDrop = useCallback((file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const mapped = EXT_TO_SOURCE[ext] || "";
    setDroppedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB", ext: ext.toUpperCase() });
    if (mapped) { setSource(mapped); setOperationIdx(0); }
  }, []);

  const clearFile = () => { setDroppedFile(null); setSource(""); };

  const sourceOptions = SOURCE_FORMATS.map((item) => ({
    value: item.id,
    label: item.label,
    icon: item.icon,
  }));

  const operationOptions = operations.map((item, idx) => ({
    value: idx,
    label: item.label,
    icon: Zap,
  }));

  return (
    <PageTransition>
      <style>{`
        @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes flow-pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .gradient-text { background: linear-gradient(135deg, #7C5CFC, #A78BFA, #7C5CFC); background-size: 200% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-shift 4s ease infinite; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="w-full min-h-screen">

        <section
          className="w-full bg-[#0b0b0f] relative overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault(); setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(124,92,252,0.07),transparent_70%)] pointer-events-none" />

          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#0b0b0f]/90 border-2 border-dashed border-[#7C5CFC] flex flex-col items-center justify-center gap-3 pointer-events-none"
              >
                <UploadCloud size={36} className="text-[#7C5CFC] animate-bounce" />
                <p className="text-sm font-bold text-white">Drop your file anywhere</p>
                <p className="text-[11px] text-[#5a5a6a]">We'll auto-detect the format</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-14 md:pb-16">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 lg:mb-12">
              
              <div className="lg:col-span-7 text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-black tracking-tight text-white leading-[1.1] mb-4"
                >
                  What do you want to
                  <span className="gradient-text"> process</span>
                  <span className="text-white">?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-[#6a6a7a] text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto lg:mx-0 leading-relaxed mb-6"
                >
                  Supercharge your files. Daily Utility Hub offers over 90+ utilities to convert, compress, and edit documents locally in your browser.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 md:gap-8"
                >
                  {[
                    { icon: Zap, value: 90, suffix: "+", label: "Tools" },
                    { icon: Shield, value: 100, suffix: "%", label: "Local" },
                    { icon: Cpu, value: 0, suffix: "", label: "Server Uploads", display: "Zero" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[#4a4a5a]">
                      <stat.icon size={12} className="text-[#3a3a48] shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black text-[#6a6a7a]">
                        {stat.display || <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium">{stat.label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="lg:col-span-5 hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <InteractiveHubGraphic />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="relative mb-8 rounded-2xl p-[1px]"
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,#7C5CFC,#A78BFA,#3b82f6,#7C5CFC)] animate-[spin_4s_linear_infinite]" />
              </div>

              <div className="relative z-10 rounded-[calc(1rem-1px)] bg-[#141419]/95 backdrop-blur-xl p-4 sm:p-5 flex flex-col">
                <div className="w-full">
                  {/* Desktop/Tablet Flow (visible format & operation at all times) */}
                  <div className="hidden sm:flex items-center justify-between gap-4">
                    {/* Source File Badge / Selector */}
                    {droppedFile ? (
                      <div className="flex items-center gap-2.5 bg-[#1a1a22] border border-[#222230] px-3.5 py-2 rounded-xl min-w-[200px] max-w-[260px] h-[44px]">
                        <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] font-black text-[10px] shrink-0">
                          {droppedFile.ext}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{droppedFile.name}</p>
                          <p className="text-[10px] text-[#5a5a6a]">{droppedFile.size}</p>
                        </div>
                        <button onClick={clearFile} className="p-1 text-[#5a5a6a] hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3.5 py-2 bg-[#1a1a22]/50 hover:bg-[#1a1a22] border border-dashed border-[#222230] hover:border-[#7C5CFC]/30 text-[#b0b0bc] hover:text-white rounded-xl transition-all cursor-pointer min-w-[200px] max-w-[260px] h-[44px] group"
                      >
                        <UploadCloud size={14} className="text-[#7C5CFC]/80 group-hover:text-[#7C5CFC] shrink-0" />
                        <span className="text-xs font-bold truncate">Select or drop file</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); e.target.value = ''; }}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Animated Connector Line */}
                    <div className="flex-1 flex items-center justify-center relative min-w-[40px]">
                      <div className="w-full h-[1px] bg-gradient-to-r from-[#7C5CFC]/20 via-[#7C5CFC]/80 to-[#7C5CFC]/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-white to-transparent animate-[flow-pulse_1.5s_ease-in-out_infinite]" />
                      </div>
                      <div className="absolute w-5 h-5 rounded-full bg-[#1a1a22] border border-[#222230] flex items-center justify-center shadow-lg">
                        <ArrowRight size={10} className="text-[#7C5CFC]" />
                      </div>
                    </div>

                    {/* Target Selectors */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-[140px] md:w-[155px]">
                        <CustomDropdown value={source} onChange={handleSourceChange} options={sourceOptions} placeholder="Format" icon={Layers} />
                      </div>
                      <div className="w-[150px] md:w-[170px]">
                        <CustomDropdown value={operationIdx} onChange={(val) => setOperationIdx(val)} options={operationOptions} placeholder="Operation" disabled={!source} icon={Zap} />
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      onClick={handleLaunch}
                      disabled={!activeOp}
                      className="px-5 py-2 bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white text-xs font-black transition-all disabled:bg-[#1a1a22] disabled:text-[#3a3a48] disabled:cursor-not-allowed cursor-pointer shrink-0 rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(124,92,252,0.15)] hover:shadow-[0_0_20px_rgba(124,92,252,0.3)]"
                    >
                      Launch <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Mobile Flow (stacked) */}
                  <div className="flex sm:hidden flex-col gap-3">
                    {droppedFile ? (
                      <div className="flex items-center gap-2.5 bg-[#1a1a22] border border-[#222230] px-3.5 py-2.5 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] font-black text-xs shrink-0">
                          {droppedFile.ext}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{droppedFile.name}</p>
                          <p className="text-[10px] text-[#5a5a6a]">{droppedFile.size}</p>
                        </div>
                        <button onClick={clearFile} className="p-1 text-[#5a5a6a] hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-3 bg-[#1a1a22]/50 border border-dashed border-[#222230] text-[#b0b0bc] rounded-xl transition-all cursor-pointer group"
                      >
                        <UploadCloud size={14} className="text-[#7C5CFC] shrink-0" />
                        <span className="text-xs font-bold">Select or drop file</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); e.target.value = ''; }}
                          className="hidden"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <CustomDropdown value={source} onChange={handleSourceChange} options={sourceOptions} placeholder="Format" icon={Layers} />
                      <CustomDropdown value={operationIdx} onChange={(val) => setOperationIdx(val)} options={operationOptions} placeholder="Operation" disabled={!source} icon={Zap} />
                    </div>

                    <button
                      onClick={handleLaunch}
                      disabled={!activeOp}
                      className="w-full py-3 bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white text-xs font-black transition-all disabled:bg-[#1a1a22] disabled:text-[#3a3a48] disabled:cursor-not-allowed cursor-pointer rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,92,252,0.15)]"
                    >
                      Launch <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══ CATEGORY TABS ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <h2 className="text-[10px] sm:text-xs font-black text-[#5a5a6a] uppercase tracking-widest text-center mb-4 sm:mb-5">
                Browse by category
              </h2>

              {/* Tabs — horizontally scrollable on mobile */}
              <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-6">
                <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
                  {CATEGORY_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          activeTab === tab.id
                            ? "text-white"
                            : "text-[#5a5a6a] hover:text-[#8a8a9a] hover:bg-[#ffffff04]"
                        }`}
                      >
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 rounded-lg sm:rounded-xl"
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          />
                        )}
                        <TabIcon size={13} className="relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operations grid */}
              <div className="min-h-[120px] sm:min-h-[140px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                  >
                    {tabOps.map((op, i) => (
                      <motion.div
                        key={op.to}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                      >
                        <Link
                          to={op.to}
                          className="group flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[#141419] border border-[#1e1e28] hover:border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/5 transition-all"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1e1e28] group-hover:bg-[#7C5CFC]/10 flex items-center justify-center transition-colors shrink-0">
                            <ArrowRight size={11} className="text-[#5a5a6a] group-hover:text-[#7C5CFC] transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs font-bold text-[#c0c0cc] group-hover:text-white transition-colors truncate">{op.label}</p>
                            <p className="text-[9px] text-[#4a4a5a] group-hover:text-[#6a6a7a] transition-colors truncate">{op.result}</p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ POPULAR — Light/dark themed section ═══ */}
        <section className="w-full bg-background py-10 sm:py-12 md:py-16">
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight mb-5 sm:mb-6">
              Popular operations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
              {[
                { label: "Compress PDF", to: "/tools/pdf-compressor" },
                { label: "Merge PDF", to: "/tools/pdf-merge" },
                { label: "PDF to Text", to: "/tools/pdf-to-text" },
                { label: "Edit PDF", to: "/tools/pdf-edit" },
                { label: "Compress Image", to: "/tools/image-compressor" },
                { label: "Resize Image", to: "/tools/image-resizer" },
                { label: "Image to PDF", to: "/tools/image-to-pdf" },
                { label: "Extract Colors", to: "/tools/image-color-extractor" },
                { label: "JSON Formatter", to: "/tools/json-formatter" },
                { label: "Regex Tester", to: "/tools/regex-tester" },
                { label: "JWT Decoder", to: "/tools/jwt-decoder" },
                { label: "UUID Generator", to: "/tools/uuid-generator" },
                { label: "Markdown Editor", to: "/tools/markdown-editor" },
                { label: "Text Diff", to: "/tools/text-diff" },
                { label: "Password Generator", to: "/tools/password-generator" },
                { label: "Code to Image", to: "/tools/code-to-image" },
                { label: "Hash Generator", to: "/tools/hash-generator" },
                { label: "File Vault", to: "/tools/file-vault" },
                { label: "Word Counter", to: "/tools/word-counter" },
                { label: "Cron Parser", to: "/tools/cron-parser" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[11px] sm:text-xs text-muted-foreground hover:text-primary font-medium transition-colors relative group/lnk inline-block"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover/lnk:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
