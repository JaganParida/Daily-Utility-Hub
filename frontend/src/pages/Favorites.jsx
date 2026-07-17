import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Heart, Pin, FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay, FolderArchive, Music
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";

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
    { label: "Notes Prompter", result: "Paced Prompter", to: "/tools/prompter-timer" },
    { label: "Theme Swatches", result: "Projector Colors", to: "/tools/ppt-palette-generator" },
    { label: "Voice Remote", result: "Voice Nav Control", to: "/tools/presentation-remote" },
    { label: "Slide Whiteboard", result: "Sketch Drafts", to: "/tools/slide-mockup" },
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

const Favorites = () => {
  const { currentUser, togglePin, toggleFavorite } = useAuth();

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

  const favoriteResolved = (currentUser?.favoriteTools || [])
    .map(path => getToolCategoryAndDetails(path))
    .filter(Boolean);

  const favoriteGroups = favoriteResolved.reduce((groups, tool) => {
    if (!groups[tool.categoryKey]) {
      groups[tool.categoryKey] = {
        label: tool.categoryLabel,
        icon: tool.icon,
        tools: []
      };
    }
    groups[tool.categoryKey].tools.push(tool);
    return groups;
  }, {});

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#060608] text-white pt-20 px-6 sm:px-12 lg:px-20 pb-16">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col gap-2 border-b border-zinc-800 pb-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Favorite Workspaces</h1>
                <p className="text-xs text-zinc-500 font-medium">Quick access to your most frequently used utilities</p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {favoriteResolved.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 bg-[#09090b] text-center"
            >
              <Heart className="text-zinc-700 w-12 h-12 mb-4" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">No favorites selected</h3>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-sm leading-relaxed">
                Hover over any utility card on the main dashboard and click the heart icon to add it here.
              </p>
              <Link
                to="/"
                className="mt-6 px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] uppercase tracking-wider transition-colors"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          ) : (
            /* Groups Deck */
            <div className="space-y-8 text-left">
              {Object.keys(favoriteGroups).map((catKey) => {
                const group = favoriteGroups[catKey];
                const GroupIcon = group.icon;
                return (
                  <div key={catKey} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
                      <GroupIcon size={12} className="text-[#52525b]" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{group.label}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.tools.map((tool) => (
                        <div key={tool.to} className="group relative flex items-center bg-[#111116] border border-[#27272a] hover:border-rose-500/30 hover:bg-rose-500/[0.02] transition-all rounded-xl overflow-hidden">
                          <Link
                            to={tool.to}
                            className="flex-1 flex items-center gap-3 px-3.5 py-3"
                          >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 group-hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0">
                              <ArrowRight size={11} className="text-zinc-500 group-hover:text-rose-500 transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] sm:text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{tool.label}</p>
                              <p className="text-[9px] text-[#3f3f46] group-hover:text-[#71717a] transition-colors truncate">{tool.result}</p>
                            </div>
                          </Link>
                          {/* Heart/Pin toggles (visible only on hover) */}
                          <div className="flex items-center gap-1.5 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(tool.to);
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:text-rose-400 cursor-pointer shrink-0"
                              title="Remove Favorite"
                            >
                              <Heart size={11} fill="currentColor" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(tool.to);
                              }}
                              className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                currentUser?.pinnedTools?.includes(tool.to)
                                  ? 'text-[#2563eb] hover:text-[#1d4ed8]'
                                  : 'text-[#3f3f46] hover:text-[#2563eb] hover:bg-[#ffffff04]'
                              }`}
                              title={currentUser?.pinnedTools?.includes(tool.to) ? "Unpin" : "Pin"}
                            >
                              <Pin size={11} fill={currentUser?.pinnedTools?.includes(tool.to) ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Favorites;
