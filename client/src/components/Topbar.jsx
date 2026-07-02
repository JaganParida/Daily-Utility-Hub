import { User, LogOut, Search, ArrowLeft, Layers } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHotkeys } from 'react-hotkeys-hook';

// Master list of tools for search
const ALL_TOOLS = [
  { name: 'Image Compressor', to: '/tools/image-compressor' },
  { name: 'Image Resizer', to: '/tools/image-resizer' },
  { name: 'Image Cropper', to: '/tools/image-cropper' },
  { name: 'Image Converter', to: '/tools/image-converter' },
  { name: 'Image Collage', to: '/tools/image-collage' },
  { name: 'Image to PDF', to: '/tools/image-to-pdf' },
  { name: 'Word Counter', to: '/tools/word-counter' },
  { name: 'Case Converter', to: '/tools/case-converter' },
  { name: 'Lorem Ipsum Generator', to: '/tools/lorem-ipsum' },
  { name: 'Remove Duplicate Lines', to: '/tools/remove-duplicates' },
  { name: 'Sort Lines', to: '/tools/sort-lines' },
  { name: 'Find & Replace', to: '/tools/find-replace' },
  { name: 'UUID Generator', to: '/tools/uuid-generator' },
  { name: 'Password Generator', to: '/tools/password-generator' },
  { name: 'Hash Generator', to: '/tools/hash-generator' },
  { name: 'JWT Decoder', to: '/tools/jwt-decoder' },
  { name: 'Regex Tester', to: '/tools/regex-tester' },
  { name: 'Color Picker', to: '/tools/color-picker' },
  { name: 'Gradient Generator', to: '/tools/gradient-generator' },
  { name: 'API Key Generator', to: '/tools/api-key-generator' },
  { name: 'JSON Formatter', to: '/tools/json-formatter' },
  { name: 'Base64 Converter', to: '/tools/base64-converter' },
  { name: 'URL Converter', to: '/tools/url-converter' },
  { name: 'Bcrypt Generator', to: '/tools/bcrypt-generator' },
  { name: 'Cron Parser', to: '/tools/cron-parser' },
  { name: 'Readme Generator', to: '/tools/readme-generator' },
  { name: 'Code to Image', to: '/tools/code-to-image' },
  { name: 'Image to Text', to: '/tools/image-to-text' },
  { name: 'Text Diff', to: '/tools/text-diff' },
  { name: 'Markdown Editor', to: '/tools/markdown-editor' },
  { name: 'Temp File Share', to: '/tools/temp-share' },
  { name: 'Batch Renamer', to: '/tools/batch-renamer' },
  { name: 'Zip & Unzip', to: '/tools/zip-archiver' },
  { name: 'EMI Calculator', to: '/tools/emi-calculator' },
  { name: 'SIP Calculator', to: '/tools/sip-calculator' },
  { name: 'GST Calculator', to: '/tools/gst-calculator' },
  { name: 'Income Tax', to: '/tools/tax-calculator' }
];

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  
  // Split the text based on the search query, case-insensitive
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-indigo-500/20 text-indigo-400 font-bold px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const Topbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { currentUser: user, logout } = useAuth();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearchOpen(false);
    } else {
      const results = ALL_TOOLS.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearchOpen(true);
    }
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (to) => {
    navigate(to);
    setSearchQuery('');
    setIsSearchOpen(false);
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  // Global Hotkeys
  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, { enableOnFormTags: true });

  useHotkeys('escape', () => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    setIsSearchOpen(false);
  }, { enableOnFormTags: true });


  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-transparent border-b border-border/10 z-50 relative">
      
      {/* LEFT: Logo & Back Button */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {location.pathname !== '/dashboard' && location.pathname !== '/' ? (
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 md:px-3 py-2 rounded-full transition-colors whitespace-nowrap"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline-block">Dashboard</span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Layers size={18} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline-block text-foreground truncate">Daily Utility Hub</span>
          </Link>
        )}
      </div>

      {/* CENTER: Search Bar */}
      <div className="flex-1 flex justify-center px-4 max-w-2xl">
        <div ref={searchContainerRef} className="flex items-center relative w-full group">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-md transition-all duration-500 group-hover:bg-indigo-500/20 opacity-0 focus-within:opacity-100 group-hover:opacity-100"></div>
          <div className="relative w-full flex items-center">
            <Search size={18} className="absolute left-3.5 text-muted-foreground z-10" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() !== '') setIsSearchOpen(true);
              }}
              placeholder="Search all tools... (Ctrl+K)"
              className="w-full bg-card/60 backdrop-blur-md border border-border/60 text-foreground text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground relative z-0"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card/95 backdrop-blur-3xl border border-border/80 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {searchResults.map((tool) => (
                <button
                  key={tool.to}
                  onClick={() => handleSearchResultClick(tool.to)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors border-b border-border/50 last:border-0 group/item"
                >
                  <HighlightText text={tool.name} highlight={searchQuery} />
                  <span className="opacity-0 group-hover/item:opacity-100 text-xs text-indigo-400 font-mono tracking-widest transition-opacity">
                    JUMP TO
                  </span>
                </button>
              ))}
            </div>
          )}
          {isSearchOpen && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card/95 backdrop-blur-3xl border border-border/80 rounded-xl shadow-2xl p-8 text-center text-sm font-medium text-muted-foreground z-50 flex flex-col items-center gap-2">
              <Search size={32} className="text-muted-foreground/30" />
              No tools found matching "<span className="text-foreground">{searchQuery}</span>"
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: User Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline-block text-sm font-medium text-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
              Hello, {user.name}
            </span>
            <button 
              onClick={logout}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-sm"
          >
            <User size={18} />
            <span className="hidden sm:inline-block text-sm">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Topbar;
