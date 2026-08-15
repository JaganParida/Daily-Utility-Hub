import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, X, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { allTools, toolCategories } from '../data/toolCategories';

const LOCKED_GUEST_TOOLS = [
  '/tools/ai-pdf-to-markdown',
  '/tools/ai-image-to-markdown',
  '/tools/google-search-builder',
  '/tools/regex-tester',
  '/tools/ai-code-playground',
  '/tools/cron-parser',
  '/tools/audio-video-transcriber'
];

const SearchPage = () => {
  const { currentUser } = useAuth();
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
          tool.description.toLowerCase().includes(query)
      );
    }

    setFilteredTools(results);
  }, [searchQuery, activeCategory]);

  const popularSearches = [
    { name: 'JSON Formatter', to: '/tools/json-formatter' },
    { name: 'Image Compressor', to: '/tools/image-compressor' },
    { name: 'JWT Decoder', to: '/tools/jwt-decoder' },
    { name: 'UUID Generator', to: '/tools/uuid-generator' },
    { name: 'PDF to Word', to: '/tools/pdf-to-word' },
  ];

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] pt-16 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background emerald ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00a884]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1050px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] mb-3 shadow-xs"
          >
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Instant Tool Directory</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-[#e9edef] tracking-tight"
          >
            What utility do you need?
          </motion.h1>
          <p className="text-[#8696a0] text-sm mt-2 max-w-md mx-auto">
            Instant fuzzy search across all 90+ client-side developer, document, and media tools.
          </p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-8"
        >
          <div className="relative bg-[#111b21] border border-[#2a3942] focus-within:border-[#00a884] focus-within:ring-2 focus-within:ring-[#00a884]/25 rounded-2xl flex items-center px-4 sm:px-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <SearchIcon size={22} className="text-[#8696a0] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g. PDF split, JSON, watermark, compress)..."
              className="w-full py-4 text-sm sm:text-base bg-transparent border-none text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors ml-2 cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Popular searches pill row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <span className="text-xs text-[#8696a0] font-medium mr-1">Popular:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#8696a0] hover:text-[#00a884] hover:border-[#00a884]/60 transition-all font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Category Pills Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'All'
                ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/25'
                : 'bg-[#202c33] border border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
            }`}
          >
            All Utilities ({allTools.length})
          </button>
          {Object.keys(toolCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === category
                  ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/25'
                  : 'bg-[#202c33] border border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
              }`}
            >
              {category} ({toolCategories[category].length})
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8696a0]">
              Showing {filteredTools.length} {filteredTools.length === 1 ? 'utility' : 'utilities'}
            </span>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <AnimatePresence>
                {filteredTools.map((tool, index) => {
                  const ToolIcon = tool.icon || Zap;
                  const isLocked = !currentUser && LOCKED_GUEST_TOOLS.includes(tool.to);

                  return (
                    <motion.div
                      key={tool.to}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <Link
                        to={tool.to}
                        className="group flex flex-col justify-between p-4 bg-[#111b21] border border-[#222d34] hover:border-[#00a884]/80 hover:bg-[#202c33] transition-all rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] h-full"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-[#202c33] group-hover:bg-[#00a884] group-hover:text-white text-[#00a884] flex items-center justify-center transition-colors shrink-0">
                              <ToolIcon size={18} />
                            </div>
                            {isLocked && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30">
                                Auth Required
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-[#e9edef] group-hover:text-[#00a884] transition-colors truncate">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-[#8696a0] line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#222d34] text-[11px] text-[#8696a0] group-hover:text-[#00a884] transition-colors">
                          <span className="font-semibold">{tool.category || 'Utility'}</span>
                          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#111b21] border border-[#222d34] rounded-2xl p-8 shadow-xs">
              <SearchIcon size={36} className="mx-auto text-[#8696a0] mb-3 opacity-50" />
              <h3 className="text-base font-bold text-[#e9edef]">No tools matching "{searchQuery}"</h3>
              <p className="text-xs text-[#8696a0] mt-1 max-w-sm mx-auto">
                Try searching for general keywords like "pdf", "image", "json", "code", or "formatter".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 px-4 py-2 bg-[#00a884] hover:bg-[#25d366] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#00a884]/25 cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-6 bg-[#111b21] border border-[#222d34] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#e9edef]">100% Client-Side Processing</h4>
              <p className="text-xs text-[#8696a0] mt-0.5">
                Every utility runs directly on your device CPU/GPU. No files are uploaded to any server.
              </p>
            </div>
          </div>
          <Link
            to="/privacy-policy"
            className="px-4 py-2 bg-[#202c33] hover:bg-[#222e35] text-[#e9edef] hover:text-[#00a884] text-xs font-bold rounded-xl border border-[#2a3942] transition-colors shrink-0"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
