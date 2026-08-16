import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ArrowRight, UploadCloud, X, ChevronDown, Zap, Shield, Cpu,
  FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay,
  FolderArchive, Music, Layers, Search, ChevronLeft, ChevronRight, Heart, Pin, Sparkles, Terminal, Activity,
  Lock, CheckCircle2, Sliders, RefreshCw, Key, FileCheck, ArrowRightLeft, Copy, Check, Play, Globe, Flame,
  Clock, HardDrive, FileCode, CheckCircle, Database
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

// ─── 200+ FORMATS REPOSITORY ───
const FORMAT_GROUPS = [
  {
    category: "Document",
    formats: [
      { ext: "PDF", name: "Portable Document Format", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
      { ext: "DOCX", name: "Microsoft Word Document", icon: FileText, color: "text-[#1a73e8] bg-[#e8f0fe]" },
      { ext: "DOC", name: "Legacy Word Document", icon: FileText, color: "text-[#1a73e8] bg-[#e8f0fe]" },
      { ext: "TXT", name: "Plain Text Document", icon: Type, color: "text-[#5f6368] bg-[#f1f3f4]" },
      { ext: "MD", name: "Markdown Document", icon: FileText, color: "text-[#8e24aa] bg-[#f3e8fd]" },
      { ext: "EPUB", name: "Electronic Publication", icon: FileText, color: "text-[#fbbc04] bg-[#fef7e0]" },
    ]
  },
  {
    category: "Image",
    formats: [
      { ext: "PNG", name: "Portable Network Graphics", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea]" },
      { ext: "JPG", name: "Joint Photographic Experts", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea]" },
      { ext: "WEBP", name: "Modern Web Picture", icon: ImageIcon, color: "text-[#1a73e8] bg-[#e8f0fe]" },
      { ext: "SVG", name: "Scalable Vector Graphics", icon: Code2, color: "text-[#fbbc04] bg-[#fef7e0]" },
      { ext: "BMP", name: "Bitmap Image", icon: ImageIcon, color: "text-[#5f6368] bg-[#f1f3f4]" },
      { ext: "GIF", name: "Graphics Interchange", icon: ImageIcon, color: "text-[#ea4335] bg-[#fce8e6]" },
    ]
  },
  {
    category: "Data & Spreadsheet",
    formats: [
      { ext: "JSON", name: "JavaScript Object Notation", icon: BracesIcon, color: "text-[#34a853] bg-[#e6f4ea]" },
      { ext: "CSV", name: "Comma Separated Values", icon: Table2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
      { ext: "XLSX", name: "Microsoft Excel Worksheet", icon: Table2, color: "text-[#34a853] bg-[#e6f4ea]" },
      { ext: "XML", name: "Extensible Markup Language", icon: Code2, color: "text-[#fbbc04] bg-[#fef7e0]" },
      { ext: "SQL", name: "Structured Query Language", icon: Layers, color: "text-[#8e24aa] bg-[#f3e8fd]" },
      { ext: "TYPESCRIPT", name: "TypeScript Type Definitions", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
    ]
  },
  {
    category: "Media & Audio",
    formats: [
      { ext: "MP4", name: "MPEG-4 Video", icon: MonitorPlay, color: "text-[#ea4335] bg-[#fce8e6]" },
      { ext: "MP3", name: "MPEG Audio Layer III", icon: Music, color: "text-[#1a73e8] bg-[#e8f0fe]" },
      { ext: "WAV", name: "Waveform Audio File", icon: Music, color: "text-[#34a853] bg-[#e6f4ea]" },
      { ext: "WEBM", name: "WebM Media Format", icon: MonitorPlay, color: "text-[#fbbc04] bg-[#fef7e0]" },
      { ext: "SUBTITLES", name: "Timestamped SRT / VTT", icon: Type, color: "text-[#8e24aa] bg-[#f3e8fd]" },
    ]
  },
  {
    category: "Archive & Security",
    formats: [
      { ext: "ZIP", name: "ZIP Compressed Archive", icon: FolderArchive, color: "text-[#fbbc04] bg-[#fef7e0]" },
      { ext: "VAULT", name: "AES-256 Encrypted Locker", icon: Lock, color: "text-[#ea4335] bg-[#fce8e6]" },
      { ext: "PASSWORD", name: "High Entropy Token", icon: Key, color: "text-[#34a853] bg-[#e6f4ea]" },
    ]
  }
];

function BracesIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

// ─── CONVERSION ROUTING ENGINE ───
const CONVERSIONS_MAP = {
  "PDF": [
    { target: "DOCX", toolName: "PDF to Word Converter", desc: "Convert PDF to editable Word with OCR & exact layout", to: "/tools/pdf-to-word", badge: "AI / OCR Engine" },
    { target: "PNG", toolName: "PDF to High-Res Images", desc: "Extract PDF pages to crisp PNG images", to: "/tools/pdf-converter", badge: "Lossless" },
    { target: "JPG", toolName: "PDF to JPG Converter", desc: "Export lightweight JPG images", to: "/tools/pdf-converter", badge: "Fast" },
    { target: "WEBP", toolName: "PDF to WebP Converter", desc: "Modern web-optimized images", to: "/tools/pdf-converter", badge: "Compact" },
    { target: "TXT", toolName: "PDF Text Extractor", desc: "Extract raw, unformatted text from PDF", to: "/tools/pdf-to-text", badge: "Instant" },
    { target: "MD", toolName: "AI PDF to Markdown", desc: "Parse structural tables, headings, and code", to: "/tools/ai-pdf-to-markdown", badge: "AI Powered" },
    { target: "AUDIO", toolName: "PDF Audio Reader", desc: "Listen to documents via speech synthesis", to: "/tools/pdf-audio-reader", badge: "Speech" },
    { target: "COMPRESS", toolName: "PDF Compressor", desc: "Intelligently shrink PDF file size", to: "/tools/pdf-compressor", badge: "Up to -80%" },
  ],
  "DOCX": [
    { target: "PDF", toolName: "Word to PDF Converter", desc: "Convert DOCX to standard PDF documents", to: "/tools/docx-converter", badge: "Native Wasm" },
    { target: "PNG", toolName: "Word to Image Converter", desc: "Render document pages as images", to: "/tools/docx-converter", badge: "High DPI" },
    { target: "TXT", toolName: "Docx Text Extractor", desc: "Strip styles and extract pure text", to: "/tools/pdf-to-text", badge: "Clean" },
  ],
  "PNG": [
    { target: "WEBP", toolName: "PNG to WebP Converter", desc: "Convert to modern WebP with smaller size", to: "/tools/image-converter", badge: "Web Ready" },
    { target: "JPG", toolName: "PNG to JPG Converter", desc: "Convert with custom background & quality", to: "/tools/image-converter", badge: "Fast" },
    { target: "PDF", toolName: "PNG to PDF Multi-Page", desc: "Combine images into a clean PDF document", to: "/tools/image-to-pdf", badge: "Multi-File" },
    { target: "TXT", toolName: "OCR Image to Text", desc: "Scan and extract text from images via OCR", to: "/tools/image-to-text", badge: "Tesseract OCR" },
    { target: "MD", toolName: "AI Image to Markdown/Code", desc: "Convert UI sketches or mockups to code", to: "/tools/ai-image-to-markdown", badge: "AI Vision" },
    { target: "COMPRESS", toolName: "Image Compressor", desc: "Compress without visual quality loss", to: "/tools/image-compressor", badge: "Lossless" },
  ],
  "JPG": [
    { target: "PNG", toolName: "JPG to PNG Converter", desc: "Lossless format conversion", to: "/tools/image-converter", badge: "Lossless" },
    { target: "WEBP", toolName: "JPG to WebP Converter", desc: "Save up to 40% image file size", to: "/tools/image-converter", badge: "Recommended" },
    { target: "PDF", toolName: "JPG to PDF Converter", desc: "Bundle photos into a single PDF file", to: "/tools/image-to-pdf", badge: "Multi-Page" },
    { target: "TXT", toolName: "OCR Image to Text", desc: "Extract printed and written text", to: "/tools/image-to-text", badge: "OCR Engine" },
  ],
  "WEBP": [
    { target: "PNG", toolName: "WebP to PNG Converter", desc: "Convert WebP images to standard PNG", to: "/tools/image-converter", badge: "Standard" },
    { target: "JPG", toolName: "WebP to JPG Converter", desc: "Convert WebP to universal JPG", to: "/tools/image-converter", badge: "Universal" },
    { target: "PDF", toolName: "WebP to PDF Converter", desc: "Convert WebP files to document format", to: "/tools/image-to-pdf", badge: "Document" },
  ],
  "JSON": [
    { target: "CSV", toolName: "JSON to CSV Converter", desc: "Transform nested JSON to tabular CSV", to: "/tools/sheet-converter", badge: "Tabular" },
    { target: "XLSX", toolName: "JSON to Excel Converter", desc: "Export JSON directly to Excel workbook", to: "/tools/sheet-converter", badge: "Spreadsheet" },
    { target: "XML", toolName: "JSON to XML Converter", desc: "Generate well-formed XML tree", to: "/tools/sheet-converter", badge: "Structured" },
    { target: "TYPESCRIPT", toolName: "JSON to TypeScript Schema", desc: "Generate typed interfaces & models", to: "/tools/type-converter", badge: "Dev Favorite" },
    { target: "SQL", toolName: "JSON to SQL Inserts", desc: "Generate SQL CREATE and INSERT statements", to: "/tools/sheet-converter", badge: "Database" },
  ],
  "CSV": [
    { target: "JSON", toolName: "CSV to JSON Converter", desc: "Convert table rows into structured JSON array", to: "/tools/sheet-converter", badge: "Structured" },
    { target: "XLSX", toolName: "CSV to Excel Workbook", desc: "Convert CSV to formatted Excel file", to: "/tools/excel-merge-split", badge: "Excel" },
    { target: "SQL", toolName: "SQL Query Runner on CSV", desc: "Run relational SQL queries on your table", to: "/tools/csv-sql-runner", badge: "SQL Engine" },
    { target: "PIVOT", toolName: "Pivot & Chart Builder", desc: "Generate interactive summaries & charts", to: "/tools/pivot-table-builder", badge: "Analytics" },
  ],
  "XLSX": [
    { target: "CSV", toolName: "Excel to CSV Converter", desc: "Export sheets to lightweight CSV", to: "/tools/sheet-converter", badge: "Lightweight" },
    { target: "JSON", toolName: "Excel to JSON Converter", desc: "Convert workbook data to JSON objects", to: "/tools/sheet-converter", badge: "API Ready" },
    { target: "SQL", toolName: "Excel SQL Runner", desc: "Query Excel spreadsheets with SQLite", to: "/tools/csv-sql-runner", badge: "Query" },
  ],
  "MP4": [
    { target: "SUBTITLES", toolName: "Audio/Video Transcriber", desc: "Extract timestamped text & subtitles", to: "/tools/audio-video-transcriber", badge: "AI Whisper" },
    { target: "TXT", toolName: "Audio to Text Transcriber", desc: "Full transcription with speaker diarization", to: "/tools/audio-video-transcriber", badge: "Text" },
  ],
  "MP3": [
    { target: "SUBTITLES", toolName: "Audio to Subtitles", desc: "Generate SRT/VTT caption files", to: "/tools/audio-video-transcriber", badge: "Subtitles" },
    { target: "TXT", toolName: "Speech to Text Engine", desc: "Transcribe voice memos and podcasts", to: "/tools/audio-video-transcriber", badge: "Local Model" },
  ],
  "ZIP": [
    { target: "UNZIP", toolName: "Zip Extractor & Viewer", desc: "Inspect and extract files inside browser", to: "/tools/zip-archiver", badge: "Client Wasm" },
    { target: "VAULT", toolName: "Encrypted File Vault", desc: "Lock files with military-grade AES-256", to: "/tools/file-vault", badge: "Military Grade" },
  ]
};

// ─── LIVE ANIMATED SIMULATION PRESETS ───
const LIVE_TRANSFORMATION_DEMOS = [
  { fromExt: "PDF", fromName: "contract_nda_2026.pdf", fromSize: "2.4 MB", engine: "OCR Layout Engine", toExt: "DOCX", toName: "contract_nda_2026.docx", toSize: "1.1 MB", tool: "/tools/pdf-to-word", speed: "0.04s" },
  { fromExt: "PNG", fromName: "hero_banner_4k.png", fromSize: "8.2 MB", engine: "WebP Lossless Optimizer", toExt: "WEBP", toName: "hero_banner_4k.webp", toSize: "1.9 MB (-76%)", tool: "/tools/image-converter", speed: "0.02s" },
  { fromExt: "JSON", fromName: "api_schema_v2.json", fromSize: "180 KB", engine: "TypeScript Generator", toExt: "TS", toName: "api_schema_v2.d.ts", toSize: "45 KB", tool: "/tools/type-converter", speed: "0.01s" },
  { fromExt: "CSV", fromName: "financial_q3_sales.csv", fromSize: "640 KB", engine: "SQLite Schema Exporter", toExt: "SQL", toName: "financial_q3_sales.sql", toSize: "820 KB", tool: "/tools/sheet-converter", speed: "0.03s" },
];

// ─── POPULAR 1-CLICK CONVERSIONS ───
const POPULAR_CONVERSIONS = [
  { from: "PDF", to: "DOCX", name: "PDF to Word", desc: "Editable DOCX with OCR & format retention", link: "/tools/pdf-to-word", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
  { from: "PNG", to: "WEBP", name: "PNG to WebP", desc: "Shrink images by up to 70% with zero loss", link: "/tools/image-converter", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea]" },
  { from: "DOCX", to: "PDF", name: "Word to PDF", desc: "High-fidelity PDF document compiler", link: "/tools/docx-converter", icon: FileText, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { from: "IMAGE", to: "PDF", name: "Images to PDF", desc: "Bundle photos into multi-page PDF", link: "/tools/image-to-pdf", icon: ImageIcon, color: "text-[#ea4335] bg-[#fce8e6]" },
  { from: "JSON", to: "TYPESCRIPT", name: "JSON to TS Schema", desc: "Generate TypeScript types & models", link: "/tools/type-converter", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { from: "CSV", to: "JSON", name: "CSV to JSON", desc: "Tabular data to structured API payload", link: "/tools/sheet-converter", icon: Table2, color: "text-[#34a853] bg-[#e6f4ea]" },
  { from: "PDF", to: "COMPRESS", name: "Compress PDF", desc: "Reduce PDF size for email & uploads", link: "/tools/pdf-compressor", icon: FileText, color: "text-[#fbbc04] bg-[#fef7e0]" },
  { from: "AUDIO", to: "TEXT", name: "Audio Transcriber", desc: "Speech-to-text with timestamping", link: "/tools/audio-video-transcriber", icon: Music, color: "text-[#8e24aa] bg-[#f3e8fd]" },
];

// ─── COMPLETE 90+ TOOLS DIRECTORY ───
const ALL_DIRECTORY_TOOLS = [
  { name: "PDF to Word Converter", category: "PDF", desc: "Convert PDF to editable Word (.docx) with OCR", to: "/tools/pdf-to-word", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
  { name: "Image Compressor", category: "Image", desc: "Compress PNG, JPEG & WEBP client-side", to: "/tools/image-compressor", icon: ImageIcon, color: "text-[#34a853] bg-[#e6f4ea]" },
  { name: "Image Format Converter", category: "Image", desc: "Convert between PNG, JPEG, WEBP, and BMP", to: "/tools/image-converter", icon: ArrowRightLeft, color: "text-[#34a853] bg-[#e6f4ea]" },
  { name: "PDF Compressor", category: "PDF", desc: "Intelligent compression reducing file size by up to 80%", to: "/tools/pdf-compressor", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
  { name: "JSON Formatter & Validator", category: "Developer", desc: "Format, validate, and minify JSON data instantly", to: "/tools/json-formatter", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "JWT Token Decoder", category: "Developer", desc: "Decode and verify JSON Web Tokens client-side", to: "/tools/jwt-decoder", icon: Key, color: "text-[#fbbc04] bg-[#fef7e0]" },
  { name: "UUID Batch Generator", category: "Developer", desc: "Generate secure v1, v4, and v7 UUIDs", to: "/tools/uuid-generator", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "Spreadsheet Schema Converter", category: "Sheets", desc: "Convert CSV/Excel to formatted JSON, XML, or SQL", to: "/tools/sheet-converter", icon: Table2, color: "text-[#34a853] bg-[#e6f4ea]" },
  { name: "Merge PDF Documents", category: "PDF", desc: "Combine multiple PDF documents into one securely", to: "/tools/pdf-merge", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
  { name: "Split PDF Pages", category: "PDF", desc: "Extract specific pages or page ranges from PDF", to: "/tools/pdf-split", icon: FileText, color: "text-[#ea4335] bg-[#fce8e6]" },
  { name: "AI PDF to Markdown", category: "PDF", desc: "Convert complex PDF documents into structured Markdown", to: "/tools/ai-pdf-to-markdown", icon: Sparkles, color: "text-[#8e24aa] bg-[#f3e8fd]" },
  { name: "Audio/Video Transcriber", category: "Media", desc: "Transcribe audio & video into subtitles & text", to: "/tools/audio-video-transcriber", icon: Music, color: "text-[#ea4335] bg-[#fce8e6]" },
  { name: "Military-Grade File Vault", category: "Security", desc: "Encrypt any file with AES-256 client-side encryption", to: "/tools/file-vault", icon: Shield, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "HTML Live Sandbox", category: "Developer", desc: "Live preview and sandbox for HTML, CSS, and JS", to: "/tools/html-previewer", icon: Code2, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "Password Generator", category: "Security", desc: "Generate cryptographically secure passwords", to: "/tools/password-generator", icon: Lock, color: "text-[#34a853] bg-[#e6f4ea]" },
  { name: "Hash Generator", category: "Developer", desc: "Compute MD5, SHA-256, and HMAC signatures", to: "/tools/hash-generator", icon: Key, color: "text-[#fbbc04] bg-[#fef7e0]" },
  { name: "Code to Image Studio", category: "Developer", desc: "Render syntax highlighted code screenshots", to: "/tools/code-to-image", icon: ImageIcon, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "Word to PDF Converter", category: "Docs", desc: "Convert Word DOCX files to PDF documents", to: "/tools/docx-converter", icon: FileSpreadsheet, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  { name: "Regex Interactive Tester", category: "Developer", desc: "Test regular expressions with real-time match highlighting", to: "/tools/regex-tester", icon: Terminal, color: "text-[#34a853] bg-[#e6f4ea]" },
  { name: "Image to Text OCR", category: "Image", desc: "Extract printed and handwritten text from images", to: "/tools/image-to-text", icon: Type, color: "text-[#34a853] bg-[#e6f4ea]" },
];

const CATEGORIES = ["All", "PDF", "Image", "Developer", "Sheets", "Docs", "Media", "Security"];

const Dashboard = () => {
  const { currentUser, toggleFavorite, togglePin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ─── CONVERSION SELECTOR STATE ───
  const [fromFormat, setFromFormat] = useState("PDF");
  const [toFormat, setToFormat] = useState("DOCX");
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [isSelectFileMenuOpen, setIsSelectFileMenuOpen] = useState(false);

  // ─── DRAG & DROP FILE STAGE ───
  const [stagedFile, setStagedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // ─── LIVE TRANSFORMATION DEMO CYCLE ───
  const [demoIndex, setDemoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % LIVE_TRANSFORMATION_DEMOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activeDemo = LIVE_TRANSFORMATION_DEMOS[demoIndex];

  // ─── ACTIVE CATEGORY & SEARCH ───
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiTab, setApiTab] = useState("js");
  const [copiedCode, setCopiedCode] = useState(false);

  // Derive compatible output formats for current fromFormat
  const availableOutputs = useMemo(() => {
    return CONVERSIONS_MAP[fromFormat] || [
      { target: "PDF", toolName: "Convert to PDF", desc: "Compile to standard PDF", to: "/tools/image-to-pdf", badge: "Universal" }
    ];
  }, [fromFormat]);

  // Derive active conversion match
  const activeConversion = useMemo(() => {
    const match = availableOutputs.find(op => op.target === toFormat);
    if (match) return match;
    return availableOutputs[0] || {
      target: "PDF",
      toolName: "Document & Media Studio",
      desc: "Process format client-side",
      to: "/search",
      badge: "Universal"
    };
  }, [availableOutputs, toFormat]);

  const handleSelectFromFormat = (ext) => {
    setFromFormat(ext);
    setIsFromDropdownOpen(false);
    const newOutputs = CONVERSIONS_MAP[ext] || [];
    if (newOutputs.length > 0) {
      setToFormat(newOutputs[0].target);
    }
  };

  const handleSwapFormats = () => {
    if (CONVERSIONS_MAP[toFormat]) {
      const prevFrom = fromFormat;
      setFromFormat(toFormat);
      setToFormat(prevFrom);
    } else {
      toast("Target format is an operation output", { icon: "ℹ️" });
    }
  };

  const processUploadedFile = (file) => {
    if (!file) return;
    setStagedFile(file);

    const ext = file.name.split(".").pop().toUpperCase();
    if (CONVERSIONS_MAP[ext]) {
      setFromFormat(ext);
      const outputs = CONVERSIONS_MAP[ext];
      if (outputs.length > 0) {
        setToFormat(outputs[0].target);
      }
    } else if (file.type.includes("pdf")) {
      setFromFormat("PDF");
      setToFormat("DOCX");
    } else if (file.type.includes("image")) {
      setFromFormat("PNG");
      setToFormat("WEBP");
    } else if (file.type.includes("json")) {
      setFromFormat("JSON");
      setToFormat("CSV");
    } else if (file.type.includes("sheet") || file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
      setFromFormat("CSV");
      setToFormat("JSON");
    }
    toast.success(`Loaded ${file.name}`);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleLaunchConversion = () => {
    if (activeConversion && activeConversion.to) {
      if (stagedFile) {
        navigate(activeConversion.to, { state: { initialFile: stagedFile } });
      } else {
        navigate(activeConversion.to);
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `clipboard-image.${imageType.split('/')[1] || 'png'}`, { type: imageType });
          processUploadedFile(file);
          return;
        }
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        const file = new File([text], "clipboard-text.txt", { type: "text/plain" });
        processUploadedFile(file);
        return;
      }
      toast.error("No image or text found on clipboard.");
    } catch (err) {
      toast.error("Unable to read clipboard. Please grant permissions or choose a file.");
    }
  };

  const loadSampleFile = (type) => {
    let dummyFile;
    if (type === "pdf") {
      dummyFile = new File(["%PDF-1.4 sample content"], "sample_financial_report.pdf", { type: "application/pdf" });
    } else if (type === "image") {
      dummyFile = new File(["dummy image"], "sample_photo.png", { type: "image/png" });
    } else if (type === "json") {
      dummyFile = new File(['{"status":"success","data":{"users":100}}'], "sample_api_response.json", { type: "application/json" });
    }
    if (dummyFile) {
      processUploadedFile(dummyFile);
    }
  };

  const filteredTools = useMemo(() => {
    return ALL_DIRECTORY_TOOLS.filter(tool => {
      const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
      const matchesQuery = !searchQuery.trim() || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const copyCodeSnippet = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeSnippets = {
    js: `// 100% In-Browser WebAssembly File Conversion
import { convertLocal } from '@utilityhub/engine';

const file = document.querySelector('#fileInput').files[0];

// Zero Cloud Upload • Runs locally on CPU/GPU
const result = await convertLocal({
  file,
  from: '${fromFormat.toLowerCase()}',
  to: '${toFormat.toLowerCase()}',
  quality: 0.95
});

// Instant Local Download
result.download();`,
    curl: `# CLI / Local Terminal Engine
npx @utilityhub/cli convert \\
  --input ./document.${fromFormat.toLowerCase()} \\
  --to ${toFormat.toLowerCase()} \\
  --offline-wasm`,
    python: `# Python Local Engine Integration
from utilityhub import LocalConverter

converter = LocalConverter(offline_mode=True)
output = converter.convert(
    input_file="my_file.${fromFormat.toLowerCase()}",
    target_format="${toFormat.toLowerCase()}"
)
output.save("converted_output.${toFormat.toLowerCase()}")`
  };

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#f8f9fa] text-[#202124] flex flex-col items-center">
        
        {/* ══════════════════════════════════════════════════════════════════
            HERO SECTION: ANIMATED DESIGN & CONVERSION SUITE
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full pt-8 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center relative z-20">
          
          {/* Privacy Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#dadce0] text-[#137333] shadow-2xs mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
            <span className="text-xs font-semibold">100% In-Browser Privacy • 0KB Cloud Upload • Zero Telemetry</span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#202124] tracking-tight max-w-4xl leading-[1.15] mb-4"
          >
            Convert & Process Any File — <span className="text-[#1a73e8]">Directly In Your Browser</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-[#5f6368] max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Drop a file and pick what to turn it into. Daily Utility Hub handles 200+ formats across documents, images, spreadsheets, media, and code — completely offline and private.
          </motion.p>

          {/* ══════════════════════════════════════════════════════════════
              ANIMATED CONVERSION TRANSFORMATION FLOW GRAPHIC
          ══════════════════════════════════════════════════════════════ */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="w-full max-w-2xl mb-8 p-3 sm:p-4 rounded-2xl bg-white border border-[#dadce0] shadow-2xs overflow-hidden cursor-pointer"
            onClick={() => navigate(activeDemo.tool)}
            title="Click to launch this utility"
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
              
              {/* Input Staged File */}
              <div className="flex items-center gap-2.5 min-w-0 bg-[#f8f9fa] px-3 py-2 rounded-xl border border-[#dadce0] flex-1">
                <span className="w-7 h-7 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {activeDemo.fromExt}
                </span>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-[#202124] truncate">{activeDemo.fromName}</p>
                  <p className="text-[10px] text-[#5f6368]">{activeDemo.fromSize}</p>
                </div>
              </div>

              {/* Animated Engine Core */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2 py-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] mb-0.5">
                  <Zap size={13} className="text-[#1a73e8] animate-bounce-subtle" />
                  <span className="hidden sm:inline">{activeDemo.engine}</span>
                  <span className="sm:hidden">WASM</span>
                </div>
                <div className="w-20 sm:w-28 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden relative">
                  <motion.div 
                    key={activeDemo.fromExt}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-1/2 h-full bg-gradient-to-r from-[#1a73e8] to-[#34a853] rounded-full"
                  />
                </div>
                <span className="text-[9px] text-[#34a853] font-bold mt-0.5">{activeDemo.speed} local speed</span>
              </div>

              {/* Output File */}
              <div className="flex items-center gap-2.5 min-w-0 bg-[#f8f9fa] px-3 py-2 rounded-xl border border-[#dadce0] flex-1">
                <span className="w-7 h-7 rounded-lg bg-[#e6f4ea] text-[#34a853] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {activeDemo.toExt}
                </span>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-[#202124] truncate">{activeDemo.toName}</p>
                  <p className="text-[10px] text-[#34a853] font-semibold">{activeDemo.toSize}</p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════
              SIGNATURE CONVERTER SELECTOR BAR
          ══════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-3xl bg-white border border-[#dadce0] rounded-3xl p-5 sm:p-7 shadow-xs relative mb-6 text-left"
          >
            {/* The Convert [FROM] to [TO] sentence bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pb-6 border-b border-[#dadce0]">
              <span className="text-lg sm:text-xl font-bold text-[#5f6368] lowercase">convert</span>

              {/* FROM Format Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsFromDropdownOpen(!isFromDropdownOpen);
                    setIsToDropdownOpen(false);
                  }}
                  className="h-12 px-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] hover:border-[#1a73e8] hover:bg-white text-[#202124] font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
                  <span>{fromFormat}</span>
                  <ChevronDown size={16} className="text-[#5f6368]" />
                </button>

                {/* Dropdown Menu */}
                {isFromDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white border border-[#dadce0] rounded-2xl shadow-xl z-50 p-3 text-left max-h-96 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] px-2 py-1 mb-1">
                      Select Input Format
                    </div>
                    {FORMAT_GROUPS.map((grp) => (
                      <div key={grp.category} className="mb-2">
                        <div className="text-[11px] font-bold text-[#80868b] px-2 py-1">{grp.category}</div>
                        <div className="grid grid-cols-2 gap-1">
                          {grp.formats.map((f) => (
                            <button
                              key={f.ext}
                              onClick={() => handleSelectFromFormat(f.ext)}
                              className={`p-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#f1f3f4] transition-colors cursor-pointer ${
                                fromFormat === f.ext ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#202124]"
                              }`}
                            >
                              <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${f.color}`}>
                                {f.ext.slice(0, 3)}
                              </span>
                              <span className="truncate">{f.ext}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interchange Swap Button */}
              <button
                onClick={handleSwapFormats}
                title="Swap formats"
                className="w-10 h-10 rounded-full bg-[#f1f3f4] hover:bg-[#e8f0fe] text-[#5f6368] hover:text-[#1a73e8] border border-[#dadce0] flex items-center justify-center transition-all active:rotate-180 cursor-pointer"
              >
                <ArrowRightLeft size={16} />
              </button>

              <span className="text-lg sm:text-xl font-bold text-[#5f6368] lowercase">to</span>

              {/* TO Format Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsToDropdownOpen(!isToDropdownOpen);
                    setIsFromDropdownOpen(false);
                  }}
                  className="h-12 px-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] hover:border-[#1a73e8] hover:bg-white text-[#202124] font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
                  <span>{toFormat}</span>
                  <ChevronDown size={16} className="text-[#5f6368]" />
                </button>

                {/* TO Dropdown Menu */}
                {isToDropdownOpen && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 sm:w-80 bg-white border border-[#dadce0] rounded-2xl shadow-xl z-50 p-3 text-left max-h-96 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] px-2 py-1 mb-1">
                      Compatible Output Targets
                    </div>
                    <div className="space-y-1">
                      {availableOutputs.map((op) => (
                        <button
                          key={op.target}
                          onClick={() => {
                            setToFormat(op.target);
                            setIsToDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:bg-[#f1f3f4] transition-colors cursor-pointer ${
                            toFormat === op.target ? "bg-[#e6f4ea] text-[#137333]" : "text-[#202124]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-sm block">{op.target}</span>
                            <span className="text-[11px] text-[#5f6368] block mt-0.5">{op.toolName}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#dadce0] text-[#5f6368]">
                            {op.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drag & Drop Live Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-6 p-6 sm:p-8 rounded-2xl dropzone-animated ${isDragging ? "is-dragover" : ""} flex flex-col items-center justify-center text-center cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && processUploadedFile(e.target.files[0])}
              />

              {!stagedFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] flex items-center justify-center mb-3 shadow-2xs">
                    <UploadCloud size={28} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#202124]">
                    Select File or Drop here
                  </h3>
                  <p className="text-xs text-[#5f6368] mt-1 max-w-sm">
                    Upload from your device. Files stay 100% on your machine with zero server roundtrips.
                  </p>
                  
                  {/* Sample file buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-semibold text-[#80868b]">Try Sample:</span>
                    <button
                      onClick={() => loadSampleFile("pdf")}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#dadce0] hover:border-[#1a73e8] text-[#5f6368] hover:text-[#1a73e8] transition-colors"
                    >
                      Sample PDF
                    </button>
                    <button
                      onClick={() => loadSampleFile("image")}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#dadce0] hover:border-[#1a73e8] text-[#5f6368] hover:text-[#1a73e8] transition-colors"
                    >
                      Sample PNG
                    </button>
                    <button
                      onClick={() => loadSampleFile("json")}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#dadce0] hover:border-[#1a73e8] text-[#5f6368] hover:text-[#1a73e8] transition-colors"
                    >
                      Sample JSON
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#dadce0] shadow-2xs" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center font-bold text-xs shrink-0">
                      {stagedFile.name.split('.').pop().toUpperCase()}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#202124] truncate">{stagedFile.name}</p>
                      <p className="text-[11px] text-[#5f6368]">
                        {(stagedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setStagedFile(null)}
                      className="p-2 rounded-lg text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#ea4335] cursor-pointer"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar: Select File CTA + Launch */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Select File Multi-Action Button */}
              <div className="relative w-full sm:w-auto">
                <div className="flex items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 px-6 rounded-l-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer flex-1 sm:flex-none"
                  >
                    <UploadCloud size={18} />
                    <span>Select File</span>
                  </button>
                  <button
                    onClick={() => setIsSelectFileMenuOpen(!isSelectFileMenuOpen)}
                    className="h-12 px-3 rounded-r-full bg-[#1765cc] hover:bg-[#124ea2] text-white border-l border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {isSelectFileMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#dadce0] rounded-2xl shadow-xl z-50 p-2 text-left">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsSelectFileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UploadCloud size={15} className="text-[#1a73e8]" />
                      <span>From My Computer</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePasteClipboard();
                        setIsSelectFileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Copy size={15} className="text-[#34a853]" />
                      <span>Paste from Clipboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory("All");
                        setIsSelectFileMenuOpen(false);
                        const el = document.getElementById("all-tools-grid");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#f1f3f4] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Layers size={15} className="text-[#8e24aa]" />
                      <span>Browse 90+ Tools</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Convert Trigger CTA */}
              <button
                onClick={handleLaunchConversion}
                className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span>Convert {fromFormat} to {toFormat}</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </motion.div>

          {/* ══════════════════════════════════════════════════════════════
              FLOATING INTERACTIVE FORMAT PILLS
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto pt-2">
            <span className="text-xs font-semibold text-[#5f6368] mr-1 flex items-center gap-1">
              <Flame size={14} className="text-[#ea4335]" /> Popular Formats:
            </span>
            {["PDF", "DOCX", "PNG", "WEBP", "JSON", "CSV", "MP4", "MP3", "ZIP", "SVG"].map((ext, idx) => (
              <button
                key={ext}
                onClick={() => handleSelectFromFormat(ext)}
                className={`text-xs px-3 py-1 rounded-full font-bold format-pill cursor-pointer shadow-2xs border transition-all ${
                  fromFormat === ext
                    ? "bg-[#1a73e8] text-white border-[#1a73e8]"
                    : "bg-white text-[#3c4043] border-[#dadce0] hover:border-[#1a73e8] hover:text-[#1a73e8]"
                }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {ext}
              </button>
            ))}
          </div>

        </section>


        {/* ══════════════════════════════════════════════════════════════════
            POPULAR 1-CLICK CONVERSIONS MATRIX
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">
                Popular Conversions
              </h2>
              <p className="text-xs sm:text-sm text-[#5f6368] mt-1">
                Frequently used offline pipelines across developers, students, and businesses.
              </p>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold text-[#1a73e8] hover:underline flex items-center gap-1 shrink-0"
            >
              Explore all 200+ formats <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_CONVERSIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.link}
                  className="p-5 bg-white border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-[0_4px_16px_rgba(26,115,232,0.12)] rounded-2xl transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                        {item.from} → {item.to}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#5f6368] mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#dadce0] flex items-center justify-between text-xs font-semibold text-[#5f6368] group-hover:text-[#1a73e8]">
                    <span>Convert Now</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════════
            WHY CLIENT-SIDE BEATS CLOUD CONVERT (COMPARISON MATRIX)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#dadce0]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6f4ea] border border-[#ceead6] text-[#137333] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Shield size={13} /> The Client-Side Advantage
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#202124] tracking-tight">
              Why Daily Utility Hub Beats Cloud Converters
            </h2>
            <p className="text-xs sm:text-sm text-[#5f6368] mt-2">
              Unlike cloud services that upload your private documents to 3rd-party servers, Daily Utility Hub processes everything directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-6 bg-white border border-[#dadce0] rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] text-[#34a853] flex items-center justify-center mb-3">
                  <Shield size={20} />
                </div>
                <h3 className="font-bold text-sm text-[#202124] mb-1">100% Data Confidentiality</h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Your files never leave your device. Zero cloud uploads, zero telemetry, and zero compliance exposure (HIPAA, GDPR safe).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dadce0] text-[11px] font-bold text-[#137333] flex items-center gap-1">
                <Check size={14} /> 0KB Server Upload
              </div>
            </div>

            <div className="p-6 bg-white border border-[#dadce0] rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mb-3">
                  <Zap size={20} />
                </div>
                <h3 className="font-bold text-sm text-[#202124] mb-1">Instant Execution (0s Queue)</h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Powered by WebAssembly (Wasm) and multithreaded Web Workers running directly on your CPU/GPU hardware.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dadce0] text-[11px] font-bold text-[#1a73e8] flex items-center gap-1">
                <Check size={14} /> No server waiting queues
              </div>
            </div>

            <div className="p-6 bg-white border border-[#dadce0] rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#fef7e0] text-[#b06000] flex items-center justify-center mb-3">
                  <Flame size={20} />
                </div>
                <h3 className="font-bold text-sm text-[#202124] mb-1">Unlimited Free Conversions</h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  No 25-conversions/day quotas, no artificial file size caps, and no paywalls. Convert gigabytes without paying a cent.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dadce0] text-[11px] font-bold text-[#b06000] flex items-center gap-1">
                <Check size={14} /> Unlimited forever
              </div>
            </div>

            <div className="p-6 bg-white border border-[#dadce0] rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#f3e8fd] text-[#7627bb] flex items-center justify-center mb-3">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold text-sm text-[#202124] mb-1">Works 100% Offline</h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Install as a Progressive Web App (PWA). Convert files on airplanes, remote locations, or without internet access.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dadce0] text-[11px] font-bold text-[#7627bb] flex items-center gap-1">
                <Check size={14} /> Full PWA offline mode
              </div>
            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════════
            INTERACTIVE DEVELOPER API / CLI CODE PREVIEW
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#dadce0]">
          <div className="bg-white border border-[#dadce0] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Terminal size={13} /> Developer Ready
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#202124] tracking-tight">
                  Integrate Client-Side Utilities in Your Stack
                </h3>
                <p className="text-xs text-[#5f6368] mt-1">
                  Embed offline-first WebAssembly pipelines into your web applications or run via terminal.
                </p>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex items-center gap-1 bg-[#f1f3f4] p-1 rounded-full border border-[#dadce0] self-start md:self-auto">
                <button
                  onClick={() => setApiTab("js")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    apiTab === "js" ? "bg-white text-[#202124] shadow-2xs" : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  JavaScript / Wasm
                </button>
                <button
                  onClick={() => setApiTab("curl")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    apiTab === "curl" ? "bg-white text-[#202124] shadow-2xs" : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  CLI Terminal
                </button>
                <button
                  onClick={() => setApiTab("python")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    apiTab === "python" ? "bg-white text-[#202124] shadow-2xs" : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative bg-[#1e1e1e] rounded-2xl p-4 sm:p-5 font-mono text-xs text-[#d4d4d4] overflow-x-auto shadow-inner">
              <button
                onClick={() => copyCodeSnippet(codeSnippets[apiTab])}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check size={13} className="text-[#34a853]" /> : <Copy size={13} />}
                <span>{copiedCode ? "Copied" : "Copy Code"}</span>
              </button>
              <pre className="pr-20 leading-relaxed">{codeSnippets[apiTab]}</pre>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════════
            COMPLETE 90+ TOOLS EXPLORER & MATRIX
        ══════════════════════════════════════════════════════════════════ */}
        <section id="all-tools-grid" className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#dadce0]">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">
                All 90+ Utilities & Tools
              </h2>
              <p className="text-xs sm:text-sm text-[#5f6368] mt-1">
                Browse our complete suite of offline-first document, developer, and media processors.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 90+ tools..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#dadce0] rounded-full text-xs text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#1a73e8] text-white shadow-xs"
                    : "bg-white border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon || Zap;
              const isFav = currentUser?.favoriteTools?.includes(tool.to);
              const isPin = currentUser?.pinnedTools?.includes(tool.to);

              return (
                <div
                  key={tool.name}
                  className="p-4 bg-white border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-[0_4px_16px_rgba(26,115,232,0.12)] rounded-2xl transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavorite(tool.to)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav ? "text-[#ea4335] bg-[#fce8e6]" : "text-[#80868b] hover:text-[#ea4335] hover:bg-[#fce8e6]"
                          }`}
                          title="Favorite"
                        >
                          <Heart size={13} fill={isFav ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => togglePin(tool.to)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPin ? "text-[#1a73e8] bg-[#e8f0fe]" : "text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe]"
                          }`}
                          title="Pin to workspace"
                        >
                          <Pin size={13} fill={isPin ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-[#5f6368] mt-1 line-clamp-2 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <Link
                    to={tool.to}
                    className="mt-4 pt-3 border-t border-[#dadce0] flex items-center justify-between text-xs font-semibold text-[#5f6368] group-hover:text-[#1a73e8]"
                  >
                    <span>Launch Utility</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>

        </section>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
