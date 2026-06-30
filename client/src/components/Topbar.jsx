import { Menu, Moon, Sun, User, LogOut, Search, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useHotkeys } from 'react-hotkeys-hook';

// Master list of tools for search
const ALL_TOOLS = [
  { name: 'Image Compressor', to: '/tools/image-compressor' },
  { name: 'Image Resizer', to: '/tools/image-resizer' },
  { name: 'Image Cropper', to: '/tools/image-cropper' },
  { name: 'Image Converter', to: '/tools/image-converter' },
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
  { name: 'Gradient Generator', to: '/tools/gradient-generator' }
];

const Topbar = ({ toggleSidebar }) => {
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { user, logout } = useContext(AuthContext);
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

  // Click outside search to close
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
  useHotkeys('ctrl+b, meta+b', (e) => {
    e.preventDefault();
    toggleSidebar();
  }, { enableOnFormTags: true });

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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 glass-header">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Sidebar Toggle / Back Button */}
        {location.pathname !== '/' ? (
          <button 
            onClick={() => navigate('/')}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={24} />
          </button>
        )}
        
        {/* Search Bar */}
        <div ref={searchContainerRef} className="hidden sm:flex items-center relative max-w-md w-full">
          <Search size={18} className="absolute left-3 text-muted-foreground" />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() !== '') setIsSearchOpen(true);
            }}
            placeholder="Search tools... (Ctrl+K)"
            className="w-full bg-muted/50 border border-border/50 text-foreground text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
          />
          
          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
              {searchResults.map((tool) => (
                <button
                  key={tool.to}
                  onClick={() => handleSearchResultClick(tool.to)}
                  className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}
          {isSearchOpen && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl p-4 text-center text-sm text-muted-foreground z-50">
              No tools found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden md:inline-block text-sm font-medium text-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/50">
              Hello, {user.name}
            </span>
            <button 
              onClick={logout}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-all"
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
