import { NavLink, Link } from 'react-router-dom';
import { 
  Home, LayoutDashboard, Image as ImageIcon, Maximize, Crop, RefreshCw, LayoutGrid, FileJson,
  ListOrdered, CaseUpper, Pilcrow, AlignLeft, ListChecks, SearchCode,
  Key, Braces, Binary, Link as LinkIcon, Shield, Clock, Fingerprint, Lock, Hash, Ticket, TerminalSquare, Palette, Droplet, Repeat,
  FileEdit, FileType, Combine, Scissors, Droplets, FileLock2, FileKey2, Tags, ScanText,
  Code, Scan, Diff, PenTool,
  Calculator, TrendingUp, Receipt, Landmark,
  Share2, FolderEdit, Archive,
  LogOut, User, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { currentUser, logout } = useAuth();
  
  const categories = [
    {
      title: 'General',
      links: [
        { name: 'Home', to: '/', icon: Home },
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Image Tools',
      links: [
        { name: 'Image Compressor', to: '/tools/image-compressor', icon: ImageIcon },
        { name: 'Image Resizer', to: '/tools/image-resizer', icon: Maximize },
        { name: 'Image Cropper', to: '/tools/image-cropper', icon: Crop },
        { name: 'Image Converter', to: '/tools/image-converter', icon: RefreshCw },
        { name: 'Image Collage', to: '/tools/image-collage', icon: LayoutGrid },
        { name: 'Image to PDF', to: '/tools/image-to-pdf', icon: FileJson },
      ]
    },
    {
      title: 'Text Tools',
      links: [
        { name: 'Word Counter', to: '/tools/word-counter', icon: ListOrdered },
        { name: 'Case Converter', to: '/tools/case-converter', icon: CaseUpper },
        { name: 'Font Converter', to: '/tools/font-converter', icon: Pilcrow },
        { name: 'Lorem Ipsum', to: '/tools/lorem-ipsum', icon: AlignLeft },
        { name: 'Text Line Editor', to: '/tools/text-line-editor', icon: ListChecks },
        { name: 'Find & Replace', to: '/tools/find-replace', icon: SearchCode },
      ]
    },
    {
      title: 'Developer Tools',
      links: [
        { name: 'API Key Generator', to: '/tools/api-key-generator', icon: Key },
        { name: 'JSON Formatter', to: '/tools/json-formatter', icon: Braces },
        { name: 'Base64 Converter', to: '/tools/base64-converter', icon: Binary },
        { name: 'URL Converter', to: '/tools/url-converter', icon: LinkIcon },
        { name: 'Bcrypt Generator', to: '/tools/bcrypt-generator', icon: Shield },
        { name: 'Cron Parser', to: '/tools/cron-parser', icon: Clock },
        { name: 'UUID Generator', to: '/tools/uuid-generator', icon: Fingerprint },
        { name: 'Password Generator', to: '/tools/password-generator', icon: Lock },
        { name: 'Hash Generator', to: '/tools/hash-generator', icon: Hash },
        { name: 'JWT Decoder', to: '/tools/jwt-decoder', icon: Ticket },
        { name: 'Regex Tester', to: '/tools/regex-tester', icon: TerminalSquare },
        { name: 'Color Picker', to: '/tools/color-picker', icon: Palette },
        { name: 'Gradient Generator', to: '/tools/gradient-generator', icon: Droplet },
        { name: 'Encoder / Decoder', to: '/tools/encoder-decoder', icon: Repeat },
      ]
    },
    {
      title: 'PDF Tools',
      links: [
        { name: 'Edit PDF', to: '/tools/pdf-edit', icon: FileEdit },
        { name: 'PDF Converter', to: '/tools/pdf-converter', icon: FileType },
        { name: 'Merge PDF', to: '/tools/pdf-merge', icon: Combine },
        { name: 'Split PDF', to: '/tools/pdf-split', icon: Scissors },
        { name: 'Watermark PDF', to: '/tools/pdf-watermark', icon: Droplets },
        { name: 'Lock PDF', to: '/tools/pdf-lock', icon: FileLock2 },
        { name: 'Unlock PDF', to: '/tools/pdf-unlock', icon: FileKey2 },
        { name: 'Edit Metadata', to: '/tools/pdf-metadata', icon: Tags },
        { name: 'Extract Text', to: '/tools/pdf-to-text', icon: ScanText },
      ]
    },
    {
      title: 'Student & Docs',
      links: [
        { name: 'Code to Image', to: '/tools/code-to-image', icon: Code },
        { name: 'Image to Text', to: '/tools/image-to-text', icon: Scan },
        { name: 'Text Diff', to: '/tools/text-diff', icon: Diff },
        { name: 'Markdown Editor', to: '/tools/markdown-editor', icon: PenTool },
      ]
    },
    {
      title: 'Finance & Productivity',
      links: [
        { name: 'EMI Calculator', to: '/tools/emi-calculator', icon: Calculator },
        { name: 'SIP Calculator', to: '/tools/sip-calculator', icon: TrendingUp },
        { name: 'GST Calculator', to: '/tools/gst-calculator', icon: Receipt },
        { name: 'Income Tax', to: '/tools/tax-calculator', icon: Landmark },
      ]
    },
    {
      title: 'File & Storage Tools',
      links: [
        { name: 'Temp File Share', to: '/tools/temp-share', icon: Share2 },
        { name: 'Batch Renamer', to: '/tools/batch-renamer', icon: FolderEdit },
        { name: 'Zip & Unzip', to: '/tools/zip-archiver', icon: Archive },
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
        "fixed md:static inset-y-0 left-0 z-50 bg-card md:bg-transparent md:border-r border-border transition-all duration-300 ease-in-out flex flex-col backdrop-blur-xl",
        isCollapsed ? "w-20" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          {!isCollapsed && <Link to="/" className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent truncate hover:opacity-80 transition-opacity">Daily Utility Hub</Link>}
          {isCollapsed && <Link to="/" className="font-bold text-lg tracking-tight text-primary mx-auto hidden md:block hover:opacity-80 transition-opacity">DUH</Link>}
          
          <button 
            className={cn("hidden md:flex p-2 text-muted-foreground hover:text-foreground", !isCollapsed && "ml-auto")}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground ml-auto"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 overflow-x-hidden custom-scrollbar">
          {categories.map((category, idx) => (
            <div key={idx}>
              {!isCollapsed ? (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </h3>
              ) : (
                <div className="h-[1px] bg-border/50 my-4 mx-2" />
              )}
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
                      title={isCollapsed ? link.name : undefined}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isCollapsed ? "justify-center px-0 mx-2" : "",
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!isCollapsed && <span className="truncate">{link.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile / Auth Footer */}
        <div className="p-4 border-t border-border bg-card/50 shrink-0">
          {currentUser ? (
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
              {!isCollapsed && (
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-foreground truncate">{currentUser.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>
              )}
              <button 
                onClick={logout} 
                className={cn("p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0", isCollapsed && "w-10 h-10 flex items-center justify-center mx-auto")}
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className={cn("flex items-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors", isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "justify-center w-full")}
              onClick={() => setIsOpen(false)}
              title={isCollapsed ? "Sign In / Register" : undefined}
            >
              <User size={18} className="shrink-0" />
              {!isCollapsed && <span>Sign In / Register</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
