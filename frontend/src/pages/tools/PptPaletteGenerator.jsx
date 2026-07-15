import { useState } from 'react';
import { Palette, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CONTRAST_THEMES = [
  { id: 'dark-blue', name: 'Deep Midnight (Projector Safe)', bg: '#0b1329', cardBg: '#1c2541', text: '#ffffff', accent: '#5bc0be' },
  { id: 'dark-slate', name: 'Slate High-Contrast', bg: '#0f172a', cardBg: '#1e293b', text: '#f8fafc', accent: '#38bdf8' },
  { id: 'light-cream', name: 'Academic Cream Light', bg: '#fefcbf', cardBg: '#fef08a', text: '#1a202c', accent: '#3182ce' },
  { id: 'high-contrast-bw', name: 'Maximum Contrast B&W', bg: '#000000', cardBg: '#111111', text: '#ffffff', accent: '#ffff00' }
];

const PptPaletteGenerator = () => {
  const [selectedTheme, setSelectedTheme] = useState(CONTRAST_THEMES[0]);
  const [copiedKey, setCopiedKey] = useState('');

  const copyColorCode = (color, key) => {
    navigator.clipboard.writeText(color);
    setCopiedKey(key);
    toast.success(`Copied ${key}: ${color}`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Palette size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Projector Palette Swatches</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Generate high-contrast color schemes calibrated specifically to preserve readability on light/dark digital projectors.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Color presets list */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contrast Themes</h3>
            
            <div className="space-y-3">
              {CONTRAST_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`w-full p-4 border rounded-xl text-left transition-all ${selectedTheme.id === theme.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/20 border-border hover:bg-muted/40'}`}
                >
                  <p className="text-xs font-bold text-foreground mb-3">{theme.name}</p>
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded border border-border" style={{ backgroundColor: theme.bg }} />
                    <span className="w-6 h-6 rounded border border-border" style={{ backgroundColor: theme.cardBg }} />
                    <span className="w-6 h-6 rounded border border-border" style={{ backgroundColor: theme.text }} />
                    <span className="w-6 h-6 rounded border border-border" style={{ backgroundColor: theme.accent }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Presentation Preview & Swatches */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Swatches Board */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Color Hex Codes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(selectedTheme).map(([key, color]) => {
                if (key === 'id' || key === 'name') return null;
                const isCopied = copiedKey === key;
                return (
                  <div key={key} className="p-4 border border-border bg-muted/20 rounded-xl flex flex-col justify-between items-center gap-3">
                    <span className="w-10 h-10 rounded-full border border-border shadow-inner" style={{ backgroundColor: color }} />
                    <div className="text-center min-w-0 w-full">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">{key}</p>
                      <p className="text-xs font-bold text-foreground font-mono truncate mt-0.5">{color}</p>
                    </div>
                    <button
                      onClick={() => copyColorCode(color, key)}
                      className={`p-1.5 rounded-lg border transition-all ${isCopied ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulated Presentation Canvas */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            <div className="p-4 border-b border-border bg-muted/30 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Projector Contrast Simulator</h3>
            </div>

            <div className="flex-1 p-6 md:p-8 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
              <div 
                className="w-full max-w-xl aspect-[4/3] p-10 rounded-2xl shadow-2xl flex flex-col justify-between font-sans border border-white/5 transition-all duration-300"
                style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.text }}
              >
                <div>
                  <h2 className="text-2xl font-black tracking-tight" style={{ borderBottom: `1px solid ${selectedTheme.cardBg}`, paddingBottom: '12px', marginBottom: '24px' }}>
                    Visual Accessibility Checker
                  </h2>
                  <p className="text-sm leading-relaxed opacity-95">
                    This slide renders the active color palette. Projectors typically wash out soft greys, so it is recommended to keep contrast ratios high using clear accents.
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-40 font-mono tracking-wider">
                  <span style={{ color: selectedTheme.accent }}>COMPLIANT ACCENT CHECKER</span>
                  <span>PAGE 1 OF 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PptPaletteGenerator;
