import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Layers, Pin, Sparkles, Shield, Cpu, Activity,
  ChevronRight, ArrowRight, Search, FileText, Code, CheckCircle,
  AlertCircle, X, Terminal, Server, Folder
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import { toolCategories, allTools } from "../data/toolCategories";

// Cursor-glowing Tool Card Component
const ToolCard = ({ tool, isPinned, togglePin }) => {
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const ToolIcon = tool.icon;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Build tags
  const tags = [];
  const isAi = tool.to.includes("ai-") || tool.description.toLowerCase().includes("ai ");
  if (isAi) {
    tags.push({ label: "AI Engine", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" });
  } else {
    tags.push({ label: "Offline", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" });
  }
  
  if (tool.to.includes("pdf")) {
    tags.push({ label: "PDF", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" });
  } else if (tool.to.includes("compress") || tool.to.includes("converter")) {
    tags.push({ label: "Processor", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="group flex flex-col p-4 rounded-xl border border-border/80 bg-card hover:border-primary/45 transition-all shadow-sm justify-between min-h-[135px] relative overflow-hidden cursor-pointer"
    >
      {/* Radial Hover Glow Accent */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(150px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(233, 81, 68, 0.07), transparent 80%)`
          }}
        />
      )}

      <div className="flex gap-3 relative z-10">
        {/* Icon wrapper */}
        <Link 
          to={tool.to}
          className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center border border-border/40 transition-transform group-hover:scale-105 h-fit ${
            tool.color || "bg-primary/10 text-primary"
          }`}
        >
          <ToolIcon size={15} />
        </Link>

        {/* Text descriptions */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <Link to={tool.to} className="min-w-0 flex-1 block">
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {tool.name}
              </h4>
            </Link>
            
            {/* Pinned toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePin(tool.to);
              }}
              className={`p-1.5 rounded-md hover:bg-muted shrink-0 transition-all cursor-pointer ${
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

      {/* Footer capabilities */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-4 relative z-10">
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
};

const Dashboard = () => {
  const { pinnedTools, togglePin } = useAnalytics();

  // Workbench layout states
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Telemetry statuses
  const [mockStats, setMockStats] = useState({ cpu: 1.2, ram: 42.4, uptime: "0s" });

  // Update telemetry stats dynamically
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - startTime) / 1000);
      const uptimeStr = diffSecs < 60 ? `${diffSecs}s` : `${Math.floor(diffSecs / 60)}m ${diffSecs % 60}s`;
      
      setMockStats({
        cpu: +(Math.random() * 3 + 0.8).toFixed(1),
        ram: +(40 + Math.random() * 5).toFixed(1),
        uptime: uptimeStr
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Filter tools matching category and query
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

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 pt-24 pb-20">
        
        {/* ========================================= */}
        {/* WORKBENCH CONTAINER (Locked Viewport)     */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-[calc(100vh-10rem)] overflow-hidden min-h-[500px]">
          
          {/* LEFT PANEL: Directory folders & telemetry */}
          <aside className="lg:col-span-3 bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden shadow-sm">
            
            {/* Header / Search box */}
            <div className="space-y-4 shrink-0">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={12} className="text-primary animate-pulse" /> Utility Engine
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              {/* Sidebar Search input */}
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Filter utilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 bg-background border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded text-muted-foreground cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list of categories */}
            <div className="flex-1 overflow-y-auto custom-scrollbar my-4 pr-1 space-y-0.5">
              {/* All tab */}
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-primary/10 text-primary border border-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder size={12} />
                  <span>All Utilities</span>
                </span>
                <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground shrink-0">
                  {allTools.length}
                </span>
              </button>

              {Object.keys(toolCategories).map((catName) => {
                const isActive = activeCategory === catName;
                const toolsCount = toolCategories[catName].length;

                return (
                  <button
                    key={catName}
                    onClick={() => setActiveCategory(catName)}
                    className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder size={12} />
                      <span className="truncate">{catName}</span>
                    </span>
                    <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground shrink-0">
                      {toolsCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer Telemetry Stats */}
            <div className="shrink-0 bg-muted/30 border border-border/60 p-3 rounded-xl space-y-2">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Server size={10} /> Local Diagnostics
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-muted-foreground">
                <div>
                  <span className="text-foreground block font-bold">{mockStats.cpu}%</span>
                  <span>CPU engine</span>
                </div>
                <div>
                  <span className="text-foreground block font-bold">{mockStats.ram} MB</span>
                  <span>Sandbox RAM</span>
                </div>
              </div>
              <div className="text-[8px] text-muted-foreground border-t border-border/50 pt-2 flex items-center justify-between">
                <span>Session uptime:</span>
                <span className="font-bold text-foreground">{mockStats.uptime}</span>
              </div>
            </div>

          </aside>

          {/* RIGHT PANEL: Folder workspace tools catalog */}
          <main className="lg:col-span-9 bg-card border border-border/80 rounded-2xl p-5 flex flex-col h-full overflow-hidden shadow-sm">
            {/* Header path breadcrumbs */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <span>Root</span>
                <span>/</span>
                <span className="text-foreground">{activeCategory === "all" ? "All Operations" : activeCategory}</span>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded-lg shrink-0">
                {filteredTools.length} utilities matching
              </div>
            </div>

            {/* Scrollable list of grid cards */}
            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory + searchQuery}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.015 }
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {filteredTools.map((tool) => {
                    const isPinned = pinnedTools.includes(tool.to);
                    return (
                      <ToolCard
                        key={tool.to}
                        tool={tool}
                        isPinned={isPinned}
                        togglePin={togglePin}
                      />
                    );
                  })}

                  {/* Empty state */}
                  {filteredTools.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-center p-12 opacity-60 my-auto">
                      <AlertCircle size={24} className="text-muted-foreground mb-3" />
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">No matching operations</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">
                        Refine your search query or select another directory folder on the left.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

        </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
