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

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter tools based on query and active category
  useEffect(() => {
    let results = allTools;

    // Filter by category
    if (activeCategory !== 'All') {
      results = toolCategories[activeCategory] || [];
    }

    // Filter by search query
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
    <div className="min-h-screen bg-transparent text-slate-900 pt-16 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1050px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 mb-3 shadow-2xs"
          >
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Instant Tool Finder</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
          >
            What utility do you need?
          </motion.h1>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            Search across all 90+ offline-first developer, document, and media tools.
          </p>
        </div>

        {/* Search Bar Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-8"
        >
          <div className="relative bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-2xl flex items-center px-4 sm:px-5 shadow-sm transition-all">
            <SearchIcon size={22} className="text-slate-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 90+ tools by name, description, or keyword..."
              className="w-full bg-transparent text-slate-900 text-base sm:text-lg h-14 sm:h-16 focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Popular Searches / Quick Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-10 text-xs sm:text-sm"
        >
          <span className="text-slate-400 font-bold mr-1">Popular:</span>
          {popularSearches.map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              onClick={(e) => {
                if (LOCKED_GUEST_TOOLS.includes(item.to) && !currentUser) {
                  e.preventDefault();
                  navigate('/?authGate=true');
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold transition-all duration-200 shadow-2xs"
            >
              {item.name}
            </Link>
          ))}
        </motion.div>

        {/* Categories Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-200 custom-scrollbar"
        >
          {['All', ...Object.keys(toolCategories)].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === category
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs hover:bg-slate-50'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className={`ml-1.5 text-[10px] ${activeCategory === category ? 'opacity-80' : 'text-slate-400'}`}>
                  {toolCategories[category].length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tools Results Grid */}
        <div className="relative">
          <AnimatePresence mode="popLayout">
            {filteredTools.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-16 text-center text-slate-500 flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-3xl shadow-xs"
              >
                <SearchIcon size={44} className="mb-4 text-slate-300" />
                <p className="text-base font-bold text-slate-900 mb-1">No tools found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Try searching for keywords like "PDF", "Converter", "Compress", or "JSON".</p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5"
              >
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      layout
                      key={tool.to}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group relative"
                    >
                      <Link
                        to={tool.to}
                        onClick={(e) => {
                          if (LOCKED_GUEST_TOOLS.includes(tool.to) && !currentUser) {
                            e.preventDefault();
                            navigate('/?authGate=true');
                          }
                        }}
                        className="block p-4.5 bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl hover:bg-blue-50/20 shadow-2xs hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tool.color || 'bg-slate-100 text-slate-600'}`}>
                            <Icon size={19} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {tool.name}
                              <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Offline client side notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-4 max-w-xl mx-auto rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Shield size={16} />
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            <span className="text-slate-800 font-bold">100% Client-Side Privacy</span>. All searches and file operations run directly in your browser's local runtime. No server uploads or tracking.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SearchPage;
