import { useState } from 'react';
import { Layers, Copy, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GradientGenerator = () => {
  const [type, setType] = useState('linear'); // linear, radial, conic
  const [angle, setAngle] = useState(90);
  
  // Radial / Conic specific
  const [position, setPosition] = useState('center'); 
  
  // Multi-stop colors
  const [colors, setColors] = useState([
    { id: 1, hex: '#3b82f6', position: 0 },
    { id: 2, hex: '#8b5cf6', position: 100 }
  ]);

  const [copied, setCopied] = useState(false);

  const addColor = () => {
    if (colors.length >= 6) {
      toast.error('Maximum 6 colors allowed');
      return;
    }
    const newColors = [...colors];
    const lastPos = newColors[newColors.length - 1].position;
    const prevPos = newColors.length > 1 ? newColors[newColors.length - 2].position : 0;
    
    // Attempt to place it between the last two
    const newPos = Math.round((lastPos + prevPos) / 2);
    
    newColors.push({
      id: Date.now(),
      hex: '#ffffff',
      position: newPos
    });
    
    // Sort by position
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
        return { ...c, [field]: field === 'position' ? parseInt(value) : value };
      }
      return c;
    });
    
    if (field === 'position') {
      newColors.sort((a, b) => a.position - b.position);
    }
    
    setColors(newColors);
  };

  const getGradientString = () => {
    const stopsString = colors.map(c => `${c.hex} ${c.position}%`).join(', ');
    
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsString})`;
    } else if (type === 'radial') {
      return `radial-gradient(circle at ${position}, ${stopsString})`;
    } else if (type === 'conic') {
      return `conic-gradient(from ${angle}deg at ${position}, ${stopsString})`;
    }
  };

  const cssCode = `/* CSS Gradient */\nbackground: ${colors[0].hex};\nbackground: ${getGradientString()};`;
  const tailwindCode = `<!-- Tailwind CSS Arbitrary Value -->\n<div class="bg-[${getGradientString().replace(/ /g, '_')}]"></div>`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('CSS copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-fuchsia-500/10 text-fuchsia-500 rounded-lg shadow-sm">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Gradient Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create linear, radial, and conic gradients with multiple color stops.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        
        {/* Preview Panel */}
        <div className="space-y-6">
          <div 
            className="w-full h-64 sm:h-96 rounded-3xl border border-border/50 shadow-xl transition-all duration-300 relative overflow-hidden"
            style={{ background: getGradientString() }}
          >
            {/* Subtle overlay to make it look premium */}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none"></div>
          </div>
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Export Code</h3>
               <button 
                onClick={() => handleCopy(cssCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-fuchsia-500 hover:bg-fuchsia-500/10 rounded-md transition-colors"
               >
                 {copied ? <Check size={14} /> : <Copy size={14} />} Copy CSS
               </button>
             </div>
             
             <pre className="p-4 bg-muted/50 border border-border rounded-xl font-mono text-sm text-foreground overflow-x-auto custom-scrollbar">
               {cssCode}
             </pre>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['linear', 'radial', 'conic'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                    type === t 
                      ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-500 shadow-sm'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Angle / Position */}
          {type !== 'radial' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Angle</label>
                <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-md">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
              />
            </div>
          )}

          {type !== 'linear' && (
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 appearance-none cursor-pointer"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>
          )}

          {/* Color Stops */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Color Stops</label>
              <button 
                onClick={addColor}
                disabled={colors.length >= 6}
                className="flex items-center gap-1 text-xs font-bold text-fuchsia-500 hover:bg-fuchsia-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                <Plus size={14} /> Add Stop
              </button>
            </div>

            <div className="space-y-3">
              {colors.map((color, idx) => (
                <div key={color.id} className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border group">
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(color.id, 'hex', e.target.value)}
                      className="w-10 h-10 p-0 border-0 bg-transparent rounded-lg cursor-pointer shrink-0 shadow-sm"
                    />
                    <input
                      type="text"
                      value={color.hex.toUpperCase()}
                      onChange={(e) => updateColor(color.id, 'hex', e.target.value)}
                      className="w-24 bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={color.position}
                      onChange={(e) => updateColor(color.id, 'position', e.target.value)}
                      className="w-14 bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:border-fuchsia-500"
                    />
                    <span className="text-xs text-muted-foreground font-bold">%</span>
                  </div>

                  <button
                    onClick={() => removeColor(color.id)}
                    disabled={colors.length <= 2}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Visual Bar showing positions */}
            <div className="h-4 w-full bg-muted rounded-full relative mt-4 overflow-hidden border border-border/50">
               {colors.map(c => (
                 <div 
                  key={`marker-${c.id}`}
                  className="absolute top-0 h-full w-2 -ml-1 bg-white border border-black/20 rounded-full shadow-sm"
                  style={{ left: `${c.position}%`, backgroundColor: c.hex }}
                 />
               ))}
               <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `linear-gradient(to right, ${colors.map(c => `${c.hex} ${c.position}%`).join(', ')})` }} />
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
};

export default GradientGenerator;
