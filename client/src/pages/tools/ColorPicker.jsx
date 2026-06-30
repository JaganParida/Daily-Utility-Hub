import { useState, useEffect } from 'react';
import { Palette, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { colord, extend } from 'colord';
import harmoniesPlugin from 'colord/plugins/harmonies';
import { toast } from 'react-hot-toast';

extend([harmoniesPlugin]);

const ColorPicker = () => {
  const [color, setColor] = useState('#3b82f6');
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [savedColors, setSavedColors] = useState(() => {
    const saved = localStorage.getItem('duh_saved_colors');
    return saved ? JSON.parse(saved) : ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
  });

  const parsedColor = colord(color);
  const rgb = parsedColor.toRgbString();
  const hsl = parsedColor.toHslString();
  
  // Harmonies
  const complementary = parsedColor.harmonies('complementary').map(c => c.toHex());
  const analogous = parsedColor.harmonies('analogous').map(c => c.toHex());
  const triadic = parsedColor.harmonies('triadic').map(c => c.toHex());

  useEffect(() => {
    localStorage.setItem('duh_saved_colors', JSON.stringify(savedColors));
  }, [savedColors]);

  const handleCopy = (value, formatName) => {
    navigator.clipboard.writeText(value);
    setCopiedFormat(formatName);
    toast.success(`${formatName} copied!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const saveColor = () => {
    if (!savedColors.includes(color)) {
      setSavedColors(prev => [color, ...prev].slice(0, 15)); // Keep max 15
      toast.success('Color saved to palette!');
    }
  };

  const removeColor = (colorToRemove, e) => {
    e.stopPropagation();
    setSavedColors(prev => prev.filter(c => c !== colorToRemove));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Palette size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Color Picker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Professional color tools: harmonies, palette saving, and instant formats.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Picker */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col items-center">
             <div className="w-full max-w-[250px]">
               <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', height: '250px' }} />
             </div>
             
             <div className="w-full mt-6 flex items-center gap-2">
               <div className="flex-1 relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">#</span>
                 <input 
                   type="text" 
                   value={color.replace('#', '')}
                   onChange={(e) => {
                     const val = '#' + e.target.value.replace('#', '');
                     if (colord(val).isValid()) setColor(val);
                   }}
                   className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:ring-2 focus:ring-primary outline-none transition-all uppercase"
                 />
               </div>
               <div 
                 className="w-10 h-10 rounded-lg shadow-inner border border-black/10 shrink-0" 
                 style={{ backgroundColor: color }}
               />
             </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saved Palette</h3>
               <button onClick={saveColor} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium bg-primary/10 px-2 py-1 rounded-md">
                 <Plus size={14} /> Save Current
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {savedColors.map(sc => (
                 <div 
                   key={sc}
                   onClick={() => setColor(sc)}
                   className="w-10 h-10 rounded-full cursor-pointer shadow-sm border border-black/10 relative group hover:scale-110 transition-transform"
                   style={{ backgroundColor: sc }}
                 >
                   <button 
                     onClick={(e) => removeColor(sc, e)}
                     className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                   >
                     <Trash2 size={10} />
                   </button>
                 </div>
               ))}
               {savedColors.length === 0 && (
                 <p className="text-sm text-muted-foreground italic w-full text-center py-2">No saved colors.</p>
               )}
             </div>
          </div>
        </div>

        {/* Right Column: Values & Harmonies */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* HEX */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }} />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">HEX</h3>
              <div className="flex items-center justify-between relative z-10">
                <span className="font-mono text-lg text-foreground font-medium">{color.toUpperCase()}</span>
                <button 
                  onClick={() => handleCopy(color.toUpperCase(), 'HEX')}
                  className="p-2 bg-background/50 backdrop-blur border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copiedFormat === 'HEX' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            
            {/* RGB */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }} />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">RGB</h3>
              <div className="flex items-center justify-between relative z-10">
                <span className="font-mono text-[15px] text-foreground font-medium">{rgb}</span>
                <button 
                  onClick={() => handleCopy(rgb, 'RGB')}
                  className="p-2 bg-background/50 backdrop-blur border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copiedFormat === 'RGB' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* HSL */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }} />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">HSL</h3>
              <div className="flex items-center justify-between relative z-10">
                <span className="font-mono text-[15px] text-foreground font-medium">{hsl}</span>
                <button 
                  onClick={() => handleCopy(hsl, 'HSL')}
                  className="p-2 bg-background/50 backdrop-blur border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copiedFormat === 'HSL' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Color Harmonies</h2>
            
            <div className="space-y-4">
               <div>
                 <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex justify-between">
                   Complementary <span className="text-xs font-normal">Opposite on color wheel</span>
                 </h3>
                 <div className="flex h-16 rounded-lg overflow-hidden shadow-inner border border-black/10 cursor-pointer">
                   {complementary.map((c, i) => (
                     <div key={i} className="flex-1 group relative transition-all hover:flex-[1.2]" style={{ backgroundColor: c }} onClick={() => setColor(c)}>
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white font-mono text-sm transition-opacity">
                         {c.toUpperCase()}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex justify-between">
                   Analogous <span className="text-xs font-normal">Adjacent on color wheel</span>
                 </h3>
                 <div className="flex h-16 rounded-lg overflow-hidden shadow-inner border border-black/10 cursor-pointer">
                   {analogous.map((c, i) => (
                     <div key={i} className="flex-1 group relative transition-all hover:flex-[1.2]" style={{ backgroundColor: c }} onClick={() => setColor(c)}>
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white font-mono text-sm transition-opacity">
                         {c.toUpperCase()}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex justify-between">
                   Triadic <span className="text-xs font-normal">Evenly spaced on wheel</span>
                 </h3>
                 <div className="flex h-16 rounded-lg overflow-hidden shadow-inner border border-black/10 cursor-pointer">
                   {triadic.map((c, i) => (
                     <div key={i} className="flex-1 group relative transition-all hover:flex-[1.2]" style={{ backgroundColor: c }} onClick={() => setColor(c)}>
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white font-mono text-sm transition-opacity">
                         {c.toUpperCase()}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ColorPicker;
