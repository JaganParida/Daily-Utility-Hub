import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, X, ArrowRight, Zap, Sparkles, 
  FileText, ImageIcon, Code2, Type, FileSpreadsheet, 
  Table2, MonitorPlay, Lock, Calculator, Layers, BookOpen,
  ChevronLeft, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { allTools, toolCategories } from '../data/toolCategories';

const CATEGORY_ICONS = {
  'All': Zap,
  'PDF Tools': FileText,
  'Image Tools': ImageIcon,
  'Developer Tools': Code2,
  'Text Tools': Type,
  'Word & Docs Tools': FileSpreadsheet,
  'Excel & Sheets Tools': Table2,
  'PowerPoint & Slides Tools': MonitorPlay,
  'Student & Docs': BookOpen,
  'Finance & Productivity': Calculator,
  'File & Storage Tools': Lock
};

const POPULAR_SEARCHES = [
  { name: 'PDF to Word', to: '/tools/pdf-to-word' },
  { name: 'JSON Formatter', to: '/tools/json-formatter' },
  { name: 'Image Compressor', to: '/tools/image-compressor' },
  { name: 'Merge PDF', to: '/tools/pdf-merge' },
  { name: 'Split PDF', to: '/tools/pdf-split' },
  { name: 'JWT Decoder', to: '/tools/jwt-decoder' },
  { name: 'UUID Generator', to: '/tools/uuid-generator' },
  { name: 'File Vault', to: '/tools/file-vault' }
];

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const inputRef = useRef(null);
  const searchBoxRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check scroll positions for left/right arrow buttons
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 5;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -280 : 280;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleCategorySelect = (category, event) => {
    setActiveCategory(category);
    setSelectedIndex(0);
    // Smooth scroll the clicked button into view
    if (event?.currentTarget) {
      event.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  // Instant zero-lag synchronous memoized filter
  const filteredTools = useMemo(() => {
    let list = allTools;

    if (activeCategory !== 'All') {
      list = toolCategories[activeCategory] || [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((tool) =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      (tool.category && tool.category.toLowerCase().includes(query))
    );
  }, [searchQuery, activeCategory]);

  // Autocomplete dropdown results
  const dropdownResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredTools.slice(0, 6);
  }, [searchQuery, filteredTools]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
    if (searchQuery.trim()) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  // Keyboard navigation on input
  const handleInputKeyDown = (e) => {
    const currentList = dropdownResults.length > 0 ? dropdownResults : filteredTools;
    const totalCount = Math.min(currentList.length, 12);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalCount > 0) {
        setSelectedIndex((prev) => (prev + 1) % totalCount);
        setIsDropdownOpen(true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalCount > 0) {
        setSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
        setIsDropdownOpen(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentList.length > 0 && currentList[selectedIndex]) {
        setIsDropdownOpen(false);
        navigate(currentList[selectedIndex].to);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] pt-4 sm:pt-6 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] mb-3 shadow-2xs">
            <Sparkles size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">All-in-One Utility Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#202124] tracking-tight leading-tight">
            Explore All 90+ Tools
          </h1>
          <p className="text-[#5f6368] text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Fast, secure, 100% client-side file and developer utilities in your browser.
          </p>
        </div>

        {/* Omnibox Search Bar with Autocomplete Dropdown */}
        <div ref={searchBoxRef} className="max-w-2xl mx-auto space-y-3 relative z-30">
          <div className={`relative bg-white border transition-all duration-200 shadow-xs flex items-center px-4 sm:px-5 ${
            isDropdownOpen && dropdownResults.length > 0
              ? 'border-[#1a73e8] rounded-t-2xl border-b-transparent shadow-md'
              : 'border-[#dadce0] focus-within:border-[#1a73e8] focus-within:ring-3 focus-within:ring-[#1a73e8]/15 rounded-2xl'
          }`}>
            <SearchIcon size={18} className="text-[#1a73e8] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search tools by name, action (compress, merge, convert), or format..."
              className="w-full py-3.5 sm:py-4 text-xs sm:text-sm bg-transparent border-none text-[#202124] placeholder-[#80868b] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-[#80868b] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors ml-2 cursor-pointer"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Panel */}
          {isDropdownOpen && dropdownResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-[#1a73e8] border-t-0 rounded-b-2xl shadow-[0_12px_28px_rgba(60,64,67,0.18)] overflow-hidden z-40 p-2 space-y-1">
              {dropdownResults.map((tool, idx) => {
                const ToolIcon = tool.icon || Zap;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={tool.to}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(tool.to);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8f0fe] border border-[#d2e3fc] shadow-2xs'
                        : 'hover:bg-[#f1f3f4] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                        isSelected
                          ? 'bg-[#1a73e8] text-white'
                          : 'bg-[#e8f0fe] text-[#1a73e8] group-hover:bg-[#1a73e8] group-hover:text-white'
                      }`}>
                        <ToolIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold transition-colors truncate ${
                          isSelected ? 'text-[#1a73e8]' : 'text-[#202124] group-hover:text-[#1a73e8]'
                        }`}>
                          {tool.name}
                        </p>
                        <p className="text-[11px] text-[#5f6368] truncate mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isSelected 
                          ? 'bg-white text-[#1a73e8] border-[#d2e3fc]' 
                          : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                      }`}>
                        {tool.category || "Utility"}
                      </span>
                      <CornerDownLeft size={13} className={`transition-all ${
                        isSelected ? 'text-[#1a73e8] opacity-100' : 'text-[#80868b] opacity-0 group-hover:opacity-100'
                      }`} />
                    </div>
                  </button>
                );
              })}

              <div className="px-3 py-1.5 border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#80868b] bg-[#f8f9fa] -mx-2 -mb-2 rounded-b-xl">
                <span>Navigate with <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">↓</kbd></span>
                <span>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">Enter</kbd> to open</span>
              </div>
            </div>
          )}

          {/* Suggested Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-[11px] text-[#5f6368] font-bold mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-[#dadce0] text-[#3c4043] hover:text-[#1a73e8] hover:border-[#1a73e8] hover:bg-[#f8fbff] transition-all font-semibold shadow-2xs"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Professional Scrollable Category Navigation with Arrow Controls & Fade Edges */}
        <div className="relative w-full group/nav">
          
          {/* Left Arrow Button with Gradient Backdrop */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-0 bg-gradient-to-r from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent">
              <button
                onClick={() => handleScroll('left')}
                className="w-8 h-8 rounded-full bg-white border border-[#dadce0] text-[#202124] shadow-md flex items-center justify-center hover:bg-[#f1f3f4] hover:text-[#1a73e8] transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Scroll left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}

          {/* Scrollable Pills Container (Zero Scrollbar) */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Utilities Pill */}
            <button
              onClick={(e) => handleCategorySelect('All', e)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeCategory === 'All'
                  ? 'bg-[#1a73e8] text-white shadow-xs ring-2 ring-[#1a73e8]/20'
                  : 'bg-white border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] hover:border-[#bdc1c6]'
              }`}
            >
              <Zap size={14} className={activeCategory === 'All' ? 'text-white' : 'text-[#1a73e8]'} />
              <span>All Utilities</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeCategory === 'All' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
              }`}>
                {allTools.length}
              </span>
            </button>

            {/* Category Pills */}
            {Object.keys(toolCategories).map((category) => {
              const Icon = CATEGORY_ICONS[category] || Layers;
              const count = toolCategories[category].length;
              const isSelected = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={(e) => handleCategorySelect(category, e)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a73e8] text-white shadow-xs ring-2 ring-[#1a73e8]/20'
                      : 'bg-white border border-[#dadce0] text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] hover:border-[#bdc1c6]'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : 'text-[#5f6368]'} />
                  <span>{category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button with Gradient Backdrop */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-0 bg-gradient-to-l from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent">
              <button
                onClick={() => handleScroll('right')}
                className="w-8 h-8 rounded-full bg-white border border-[#dadce0] text-[#202124] shadow-md flex items-center justify-center hover:bg-[#f1f3f4] hover:text-[#1a73e8] transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Scroll right"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

        </div>

        {/* Results Matrix & Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 border-b border-[#dadce0] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
              {activeCategory === 'All' ? 'All Tools' : activeCategory} ({filteredTools.length})
            </span>

            {searchQuery && (
              <span className="text-xs text-[#5f6368]">
                Filtered for "<span className="font-bold text-[#202124]">{searchQuery}</span>"
              </span>
            )}
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredTools.map((tool, idx) => {
                const ToolIcon = tool.icon || Zap;
                const isSelected = (!isDropdownOpen && searchQuery.trim() !== '' && idx === selectedIndex);

                return (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className={`group flex flex-col justify-between p-4 sm:p-5 bg-white border transition-all duration-200 rounded-2xl shadow-2xs hover:-translate-y-0.5 ${
                      isSelected 
                        ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-md' 
                        : 'border-[#dadce0] hover:border-[#1a73e8] hover:shadow-[0_4px_18px_rgba(26,115,232,0.12)]'
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon + Category Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 shadow-2xs ${
                          isSelected
                            ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                            : 'bg-[#e8f0fe] border-[#d2e3fc] group-hover:bg-[#1a73e8] group-hover:text-white text-[#1a73e8]'
                        }`}>
                          <ToolIcon size={20} />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                          {tool.category || 'Utility'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className={`text-sm sm:text-base font-bold transition-colors truncate ${
                        isSelected ? 'text-[#1a73e8]' : 'text-[#202124] group-hover:text-[#1a73e8]'
                      }`}>
                        {tool.name}
                      </h3>
                      <p className="text-xs text-[#5f6368] line-clamp-2 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    {/* Footer Launch Action */}
                    <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[#dadce0]/70 text-xs font-semibold text-[#5f6368] group-hover:text-[#1a73e8] transition-colors">
                      <span className="font-bold">Open Tool</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white border border-[#dadce0] rounded-3xl p-8 shadow-xs">
              <SearchIcon size={40} className="mx-auto text-[#80868b] mb-3 opacity-60" />
              <h3 className="text-base font-bold text-[#202124]">No tools matching "{searchQuery}"</h3>
              <p className="text-xs text-[#5f6368] mt-1 max-w-sm mx-auto">
                Try searching for general keywords like "pdf", "image", "json", "word", or "code".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 btn-google-primary text-xs py-2 px-5 shadow-xs"
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
