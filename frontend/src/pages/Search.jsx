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
    { name: 'Base64 Converter', to: '/tools/base64-converter' },
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2563eb]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#60a5fa]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <Sparkles size={16} className="text-[#60a5fa]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]">Instant Search</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-white to-[#a1a1aa] bg-clip-text text-transparent"
          >
            What utility do you need?
          </motion.h1>
        </div>

        {/* Search Bar Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-10"
        >
          {/* Animated Glowing border wrapper */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#2563eb]/30 via-[#60a5fa]/50 to-[#2563eb]/30 rounded-2xl blur-sm opacity-75 group-focus-within:opacity-100 transition-opacity duration-300" />
          
          <div className="relative bg-[#09090b]/90 backdrop-blur-xl border border-[#27272a] rounded-2xl flex items-center px-4 sm:px-5">
            <SearchIcon size={22} className="text-[#71717a] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 50+ offline-first developer & file tools..."
              className="w-full bg-transparent text-white text-base sm:text-lg h-14 sm:h-16 focus:outline-none placeholder:text-[#3f3f46]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-[#27272a] rounded-lg text-[#71717a] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Popular Searches / Quick Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-12 text-xs sm:text-sm"
        >
          <span className="text-[#52525b] font-medium mr-1">Popular:</span>
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
              className="px-3 py-1.5 rounded-full bg-[#111116] border border-[#27272a] hover:border-[#2563eb] hover:bg-[#2563eb]/5 text-[#a1a1aa] hover:text-white transition-all duration-200"
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
          className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 border-b border-[#13131a] custom-scrollbar"
        >
          {['All', ...Object.keys(toolCategories)].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === category
                  ? 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20'
                  : 'bg-[#111116] text-[#71717a] hover:text-white border border-[#27272a]'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-60">
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
                className="py-16 text-center text-[#52525b] flex flex-col items-center justify-center bg-[#09090b]/50 border border-[#27272a]/50 rounded-2xl"
              >
                <SearchIcon size={44} className="mb-4 opacity-15 text-white" />
                <p className="text-base font-bold text-white mb-1">No tools found matching "{searchQuery}"</p>
                <p className="text-xs">Try searching for other keywords like "PDF", "Converter", or "Formatter".</p>
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
                        className="block p-4.5 bg-[#09090b]/80 backdrop-blur-md border border-[#27272a] hover:border-[#2563eb]/40 rounded-2xl hover:bg-[#111118]/90 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tool.color || 'bg-[#27272a] text-[#71717a]'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-white group-hover:text-[#60a5fa] transition-colors flex items-center gap-1.5">
                              {tool.name}
                              <ArrowRight size={10} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </h3>
                            <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed line-clamp-2">
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
          className="mt-12 p-4 max-w-xl mx-auto rounded-2xl bg-[#09090b]/60 border border-[#27272a]/50 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb]">
            <Shield size={14} />
          </div>
          <div className="text-[11px] text-[#52525b] leading-relaxed">
            <span className="text-white font-bold">100% Client-Side Search & Processing</span>. All tools execute directly in your browser's local sandbox environment. We never store or track your inputs.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SearchPage;
