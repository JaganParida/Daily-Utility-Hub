import { useState, useCallback, useMemo } from 'react';
import { 
  Layers, Copy, Check, Plus, Trash2, Shuffle, 
  Settings2, ChevronDown, Monitor, Sparkles, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// 20 beautiful gradient presets
const PRESET_GRADIENTS = [
  { name: 'Hyper Sunrise', colors: [{ hex: '#f97316', position: 0 }, { hex: '#ec4899', position: 50 }, { hex: '#3b82f6', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Sunset Glow', colors: [{ hex: '#f43f5e', position: 0 }, { hex: '#eab308', position: 100 }], type: 'linear', angle: 90 },
  { name: 'Deep Space', colors: [{ hex: '#0f172a', position: 0 }, { hex: '#1e1b4b', position: 50 }, { hex: '#311042', position: 100 }], type: 'linear', angle: 135 },
  { name: 'Ocean Breeze', colors: [{ hex: '#06b6d4', position: 0 }, { hex: '#3b82f6', position: 100 }], type: 'linear', angle: 60 },
  { name: 'Aurora', colors: [{ hex: '#10b981', position: 0 }, { hex: '#06b6d4', position: 50 }, { hex: '#6366f1', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Neon Purple', colors: [{ hex: '#d946ef', position: 0 }, { hex: '#8b5cf6', position: 100 }], type: 'linear', angle: 90 },
  { name: 'Coral Dreams', colors: [{ hex: '#ff7f50', position: 0 }, { hex: '#f43f5e', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Forest Mist', colors: [{ hex: '#111827', position: 0 }, { hex: '#065f46', position: 100 }], type: 'linear', angle: 120 },
  { name: 'Citrus Blast', colors: [{ hex: '#f59e0b', position: 0 }, { hex: '#84cc16', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Cherry Blossom', colors: [{ hex: '#fbcfe8', position: 0 }, { hex: '#ec4899', position: 100 }], type: 'linear', angle: 90 },
  { name: 'Electric Indigo', colors: [{ hex: '#6366f1', position: 0 }, { hex: '#4f46e5', position: 100 }], type: 'linear', angle: 135 },
  { name: 'Rose Gold', colors: [{ hex: '#ffe4e6', position: 0 }, { hex: '#f43f5e', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Teal Teal', colors: [{ hex: '#14b8a6', position: 0 }, { hex: '#0f766e', position: 100 }], type: 'linear', angle: 90 },
  { name: 'Cotton Candy', colors: [{ hex: '#a5f3fc', position: 0 }, { hex: '#fbcfe8', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Golden Hour', colors: [{ hex: '#eab308', position: 0 }, { hex: '#d97706', position: 100 }], type: 'linear', angle: 135 },
  { name: 'Ice & Fire', colors: [{ hex: '#3b82f6', position: 0 }, { hex: '#ef4444', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Midnight', colors: [{ hex: '#09090b', position: 0 }, { hex: '#27272a', position: 100 }], type: 'linear', angle: 90 },
  { name: 'Lush Green', colors: [{ hex: '#22c55e', position: 0 }, { hex: '#15803d', position: 100 }], type: 'linear', angle: 45 },
  { name: 'Pink Lemonade', colors: [{ hex: '#ec4899', position: 0 }, { hex: '#facc15', position: 100 }], type: 'linear', angle: 60 },
  { name: 'Slate Calm', colors: [{ hex: '#475569', position: 0 }, { hex: '#94a3b8', position: 100 }], type: 'linear', angle: 135 }
];

const GradientGenerator = () => {
  const [type, setType] = useState('linear'); // 'linear' | 'radial' | 'conic'
  const [angle, setAngle] = useState(90);
  const [position, setPosition] = useState('center'); 
  const [copiedType, setCopiedType] = useState(null);
  
  // Draggable stops
  const [colors, setColors] = useState([
    { id: 1, hex: '#4f46e5', position: 0 },
    { id: 2, hex: '#3b82f6', position: 100 }
  ]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const getGradientString = useCallback(() => {
    const stopsString = colors.map(c => `${c.hex} ${c.position}%`).join(', ');
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsString})`;
    } else if (type === 'radial') {
      return `radial-gradient(circle at ${position}, ${stopsString})`;
    } else if (type === 'conic') {
      return `conic-gradient(from ${angle}deg at ${position}, ${stopsString})`;
    }
    return '';
  }, [type, angle, position, colors]);

  const addColor = () => {
    if (colors.length >= 8) {
      toast.error('Maximum 8 colors allowed');
      return;
    }
    const newColors = [...colors];
    
    // Find biggest gap
    let gapStart = 0;
    let maxGap = 0;
    let targetPos = 50;

    for (let i = 0; i < newColors.length - 1; i++) {
      const gap = newColors[i+1].position - newColors[i].position;
      if (gap > maxGap) {
        maxGap = gap;
        gapStart = newColors[i].position;
        targetPos = Math.round(gapStart + gap / 2);
      }
    }

    newColors.push({
      id: Date.now(),
      hex: '#ffffff',
      position: targetPos
    });
    newColors.sort((a, b) => a.position - b.position);
    setColors(newColors);
  };

  const removeColor = (id) => {
    if (colors.length <= 2) {
      toast.error('Minimum 2 colors required');
      return;
    }
    setColors(colors.filter(c => c.id !== id));
  };

  const updateColor = (id, field, value) => {
    let newColors = colors.map(c => {
      if (c.id === id) {
        return { ...c, [field]: field === 'position' ? Math.max(0, Math.min(100, parseInt(value) || 0)) : value };
      }
      return c;
    });

    if (field === 'position') {
      newColors.sort((a, b) => a.position - b.position);
    }
    setColors(newColors);
  };

  const handleCopy = (text, typeLabel) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeLabel);
    toast.success(`${typeLabel} copied!`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateRandom = () => {
    const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const stopsCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 stops
    const stops = [];
    for (let i = 0; i < stopsCount; i++) {
      stops.push({
        id: i,
        hex: randomHex(),
        position: Math.round((i / (stopsCount - 1)) * 100)
      });
    }
    setColors(stops);
    setAngle(Math.floor(Math.random() * 360));
    toast.success('Random gradient generated!');
  };

  const loadPreset = (preset) => {
    setColors(preset.colors.map((c, i) => ({ id: i, ...c })));
    setType(preset.type || 'linear');
    if (preset.angle !== undefined) setAngle(preset.angle);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const cssCode = useMemo(() => {
    return `background: ${colors[0].hex};\nbackground: ${getGradientString()};`;
  }, [colors, getGradientString]);

  const tailwindCode = useMemo(() => {
    return `bg-[${getGradientString().replace(/ /g, '_')}]`;
  }, [getGradientString]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Gradient Generator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Create and export multi-stop CSS, SVG, and Tailwind gradients with interactive controls.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full space-y-6">
          {/* Main Visualizer Swatch */}
          <div 
            className="w-full h-64 sm:h-96 rounded-3xl border border-border/80 relative overflow-hidden group shadow-xl transition-all duration-300"
            style={{ background: getGradientString() }}
          >
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />
            
            {/* Swatch Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-black/45 hover:bg-black/60 backdrop-blur border border-white/15 hover:border-white/25 rounded-xl text-white transition-all shadow-sm cursor-pointer"
                title="Fullscreen Preview"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={generateRandom}
                className="p-2 bg-black/45 hover:bg-black/60 backdrop-blur border border-white/15 hover:border-white/25 rounded-xl text-white transition-all shadow-sm cursor-pointer"
                title="Random Colors"
              >
                <Shuffle size={16} />
              </button>
            </div>
          </div>

          {/* Interactive Draggable Colors Bar */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4">
              <label className="text-sm font-semibold text-foreground">Timeline Stops</label>
              <button
                onClick={addColor}
                disabled={colors.length >= 8}
                className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                + Add Color Stop
              </button>
            </div>

            {/* Visual gradient bar showing stops */}
            <div className="h-6 w-full bg-muted/30 rounded-xl relative overflow-hidden border border-border/50 shadow-inner">
              <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: `linear-gradient(to right, ${colors.map(c => `${c.hex} ${c.position}%`).join(', ')})` }} />
              {colors.map(c => (
                <div 
                  key={`marker-${c.id}`}
                  className="absolute top-0.5 bottom-0.5 h-auto w-2.5 -ml-1.25 bg-white border border-black/35 rounded-full shadow cursor-pointer transition-transform hover:scale-125 hover:border-black/50"
                  style={{ left: `${c.position}%`, backgroundColor: c.hex }}
                  title={`${c.hex} (${c.position}%)`}
                />
              ))}
            </div>

            {/* List of stops with input controllers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colors.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 bg-background border border-border/80 p-3 rounded-xl group relative">
                  <div className="w-8 h-8 rounded-lg border border-border overflow-hidden shrink-0 shadow-sm relative">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateColor(c.id, 'hex', e.target.value)}
                      className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={c.hex.toUpperCase()}
                    onChange={(e) => updateColor(c.id, 'hex', e.target.value)}
                    className="w-20 bg-transparent border-none p-0 text-xs font-mono font-bold focus:ring-0 focus:outline-none text-foreground"
                  />

                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={c.position}
                      onChange={(e) => updateColor(c.id, 'position', e.target.value)}
                      className="w-12 bg-muted/40 border border-border/50 rounded px-1.5 py-0.5 text-center font-mono text-xs text-foreground focus:outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground font-bold">%</span>
                  </div>

                  <button
                    onClick={() => removeColor(c.id)}
                    disabled={colors.length <= 2}
                    className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Export Code Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSS */}
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-3.5">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code2 size={14} /> CSS Export
                </span>
                <button
                  onClick={() => handleCopy(cssCode, 'CSS')}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {copiedType === 'CSS' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-3.5 bg-muted/30 border border-border/50 rounded-xl font-mono text-[11px] overflow-x-auto custom-scrollbar h-24 leading-relaxed text-foreground">
                {cssCode}
              </pre>
            </div>

            {/* Tailwind */}
            <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-3.5">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles size={14} /> Tailwind CSS
                </span>
                <button
                  onClick={() => handleCopy(tailwindCode, 'Tailwind')}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {copiedType === 'Tailwind' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-3.5 bg-muted/30 border border-border/50 rounded-xl font-mono text-[11px] overflow-x-auto custom-scrollbar h-24 leading-relaxed text-foreground">
                {tailwindCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          {/* Settings Card */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> settings
              </h3>
            </div>

            {/* Type selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Gradient Type</label>
              <div className="flex overflow-x-auto md:grid md:grid-cols-3 scrollbar-none whitespace-nowrap p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
                {['linear', 'radial', 'conic'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 md:flex-none relative z-10 py-2.5 text-xs font-bold rounded-lg transition-colors capitalize cursor-pointer shrink-0 px-4 md:px-0 ${
                      type === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type === t && (
                      <motion.div
                        layoutId="gradient-type-active"
                        className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Angle Slider (linear/conic) */}
            {type !== 'radial' && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-sm font-semibold text-foreground">Angle</label>
                  <span className="font-bold font-mono bg-muted/60 px-2 py-0.5 rounded">{angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${Math.round((angle/360)*100)}%, var(--muted) ${Math.round((angle/360)*100)}%)`
                  }}
                />
              </div>
            )}

            {/* Position Picker (radial/conic) */}
            {type !== 'linear' && (
              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-foreground">Origin Position</label>
                <div className="relative group">
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full appearance-none bg-muted/20 border border-border/50 group-hover:border-border p-3.5 pl-4 pr-10 rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/45 outline-none transition-all cursor-pointer shadow-sm"
                  >
                    <option value="center" className="bg-background text-foreground">Center</option>
                    <option value="top" className="bg-background text-foreground">Top</option>
                    <option value="bottom" className="bg-background text-foreground">Bottom</option>
                    <option value="left" className="bg-background text-foreground">Left</option>
                    <option value="right" className="bg-background text-foreground">Right</option>
                    <option value="top left" className="bg-background text-foreground">Top Left</option>
                    <option value="top right" className="bg-background text-foreground">Top Right</option>
                    <option value="bottom left" className="bg-background text-foreground">Bottom Left</option>
                    <option value="bottom right" className="bg-background text-foreground">Bottom Right</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Presets library */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} /> Presets Library
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {PRESET_GRADIENTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="group text-left p-1.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-all flex flex-col gap-1.5 cursor-pointer"
                >
                  <div 
                    className="w-full aspect-video rounded-lg border border-border/20 shadow-inner group-hover:scale-[1.02] transition-transform duration-200" 
                    style={{ background: `linear-gradient(${p.angle}deg, ${p.colors.map(c => `${c.hex} ${c.position}%`).join(', ')})` }}
                  />
                  <span className="text-[10px] font-bold text-foreground truncate pl-1">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
            style={{ background: getGradientString() }}
          >
            <div className="absolute top-6 right-6 p-3 bg-black/55 backdrop-blur-md rounded-2xl border border-white/10 text-white font-semibold text-xs tracking-wider uppercase pointer-events-none select-none">
              Click anywhere to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        input[type=range]:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
      ` }} />
    </motion.div>
  );
};

export default GradientGenerator;
