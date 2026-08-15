import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, X, ArrowRight, Zap, Shield, Sparkles, Command, Heart, Pin } from 'lucide-react';
import { allTools, toolCategories } from '../data/toolCategories';

const SearchPage = () => {
  const { currentUser, toggleFavorite, togglePin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredTools, setFilteredTools] = useState(allTools);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let results = allTools;

    if (activeCategory !== 'All') {
      results = toolCategories[activeCategory] || [];
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.category?.toLowerCase().includes(query)
      );
    }

    setFilteredTools(results);
  }, [searchQuery, activeCategory]);

  const popularSearches = [
    { name: 'JSON Formatter', to: '/tools/json-formatter' },
    { name: 'PDF to Word', to: '/tools/pdf-to-word' },
    { name: 'Image Compressor', to: '/tools/image-compressor' },
    { name: 'JWT Decoder', to: '/tools/jwt-decoder' },
    { name: 'UUID Batch Gen', to: '/tools/uuid-generator' },
    { name: 'File Vault', to: '/tools/file-vault' },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f8fafc] pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-xs">
            <Sparkles size={13} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Command Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Explore All 90+ Tools
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Instant search and category filtering across our complete client-side processing suite.
          </p>
        </div>

        {/* Command Search Bar */}
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="relative bg-[#0f1118] border border-[#1e2235] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl flex items-center px-4 shadow-xl transition-all">
            <SearchIcon size={20} className="text-slate-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool name, format (PDF, PNG, JSON), or action..."
              className="w-full py-4 text-sm bg-transparent border-none text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#181b28] transition-colors ml-2 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Suggested:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#141722] border border-[#1e2235] text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'All'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#141722] border border-[#1e2235] text-slate-300 hover:text-white hover:bg-[#181b28]'
            }`}
          >
            All Utilities ({allTools.length})
          </button>
          {Object.keys(toolCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === category
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#141722] border border-[#1e2235] text-slate-300 hover:text-white hover:bg-[#181b28]'
              }`}
            >
              {category} ({toolCategories[category].length})
            </button>
          ))}
        </div>

        {/* Results Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Showing {filteredTools.length} {filteredTools.length === 1 ? 'utility' : 'utilities'}
            </span>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredTools.map((tool, index) => {
                  const ToolIcon = tool.icon || Zap;

                  return (
                    <motion.div
                      key={tool.to}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                      <Link
                        to={tool.to}
                        className="group flex flex-col justify-between p-4 bg-[#0f1118] border border-[#1e2235] hover:border-indigo-500/50 hover:bg-[#141722] transition-all rounded-2xl shadow-md h-full"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#141722] group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 flex items-center justify-center transition-colors shrink-0 shadow-xs">
                              <ToolIcon size={20} />
                            </div>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#181b28] text-slate-400 border border-[#262b40]">
                              {tool.category || 'Utility'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#1e2235] text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
                          <span>Launch Utility</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0f1118] border border-[#1e2235] rounded-3xl p-8 shadow-xl">
              <SearchIcon size={40} className="mx-auto text-slate-500 mb-3 opacity-50" />
              <h3 className="text-base font-bold text-white">No tools matching "{searchQuery}"</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching for general keywords like "pdf", "image", "json", "code", or "excel".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchPage;
