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
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] pt-8 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] mb-3 shadow-2xs">
            <Sparkles size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Command Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#202124] tracking-tight">
            Explore All 90+ Tools
          </h1>
          <p className="text-[#5f6368] text-xs sm:text-sm mt-2">
            Instant search and category filtering across our complete client-side processing suite.
          </p>
        </div>

        {/* Google-Style Omnibox Search Bar */}
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="relative bg-white border border-[#dadce0] focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 rounded-full flex items-center px-5 shadow-xs transition-all">
            <SearchIcon size={20} className="text-[#5f6368] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool name, format (PDF, PNG, JSON), or action..."
              className="w-full py-4 text-sm bg-transparent border-none text-[#202124] placeholder-[#80868b] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-[#80868b] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors ml-2 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-[#5f6368] font-medium mr-1">Suggested:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="text-xs px-3 py-1 rounded-full bg-white border border-[#dadce0] text-[#3c4043] hover:text-[#1a73e8] hover:border-[#1a73e8] transition-all font-medium shadow-2xs"
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
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'All'
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : 'bg-white border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            All Utilities ({allTools.length})
          </button>
          {Object.keys(toolCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === category
                  ? 'bg-[#1a73e8] text-white shadow-xs'
                  : 'bg-white border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
              }`}
            >
              {category} ({toolCategories[category].length})
            </button>
          ))}
        </div>

        {/* Results Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
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
                        className="group flex flex-col justify-between p-4 bg-white border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-[0_4px_16px_rgba(26,115,232,0.12)] transition-all rounded-2xl shadow-xs h-full"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] group-hover:bg-[#1a73e8] group-hover:text-white text-[#1a73e8] flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                              <ToolIcon size={20} />
                            </div>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                              {tool.category || 'Utility'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#202124] group-hover:text-[#1a73e8] transition-colors truncate">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-[#5f6368] line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#dadce0] text-xs font-semibold text-[#5f6368] group-hover:text-[#1a73e8] transition-colors">
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
            <div className="text-center py-16 bg-white border border-[#dadce0] rounded-3xl p-8 shadow-xs">
              <SearchIcon size={40} className="mx-auto text-[#80868b] mb-3 opacity-60" />
              <h3 className="text-base font-bold text-[#202124]">No tools matching "{searchQuery}"</h3>
              <p className="text-xs text-[#5f6368] mt-1 max-w-sm mx-auto">
                Try searching for general keywords like "pdf", "image", "json", "code", or "excel".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full transition-all shadow-xs cursor-pointer"
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
