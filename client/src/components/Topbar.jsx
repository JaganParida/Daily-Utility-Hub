import { Menu, Moon, Sun, User, LogOut, Search, ArrowLeft, Monitor } from 'lucide-react';
import { useState, useEffect, useContext, useRef } from 'react';
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
  { name: 'Cron Parser', to: '/tools/cron-parser' }
];

const Topbar = ({ toggleSidebar }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme-preference') || 'system');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentUser: user, logout } = useAuth();
  const profileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const themeMenuRef = useRef(null);
  
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
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
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
    setIsThemeMenuOpen(false);
  }, { enableOnFormTags: true });

  // Theme Logic
  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    
    const applyTheme = () => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listener for system theme changes if set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

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
        
        {/* Theme Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button 
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            title="Theme Settings"
          >
            {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
          </button>
          
          {isThemeMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <button
                onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
              >
                <Sun size={16} /> Light
              </button>
              <button
                onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
              >
                <Moon size={16} /> Dark
              </button>
              <button
                onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
              >
                <Monitor size={16} /> System
              </button>
            </div>
          )}
        </div>
        
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
