import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight, UploadCloud, X, ChevronDown, Zap, Shield, Cpu,
  FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay,
  FolderArchive, Music, Layers, Search, ChevronLeft, ChevronRight, Heart, Pin, Sparkles
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

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
    { label: "Convert to Word (DOCX)", result: "Editable Word Doc", to: "/tools/pdf-to-word" },
    { label: "Convert to Images", result: "PNG / JPG Images", to: "/tools/pdf-converter" },
    { label: "Extract Text", result: "Plain Text", to: "/tools/pdf-to-text" },
    { label: "Merge Files", result: "Combined PDF", to: "/tools/pdf-merge" },
    { label: "Split Pages", result: "Individual PDFs", to: "/tools/pdf-split" },
    { label: "Edit Content", result: "Edited PDF", to: "/tools/pdf-edit" },
    { label: "Add Watermark", result: "Stamped PDF", to: "/tools/pdf-watermark" },
    { label: "Lock & Encrypt", result: "Secured PDF", to: "/tools/pdf-lock" },
    { label: "Unlock", result: "Open PDF", to: "/tools/pdf-unlock" },
    { label: "Edit Metadata", result: "Clean PDF Properties", to: "/tools/pdf-metadata" },
    { label: "Organize PDF", result: "Visual Reorder", to: "/tools/pdf-organizer" },
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
    { label: "Clean Data", result: "Clean File", to: "/tools/data-cleaner" },
    { label: "SQL Query Runner", result: "SQL on Sheets", to: "/tools/csv-sql-runner" },
    { label: "Mock Data Gen", result: "Test Dataset", to: "/tools/test-data-generator" },
    { label: "Amortization", result: "Compounding Plan", to: "/tools/amortization-scheduler" },
  ],
  document: [
    { label: "Convert to PDF / Image", result: "PDF / Image", to: "/tools/docx-converter" },
    { label: "Build Template", result: "Doc Template", to: "/tools/doc-template-builder" },
    { label: "Strip Metadata", result: "Clean Document", to: "/tools/doc-metadata-cleaner" },
    { label: "Grammar Checker", result: "Spelling Correction", to: "/tools/grammar-checker" },
    { label: "Compare Versions", result: "Similarity Score", to: "/tools/similarity-checker" },
    { label: "Batch Find/Replace", result: "Multi-File Zip", to: "/tools/batch-find-replace" },
    { label: "Layout Checker", result: "Academic Margins", to: "/tools/academic-format-checker" },
    { label: "HTML to Word", result: "DOCX Export", to: "/tools/html-to-docx" },
    { label: "README Gen", result: "Markdown File", to: "/tools/readme-generator" },
    { label: "Citation Gen", result: "APA/MLA/Chicago", to: "/tools/citation-generator" },
    { label: "Dev Link Tree", result: "Portfolio Card", to: "/tools/developer-profile" },
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
    { label: "Generate Password", result: "Secure Password", to: "/tools/password-generator" },
    { label: "Hash Generator", result: "MD5/SHA/HMAC", to: "/tools/hash-generator" },
    { label: "Color Picker", result: "Contrast / Palette", to: "/tools/color-picker" },
    { label: "Gradient Gen", result: "CSS Gradients", to: "/tools/gradient-generator" },
    { label: "JWT Secret Gen", result: "Secure Secrets", to: "/tools/jwt-secret-generator" },
    { label: "Base64 Converter", result: "Encode / Decode", to: "/tools/base64-converter" },
    { label: "URL Converter", result: "Encode / Decode", to: "/tools/url-converter" },
    { label: "Markdown Preview", result: "Compiled HTML", to: "/tools/markdown-previewer" },
    { label: "JSON Type Convert", result: "TypeScript/Python", to: "/tools/type-converter" },
    { label: "Google Dork Builder", result: "Search Queries", to: "/tools/google-search-builder" },
    { label: "AI Image → MD", result: "Markdown Code", to: "/tools/ai-image-to-markdown" },
  ],
  text: [
    { label: "Edit Markdown", result: "Formatted MD", to: "/tools/markdown-editor" },
    { label: "Compare Diff", result: "Diff Report", to: "/tools/text-diff" },
    { label: "Count Words", result: "Word Stats", to: "/tools/word-counter" },
    { label: "Find & Replace", result: "Modified Text", to: "/tools/find-replace" },
    { label: "Generate Lorem", result: "Placeholder Text", to: "/tools/lorem-ipsum" },
    { label: "Change Case", result: "Cased Text", to: "/tools/case-converter" },
    { label: "Font Converter", result: "Stylish Fonts", to: "/tools/font-converter" },
    { label: "Line Editor", result: "Deduplicated List", to: "/tools/text-line-editor" },
    { label: "Analyze Text", result: "Readability Stats", to: "/tools/text-analyzer" },
  ],
  presentation: [
    { label: "Convert to PDF", result: "PDF Slides", to: "/tools/ppt-to-pdf" },
    { label: "MD → Slides", result: "Slide Deck", to: "/tools/md-to-slides" },
    { label: "Edit Metadata", result: "Clean PPTX", to: "/tools/pptx-metadata-editor" },
    { label: "HTML Slides Sandbox", result: "Code Slides", to: "/tools/html-presentation" },
    { label: "Notes Prompter", result: "Paced Prompter", to: "/tools/pptx-studio" },
    { label: "Theme Swatches", result: "Projector Colors", to: "/tools/pptx-studio" },
    { label: "Voice Remote", result: "Voice Nav Control", to: "/tools/pptx-studio" },
    { label: "Slide Whiteboard", result: "Sketch Drafts", to: "/tools/pptx-studio" },
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
    { label: "EMI Calculator", result: "Monthly Installment", to: "/tools/emi-calculator" },
    { label: "SIP Calculator", result: "Compound Growth", to: "/tools/sip-calculator" },
    { label: "GST Calculator", result: "Tax Split SGST/CGST", to: "/tools/gst-calculator" },
    { label: "Income Tax", result: "Old vs New Regimes", to: "/tools/tax-calculator" },
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
  { id: "media", label: "Media & Finance", icon: Music },
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

// ─── Custom Light Dropdown Component ───
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false, 
  icon: Icon,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  highlightedValue
}) => {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setLocalOpen;
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef(null);
  
  const [isFlashing, setIsFlashing] = useState(false);
  const [isPop, setIsPop] = useState(false);
  const prevValue = useRef(value);
  const prevDisabled = useRef(disabled);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (value !== prevValue.current && value !== undefined && value !== "") {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 800);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value]);

  useEffect(() => {
    if (prevDisabled.current && !disabled) {
      setIsPop(true);
      const timer = setTimeout(() => setIsPop(false), 500);
      return () => clearTimeout(timer);
    }
    prevDisabled.current = disabled;
  }, [disabled]);

  const selected = options.find((o) => o.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full h-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`w-full h-11 flex items-center gap-2.5 px-3.5 sm:px-4 text-left rounded-xl border transition-all select-none ${
          isFlashing ? "animate-flash-glow" : ""
        } ${
          isPop ? "animate-scale-pop" : ""
        } ${
          open 
            ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs" 
            : "border-slate-200 bg-white"
        } ${
          disabled 
            ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50/70 pointer-events-none text-slate-400" 
            : "cursor-pointer hover:border-blue-400 hover:bg-slate-50/80 active:scale-[0.98] text-slate-800 shadow-2xs"
        }`}
      >
        {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
        <span className="text-xs font-bold truncate flex-1 block overflow-hidden h-4 relative">
          <AnimatePresence mode="wait">
            <motion.span
              key={selected ? selected.label : placeholder}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute inset-y-0 left-0 truncate w-full flex items-center ${selected ? "text-slate-900" : "text-slate-400"}`}
            >
              {selected ? selected.label : placeholder}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDown size={13} className={`ml-auto text-slate-400 shrink-0 transition-transform ${open ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[200px] max-h-[260px] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-[200] flex flex-col"
          >
            {options.length > 5 && (
              <div className="px-2 py-2 border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                  <Search size={12} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-[11px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <motion.div 
              variants={{
                visible: { transition: { staggerChildren: 0.02 } },
                hidden: {}
              }}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto custom-scrollbar py-1"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        (opt.value === value || opt.value === highlightedValue || opt.label === highlightedValue)
                          ? "bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-600"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {OptIcon && <OptIcon size={14} className="shrink-0 opacity-60" />}
                      <span className="truncate">{opt.label}</span>
                      {opt.value === value && (
                        <svg className="w-3.5 h-3.5 ml-auto text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3.5 py-4 text-center text-xs text-slate-400">
                  No matching options
                </div>
              )}
            </motion.div>
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

// ─── Interactive Hub Graphic in Light Theme ───
const InteractiveHubGraphic = () => {
  const fileTypes = [
    { label: "PDF", color: "from-rose-500 to-red-600", x: -95, y: -45, delay: 0 },
    { label: "PNG", color: "from-emerald-400 to-teal-500", x: 95, y: -45, delay: 1 },
    { label: "JSON", color: "from-amber-400 to-orange-500", x: -95, y: 45, delay: 2 },
    { label: "ZIP", color: "from-blue-500 to-indigo-600", x: 95, y: 45, delay: 3 },
  ];

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center overflow-hidden">
      <div className="absolute w-[180px] h-[180px] rounded-full bg-blue-500/10 blur-[50px]" />
      <div className="absolute w-[240px] h-[240px] rounded-full border border-slate-200 border-dashed animate-[spin_40s_linear_infinite]" />
      <div className="absolute w-[160px] h-[160px] rounded-full border border-slate-300/80 animate-[spin_25s_linear_infinite_reverse]" />
      <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-[1.5px] shadow-[0_10px_25px_rgba(37,99,235,0.25)]">
        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
          <Cpu className="text-blue-600 animate-pulse" size={26} />
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
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all shadow-md flex items-center gap-1.5 cursor-default group">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${type.color}`} />
            <span className="text-[11px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{type.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Filter Operations by Uploaded File Type ───
const getFilteredOperations = (source, ext) => {
  const allOps = OPERATIONS_MAP[source] || [];
  if (!ext) return allOps;
  const lowercaseExt = ext.toLowerCase();

  switch (source) {
    case "pdf":
      return allOps;
      
    case "image":
      return allOps.filter(op => 
        ["/tools/image-compressor", "/tools/image-resizer", "/tools/image-cropper", 
         "/tools/image-converter", "/tools/image-watermark", "/tools/image-to-pdf", 
         "/tools/image-to-text", "/tools/ai-image-to-markdown"].includes(op.to)
      );

    case "spreadsheet":
      return allOps.filter(op => 
        ["/tools/excel-merge-split", "/tools/data-cleaner", "/tools/csv-sql-runner"].includes(op.to)
      );

    case "document": // Word Docs
      return allOps.filter(op => 
        ["/tools/docx-converter", "/tools/doc-metadata-cleaner", "/tools/grammar-checker", 
         "/tools/similarity-checker", "/tools/batch-find-replace", "/tools/academic-format-checker"].includes(op.to)
      );

    case "presentation": // Slides
      return allOps.filter(op => 
        ["/tools/ppt-to-pdf", "/tools/pptx-metadata-editor"].includes(op.to)
      );

    case "code":
      if (lowercaseExt === "json") {
        return allOps.filter(op => ["/tools/json-formatter", "/tools/ai-code-playground"].includes(op.to));
      }
      if (lowercaseExt === "html") {
        return allOps.filter(op => ["/tools/html-previewer", "/tools/ai-code-playground"].includes(op.to));
      }
      if (lowercaseExt === "md") {
        return allOps.filter(op => ["/tools/markdown-previewer", "/tools/ai-code-playground"].includes(op.to));
      }
      return allOps.filter(op => ["/tools/ai-code-playground"].includes(op.to));

    case "text":
      return allOps.filter(op => 
        ["/tools/text-diff", "/tools/word-counter", "/tools/find-replace", 
         "/tools/case-converter", "/tools/text-line-editor", "/tools/text-analyzer", 
         "/tools/markdown-editor"].includes(op.to)
      );

    case "archive":
      return allOps.filter(op => 
        ["/tools/file-vault", "/tools/temp-share", "/tools/batch-renamer"].includes(op.to)
      );

    case "media":
      return allOps.filter(op => 
        ["/tools/audio-video-transcriber", "/tools/voice-helper"].includes(op.to)
      );

    default:
      return allOps;
  }
};

// ─── GUEST PROTECTED TOOLS ───
const LOCKED_GUEST_TOOLS = [
  '/tools/ai-pdf-to-markdown',
  '/tools/ai-image-to-markdown',
  '/tools/google-search-builder',
  '/tools/regex-tester',
  '/tools/ai-code-playground',
  '/tools/cron-parser',
  '/tools/audio-video-transcriber'
];

// ─── MAIN COMPONENT ───

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRefDesktop = useRef(null);
  const fileInputRefMobile = useRef(null);

  const { currentUser, togglePin, toggleFavorite, loginWithGoogle } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("authGate") === "true") {
      setIsAuthModalOpen(true);
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  const [source, setSource] = useState("");
  const [selectedOpTo, setSelectedOpTo] = useState("");
  const [droppedFile, setDroppedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('dashboardActiveTab') || "pdf");
  
  useEffect(() => {
    sessionStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  
  const [isLaunchPop, setIsLaunchPop] = useState(false);
  const prevHasActiveOp = useRef(false);

  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isOperationOpen, setIsOperationOpen] = useState(false);
  const [simulatedFormatHighlight, setSimulatedFormatHighlight] = useState(null);
  const [simulatedOpHighlight, setSimulatedOpHighlight] = useState(null);
  const simulationTimeouts = useRef([]);
  const hasUserInteracted = useRef(false);

  const DEMO_FORMATS = ["Format", "Image", "PDF", "Word Doc"];
  const DEMO_OPERATIONS = ["Operation", "Convert to PDF", "Compress PDF", "Resize Image"];
  
  const clearSimulation = useCallback(() => {
    simulationTimeouts.current.forEach(clearTimeout);
    simulationTimeouts.current = [];
    setSimulatedFormatHighlight(null);
    setSimulatedOpHighlight(null);
    setIsFormatOpen(false);
    setIsOperationOpen(false);
  }, []);

  const stopDemoAndInteract = useCallback(() => {
    if (hasUserInteracted.current) return;
    hasUserInteracted.current = true;
    clearSimulation();
    setDroppedFile((prev) => {
      if (prev?.isDemo) {
        setSource("");
        setSelectedOpTo("");
        return null;
      }
      return prev;
    });
  }, [clearSimulation]);

  const [isIconDropping, setIsIconDropping] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    if (droppedFile || hasUserInteracted.current) {
      setDemoStep(0);
      return;
    }

    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
      
      setIsIconDropping(true);
      const t = setTimeout(() => setIsIconDropping(false), 600);
      simulationTimeouts.current.push(t);
    }, 2800);

    return () => clearInterval(interval);
  }, [droppedFile]);

  useEffect(() => {
    return () => {
      simulationTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 2);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
    }
  }, []);

  useEffect(() => {
    const tabsEl = tabsRef.current;
    if (tabsEl) {
      updateScrollButtons();
      tabsEl.addEventListener("scroll", updateScrollButtons, { passive: true });
      window.addEventListener("resize", updateScrollButtons);
      const t = setTimeout(updateScrollButtons, 100);
      return () => {
        tabsEl.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
        clearTimeout(t);
      };
    }
  }, [updateScrollButtons]);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 240;
      const currentScroll = tabsRef.current.scrollLeft;
      const target = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      tabsRef.current.scrollTo({
        left: target,
        behavior: 'smooth'
      });
    }
  };

  const operations = source ? getFilteredOperations(source, droppedFile?.ext) : [];
  const activeOp = operations.find(op => op.to === (selectedOpTo || (operations[0]?.to || ""))) || null;
  const tabOps = OPERATIONS_MAP[activeTab] || [];

  const handleToolClick = (e, path) => {
    if (LOCKED_GUEST_TOOLS.includes(path) && !currentUser) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  const getToolCategoryAndDetails = (toPath) => {
    for (const catKey of Object.keys(OPERATIONS_MAP)) {
      const found = OPERATIONS_MAP[catKey].find(op => op.to === toPath);
      if (found) {
        const catTab = CATEGORY_TABS.find(tab => tab.id === catKey);
        return {
          ...found,
          categoryKey: catKey,
          categoryLabel: catTab?.label || catKey,
          icon: catTab?.icon || ArrowRight
        };
      }
    }
    return null;
  };

  const pinnedResolved = (currentUser?.pinnedTools || [])
    .map(path => getToolCategoryAndDetails(path))
    .filter(Boolean);

  useEffect(() => {
    const hasOp = !!activeOp;
    if (!prevHasActiveOp.current && hasOp) {
      setIsLaunchPop(true);
      const timer = setTimeout(() => setIsLaunchPop(false), 500);
      return () => clearTimeout(timer);
    }
    prevHasActiveOp.current = hasOp;
  }, [activeOp]);

  const handleSourceChange = (val) => { 
    clearSimulation();
    setSource(val); 
    const ops = getFilteredOperations(val, droppedFile?.ext);
    setSelectedOpTo(ops[0]?.to || "");
  };
  
  const handleOperationChange = (val) => {
    setSelectedOpTo(val);
  };

  const handleLaunch = () => { 
    if (activeOp) {
      if (LOCKED_GUEST_TOOLS.includes(activeOp.to) && !currentUser) {
        setIsAuthModalOpen(true);
        return;
      }
      navigate(activeOp.to, { state: { initialFile: droppedFile?.rawFile } });
    }
  };

  const handleFileDrop = useCallback((file) => {
    clearSimulation();
    hasUserInteracted.current = true;

    const ext = file.name.split(".").pop().toLowerCase();
    const mapped = EXT_TO_SOURCE[ext] || "";
    setDroppedFile({ 
      rawFile: file,
      name: file.name, 
      size: (file.size / 1024).toFixed(1) + " KB", 
      ext: ext.toUpperCase() 
    });

    setSource("");
    setSelectedOpTo("");

    if (mapped) {
      setSource(mapped);
      const ops = getFilteredOperations(mapped, ext);
      setSelectedOpTo(ops[0]?.to || "");
    }
  }, [clearSimulation]);

  const clearFile = () => { 
    clearSimulation();
    setDroppedFile(null); 
    setSource(""); 
    setSelectedOpTo("");
  };

  const sourceOptions = SOURCE_FORMATS.map((item) => ({
    value: item.id,
    label: item.label,
    icon: item.icon,
  }));

  const operationOptions = operations.map((item) => ({
    value: item.to,
    label: item.label,
    icon: Zap,
  }));

  return (
    <>
      <PageTransition>
      <style>{`
        @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes flow-pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes icon-drop {
          0% { transform: translateY(-22px) scale(0.6); opacity: 0; }
          60% { transform: translateY(4px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes flash-glow {
          0% { border-color: #e2e8f0; box-shadow: 0 0 0 rgba(37, 99, 235, 0); }
          30% { border-color: #2563eb; box-shadow: 0 0 15px rgba(37, 99, 235, 0.25); }
          100% { border-color: #e2e8f0; box-shadow: 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes scale-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); border-color: #2563eb; box-shadow: 0 0 12px rgba(37, 99, 235, 0.2); }
          100% { transform: scale(1); }
        }
        .animate-flash-glow { animation: flash-glow 0.8s ease-out; }
        .animate-scale-pop { animation: scale-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gradient-text { background: linear-gradient(135deg, #2563eb, #4f46e5, #0284c7); background-size: 200% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-shift 4s ease infinite; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="w-full min-h-screen">
        <section
          className="w-full bg-transparent relative overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault(); setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
          }}
        >
          {/* Subtle light mesh decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-blue-100/40 via-indigo-50/30 to-transparent blur-[100px] pointer-events-none" />

          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md border-3 border-dashed border-blue-600 flex flex-col items-center justify-center gap-3 pointer-events-none"
              >
                <UploadCloud size={44} className="text-blue-600 animate-bounce" />
                <p className="text-base font-black text-slate-900">Drop your file anywhere</p>
                <p className="text-xs text-slate-500 font-medium">We'll automatically detect its format</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 w-full max-w-[1050px] mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-14 md:pb-16">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 lg:mb-12">
              
              <div className="lg:col-span-7 text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-black tracking-tight text-slate-900 leading-[1.12] mb-4"
                >
                  What do you want to
                  <span className="gradient-text"> process</span>
                  <span className="text-slate-900">?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-slate-600 text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto lg:mx-0 leading-relaxed mb-6"
                >
                  Daily Utility Hub offers over 90+ utilities to convert, compress, format, and edit files entirely in your browser with zero latency.
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
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
                      <stat.icon size={13} className="text-blue-600 shrink-0" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-900">
                        {stat.display || <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{stat.label}</span>
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

            {/* ═══ INTERACTIVE WORKFLOW CENTERPIECE ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              onMouseDownCapture={stopDemoAndInteract}
              className="relative z-30 mb-8 rounded-2xl"
            >
              <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex flex-col">
                <div className="w-full">
                  {/* Desktop/Tablet Flow */}
                  <motion.div layout className="hidden sm:flex items-center justify-between gap-4">
                    {/* Source File Badge / Selector */}
                    <AnimatePresence mode="wait">
                      {droppedFile ? (
                        <motion.div
                          key="file-active"
                          initial={{ scale: 0.9, opacity: 0, y: 10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: -10 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-200 px-3.5 py-2 rounded-xl min-w-[200px] max-w-[260px] h-[44px] shadow-2xs"
                        >
                          <motion.div 
                            initial={{ y: -30, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 450, damping: 15, delay: 0.12 }}
                            className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                          >
                            {droppedFile.ext}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{droppedFile.name}</p>
                              {droppedFile.isDemo && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-100 text-blue-700 border border-blue-300 rounded uppercase tracking-wider shrink-0 animate-pulse">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">{droppedFile.size}</p>
                          </div>
                          <button onClick={clearFile} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0">
                            <X size={13} />
                          </button>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div
                            key="file-empty"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => fileInputRefDesktop.current?.click()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer min-w-[200px] max-w-[260px] h-[44px] group"
                          >
                            <UploadCloud 
                              size={15} 
                              className={`text-slate-400 group-hover:text-blue-600 shrink-0 ${
                                isIconDropping ? "animate-[icon-drop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] text-blue-600" : ""
                              }`} 
                            />
                            <span className="text-xs font-bold truncate">Select or drop file</span>
                          </motion.div>
                          <input
                            type="file"
                            ref={fileInputRefDesktop}
                            onChange={(e) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); e.target.value = ''; }}
                            className="hidden"
                          />
                        </>
                      )}
                    </AnimatePresence>

                    {/* Animated Connector Line */}
                    <motion.div layout className="flex-1 flex items-center justify-center relative min-w-[40px]">
                      <div className="w-full h-[2px] bg-slate-200 relative overflow-hidden rounded-full">
                        <div className="absolute top-0 left-0 w-16 h-full bg-blue-500 animate-[flow-pulse_1.5s_ease-in-out_infinite]" />
                      </div>
                      <div className="absolute w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                        <ArrowRight size={10} className="text-blue-600" />
                      </div>
                    </motion.div>

                    {/* Target Selectors */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-[140px] md:w-[155px]">
                        <CustomDropdown 
                          value={source} 
                          onChange={handleSourceChange} 
                          options={sourceOptions} 
                          placeholder={!droppedFile ? DEMO_FORMATS[demoStep] : "Format"} 
                          icon={Layers} 
                          disabled={true}
                          open={isFormatOpen}
                          setOpen={setIsFormatOpen}
                          highlightedValue={simulatedFormatHighlight}
                        />
                      </div>
                      <div className="w-[150px] md:w-[170px]">
                        <CustomDropdown 
                          value={selectedOpTo || (operations[0]?.to || "")} 
                          onChange={handleOperationChange} 
                          options={operationOptions} 
                          placeholder={!droppedFile ? DEMO_OPERATIONS[demoStep] : "Operation"} 
                          disabled={!droppedFile || !source} 
                          icon={Zap} 
                          open={isOperationOpen}
                          setOpen={setIsOperationOpen}
                          highlightedValue={simulatedOpHighlight}
                        />
                      </div>
                    </div>

                    {/* Launch Button */}
                    <motion.button
                      layout
                      onClick={handleLaunch}
                      disabled={!droppedFile || !activeOp}
                      className={`h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer shrink-0 ${
                        !droppedFile || !activeOp
                          ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500 shadow-none pointer-events-none"
                          : "hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
                      } ${
                        isLaunchPop ? "animate-scale-pop" : ""
                      }`}
                    >
                      Launch <ArrowRight size={13} />
                    </motion.button>
                  </motion.div>

                   {/* Mobile Flow (stacked) */}
                  <motion.div layout className="flex sm:hidden flex-col gap-3">
                    <AnimatePresence mode="wait">
                      {droppedFile ? (
                        <motion.div
                          key="file-active-mobile"
                          initial={{ scale: 0.9, opacity: 0, y: 10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: -10 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 px-3.5 py-2.5 rounded-xl shadow-2xs"
                        >
                          <motion.div 
                            initial={{ y: -35, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 450, damping: 15, delay: 0.12 }}
                            className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0"
                          >
                            {droppedFile.ext}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{droppedFile.name}</p>
                              {droppedFile.isDemo && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-100 text-blue-700 border border-blue-300 rounded uppercase tracking-wider shrink-0 animate-pulse">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">{droppedFile.size}</p>
                          </div>
                          <button onClick={clearFile} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0">
                            <X size={13} />
                          </button>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div
                            key="file-empty-mobile"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => fileInputRefMobile.current?.click()}
                            className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-dashed border-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer group"
                          >
                            <UploadCloud 
                              size={15} 
                              className={`text-slate-400 group-hover:text-blue-600 shrink-0 ${
                                isIconDropping ? "animate-[icon-drop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] text-blue-600" : ""
                              }`} 
                            />
                            <span className="text-xs font-bold">Select or drop file</span>
                          </motion.div>
                          <input
                            type="file"
                            ref={fileInputRefMobile}
                            onChange={(e) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); e.target.value = ''; }}
                            className="hidden"
                          />
                        </>
                      )}
                    </AnimatePresence>

                    <motion.div layout className="grid grid-cols-2 gap-2">
                      <CustomDropdown 
                        value={source} 
                        onChange={handleSourceChange} 
                        options={sourceOptions} 
                        placeholder={!droppedFile ? DEMO_FORMATS[demoStep] : "Format"} 
                        icon={Layers} 
                        disabled={true} 
                        open={isFormatOpen}
                        setOpen={setIsFormatOpen}
                        highlightedValue={simulatedFormatHighlight}
                      />
                      <CustomDropdown 
                        value={selectedOpTo || (operations[0]?.to || "")} 
                        onChange={handleOperationChange} 
                        options={operationOptions} 
                        placeholder={!droppedFile ? DEMO_OPERATIONS[demoStep] : "Operation"} 
                        disabled={!droppedFile || !source} 
                        icon={Zap} 
                        open={isOperationOpen}
                        setOpen={setIsOperationOpen}
                        highlightedValue={simulatedOpHighlight}
                      />
                    </motion.div>

                    <motion.button
                      layout
                      onClick={handleLaunch}
                      disabled={!droppedFile || !activeOp}
                      className={`w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer ${
                        !droppedFile || !activeOp
                          ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500 shadow-none pointer-events-none"
                          : "active:scale-[0.98]"
                      } ${
                        isLaunchPop ? "animate-scale-pop" : ""
                      }`}
                    >
                      Launch <ArrowRight size={13} />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* ═══ PINNED TOOLS SECTION ═══ */}
            {currentUser && pinnedResolved.length > 0 && (
              <div className="mb-8 text-center sm:text-left">
                <button
                  onClick={() => setIsPinnedOpen(!isPinnedOpen)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl flex items-center justify-between sm:justify-start gap-4 transition-all mx-auto sm:mx-0 group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Pin size={13} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {isPinnedOpen ? 'Hide Pinned Workspaces' : 'Show Pinned Workspaces'} 
                      <span className="ml-1.5 text-slate-400 font-medium">({pinnedResolved.length})</span>
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-300 ${isPinnedOpen ? 'rotate-180 text-blue-600' : 'rotate-0'}`} 
                  />
                </button>

                <AnimatePresence>
                  {isPinnedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x pb-3 pt-2 px-1 -mx-1">
                        {pinnedResolved.map((tool, i) => (
                          <motion.div 
                            key={tool.to} 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                            className="group relative flex flex-col flex-shrink-0 w-[76px] sm:w-[88px] snap-start"
                          >
                            <Link
                              to={tool.to}
                              onClick={(e) => {
                                if (LOCKED_GUEST_TOOLS.includes(tool.to) && !currentUser) {
                                  e.preventDefault();
                                  setIsAuthModalOpen(true);
                                }
                              }}
                              className="w-full flex flex-col items-center gap-2"
                            >
                              <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-2xl bg-white border border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-xs relative">
                                <tool.icon size={22} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors text-center w-full truncate leading-tight px-0.5">
                                {tool.label}
                              </span>
                            </Link>
                            
                            {/* Unpin button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                togglePin(tool.to);
                              }}
                              className="absolute top-0 right-0 sm:-top-1 sm:-right-1 w-6 h-6 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-sm z-10 cursor-pointer"
                              title="Unpin Workspace"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ═══ CATEGORY TABS ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center mb-4 sm:mb-5">
                Explore Utilities By Category
              </h2>
              
              {/* Slider Tabs Container */}
              <div className="relative w-full mb-5 sm:mb-6 group">
                
                {/* Left shadow fade + Arrow */}
                <AnimatePresence>
                  {showLeftArrow && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/80 to-transparent z-20 flex items-center justify-start pointer-events-none"
                    >
                      <button
                        onClick={() => scrollTabs('left')}
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center justify-center shadow-xs pointer-events-auto ml-1 cursor-pointer hover:scale-105"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tabs Row */}
                <div 
                  ref={tabsRef}
                  className="overflow-x-auto hide-scrollbar flex items-center justify-start gap-2 w-full flex-nowrap py-1 scroll-smooth"
                >
                  {CATEGORY_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 select-none ${
                          activeTab === tab.id
                            ? "text-white shadow-sm shadow-blue-500/20"
                            : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
                        }`}
                      >
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-blue-600 rounded-xl"
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          />
                        )}
                        <TabIcon size={14} className="relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right shadow fade + Arrow */}
                <AnimatePresence>
                  {showRightArrow && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f8fafc] via-[#f8fafc]/80 to-transparent z-20 flex items-center justify-end pointer-events-none"
                    >
                      <button
                        onClick={() => scrollTabs('right')}
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center justify-center shadow-xs pointer-events-auto mr-1 cursor-pointer hover:scale-105"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                  >
                    {tabOps.map((op, i) => (
                      <motion.div
                        key={op.to}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="group relative flex items-center bg-white border border-slate-200/90 hover:border-blue-400/80 hover:bg-blue-50/20 transition-all rounded-2xl shadow-2xs hover:shadow-sm overflow-hidden"
                      >
                        <Link
                          to={op.to}
                          onClick={(e) => handleToolClick(e, op.to)}
                          className="flex-1 flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-2.5 sm:py-3.5 min-w-0"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 text-slate-600">
                            <ArrowRight className="w-3 h-3 transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1 py-0.5">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 sm:truncate leading-[1.2]">{op.label}</p>
                            <p className="hidden sm:block text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors truncate mt-0.5">{op.result}</p>
                          </div>
                        </Link>
                        
                        {/* ACTIONS - Horizontal on the right */}
                        <div className="flex items-center gap-0.5 sm:gap-1 pr-1.5 sm:pr-2 w-[52px] sm:w-[76px] opacity-100 md:w-0 md:opacity-0 md:group-hover:w-[76px] md:group-hover:opacity-100 transition-all duration-300 ease-out shrink-0 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!currentUser) {
                                setIsAuthModalOpen(true);
                              } else {
                                toggleFavorite(op.to);
                              }
                            }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 ${
                              currentUser?.favoriteTools?.includes(op.to)
                                ? 'text-rose-500 hover:text-rose-600 bg-rose-50'
                                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" fill={currentUser?.favoriteTools?.includes(op.to) ? "currentColor" : "none"} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!currentUser) {
                                setIsAuthModalOpen(true);
                              } else {
                                togglePin(op.to);
                              }
                            }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 ${
                              currentUser?.pinnedTools?.includes(op.to)
                                ? 'text-blue-600 hover:text-blue-700 bg-blue-50'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" fill={currentUser?.pinnedTools?.includes(op.to) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>

    {/* Light Auth Gate Modal */}
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-sm bg-white border border-slate-200 p-8 shadow-2xl rounded-2xl z-10 flex flex-col text-left"
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600 shadow-xs">
                <Shield size={22} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Authentication Required</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Create an account or log in to use advanced utilities, sync favorites across devices, and keep tools pinned.
              </p>
            </div>
            
            <div className="space-y-3.5">
              <button
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    setIsAuthModalOpen(false);
                  } catch (e) {}
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs shadow-2xs cursor-pointer active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 text-[10px] uppercase tracking-widest font-bold">Or with email</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors rounded-xl shadow-xs"
                >
                  Register
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Dashboard;
