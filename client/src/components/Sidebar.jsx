import { NavLink } from 'react-router-dom';
import { Home, Type, Hash, Key, Layers, AlignLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const categories = [
    {
      title: 'General',
      links: [
        { name: 'Dashboard', to: '/', icon: Home },
      ]
    },
    {
      title: 'Text Tools',
      links: [
        { name: 'Word Counter', to: '/tools/word-counter', icon: Type },
        { name: 'Case Converter', to: '/tools/case-converter', icon: Type },
        { name: 'Lorem Ipsum', to: '/tools/lorem-ipsum', icon: AlignLeft },
        { name: 'Remove Duplicates', to: '/tools/remove-duplicates', icon: Layers },
        { name: 'Sort Lines', to: '/tools/sort-lines', icon: Layers },
        { name: 'Find & Replace', to: '/tools/find-replace', icon: Type },
      ]
    },
    {
      title: 'Developer Tools',
      links: [
        { name: 'UUID Generator', to: '/tools/uuid-generator', icon: Hash },
        { name: 'Password Generator', to: '/tools/password-generator', icon: Key },
        { name: 'Hash Generator', to: '/tools/hash-generator', icon: Hash },
        { name: 'JWT Decoder', to: '/tools/jwt-decoder', icon: Hash },
        { name: 'Regex Tester', to: '/tools/regex-tester', icon: Type },
        { name: 'Color Picker', to: '/tools/color-picker', icon: Layers },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-card md:bg-transparent md:border-r border-border transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Daily Utility Hub</span>
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map((category, idx) => (
            <div key={idx}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon size={18} />
                      <span>{link.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
