import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Layers, Pin, Clock, Sparkles, Shield, Cpu, Activity,
  ChevronRight, ArrowRight, Search, FileText, Code, CheckCircle,
  AlertCircle
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import CommandPalette from "../components/CommandPalette";
import { toolCategories, allTools } from "../data/toolCategories";

const Dashboard = () => {
  const { pinnedTools, togglePin, recentTools = [] } = useAnalytics();
  const { currentUser } = useAuth();

  // Dialog and panel states
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all"); // "all" or specific category name
  const [greeting, setGreeting] = useState("Hello");
  const [searchQuery, setSearchQuery] = useState("");

  // Check API keys locally
  const [geminiKey, setGeminiKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState(false);

  useEffect(() => {
    setGeminiKey(!!localStorage.getItem("dev_hub_gemini_key"));
    setOpenaiKey(!!localStorage.getItem("dev_hub_openai_key"));
  }, []);

  // Time-of-day greeting
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Filter tools based on search and category
  const getFilteredTools = () => {
    let list = [];
    if (activeCategory === "all") {
      list = allTools;
    } else {
      list = toolCategories[activeCategory] || [];
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
    .slice(0, 8);

  const recentToolObjects = (recentTools || [])
    .map((path) => allTools.find((t) => t.to === path))
    .filter(Boolean)
    .slice(0, 8);

  // Command Shortcuts presets
  const SHORTCUTS = [
    { name: "Optimize & Refactor Code", to: "/tools/ai-code-playground", action: "Optimize", desc: "Code Playground" },
    { name: "Convert image to Markdown", to: "/tools/ai-image-to-markdown", action: "Vision OCR", desc: "Image to Doc" },
    { name: "Clean hidden document meta", to: "/tools/doc-metadata-cleaner", action: "Clean", desc: "Metadata Stripper" },
    { name: "Generate UUID batches", to: "/tools/uuid-generator", action: "Batch", desc: "UUID Generator" }
  ];

  // Helper to determine capabilities/tags
  const getToolTags = (tool) => {
    const tags = [];
    const isAi = tool.to.includes("ai-") || tool.description.toLowerCase().includes("ai ");
    
    if (isAi) {
      tags.push({ label: "AI Engine", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" });
    } else {
      tags.push({ label: "100% Offline", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" });
    }

    if (tool.to.includes("pdf") || tool.name.toLowerCase().includes("pdf")) {
      tags.push({ label: "PDF Parser", color: "bg-red-500/10 text-red-500 border-red-500/20" });
    } else if (tool.to.includes("compress") || tool.to.includes("converter")) {
      tags.push({ label: "Converter", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
    } else if (tool.to.includes("generator") || tool.name.toLowerCase().includes("generator")) {
      tags.push({ label: "Generator", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" });
    }

    return tags;
  };

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 relative pt-24 pb-20">
        
        {/* ========================================= */}
        {/* WORKBENCH METRICS PANEL (Top Bar Grid)    */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Greeting */}
          <div className="bg-card border border-border/80 p-5 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workbench Session</div>
            <div className="mt-2">
              <h2 className="text-xl font-black text-foreground leading-tight tracking-tight">
                {greeting}, {currentUser ? currentUser.name || "Developer" : "Guest Developer"}
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1">Status: active workspace</p>
            </div>
          </div>

          {/* total tools */}
          <div className="bg-card border border-border/80 p-5 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Operations Index</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{allTools.length}</span>
              <span className="text-xs font-semibold text-muted-foreground">utilities loaded</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">100% verified locally</p>
          </div>

          {/* key status */}
          <div className="bg-card border border-border/80 p-5 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Credentials</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${geminiKey ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                <span className="font-semibold text-foreground">Gemini API:</span>
                <span className="text-muted-foreground">{geminiKey ? "Active" : "Offline"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                <span className="font-semibold text-foreground">OpenAI API:</span>
                <span className="text-muted-foreground">{openaiKey ? "Active" : "Offline"}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Managed securely in browser</p>
          </div>

          {/* offline stats */}
          <div className="bg-card border border-border/80 p-5 rounded-[22px] shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Privacy Guard</div>
            <div className="mt-2">
              <span className="text-lg font-bold text-emerald-500 flex items-center gap-1.5">
                <Shield size={16} /> Sandbox Secure
              </span>
              <p className="text-xs text-muted-foreground mt-1">Zero server logs or uploads</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">AES-256 local integrity</p>
          </div>
        </div>

        {/* ========================================= */}
        {/* MAIN PANEL GRID (Sidebar + Catalog)      */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sticky Sidebar: Navigation folders */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-6">
            <div className="bg-card border border-border/80 p-4 rounded-[24px] shadow-sm">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2.5 mb-3 flex items-center gap-1.5">
                <Layers size={13} /> Directory Index
              </h3>

              <div className="space-y-0.5 max-h-[380px] lg:max-h-none overflow-y-auto pr-1 custom-scrollbar">
                {/* All category link */}
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    activeCategory === "all"
                      ? "bg-primary/10 text-primary border border-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground">
                    {allTools.length}
                  </span>
                </button>

                {Object.keys(toolCategories).map((catName) => {
                  const isActive = activeCategory === catName;
                  const count = toolCategories[catName].length;
                  return (
                    <button
                      key={catName}
                      onClick={() => setActiveCategory(catName)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                      }`}
                    >
                      <span>{catName}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets Menu */}
            <div className="bg-card border border-border/80 p-4 rounded-[24px] shadow-sm space-y-3">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2.5 flex items-center gap-1.5">
                <Sparkles size={13} /> Command Presets
              </h3>
              <div className="space-y-1.5">
                {SHORTCUTS.map((sc, idx) => (
                  <Link
                    key={idx}
                    to={sc.to}
                    className="group block p-2 rounded-xl border border-border/50 hover:border-primary/20 bg-muted/10 hover:bg-muted/30 transition-all text-left"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground group-hover:text-primary">
                      <span>{sc.action}</span>
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs font-black text-foreground truncate mt-0.5">
                      {sc.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Panel: Catalog Directory & Favorites */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Pinned & Recents workbench (Only show if populated) */}
            {(pinnedToolObjects.length > 0 || recentToolObjects.length > 0) && (
              <div className="bg-card border border-border/80 p-5 rounded-[28px] shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                    <Pin size={16} className="text-primary fill-primary/10" /> Workspace Favorites
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Quick relaunch for frequently used active processes.</p>
                </div>

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
                          title="Unpin"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {pinnedToolObjects.length === 0 && recentToolObjects.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.to}
                        to={tool.to}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm"
                      >
                        <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${tool.color || "bg-primary/10 text-primary"}`}>
                          <ToolIcon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">{tool.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catalog Main Frame */}
            <div className="bg-card border border-border/80 p-5 rounded-[28px] shadow-sm space-y-6">
              {/* Header search filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {activeCategory === "all" ? "Full Utilities Index" : `${activeCategory} List`}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Showing {filteredTools.length} compiled operations.</p>
                </div>

                {/* Inline filter search input */}
                <div className="relative w-full sm:max-w-xs group">
                  <input
                    type="text"
                    placeholder="Search category tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
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

              {/* Tools Catalog grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[220px]">
                {filteredTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isPinned = pinnedTools.includes(tool.to);
                  const tags = getToolTags(tool);

                  return (
                    <div
                      key={tool.to}
                      className="group flex flex-col p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm justify-between"
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <Link
                          to={tool.to}
                          className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 h-fit ${
                            tool.color || "bg-primary/10 text-primary"
                          }`}
                        >
                          <ToolIcon size={16} />
                        </Link>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link to={tool.to} className="min-w-0 flex-1 block">
                              <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                                {tool.name}
                              </h4>
                            </Link>
                            {/* Pin / Favorite toggle */}
                            <button
                              onClick={() => togglePin(tool.to)}
                              className={`p-1.5 rounded-lg hover:bg-muted shrink-0 transition-colors cursor-pointer ${
                                isPinned ? "text-primary bg-primary/10 border border-primary/10" : "text-muted-foreground hover:text-foreground"
                              }`}
                              title={isPinned ? "Unpin tool" : "Pin tool"}
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

                      {/* Capabilities badges footer */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tag.color}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                        <Link
                          to={tool.to}
                          className="text-[10px] font-black text-primary group-hover:text-primary/80 transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          Launch <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredTools.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center text-center p-8 my-auto opacity-50 select-none">
                    <div className="p-3.5 bg-muted rounded-2xl text-muted-foreground border border-border/40">
                      <AlertCircle size={24} />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">No matching operations</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">
                        Refine your search term or select another folder in the directory index.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </PageTransition>
  );
};

// Quick helper icon for removal in favourites
const X = ({ size, ...props }) => (
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
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default Dashboard;
