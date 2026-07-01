import { NavLink } from 'react-router-dom';
import { Home, Type, Hash, Key, Layers, AlignLeft, ChevronRight, X, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText, Braces, Search } from 'lucide-react';
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
      title: 'Image Tools',
      links: [
        { name: 'Image Compressor', to: '/tools/image-compressor', icon: ImageIcon },
        { name: 'Image Resizer', to: '/tools/image-resizer', icon: Expand },
        { name: 'Image Cropper', to: '/tools/image-cropper', icon: Crop },
        { name: 'Image Converter', to: '/tools/image-converter', icon: ArrowRightLeft },
        { name: 'Image Collage', to: '/tools/image-collage', icon: LayoutGrid },
        { name: 'Image to PDF', to: '/tools/image-to-pdf', icon: FileText },
      ]
    },
    {
      title: 'Text Tools',
      links: [
        { name: 'Word Counter', to: '/tools/word-counter', icon: Type },
        { name: 'Case Converter', to: '/tools/case-converter', icon: Type },
        { name: 'Font Converter', to: '/tools/font-converter', icon: Type },
        { name: 'Lorem Ipsum', to: '/tools/lorem-ipsum', icon: AlignLeft },
        { name: 'Text Line Editor', to: '/tools/text-line-editor', icon: Layers },
        { name: 'Find & Replace', to: '/tools/find-replace', icon: Type },
      ]
    },
    {
      title: 'Developer Tools',
      links: [
        { name: 'API Key Generator', to: '/tools/api-key-generator', icon: Key },
        { name: 'JSON Formatter', to: '/tools/json-formatter', icon: Layers },
        { name: 'Base64 Converter', to: '/tools/base64-converter', icon: Hash },
        { name: 'URL Converter', to: '/tools/url-converter', icon: Type },
        { name: 'Bcrypt Generator', to: '/tools/bcrypt-generator', icon: Key },
        { name: 'Cron Parser', to: '/tools/cron-parser', icon: Layers },
        { name: 'UUID Generator', to: '/tools/uuid-generator', icon: Hash },
        { name: 'Password Generator', to: '/tools/password-generator', icon: Key },
        { name: 'Hash Generator', to: '/tools/hash-generator', icon: Hash },
        { name: 'JWT Decoder', to: '/tools/jwt-decoder', icon: Hash },
        { name: 'Regex Tester', to: '/tools/regex-tester', icon: Type },
        { name: 'Color Picker', to: '/tools/color-picker', icon: Layers },
        { name: 'Gradient Generator', to: '/tools/gradient-generator', icon: Layers },
      ]
    },
    {
      title: 'PDF Tools',
      links: [
        { name: 'Merge PDF', to: '/tools/pdf-merge', icon: FileText },
        { name: 'Split PDF', to: '/tools/pdf-split', icon: FileText },
        { name: 'Watermark PDF', to: '/tools/pdf-watermark', icon: FileText },
        { name: 'Lock PDF', to: '/tools/pdf-lock', icon: FileText },
        { name: 'Unlock PDF', to: '/tools/pdf-unlock', icon: FileText },
        { name: 'Edit Metadata', to: '/tools/pdf-metadata', icon: FileText },
        { name: 'Extract Text', to: '/tools/pdf-to-text', icon: FileText },
      ]
    },
    {
      title: 'Student & Docs',
      links: [
        { name: 'Code to Image', to: '/tools/code-to-image', icon: ImageIcon },
        { name: 'Image to Text', to: '/tools/image-to-text', icon: Type },
        { name: 'Text Diff', to: '/tools/text-diff', icon: FileText },
        { name: 'Markdown Editor', to: '/tools/markdown-editor', icon: FileText },
      ]
    },
    {
      title: 'Developer & Data',
      links: [
        { name: 'JSON Formatter', to: '/tools/json-formatter', icon: Braces },
        { name: 'Password Gen', to: '/tools/password-generator', icon: Key },
        { name: 'Encoder / Decoder', to: '/tools/encoder-decoder', icon: ArrowRightLeft },
        { name: 'Regex Tester', to: '/tools/regex-tester', icon: Search },
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
