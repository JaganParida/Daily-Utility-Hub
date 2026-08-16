import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Heart, Pin, FileText, ImageIcon, Code2, Type, Table2, FileSpreadsheet, MonitorPlay, FolderArchive, Music
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";

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

const Favorites = () => {
  const { currentUser, toggleFavorite, togglePin } = useAuth();

  const favoriteResolved = (currentUser?.favoriteTools || [])
    .map((path) => {
      for (const [catKey, catTools] of Object.entries(OPERATIONS_MAP)) {
        const found = catTools.find((op) => op.to === path);
        if (found) return { ...found, category: catKey };
      }
      return null;
    })
    .filter(Boolean);

  const favoriteGroups = favoriteResolved.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = {
        label: tool.category.toUpperCase(),
        tools: [],
      };
    }
    acc[tool.category].tools.push(tool);
    return acc;
  }, {});

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#f8f9fa] text-[#202124] pt-8 pb-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dadce0] pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] flex items-center justify-center text-[#ea4335] shadow-2xs">
                <Heart size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">Favorite Utilities</h1>
                <p className="text-xs text-[#5f6368] mt-0.5">Quick access to your preferred tools saved across all devices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#dadce0] text-xs font-semibold text-[#5f6368] shadow-2xs">
                {favoriteResolved.length} {favoriteResolved.length === 1 ? 'utility' : 'utilities'} saved
              </div>
            </div>
          </div>

          {/* Empty State */}
          {favoriteResolved.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-12 sm:p-16 border border-dashed border-[#dadce0] bg-white rounded-3xl text-center shadow-xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] flex items-center justify-center mb-4 text-[#ea4335]">
                <Heart size={32} />
              </div>
              <h3 className="text-base font-bold text-[#202124]">No favorites saved yet</h3>
              <p className="text-xs text-[#5f6368] mt-2 max-w-sm leading-relaxed">
                Click the heart icon on any utility card across the platform to save it to your personal favorites collection.
              </p>
              <Link
                to="/"
                className="mt-6 px-6 py-2.5 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-all shadow-xs active:scale-95"
              >
                Browse All Utilities
              </Link>
            </motion.div>
          ) : (
            /* Groups Deck */
            <div className="space-y-8">
              {Object.keys(favoriteGroups).map((catKey) => {
                const group = favoriteGroups[catKey];
                return (
                  <div key={catKey} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#dadce0] pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a73e8]">{group.label}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {group.tools.map((tool) => (
                        <div key={tool.to} className="card-elevated p-3.5 flex items-center justify-between gap-3 bg-white border border-[#dadce0] hover:border-[#ea4335] rounded-2xl shadow-xs group">
                          <Link
                            to={tool.to}
                            className="flex-1 flex items-center gap-3 min-w-0"
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#fce8e6] group-hover:bg-[#ea4335] group-hover:text-white flex items-center justify-center transition-colors shrink-0 text-[#ea4335]">
                              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#202124] group-hover:text-[#ea4335] transition-colors truncate">{tool.label}</p>
                              <p className="text-[11px] text-[#5f6368] truncate mt-0.5">{tool.result}</p>
                            </div>
                          </Link>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleFavorite(tool.to)}
                              className="p-1.5 rounded-lg text-[#ea4335] hover:bg-[#fce8e6] cursor-pointer"
                              title="Remove from favorites"
                            >
                              <Heart size={13} fill="currentColor" />
                            </button>
                            <button
                              onClick={() => togglePin(tool.to)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                currentUser?.pinnedTools?.includes(tool.to)
                                  ? "text-[#1a73e8] bg-[#e8f0fe]"
                                  : "text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe]"
                              }`}
                              title={currentUser?.pinnedTools?.includes(tool.to) ? "Unpin" : "Pin"}
                            >
                              <Pin size={13} fill={currentUser?.pinnedTools?.includes(tool.to) ? "currentColor" : "none"} />
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
