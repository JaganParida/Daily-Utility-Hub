import { useState, useRef, useEffect } from 'react';
import { Code2, Download, Settings, RefreshCw, Layers } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const CodeToImage = () => {
  const [code, setCode] = useState('function generateBeautifulCode() {\n  console.log("Hello, World!");\n  return true;\n}');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('app.js');
  
  // Advanced Settings
  const [themeColor, setThemeColor] = useState('from-indigo-500 via-purple-500 to-pink-500');
  const [windowStyle, setWindowStyle] = useState('macos'); // macos, windows, none
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [padding, setPadding] = useState('p-8');
  
  const [isExporting, setIsExporting] = useState(false);
  const codeCardRef = useRef(null);

  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'css', 'html', 'json', 'bash', 'sql'];
  
  const gradients = [
    { name: 'Cosmic', class: 'from-indigo-500 via-purple-500 to-pink-500' },
    { name: 'Ocean', class: 'from-blue-400 to-emerald-400' },
    { name: 'Sunset', class: 'from-orange-400 to-rose-400' },
    { name: 'Midnight', class: 'from-slate-900 to-slate-700' },
    { name: 'Neon', class: 'from-fuchsia-600 to-pink-600' },
    { name: 'Aurora', class: 'from-green-300 via-blue-500 to-purple-600' },
    { name: 'Lava', class: 'from-red-500 to-orange-500' }
  ];

  const exportImage = async () => {
    if (!codeCardRef.current) return;
    
    try {
      setIsExporting(true);
      const toastId = toast.loading('Generating high-res image...');
      
      const dataUrl = await toPng(codeCardRef.current, { 
        quality: 0.95, 
        pixelRatio: 2.5, // High DPI but within safe memory limits
        skipFonts: true, // Prevents CORS SecurityError on external stylesheets
        fontEmbedCSS: '' // Bypasses font embedding CSS lookup
      });
      
      const link = document.createElement('a');
      link.download = `codesnap_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Image exported successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export image. Try copy-pasting or screenshots if it persists.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-md shadow-sm">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Code to Image</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Create beautiful, high-res, shareable images of your code snippets.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Workspace Area */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6"
        >
          {/* Canvas Preview Area */}
          <div className="bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col relative h-[500px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 shrink-0 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              Live Canvas Preview
            </h3>
            
            <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center bg-muted/30 rounded-xl relative border border-border/50">
              
              {/* The Exportable Canvas */}
              <div 
                ref={codeCardRef}
                className={`${padding} transition-all duration-300 relative flex items-center justify-center w-full max-w-3xl mx-auto`}
              >
                {/* Background Layer */}
                <div className={`absolute inset-0 bg-gradient-to-br ${themeColor} shadow-2xl`}></div>
                
                {/* Code Window */}
                <div className="relative z-10 bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-white/10 w-full">
                  
                  {/* Window Controls */}
                  {windowStyle === 'macos' && (
                    <div className="h-10 bg-[#2d2d2d] flex items-center px-4 relative shrink-0 border-b border-black/20">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      {title && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white/50 text-xs font-medium font-mono">{title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {windowStyle === 'windows' && (
                    <div className="h-9 bg-[#2d2d2d] flex items-center justify-between px-3 relative shrink-0 border-b border-black/20">
                      <div className="flex items-center gap-2">
                        {title && <span className="text-white/70 text-xs font-medium font-mono">{title}</span>}
                      </div>
                      <div className="flex gap-3 text-white/50">
                        <span className="text-xs">─</span>
                        <span className="text-xs">□</span>
                        <span className="text-xs hover:text-red-500">✕</span>
                      </div>
                    </div>
                  )}

                  {/* Code Body */}
                  <div className="p-4 overflow-hidden text-sm">
                    <SyntaxHighlighter 
                      language={language} 
                      style={vscDarkPlus}
                      customStyle={{ 
                        margin: 0, 
                        padding: 0, 
                        background: 'transparent', 
                        wordBreak: 'break-all', 
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden' // Suppresses both horizontal and vertical scrollbars in export renders
                      }}
                      wrapLines={true}
                      showLineNumbers={showLineNumbers}
                      lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Raw Code Input */}
          <div className="bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Raw Code</h3>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-48 bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono resize-none custom-scrollbar"
              spellCheck="false"
              placeholder="Paste your code here..."
            />
          </div>

        </motion.div>

        {/* Right Action panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings size={16} /> Image Customization
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">File Title (Optional)</label>
                <input
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. app.js"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Language Syntax</label>
                <select
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 capitalize"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-3">Window Style</label>
                <div className="flex bg-background border border-border rounded-xl p-1">
                  <button 
                    onClick={() => setWindowStyle('macos')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${windowStyle === 'macos' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >macOS</button>
                  <button 
                    onClick={() => setWindowStyle('windows')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${windowStyle === 'windows' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >Windows</button>
                  <button 
                    onClick={() => setWindowStyle('none')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${windowStyle === 'none' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >None</button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted/20 p-3 rounded-xl border border-border/50">
                <span className="text-sm font-bold text-foreground">Show Line Numbers</span>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 relative"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-3">Background Canvas</label>
                <div className="flex flex-wrap gap-2">
                  {gradients.map(grad => (
                    <button
                      key={grad.name}
                      onClick={() => setThemeColor(grad.class)}
                      title={grad.name}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad.class} transition-transform ${themeColor === grad.class ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'hover:scale-105 opacity-80'}`}
                    />
                  ))}
                  <button
                    onClick={() => setThemeColor('bg-transparent')}
                    title="Transparent"
                    className={`w-8 h-8 rounded-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYV2NkYGD4z0AEYBxVSF+FUgAA//8H8gMZrE9/EwAAAABJRU5ErkJggg==')] transition-transform ${themeColor === 'bg-transparent' ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'hover:scale-105 opacity-80'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-3">Padding (Export)</label>
                <div className="flex bg-background border border-border rounded-xl p-1">
                  <button 
                    onClick={() => setPadding('p-4')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${padding === 'p-4' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >Small</button>
                  <button 
                    onClick={() => setPadding('p-8')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${padding === 'p-8' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >Medium</button>
                  <button 
                    onClick={() => setPadding('p-16')} 
                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${padding === 'p-16' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >Large</button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-6">
              <button 
                onClick={exportImage}
                disabled={!code.trim() || isExporting}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-500 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
              >
                {isExporting ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                {isExporting ? 'Exporting...' : 'Export High-Res PNG'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CodeToImage;
