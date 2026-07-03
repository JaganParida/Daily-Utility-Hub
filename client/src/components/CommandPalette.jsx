import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { Search, ArrowRight } from 'lucide-react';
import { allTools } from '../data/toolCategories';

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-primary/20 text-primary font-bold px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const CommandPalette = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setSelectedIndex(0);
    } else {
      const results = allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 8)); // limit to 8
      setSelectedIndex(0);
    }
  }, [searchQuery]);

  // Keyboard navigation
  useHotkeys('down', (e) => {
    if (!isOpen) return;
    e.preventDefault();
    setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
  }, { enableOnFormTags: true }, [searchResults, isOpen]);

  useHotkeys('up', (e) => {
    if (!isOpen) return;
    e.preventDefault();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, { enableOnFormTags: true }, [searchResults, isOpen]);

  useHotkeys('enter', (e) => {
    if (!isOpen) return;
    e.preventDefault();
    if (searchResults.length > 0 && searchResults[selectedIndex]) {
      handleSelect(searchResults[selectedIndex].to);
    }
  }, { enableOnFormTags: true }, [searchResults, selectedIndex, isOpen]);

  useHotkeys('escape', () => {
    if (isOpen) {
      onClose();
    }
  }, { enableOnFormTags: true }, [isOpen]);

  const handleSelect = (to) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-2xl bg-card/90 backdrop-blur-2xl border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto flex flex-col"
            >
              
              {/* Search Input */}
              <div className="flex items-center px-4 border-b border-border/50 relative">
                <Search size={24} className="text-muted-foreground mr-2 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tools, utilities..."
                  className="w-full bg-transparent text-foreground text-lg md:text-xl h-16 md:h-20 focus:outline-none placeholder:text-muted-foreground/50"
                />
                <div className="hidden sm:flex items-center gap-1 shrink-0 bg-muted px-2 py-1 rounded text-xs font-semibold text-muted-foreground">
                  <span>ESC</span> to close
                </div>
              </div>

              {/* Results */}
              {searchQuery.trim() !== '' && (
                <div className="max-h-[50vh] overflow-y-auto p-2 no-scrollbar">
                  {searchResults.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Search size={40} className="mb-4 opacity-20" />
                      <p className="text-lg">No tools found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {searchResults.map((tool, index) => {
                        const Icon = tool.icon;
                        const isSelected = index === selectedIndex;
                        return (
                          <button
                            key={tool.to}
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => handleSelect(tool.to)}
                            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left group
                              ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}
                            `}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4 
                              ${isSelected ? tool.color : 'bg-muted text-muted-foreground group-hover:' + tool.color}
                            `}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground truncate">
                                <HighlightText text={tool.name} highlight={searchQuery} />
                              </div>
                              <div className="text-sm text-muted-foreground truncate hidden sm:block">
                                <HighlightText text={tool.description} highlight={searchQuery} />
                              </div>
                            </div>
                            <div className={`shrink-0 ml-4 hidden sm:flex items-center text-xs font-semibold transition-opacity
                              ${isSelected ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0'}
                            `}>
                              Press Enter <ArrowRight size={14} className="ml-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
