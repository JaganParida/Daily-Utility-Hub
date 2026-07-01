import { useState, useRef } from 'react';
import { Code2, Download, Image as ImageIcon, Settings, CheckCircle2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';

const CodeToImage = () => {
  const [code, setCode] = useState('function generateBeautifulCode() {\n  console.log("Hello, World!");\n  return true;\n}');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('app.js');
  const [themeColor, setThemeColor] = useState('from-indigo-500 via-purple-500 to-pink-500');
  const [isExporting, setIsExporting] = useState(false);
  const codeCardRef = useRef(null);

  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'css', 'html', 'json', 'bash', 'sql'];
  
  const gradients = [
    { name: 'Cosmic', class: 'from-indigo-500 via-purple-500 to-pink-500' },
    { name: 'Ocean', class: 'from-blue-400 to-emerald-400' },
    { name: 'Sunset', class: 'from-orange-400 to-rose-400' },
    { name: 'Midnight', class: 'from-slate-900 to-slate-700' },
    { name: 'Neon', class: 'from-fuchsia-600 to-pink-600' }
  ];

  const exportImage = async () => {
    if (!codeCardRef.current) return;
    
    try {
      setIsExporting(true);
      const toastId = toast.loading('Generating high-res image...');
      
      const dataUrl = await toPng(codeCardRef.current, { 
        quality: 1, 
        pixelRatio: 3, // High DPI for crisp text
        skipFonts: false
      });
      
      const link = document.createElement('a');
      link.download = `codesnap_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Image exported successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to export image');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Code2 size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Code to Image</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create beautiful, shareable images of your code snippets.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        
        {/* Editor & Preview Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 shrink-0">Live Preview</h3>
            
            {/* The Exportable Canvas */}
            <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-8 bg-muted/30 rounded-xl relative">
              
              <div 
                ref={codeCardRef}
                className={`p-8 rounded-2xl shadow-2xl bg-gradient-to-br ${themeColor} transition-all`}
                style={{ minWidth: '400px', maxWidth: '100%' }}
              >
                <div className="bg-[#1e1e1e] rounded-xl shadow-xl overflow-hidden border border-white/10">
                  {/* MacOS Window Header */}
                  <div className="h-10 bg-[#2d2d2d] flex items-center px-4 relative">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/50 text-xs font-medium">{title}</span>
                    </div>
                  </div>
                  {/* Code Body */}
                  <div className="p-4 overflow-hidden text-sm">
                    <SyntaxHighlighter 
                      language={language} 
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                      wrapLines={true}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl shadow-sm p-4 shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Raw Code</h3>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-32 bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono resize-none custom-scrollbar"
              spellCheck="false"
            />
          </div>

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 h-fit shrink-0 overflow-y-auto custom-scrollbar">
          
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Customization</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 ml-1">File Name / Title</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs text-muted-foreground mb-1 ml-1">Language</label>
                <select
                  value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 capitalize"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 ml-1">Background Gradient</label>
                <div className="grid grid-cols-5 gap-2">
                  {gradients.map(grad => (
                    <button
                      key={grad.name}
                      onClick={() => setThemeColor(grad.class)}
                      title={grad.name}
                      className={`h-10 rounded-lg bg-gradient-to-br ${grad.class} ${themeColor === grad.class ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button 
              onClick={exportImage}
              disabled={!code.trim() || isExporting}
              className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {isExporting ? 'Exporting...' : 'Download Image'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CodeToImage;
