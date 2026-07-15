import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Layers, Pin, Sparkles, Shield, Cpu, Activity,
  ChevronRight, ArrowRight, Search, FileText, Code, CheckCircle,
  AlertCircle, UploadCloud, X, HelpCircle, FileCheck
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import { toolCategories, allTools } from "../data/toolCategories";

const Dashboard = () => {
  const { pinnedTools, togglePin, recentTools = [] } = useAnalytics();
  const { currentUser } = useAuth();

  // Selector states (CloudConvert inspired)
  const [actionFilter, setActionFilter] = useState(""); // "" | "convert" | "compress" | "generate" | "ocr" | "edit" | "compare"
  const [targetFilter, setTargetFilter] = useState(""); // "" | "pdf" | "image" | "code" | "spreadsheet" | "text" | "file" | "finance"
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFile, setDetectedFile] = useState(null); // { name, type, size, ext }
  const dropzoneRef = useRef(null);

  // Helper to map tools to Actions and Targets
  const getToolActionAndTarget = (tool) => {
    const to = tool.to.toLowerCase();
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();

    let action = "other";
    let target = "other";

    // Detect Target
    if (to.includes("pdf") || name.includes("pdf")) target = "pdf";
    else if (to.includes("image") || to.includes("crop") || to.includes("watermark") || to.includes("collage") || to.includes("color-extractor") || name.includes("image")) target = "image";
    else if (to.includes("code") || to.includes("json") || to.includes("xml") || to.includes("html") || to.includes("regex") || to.includes("jwt") || to.includes("uuid") || to.includes("cron") || to.includes("sandbox") || name.includes("json") || name.includes("jwt")) target = "code";
    else if (to.includes("sheet") || to.includes("csv") || to.includes("excel") || to.includes("formula") || to.includes("cleaner") || to.includes("pivot") || name.includes("sheet") || name.includes("excel") || name.includes("csv")) target = "spreadsheet";
    else if (to.includes("word") || to.includes("text") || to.includes("grammar") || to.includes("counter") || to.includes("case") || to.includes("font") || to.includes("lorem") || to.includes("diff") || to.includes("transcriber") || to.includes("voice") || to.includes("markdown") || to.includes("readme")) target = "text";
    else if (to.includes("file") || to.includes("vault") || to.includes("share") || to.includes("renamer") || to.includes("zip")) target = "file";
    else if (to.includes("calculator") || to.includes("emi") || to.includes("sip") || to.includes("gst") || to.includes("tax") || to.includes("scheduler") || to.includes("amortization")) target = "finance";

    // Detect Action
    if (to.includes("convert") || to.includes("to-") || to.includes("transcriber") || to.includes("parser") || to.includes("helper") || name.includes("convert") || name.includes("to")) action = "convert";
    else if (to.includes("compress") || to.includes("resize") || to.includes("crop") || to.includes("zip") || to.includes("archiver") || name.includes("compress") || name.includes("resize") || name.includes("zip")) action = "compress";
    else if (to.includes("generator") || to.includes("random") || to.includes("lorem") || to.includes("uuid") || to.includes("secret") || name.includes("generator")) action = "generate";
    else if (to.includes("to-text") || to.includes("transcriber") || to.includes("image-to-markdown") || to.includes("pdf-to-markdown") || to.includes("grammar") || name.includes("ocr") || name.includes("extract")) action = "ocr";
    else if (to.includes("edit") || to.includes("watermark") || to.includes("collage") || to.includes("picker") || to.includes("gradient") || to.includes("builder") || to.includes("designer") || to.includes("mockup") || to.includes("palette") || to.includes("sandbox") || to.includes("presentation") || to.includes("remote") || name.includes("edit")) action = "edit";
    else if (to.includes("diff") || to.includes("similarity") || to.includes("checker") || to.includes("analyzer") || name.includes("compare") || name.includes("diff")) action = "compare";

    return { action, target };
  };

  // Filter tools catalog
  const getFilteredTools = () => {
    let list = allTools;

    if (actionFilter) {
      list = list.filter((t) => getToolActionAndTarget(t).action === actionFilter);
    }
    if (targetFilter) {
      list = list.filter((t) => getToolActionAndTarget(t).target === targetFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredTools = getFilteredTools();

  // Resolve pinned and recent tools
  const pinnedToolObjects = (pinnedTools || [])
    .map((path) => allTools.find((t) => t.to === path))
    .filter(Boolean)
    .slice(0, 6);

  // File drag & drop triggers
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
      const file = e.dataTransfer.files[0];
      detectFileCategory(file);
    }
  };

  const detectFileCategory = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    let detectedTarget = "";

    if (ext === "pdf") detectedTarget = "pdf";
    else if (["png", "jpg", "jpeg", "webp", "svg", "gif", "bmp"].includes(ext)) detectedTarget = "image";
    else if (["xlsx", "xls", "csv", "ods"].includes(ext)) detectedTarget = "spreadsheet";
    else if (["js", "jsx", "ts", "tsx", "py", "go", "java", "cpp", "c", "html", "css", "json", "sh", "yaml", "yml"].includes(ext)) detectedTarget = "code";
    else if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) detectedTarget = "file";
    else if (["txt", "md", "docx", "doc", "rtf"].includes(ext)) detectedTarget = "text";

    setDetectedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      ext: ext.toUpperCase()
    });

    if (detectedTarget) {
      setTargetFilter(detectedTarget);
      setActionFilter(""); // Reset action to show all tools for this format
      toastDetected(file.name, detectedTarget);
    } else {
      toastDetected(file.name, null);
    }
  };

  const toastDetected = (name, target) => {
    const targetNames = {
      pdf: "PDF Document",
      image: "Image File",
      spreadsheet: "Spreadsheet Table",
      code: "Code / Script",
      file: "Archive / File",
      text: "Plain Text Document"
    };

    if (target) {
      // Small visual success trigger
      const cleanTargetName = targetNames[target] || target;
      // Scroll smoothly to catalog
      document.getElementById("catalog-frame")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const clearDetectedFile = () => {
    setDetectedFile(null);
    setTargetFilter("");
    setActionFilter("");
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setTargetFilter("");
    setSearchQuery("");
    setDetectedFile(null);
  };

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 relative pt-24 pb-20">
        
        {/* ========================================= */}
        {/* HERO SECTION: TASK SELECTOR (CloudConvert)*/}
        {/* ========================================= */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative z-10 w-full bg-card/60 dark:bg-card/40 border border-border/80 rounded-[32px] p-6 md:p-12 shadow-xl backdrop-blur-xl transition-all duration-300 mb-8 flex flex-col items-center justify-center text-center ${
            isDragging ? "border-primary bg-primary/5 ring-4 ring-primary/10" : ""
          }`}
        >
          {/* Subtle decoration grids */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-[32px]"></div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-4xl flex flex-col items-center"
          >
            {/* Tagline */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={11} /> Offline-First Utility Hub
            </div>

            {/* CloudConvert style sentence selector */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-snug mb-8 max-w-3xl">
              I want to{" "}
              <span className="inline-block relative mx-1 select-none">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="appearance-none bg-muted/40 hover:bg-muted border border-border/80 hover:border-primary/40 px-3.5 py-1.5 pr-8 rounded-xl font-black text-primary outline-none cursor-pointer text-xl sm:text-2xl md:text-3xl tracking-tight transition-all shadow-sm"
                >
                  <option value="" className="bg-card text-foreground font-semibold text-sm">Select Operation</option>
                  <option value="convert" className="bg-card text-foreground font-semibold text-sm">Convert</option>
                  <option value="compress" className="bg-card text-foreground font-semibold text-sm">Compress & Resize</option>
                  <option value="generate" className="bg-card text-foreground font-semibold text-sm">Generate</option>
                  <option value="ocr" className="bg-card text-foreground font-semibold text-sm">Parse & OCR</option>
                  <option value="edit" className="bg-card text-foreground font-semibold text-sm">Edit & Design</option>
                  <option value="compare" className="bg-card text-foreground font-semibold text-sm">Compare & Diff</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              </span>{" "}
              my{" "}
              <span className="inline-block relative mx-1 select-none">
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="appearance-none bg-muted/40 hover:bg-muted border border-border/80 hover:border-primary/40 px-3.5 py-1.5 pr-8 rounded-xl font-black text-primary outline-none cursor-pointer text-xl sm:text-2xl md:text-3xl tracking-tight transition-all shadow-sm"
                >
                  <option value="" className="bg-card text-foreground font-semibold text-sm">Select Format</option>
                  <option value="pdf" className="bg-card text-foreground font-semibold text-sm">PDF Document</option>
                  <option value="image" className="bg-card text-foreground font-semibold text-sm">Image File</option>
                  <option value="code" className="bg-card text-foreground font-semibold text-sm">Code / Script</option>
                  <option value="spreadsheet" className="bg-card text-foreground font-semibold text-sm">Spreadsheet</option>
                  <option value="text" className="bg-card text-foreground font-semibold text-sm">Plain Text</option>
                  <option value="file" className="bg-card text-foreground font-semibold text-sm">Archive / File</option>
                  <option value="finance" className="bg-card text-foreground font-semibold text-sm">Finance & Numbers</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              </span>
            </h1>

            {/* Dropzone container */}
            <div className="w-full max-w-lg mt-2 relative">
              <AnimatePresence mode="wait">
                {detectedFile ? (
                  <motion.div
                    key="detected-banner"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2 text-left truncate">
                      <FileCheck className="text-primary shrink-0" size={16} />
                      <div className="truncate">
                        <span className="text-foreground font-bold block truncate">{detectedFile.name}</span>
                        <span className="text-[10px] text-muted-foreground block">{detectedFile.size} MB • format: {detectedFile.ext}</span>
                      </div>
                    </div>
                    <button
                      onClick={clearDetectedFile}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Clear File"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-border/80 rounded-2xl bg-muted/10 opacity-70">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <UploadCloud size={14} className="animate-pulse" />
                      <span>Drag and drop a file anywhere here to auto-detect matching tools</span>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ========================================= */}
        {/* FAVORITES SHELF (Pinned Tools Workspace)  */}
        {/* ========================================= */}
        {pinnedToolObjects.length > 0 && (
          <div className="mb-8 bg-card border border-border/80 p-5 rounded-[28px] shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Pin size={13} className="text-primary fill-primary/10" /> Workspace Favorites
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pinnedToolObjects.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <div
                    key={tool.to}
                    className="group flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm"
                  >
                    <Link to={tool.to} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${tool.color || "bg-primary/10 text-primary"}`}>
                        <ToolIcon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">{tool.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => togglePin(tool.to)}
                      className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded cursor-pointer shrink-0 transition-colors ml-2"
                      title="Unpin Favorite"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* CATALOG DIRECTORY GRID                     */}
        {/* ========================================= */}
        <div id="catalog-frame" className="bg-card border border-border/80 p-5 md:p-8 rounded-[32px] shadow-sm space-y-6 scroll-mt-28">
          
          {/* Catalog header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight">
                {actionFilter || targetFilter ? "Filtered Utilities Catalog" : "All Web Utilities Index"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Found {filteredTools.length} matching client-side operations.
              </p>
            </div>

            {/* Catalog inline search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:max-w-xs group">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-background border border-border/85 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
                />
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded text-muted-foreground"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {(actionFilter || targetFilter || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
            {filteredTools.map((tool) => {
              const ToolIcon = tool.icon;
              const isPinned = pinnedTools.includes(tool.to);
              
              // Resolve metadata tags
              const isAi = tool.to.includes("ai-") || tool.description.toLowerCase().includes("ai ");
              const formatTags = [];
              if (isAi) {
                formatTags.push({ label: "AI Engine", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" });
              } else {
                formatTags.push({ label: "100% Offline", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" });
              }

              // Target tag
              const mapping = getToolActionAndTarget(tool);
              const targetNames = {
                pdf: "PDF Doc",
                image: "Image",
                code: "Code",
                spreadsheet: "Spreadsheet",
                text: "Text",
                file: "File",
                finance: "Finance"
              };
              if (mapping.target !== "other") {
                formatTags.push({ label: targetNames[mapping.target] || mapping.target, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
              }

              return (
                <div
                  key={tool.to}
                  className="group flex flex-col p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm justify-between min-h-[140px]"
                >
                  <div className="flex gap-3.5">
                    {/* Icon container */}
                    <Link
                      to={tool.to}
                      className={`p-3 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 h-fit ${
                        tool.color || "bg-primary/10 text-primary"
                      }`}
                    >
                      <ToolIcon size={16} />
                    </Link>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link to={tool.to} className="min-w-0 flex-1 block">
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {tool.name}
                          </h4>
                        </Link>
                        
                        {/* Pin favorite button */}
                        <button
                          onClick={() => togglePin(tool.to)}
                          className={`p-1.5 rounded-lg hover:bg-muted shrink-0 transition-colors cursor-pointer ${
                            isPinned ? "text-primary bg-primary/10 border border-primary/10" : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={isPinned ? "Unpin from favorites" : "Pin as favorite"}
                        >
                          <Pin size={10} className={isPinned ? "fill-current" : ""} />
                        </button>
                      </div>

                      <Link to={tool.to} className="block mt-1">
                        <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">
                          {tool.description}
                        </p>
                      </Link>
                    </div>
                  </div>

                  {/* Badges footer */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {formatTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    
                    <Link
                      to={tool.to}
                      className="text-[10px] font-black text-primary group-hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0"
                    >
                      Launch <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Empty filter state */}
            {filteredTools.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center text-center p-12 my-auto opacity-55 animate-in fade-in duration-200">
                <div className="p-4 bg-muted rounded-2xl text-muted-foreground border border-border/40 mb-3">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">No matching operations</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px] mx-auto">
                    Try changing your action or target options above, or search for another term.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl shadow cursor-pointer transition-transform active:scale-95"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

// ChevronDown component
const ChevronDown = ({ size, ...props }) => (
  <svg
    {...props}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default Dashboard;
