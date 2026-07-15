import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Layers, Pin, Sparkles, Shield, Cpu, Activity,
  ChevronRight, ArrowRight, Search, FileText, Code, CheckCircle,
  AlertCircle, X
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import { toolCategories, allTools } from "../data/toolCategories";

const Dashboard = () => {
  const { pinnedTools, togglePin, recentTools = [] } = useAnalytics();
  const { currentUser } = useAuth();

  // Component States
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("Hello");
  const [geminiKey, setGeminiKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState(false);

  // Load API key statuses
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

  // Filter tools based on Category and Search Query
  const getFilteredTools = () => {
    let list = activeCategory === "all" ? allTools : toolCategories[activeCategory] || [];
    
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

  // Helper to resolve tags
  const getToolTags = (tool) => {
    const tags = [];
    const isAi = tool.to.includes("ai-") || tool.description.toLowerCase().includes("ai ");
    
    if (isAi) {
      tags.push({ label: "AI Engine", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" });
    } else {
      tags.push({ label: "100% Offline", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" });
    }

    if (tool.to.includes("pdf") || tool.name.toLowerCase().includes("pdf")) {
      tags.push({ label: "PDF Doc", color: "bg-red-500/10 text-red-500 border-red-500/20" });
    } else if (tool.to.includes("compress") || tool.to.includes("converter")) {
      tags.push({ label: "Converter", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
    } else if (tool.to.includes("generator") || tool.name.toLowerCase().includes("generator")) {
      tags.push({ label: "Generator", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" });
    }

    return tags;
  };

  // Framer motion variants for clean staggered rendering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.99 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 28 }
    }
  };

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 relative pt-24 pb-20 space-y-8">
        
        {/* ========================================= */}
        {/* WORKBENCH HERO & METRICS                  */}
        {/* ========================================= */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mb-3">
              <Sparkles size={10} /> Workbench Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {greeting}, {currentUser ? currentUser.name || "Developer" : "Guest Developer"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Select a directory folder to filter your local client-side tool workbench.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3.5 py-2 bg-card border border-border/80 rounded-xl shadow-sm text-xs font-bold text-foreground flex items-center gap-1.5">
              <Activity size={13} className="text-primary" />
              <span>{allTools.length} Utilities</span>
            </div>
            
            <div className="px-3.5 py-2 bg-card border border-border/80 rounded-xl shadow-sm text-xs font-bold text-foreground flex items-center gap-1.5">
              <Cpu size={13} className="text-indigo-500" />
              <span>AI Key: {geminiKey || openaiKey ? "Active" : "Offline"}</span>
            </div>

            <div className="px-3.5 py-2 bg-card border border-border/80 rounded-xl shadow-sm text-xs font-bold text-foreground flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-500" />
              <span>100% Sandbox</span>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* WORKSPACE FAVORITES SHELF                 */}
        {/* ========================================= */}
        {pinnedToolObjects.length > 0 && (
          <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Pin size={13} className="text-primary fill-primary/10" /> Workspace Favorites
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pinnedToolObjects.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <div
                    key={tool.to}
                    className="group flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm"
                  >
                    <Link to={tool.to} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${tool.color || "bg-primary/10 text-primary"}`}>
                        <ToolIcon size={14} />
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
        {/* INTERACTIVE WORKBENCH CATALOG             */}
        {/* ========================================= */}
        <div className="bg-card border border-border/80 p-5 md:p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Tabs Filter & Search bar layout */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border/60 pb-4">
            
            {/* Sliding Categories Navigation */}
            <div className="overflow-x-auto no-scrollbar -mx-5 px-5 xl:mx-0 xl:px-0">
              <div className="flex items-center gap-1 pb-1 xl:pb-0 min-w-max">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === "all" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>All Tools</span>
                </button>

                {Object.keys(toolCategories).map((catName) => {
                  const isActive = activeCategory === catName;
                  const toolsCount = toolCategories[catName].length;

                  return (
                    <button
                      key={catName}
                      onClick={() => setActiveCategory(catName)}
                      className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{catName.replace(" Tools", "")}</span>
                      <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded-lg border border-border/40 text-muted-foreground shrink-0">
                        {toolsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog inline search */}
            <div className="flex items-center gap-2 justify-end w-full xl:max-w-xs shrink-0">
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Filter operations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-background border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
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
          </div>

          {/* Tools Grid layout (with springy staggered animations) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchQuery}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]"
            >
              {filteredTools.map((tool) => {
                const ToolIcon = tool.icon;
                const isPinned = pinnedTools.includes(tool.to);
                const tags = getToolTags(tool);

                return (
                  <motion.div
                    key={tool.to}
                    variants={itemVariants}
                    className="group flex flex-col p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/40 hover:border-primary/25 transition-all shadow-sm justify-between min-h-[135px]"
                  >
                    <div className="flex gap-3.5">
                      {/* Icon */}
                      <Link
                        to={tool.to}
                        className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 h-fit ${
                          tool.color || "bg-primary/10 text-primary"
                        }`}
                      >
                        <ToolIcon size={15} />
                      </Link>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link to={tool.to} className="min-w-0 flex-1 block">
                            <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {tool.name}
                            </h4>
                          </Link>
                          
                          {/* Pin Toggle */}
                          <button
                            onClick={() => togglePin(tool.to)}
                            className={`p-1.5 rounded-lg hover:bg-muted shrink-0 transition-colors cursor-pointer ${
                              isPinned ? "text-primary bg-primary/10 border border-primary/10" : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={isPinned ? "Unpin Favorite" : "Pin Favorite"}
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

                    {/* Footer Tags */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {tags.map((tag, idx) => (
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
                  </motion.div>
                );
              })}

              {/* Empty catalog result */}
              {filteredTools.length === 0 && (
                <motion.div 
                  variants={itemVariants}
                  className="col-span-2 flex flex-col items-center justify-center text-center p-12 my-auto opacity-55"
                >
                  <div className="p-4 bg-muted rounded-2xl text-muted-foreground border border-border/40 mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">No matching operations</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px] mx-auto">
                      Refine your search term or select another catalog category tab.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
                    className="mt-4 text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl shadow cursor-pointer transition-transform active:scale-95"
                  >
                    Clear Search Filters
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
