import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight, UploadCloud, X, ChevronDown, Zap, Shield, Cpu,
  FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay,
  FolderArchive, Music, Layers, Search, ChevronLeft, ChevronRight, Heart, Pin, Sparkles, Terminal, Activity
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

// ─── WhatsApp Dark Custom Dropdown Component ───
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
            ? "border-[#00a884] bg-[#202c33] ring-2 ring-[#00a884]/30 shadow-lg" 
            : "border-[#2a3942] bg-[#202c33]"
        } ${
          disabled 
            ? "opacity-50 cursor-not-allowed border-[#222d34] bg-[#111b21] pointer-events-none text-[#8696a0]" 
            : "cursor-pointer hover:border-[#00a884]/60 hover:bg-[#222e35] active:scale-[0.98] text-[#e9edef] shadow-xs"
        }`}
      >
        {Icon && <Icon size={14} className="text-[#8696a0] shrink-0" />}
        <span className="text-xs font-bold truncate flex-1 block overflow-hidden h-4 relative">
          <AnimatePresence mode="wait">
            <motion.span
              key={selected ? selected.label : placeholder}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute inset-y-0 left-0 truncate w-full flex items-center ${selected ? "text-[#e9edef]" : "text-[#8696a0]"}`}
            >
              {selected ? selected.label : placeholder}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDown size={13} className={`ml-auto text-[#8696a0] shrink-0 transition-transform ${open ? "rotate-180 text-[#00a884]" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[200px] max-h-[260px] overflow-hidden bg-[#111b21] border border-[#222d34] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-[200] flex flex-col"
          >
            {options.length > 5 && (
              <div className="px-2 py-2 border-b border-[#222d34] sticky top-0 bg-[#111b21] z-10 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] focus-within:border-[#00a884] transition-colors">
                  <Search size={12} className="text-[#8696a0]" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-[11px] text-[#e9edef] focus:outline-none placeholder:text-[#8696a0]"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-[#8696a0] hover:text-[#e9edef]"
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
                          ? "bg-[#00a884]/15 text-[#00a884] font-bold border-l-2 border-[#00a884]"
                          : "text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                      }`}
                    >
                      {OptIcon && <OptIcon size={14} className="shrink-0 opacity-70" />}
                      <span className="truncate">{opt.label}</span>
                      {opt.value === value && (
                        <svg className="w-3.5 h-3.5 ml-auto text-[#00a884] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3.5 py-4 text-center text-xs text-[#8696a0]">
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

// ─── WhatsApp Dark Animated Interactive Hub Graphic ───
const InteractiveHubGraphic = () => {
  const fileTypes = [
    { label: "PDF", color: "from-rose-500 to-red-600", x: -95, y: -45, delay: 0 },
    { label: "PNG", color: "from-[#00a884] to-[#25d366]", x: 95, y: -45, delay: 1 },
    { label: "JSON", color: "from-amber-400 to-orange-500", x: -95, y: 45, delay: 2 },
    { label: "ZIP", color: "from-[#53bdeb] to-blue-600", x: 95, y: 45, delay: 3 },
  ];

  return (
    <div className="relative w-full h-[250px] flex items-center justify-center overflow-hidden">
      {/* Emerald Ambient Glow */}
      <div className="absolute w-[200px] h-[200px] rounded-full bg-[#00a884]/15 blur-[60px]" />
      
      {/* Rotating Dotted Rings */}
      <div className="absolute w-[240px] h-[240px] rounded-full border border-[#222d34] border-dashed animate-[spin_45s_linear_infinite]" />
      <div className="absolute w-[170px] h-[170px] rounded-full border border-[#2a3942] animate-[spin_30s_linear_infinite_reverse]" />

      {/* Central WhatsApp Dark CPU Node */}
      <div className="relative z-10 w-[74px] h-[74px] rounded-2xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-[1.5px] shadow-[0_0_30px_rgba(0,168,132,0.3)]">
        <div className="w-full h-full rounded-2xl bg-[#111b21] flex flex-col items-center justify-center">
          <Cpu className="text-[#00a884] animate-pulse" size={26} />
          <span className="text-[8px] font-black tracking-widest text-[#00a884] uppercase mt-0.5">LOCAL</span>
        </div>
      </div>

      {/* Orbiting File Node Chips */}
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
          <div className="px-3 py-1.5 rounded-xl bg-[#111b21] border border-[#2a3942] hover:border-[#00a884] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.4)] flex items-center gap-1.5 cursor-default group">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${type.color} shadow-[0_0_8px_currentColor]`} />
            <span className="text-[11px] font-black text-[#e9edef] group-hover:text-[#00a884] transition-colors">{type.label}</span>
          </div>
        </motion.div>
      ))}

      {/* Real-time Status Badge */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111b21]/90 border border-[#222d34] shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-ping" />
          <span className="text-[10px] font-mono text-[#8696a0]">0.00s Latency • 100% Client-Side Engine</span>
        </div>
      </div>
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

    case "document":
      return allOps.filter(op => 
        ["/tools/docx-converter", "/tools/doc-metadata-cleaner", "/tools/grammar-checker", 
         "/tools/similarity-checker", "/tools/batch-find-replace", "/tools/academic-format-checker"].includes(op.to)
      );

    case "presentation":
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
         "/tools/lorem-ipsum", "/tools/font-converter"].includes(op.to)
      );

    case "archive":
      return allOps.filter(op => 
        ["/tools/file-vault", "/tools/temp-share", "/tools/batch-renamer"].includes(op.to)
      );

    case "media":
      if (["mp3", "wav", "ogg", "m4a"].includes(lowercaseExt)) {
        return allOps.filter(op => ["/tools/audio-video-transcriber", "/tools/voice-helper", "/tools/pdf-audio-reader"].includes(op.to));
      }
      if (["mp4", "webm", "mkv", "avi", "mov"].includes(lowercaseExt)) {
        return allOps.filter(op => ["/tools/audio-video-transcriber"].includes(op.to));
      }
      return allOps;

    default:
      return allOps;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, toggleFavorite, togglePin } = useAuth();
  
  const [source, setSource] = useState("");
  const [operations, setOperations] = useState([]);
  const [activeOp, setActiveOp] = useState(null);
  const [selectedOpTo, setSelectedOpTo] = useState("");
  const [droppedFile, setDroppedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);

  // Dropdown open states
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isOperationOpen, setIsOperationOpen] = useState(false);

  // Animation micro-state
  const [isIconDropping, setIsIconDropping] = useState(false);
  const [isLaunchPop, setIsLaunchPop] = useState(false);

  // Simulated Animation Demo States
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoRunning, setIsDemoRunning] = useState(true);
  const demoIntervalRef = useRef(null);
  const [simulatedFormatHighlight, setSimulatedFormatHighlight] = useState("");
  const [simulatedOpHighlight, setSimulatedOpHighlight] = useState("");

  const DEMO_FORMATS = ["PDF", "PNG", "Spreadsheet", "JSON"];
  const DEMO_OPERATIONS = ["Compress", "Convert to PDF", "Clean Data", "Format JSON"];

  // File Inputs
  const fileInputRefDesktop = useRef(null);
  const fileInputRefMobile = useRef(null);

  // Category Tabs Scrolling
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollArrows = useCallback(() => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 4);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener("resize", checkScrollArrows);
    return () => window.removeEventListener("resize", checkScrollArrows);
  }, [checkScrollArrows]);

  const scrollTabs = (direction) => {
    if (!tabsRef.current) return;
    const scrollAmount = 220;
    tabsRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScrollArrows, 300);
  };

  // Automated Showcase Pipeline Demo
  useEffect(() => {
    if (!isDemoRunning || droppedFile) return;

    demoIntervalRef.current = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % DEMO_FORMATS.length);
    }, 3200);

    return () => clearInterval(demoIntervalRef.current);
  }, [isDemoRunning, droppedFile]);

  const stopDemoAndInteract = () => {
    setIsDemoRunning(false);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
  };

  // Handle actual file drop or upload
  const handleFileDrop = (file) => {
    stopDemoAndInteract();
    const ext = file.name.split(".").pop().toLowerCase();
    const detectedSource = EXT_TO_SOURCE[ext] || "document";
    
    setIsIconDropping(true);
    setTimeout(() => setIsIconDropping(false), 600);

    setDroppedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      ext: ext.toUpperCase(),
      fileObj: file
    });
    setRawFile(file);

    setSource(detectedSource);
    const filteredOps = getFilteredOperations(detectedSource, ext);
    setOperations(filteredOps);

    if (filteredOps.length > 0) {
      setActiveOp(filteredOps[0]);
      setSelectedOpTo(filteredOps[0].to);
    }
  };

  const handleSourceChange = (newSource) => {
    stopDemoAndInteract();
    setSource(newSource);
    const filteredOps = getFilteredOperations(newSource, droppedFile ? droppedFile.ext : null);
    setOperations(filteredOps);
    if (filteredOps.length > 0) {
      setActiveOp(filteredOps[0]);
      setSelectedOpTo(filteredOps[0].to);
    } else {
      setActiveOp(null);
      setSelectedOpTo("");
    }
  };

  const handleOperationChange = (opTo) => {
    stopDemoAndInteract();
    setSelectedOpTo(opTo);
    const found = operations.find((o) => o.to === opTo);
    if (found) setActiveOp(found);
  };

  const handleLaunch = () => {
    if (!activeOp) return;
    setIsLaunchPop(true);
    setTimeout(() => {
      setIsLaunchPop(false);
      navigate(activeOp.to, { state: { initialFile: rawFile } });
    }, 200);
  };

  const handleToolClick = (e, to) => {
    // Normal link navigation
  };

  const clearFile = (e) => {
    e.stopPropagation();
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
    icon: item.icon,
  }));

  const operationOptions = operations.map((item) => ({
    value: item.to,
    label: item.label,
    icon: Zap,
  }));

  const tabOps = OPERATIONS_MAP[activeTab] || [];

  // Pinned tools
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
    <>
      <PageTransition>
      <style>{`
        @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes flow-pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes flash-glow {
          0% { border-color: #2a3942; box-shadow: 0 0 0 rgba(0, 168, 132, 0); }
          30% { border-color: #00a884; box-shadow: 0 0 15px rgba(0, 168, 132, 0.4); }
          100% { border-color: #2a3942; box-shadow: 0 0 0 rgba(0, 168, 132, 0); }
        }
        @keyframes scale-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); border-color: #00a884; box-shadow: 0 0 15px rgba(0, 168, 132, 0.35); }
          100% { transform: scale(1); }
        }
        .animate-flash-glow { animation: flash-glow 0.8s ease-out; }
        .animate-scale-pop { animation: scale-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gradient-emerald-text { background: linear-gradient(135deg, #00a884, #25d366, #53bdeb); background-size: 200% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-shift 4s ease infinite; }
      `}</style>

      <div className="w-full min-h-screen bg-[#0b141a] text-[#e9edef]">
        <section
          className="w-full bg-transparent relative overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault(); setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
          }}
        >
          {/* Subtle Ambient Emerald Background Lights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#00a884]/10 via-[#53bdeb]/5 to-transparent blur-[120px] pointer-events-none" />

          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md border-3 border-dashed border-[#00a884] flex flex-col items-center justify-center gap-3 pointer-events-none"
              >
                <UploadCloud size={48} className="text-[#00a884] animate-bounce" />
                <p className="text-lg font-black text-[#e9edef]">Drop your file anywhere</p>
                <p className="text-xs text-[#8696a0] font-medium">Auto-detecting file format and suggested local tools</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-14 md:pb-16">

            {/* Hero Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 lg:mb-12">
              
              <div className="lg:col-span-7 text-center lg:text-left">
                {/* Emerald Security Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111b21] border border-[#222d34] shadow-xs mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00a884] shadow-[0_0_8px_#00a884]" />
                  <span className="text-[11px] font-bold text-[#e9edef] tracking-tight">Offline-First • 100% Private Client Execution</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-black tracking-tight text-[#e9edef] leading-[1.12] mb-4"
                >
                  What do you want to
                  <span className="gradient-emerald-text"> process</span>
                  <span className="text-[#e9edef]">?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-[#8696a0] text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto lg:mx-0 leading-relaxed mb-6"
                >
                  Daily Utility Hub offers 90+ lightning-fast utilities to edit PDFs, compress media, convert documents, and test code locally with zero latency.
                </motion.p>

                {/* Stat Badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 flex-wrap"
                >
                  {[
                    { icon: Zap, value: 90, suffix: "+", label: "Client Tools" },
                    { icon: Shield, value: 100, suffix: "%", label: "Local Privacy" },
                    { icon: Cpu, value: 0, suffix: "", label: "Server Uploads", display: "Zero" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111b21] border border-[#222d34] shadow-xs">
                      <stat.icon size={14} className="text-[#00a884] shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-[#e9edef]">
                        {stat.display || <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[#8696a0] font-medium">{stat.label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Graphic Node */}
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

            {/* ═══ WHATSAPP DARK WORKFLOW CENTERPIECE ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              onMouseDownCapture={stopDemoAndInteract}
              className="relative z-30 mb-8 rounded-2xl"
            >
              <div className="relative rounded-2xl bg-[#111b21] border border-[#222d34] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-5 flex flex-col">
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
                          className="flex items-center gap-2.5 bg-[#00a884]/15 border border-[#00a884]/40 px-3.5 py-2 rounded-xl min-w-[200px] max-w-[260px] h-[44px] shadow-xs"
                        >
                          <motion.div 
                            initial={{ y: -30, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 450, damping: 15, delay: 0.12 }}
                            className="w-7 h-7 rounded-lg bg-[#00a884] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm"
                          >
                            {droppedFile.ext}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-bold text-[#e9edef] truncate">{droppedFile.name}</p>
                              {droppedFile.isDemo && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 rounded uppercase tracking-wider shrink-0 animate-pulse">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8696a0] font-medium">{droppedFile.size}</p>
                          </div>
                          <button onClick={clearFile} className="p-1 text-[#8696a0] hover:text-[#e9edef] rounded-lg hover:bg-[#202c33] transition-colors cursor-pointer shrink-0">
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
                            className="flex items-center gap-2 px-3.5 py-2 bg-[#202c33] hover:bg-[#222e35] border border-dashed border-[#2a3942] hover:border-[#00a884] text-[#8696a0] hover:text-[#00a884] rounded-xl transition-all cursor-pointer min-w-[200px] max-w-[260px] h-[44px] group shadow-xs"
                          >
                            <UploadCloud 
                              size={15} 
                              className={`text-[#8696a0] group-hover:text-[#00a884] shrink-0 ${
                                isIconDropping ? "animate-[icon-drop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] text-[#00a884]" : ""
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
                      <div className="w-full h-[2px] bg-[#222d34] relative overflow-hidden rounded-full">
                        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-[#00a884] to-transparent animate-[flow-pulse_1.8s_ease-in-out_infinite]" />
                      </div>
                      <div className="absolute w-5 h-5 rounded-full bg-[#111b21] border border-[#2a3942] flex items-center justify-center shadow-xs">
                        <ArrowRight size={10} className="text-[#00a884]" />
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
                      className={`h-11 px-6 bg-[#00a884] hover:bg-[#25d366] text-white text-xs font-black transition-all rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#00a884]/25 cursor-pointer shrink-0 ${
                        !droppedFile || !activeOp
                          ? "opacity-40 cursor-not-allowed bg-[#202c33] text-[#8696a0] shadow-none pointer-events-none"
                          : "hover:shadow-lg hover:shadow-[#00a884]/40 hover:scale-[1.02] active:scale-[0.98]"
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
                          className="flex items-center gap-2.5 bg-[#00a884]/15 border border-[#00a884]/40 px-3.5 py-2.5 rounded-xl shadow-xs"
                        >
                          <motion.div 
                            initial={{ y: -35, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 450, damping: 15, delay: 0.12 }}
                            className="w-8 h-8 rounded-lg bg-[#00a884] text-white font-black text-xs flex items-center justify-center shrink-0"
                          >
                            {droppedFile.ext}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-bold text-[#e9edef] truncate">{droppedFile.name}</p>
                              {droppedFile.isDemo && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 rounded uppercase tracking-wider shrink-0 animate-pulse">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8696a0] font-medium">{droppedFile.size}</p>
                          </div>
                          <button onClick={clearFile} className="p-1 text-[#8696a0] hover:text-[#e9edef] rounded-lg hover:bg-[#202c33] transition-colors cursor-pointer shrink-0">
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
                            className="flex items-center justify-center gap-2 py-3 bg-[#202c33] border border-dashed border-[#2a3942] text-[#8696a0] rounded-xl transition-all cursor-pointer group"
                          >
                            <UploadCloud 
                              size={15} 
                              className={`text-[#8696a0] group-hover:text-[#00a884] shrink-0 ${
                                isIconDropping ? "animate-[icon-drop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] text-[#00a884]" : ""
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
                      className={`w-full h-11 bg-[#00a884] hover:bg-[#25d366] text-white text-xs font-black transition-all rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#00a884]/25 cursor-pointer ${
                        !droppedFile || !activeOp
                          ? "opacity-40 cursor-not-allowed bg-[#202c33] text-[#8696a0] shadow-none pointer-events-none"
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
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#111b21] border border-[#222d34] hover:border-[#00a884] rounded-xl flex items-center justify-between sm:justify-start gap-4 transition-all mx-auto sm:mx-0 group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
                      <Pin size={13} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#e9edef] group-hover:text-[#00a884] transition-colors">
                      {isPinnedOpen ? 'Hide Pinned Workspaces' : 'Show Pinned Workspaces'} 
                      <span className="ml-1.5 text-[#8696a0] font-medium">({pinnedResolved.length})</span>
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#8696a0] transition-transform duration-300 ${isPinnedOpen ? 'rotate-180 text-[#00a884]' : 'rotate-0'}`} 
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start bg-[#111b21] border border-[#222d34] hover:border-[#00a884]/60 p-4 rounded-2xl shadow-xs transition-all group flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="w-8 h-8 rounded-xl bg-[#202c33] group-hover:bg-[#00a884]/20 flex items-center justify-center text-[#8696a0] group-hover:text-[#00a884] transition-colors">
                                <Zap size={16} />
                              </div>
                              <button
                                onClick={() => togglePin(tool.to)}
                                className="text-[#8696a0] hover:text-rose-500 p-1 rounded-lg hover:bg-[#202c33] transition-colors cursor-pointer"
                                title="Unpin tool"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#e9edef] group-hover:text-[#00a884] transition-colors truncate">{tool.label}</h4>
                              <p className="text-[10px] text-[#8696a0] truncate mt-0.5">{tool.result}</p>
                            </div>
                            <Link 
                              to={tool.to}
                              className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#202c33] hover:bg-[#00a884] text-[#e9edef] hover:text-white rounded-xl text-[11px] font-bold transition-colors"
                            >
                              Launch Utility <ArrowRight size={12} />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ═══ CATEGORY TABS SLIDER ═══ */}
            <div className="relative mb-6">
              {/* Left arrow */}
              <AnimatePresence>
                {showLeftArrow && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0b141a] via-[#0b141a]/80 to-transparent z-20 flex items-center justify-start pointer-events-none"
                  >
                    <button
                      onClick={() => scrollTabs('left')}
                      className="w-7 h-7 rounded-full bg-[#111b21] border border-[#2a3942] text-[#8696a0] hover:text-[#00a884] hover:border-[#00a884] transition-all flex items-center justify-center shadow-md pointer-events-auto ml-1 cursor-pointer hover:scale-105"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs List */}
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
                          ? "text-white shadow-md shadow-[#00a884]/25"
                          : "text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] hover:bg-[#222e35] border border-[#2a3942] shadow-xs"
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-[#00a884] rounded-xl"
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        />
                      )}
                      <TabIcon size={14} className="relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right arrow */}
              <AnimatePresence>
                {showRightArrow && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0b141a] via-[#0b141a]/80 to-transparent z-20 flex items-center justify-end pointer-events-none"
                  >
                    <button
                      onClick={() => scrollTabs('right')}
                      className="w-7 h-7 rounded-full bg-[#111b21] border border-[#2a3942] text-[#8696a0] hover:text-[#00a884] hover:border-[#00a884] transition-all flex items-center justify-center shadow-md pointer-events-auto mr-1 cursor-pointer hover:scale-105"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ═══ OPERATIONS GRID ═══ */}
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
                      className="group relative flex items-center bg-[#111b21] border border-[#222d34] hover:border-[#00a884]/80 hover:bg-[#202c33] transition-all rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden"
                    >
                      <Link
                        to={op.to}
                        onClick={(e) => handleToolClick(e, op.to)}
                        className="flex-1 flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-2.5 sm:py-3.5 min-w-0"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#202c33] group-hover:bg-[#00a884] group-hover:text-white flex items-center justify-center transition-colors shrink-0 text-[#8696a0]">
                          <ArrowRight className="w-3 h-3 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[11px] sm:text-xs font-bold text-[#e9edef] group-hover:text-[#00a884] transition-colors line-clamp-2 sm:truncate leading-[1.2]">{op.label}</p>
                          <p className="hidden sm:block text-[10px] text-[#8696a0] group-hover:text-[#8696a0]/80 transition-colors truncate mt-0.5">{op.result}</p>
                        </div>
                      </Link>
                      
                      {/* Action buttons on card hover */}
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
                              ? 'text-rose-500 hover:text-rose-400 bg-rose-500/10'
                              : 'text-[#8696a0] hover:text-rose-500 hover:bg-rose-500/10'
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
                              ? 'text-[#00a884] hover:text-[#25d366] bg-[#00a884]/15'
                              : 'text-[#8696a0] hover:text-[#00a884] hover:bg-[#00a884]/15'
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
          </div>
        </section>
      </div>
    </PageTransition>

    {/* WhatsApp Dark Auth Gate Modal */}
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-sm bg-[#111b21] border border-[#222d34] p-8 shadow-2xl rounded-2xl z-10 flex flex-col text-left"
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center mb-4 text-[#00a884] shadow-xs">
                <Shield size={22} />
              </div>
              <h3 className="text-xl font-black text-[#e9edef] tracking-tight">Authentication Required</h3>
              <p className="text-xs text-[#8696a0] mt-2 leading-relaxed">
                Sign in to sync your favorite utilities across devices, pin frequently used workspaces, and unlock cloud sync.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full py-3 bg-[#00a884] hover:bg-[#25d366] text-white font-bold rounded-xl text-center text-xs block transition-all shadow-md shadow-[#00a884]/25 cursor-pointer"
              >
                Sign In to Account
              </Link>
              <Link
                to="/register"
                className="w-full py-3 bg-[#202c33] hover:bg-[#222e35] text-[#e9edef] font-bold rounded-xl text-center text-xs block border border-[#2a3942] transition-colors cursor-pointer"
              >
                Create New Account
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Dashboard;
