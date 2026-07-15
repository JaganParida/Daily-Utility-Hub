import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Layers, Pin, Sparkles, Shield, Cpu, Activity,
  ChevronRight, ArrowRight, Search, FileText, Code, CheckCircle,
  AlertCircle, UploadCloud, X, File, Settings, HelpCircle
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import { toolCategories, allTools } from "../data/toolCategories";

const Dashboard = () => {
  const { pinnedTools, togglePin } = useAnalytics();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Selector states (CloudConvert style)
  const [selectedFile, setSelectedFile] = useState(null); // { name, size, ext, category }
  const [matchingTools, setMatchingTools] = useState([]);
  const [targetToolPath, setTargetToolPath] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);

  // Map file extension to a category and tools list
  const getToolsForFile = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    
    // Categorize
    let fileCategory = "other";
    if (ext === "pdf") fileCategory = "pdf";
    else if (["png", "jpg", "jpeg", "webp", "svg", "gif", "bmp"].includes(ext)) fileCategory = "image";
    else if (["xlsx", "xls", "csv"].includes(ext)) fileCategory = "spreadsheet";
    else if (["docx", "doc", "odt"].includes(ext)) fileCategory = "document";
    else if (["pptx", "ppt", "odp"].includes(ext)) fileCategory = "presentation";
    else if (["js", "jsx", "ts", "tsx", "py", "go", "java", "cpp", "html", "css", "json", "sh", "yaml", "yml"].includes(ext)) fileCategory = "code";
    else if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) fileCategory = "archive";
    else if (["mp3", "wav", "ogg", "mp4", "mkv", "avi"].includes(ext)) fileCategory = "media";
    else if (["txt", "md"].includes(ext)) fileCategory = "text";

    // Filter tools based on category
    let matches = [];
    if (fileCategory === "pdf") {
      matches = allTools.filter(t => t.to.includes("pdf") || t.name.toLowerCase().includes("pdf") || t.to.includes("watermark"));
    } else if (fileCategory === "image") {
      matches = allTools.filter(t => t.to.includes("image") || t.to.includes("crop") || t.to.includes("watermark") || t.to.includes("collage") || t.to.includes("color-extractor"));
    } else if (fileCategory === "spreadsheet") {
      matches = allTools.filter(t => t.to.includes("sheet") || t.to.includes("excel") || t.to.includes("csv") || t.to.includes("formula") || t.to.includes("pivot"));
    } else if (fileCategory === "document") {
      matches = allTools.filter(t => t.to.includes("docx") || t.to.includes("template") || t.to.includes("metadata") || t.to.includes("word"));
    } else if (fileCategory === "presentation") {
      matches = allTools.filter(t => t.to.includes("ppt") || t.to.includes("slides"));
    } else if (fileCategory === "code") {
      matches = allTools.filter(t => t.to.includes("code") || t.to.includes("json") || t.to.includes("xml") || t.to.includes("html") || t.to.includes("regex") || t.to.includes("jwt") || t.to.includes("uuid") || t.to.includes("cron"));
    } else if (fileCategory === "archive") {
      matches = allTools.filter(t => t.to.includes("zip") || t.to.includes("vault") || t.to.includes("share"));
    } else if (fileCategory === "media") {
      matches = allTools.filter(t => t.to.includes("transcriber") || t.to.includes("audio") || t.to.includes("voice"));
    } else if (fileCategory === "text") {
      matches = allTools.filter(t => t.to.includes("text") || t.to.includes("markdown") || t.to.includes("readme") || t.to.includes("counter") || t.to.includes("diff") || t.to.includes("lorem"));
    }

    // Default fallback
    if (matches.length === 0) {
      matches = allTools.slice(0, 10); // fallback first 10 tools
    }

    return { fileCategory, matches };
  };

  // Handle selected file
  const handleFileSelection = (file) => {
    if (!file) return;
    const { fileCategory, matches } = getToolsForFile(file.name);
    
    setSelectedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      ext: file.name.split(".").pop().toUpperCase(),
      category: fileCategory
    });

    setMatchingTools(matches);
    if (matches.length > 0) {
      setTargetToolPath(matches[0].to);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleLaunchTool = () => {
    if (targetToolPath) {
      // Save pending name in session storage
      sessionStorage.setItem("pending_file_name", selectedFile.name);
      navigate(targetToolPath);
    }
  };

  // Drag and drop event handlers
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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Clean search query
  const getFilteredDirectoryTools = () => {
    if (!searchQuery.trim()) return toolCategories;
    
    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(toolCategories).forEach(([category, tools]) => {
      const matches = tools.filter(
        t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );
      if (matches.length > 0) {
        filtered[category] = matches;
      }
    });

    return filtered;
  };

  const filteredDirectory = getFilteredDirectoryTools();

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 pt-24 pb-20 space-y-12">
        
        {/* ========================================= */}
        {/* HERO HEADER SECTION                       */}
        {/* ========================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            Local File Converter & Web Utilities
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-medium">
            Convert, compress, optimize, and edit documents, images, code, and spreadsheets locally. 100% private in your browser.
          </p>
        </div>

        {/* ========================================= */}
        {/* CLOUDCONVERT DRAG & DROP CORE WORKSPACE    */}
        {/* ========================================= */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative z-10 w-full max-w-4xl mx-auto bg-card border border-border/80 rounded-2xl p-6 md:p-12 shadow-sm transition-all duration-300 ${
            isDragging ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : ""
          }`}
        >
          {/* Hide/Show select vs. file list */}
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="select-zone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner">
                  <UploadCloud size={28} className="animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Select File to Process</h3>
                  <p className="text-xs text-muted-foreground">
                    Drop your PDF, Image, Spreadsheet, or Code file here
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-[#E95144] hover:bg-[#D43D30] text-white font-bold rounded-xl transition-all shadow-md active:scale-98 text-sm cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-list-zone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* CloudConvert active file row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 border border-border/80 rounded-xl">
                  {/* File info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/10">
                      <File size={20} />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-xs font-bold text-foreground truncate">{selectedFile.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{selectedFile.size} • {selectedFile.ext}</p>
                    </div>
                  </div>

                  {/* Operation Select selector */}
                  <div className="flex items-center gap-3 shrink-0 select-none w-full md:w-auto justify-between md:justify-end">
                    <span className="text-xs font-bold text-muted-foreground">to</span>
                    
                    <div className="relative">
                      <select
                        value={targetToolPath}
                        onChange={(e) => setTargetToolPath(e.target.value)}
                        className="appearance-none bg-card hover:bg-muted border border-border/80 px-4 py-2 pr-10 rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer min-w-[180px] shadow-sm"
                      >
                        {matchingTools.map((tool) => (
                          <option key={tool.to} value={tool.to}>
                            {tool.name}
                          </option>
                        ))}
                      </select>
                      <Settings size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setMatchingTools([]);
                      }}
                      className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Big Convert action button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setMatchingTools([]);
                    }}
                    className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground font-bold rounded-xl border border-border/80 text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLaunchTool}
                    className="px-6 py-2.5 bg-[#E95144] hover:bg-[#D43D30] text-white font-bold rounded-xl shadow-md text-xs cursor-pointer active:scale-98 transition-transform"
                  >
                    Process File
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================= */}
        {/* COMPACT BROWSE DIRECTORY INDEX            */}
        {/* ========================================= */}
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Supported File Conversions & Utilities
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse our index of 90+ secure local operations.
              </p>
            </div>

            {/* Flat Directory Search filter */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search utilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all shadow-inner"
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
          </div>

          {/* Directory lists by Category */}
          <div className="space-y-8">
            {Object.entries(filteredDirectory).map(([category, tools]) => {
              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Layers size={11} /> {category}
                  </h3>

                  <div className="bg-card border border-border/60 rounded-xl divide-y divide-border/45 overflow-hidden shadow-sm">
                    {tools.map((tool) => {
                      const ToolIcon = tool.icon;
                      
                      // Resolve tags
                      const isAi = tool.to.includes("ai-") || tool.description.toLowerCase().includes("ai ");

                      return (
                        <div 
                          key={tool.to}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                        >
                          {/* Left name / desc */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center border border-border/40 ${tool.color || "bg-primary/10 text-primary"}`}>
                              <ToolIcon size={14} />
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                <Link to={tool.to} className="hover:text-primary transition-colors">{tool.name}</Link>
                                {isAi && (
                                  <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 tracking-wider">
                                    AI
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[90%]">
                                {tool.description}
                              </p>
                            </div>
                          </div>

                          {/* Right action button */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <Link
                              to={tool.to}
                              className="px-3.5 py-1.5 bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border border-border/80 hover:border-rose-500/20 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span>Launch</span>
                              <ChevronRight size={10} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(filteredDirectory).length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-border rounded-xl opacity-60">
                <AlertCircle size={28} className="text-muted-foreground mb-3" />
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">No matching operations</h4>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">
                  Refine your search query to search across folders.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
