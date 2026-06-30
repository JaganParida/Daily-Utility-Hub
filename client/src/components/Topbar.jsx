import { Menu, Moon, Sun, User, LogOut, Search } from 'lucide-react';
import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useHotkeys } from 'react-hotkeys-hook';

const Topbar = ({ toggleSidebar }) => {
  const [theme, setTheme] = useState('light');
  const { user, logout } = useContext(AuthContext);
  const searchInputRef = useRef(null);

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
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
          title="Toggle Sidebar (Ctrl+B)"
        >
          <Menu size={24} />
        </button>
        
        {/* Search Bar */}
        <div className="hidden sm:flex items-center relative max-w-md w-full">
          <Search size={18} className="absolute left-3 text-muted-foreground" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search tools... (Ctrl+K)"
            className="w-full bg-muted/50 border border-border/50 text-foreground text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
          />
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
