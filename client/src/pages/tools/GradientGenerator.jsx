import { useState } from 'react';
import { Layers, Copy, Check, RefreshCw, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GradientGenerator = () => {
  const [colors, setColors] = useState(['#3b82f6', '#8b5cf6']);
  const [type, setType] = useState('linear'); // linear, radial, conic
  const [angle, setAngle] = useState(90); // For linear and conic
  const [copied, setCopied] = useState(false);

  const getGradientString = () => {
    const colorStops = colors.join(', ');
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${colorStops})`;
    } else if (type === 'conic') {
      return `conic-gradient(from ${angle}deg, ${colorStops})`;
    } else {
      return `radial-gradient(circle, ${colorStops})`;
    }
  };

  const cssCode = `background: ${getGradientString()};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success('CSS Copied to Clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

  const randomize = () => {
    const newColors = colors.map(() => randomColor());
    setColors(newColors);
    if (type !== 'radial') {
      setAngle(Math.floor(Math.random() * 360));
    }
  };

  const addColor = () => {
    if (colors.length < 5) {
      setColors([...colors, randomColor()]);
    } else {
      toast.error('Maximum 5 colors allowed');
    }
  };

  const removeColor = (index) => {
    if (colors.length > 2) {
      const newColors = [...colors];
      newColors.splice(index, 1);
      setColors(newColors);
    } else {
      toast.error('Minimum 2 colors required');
    }
  };

  const updateColor = (index, val) => {
    const newColors = [...colors];
    newColors[index] = val;
    setColors(newColors);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Gradient Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create beautiful linear, radial, and conic gradients with multiple stops.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        
        {/* Preview Panel */}
        <div className="space-y-6 flex flex-col">
          <div 
            className="w-full flex-1 min-h-[300px] lg:min-h-0 rounded-3xl shadow-lg border border-border/50 relative overflow-hidden transition-all duration-300"
            style={{ background: getGradientString() }}
          >
             <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">CSS Output</h3>
            <div className="flex items-center justify-between gap-4">
              <code className="flex-1 font-mono text-sm text-foreground bg-muted p-3 rounded-lg overflow-x-auto whitespace-nowrap">
                {cssCode}
              </code>
              <button 
                onClick={handleCopy}
                className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm shrink-0"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-8 flex flex-col">
          
          <div className="flex items-center justify-between mb-2 border-b border-border pb-4">
            <h3 className="font-bold text-lg text-foreground">Settings</h3>
            <button 
              onClick={randomize}
              className="text-xs font-medium bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={12} /> Randomize All
            </button>
          </div>

          {/* Gradient Type */}
          <div className="space-y-3">
             <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gradient Type</label>
             <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border">
               {['linear', 'radial', 'conic'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setType(t)}
                   className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${type === t ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {t}
                 </button>
               ))}
             </div>
          </div>

          {/* Angle (Linear & Conic) */}
          {type !== 'radial' && (
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Angle</label>
                 <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{angle}°</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="360" 
                 value={angle}
                 onChange={(e) => setAngle(Number(e.target.value))}
                 className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
               />
            </div>
          )}

          {/* Colors */}
          <div className="space-y-4 flex-1">
             <div className="flex items-center justify-between">
               <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Color Stops</label>
               {colors.length < 5 && (
                 <button onClick={addColor} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium">
                   <Plus size={14} /> Add Color
                 </button>
               )}
             </div>
             
             <div className="space-y-3">
               {colors.map((color, index) => (
                 <div key={index} className="flex items-center gap-3">
                   <div className="flex-1 flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border group">
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => updateColor(index, e.target.value)} 
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                      />
                      <input 
                        type="text" 
                        value={color.toUpperCase()}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-mono focus:outline-none uppercase"
                      />
                   </div>
                   {colors.length > 2 && (
                     <button 
                       onClick={() => removeColor(index)}
                       className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                     >
                       <X size={18} />
                     </button>
                   )}
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GradientGenerator;
