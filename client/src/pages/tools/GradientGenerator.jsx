import { useState } from 'react';
import { Layers, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GradientGenerator = () => {
  const [color1, setColor1] = useState('#3b82f6');
  const [color2, setColor2] = useState('#8b5cf6');
  const [type, setType] = useState('linear');
  const [direction, setDirection] = useState('to right');
  const [copied, setCopied] = useState(false);

  const getGradientString = () => {
    if (type === 'linear') {
      return `linear-gradient(${direction}, ${color1}, ${color2})`;
    }
    return `radial-gradient(circle, ${color1}, ${color2})`;
  };

  const cssCode = `background: ${getGradientString()};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success('CSS Copied to Clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const randomGradient = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColor1(randomColor());
    setColor2(randomColor());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Gradient Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create beautiful CSS gradients instantly and copy the code.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Preview Panel */}
        <div className="space-y-6">
          <div 
            className="w-full aspect-video rounded-3xl shadow-lg border border-border/50 relative overflow-hidden transition-all duration-300"
            style={{ background: getGradientString() }}
          >
             {/* Subtle overlay for depth */}
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
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-foreground">Settings</h3>
            <button 
              onClick={randomGradient}
              className="text-xs font-medium bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={12} /> Randomize
            </button>
          </div>

          {/* Colors */}
          <div className="space-y-4">
             <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Colors</label>
             <div className="flex gap-4">
               <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border">
                    <input 
                      type="color" 
                      value={color1} 
                      onChange={(e) => setColor1(e.target.value)} 
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={color1.toUpperCase()}
                      onChange={(e) => setColor1(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-mono focus:outline-none uppercase"
                    />
                 </div>
               </div>
               <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border">
                    <input 
                      type="color" 
                      value={color2} 
                      onChange={(e) => setColor2(e.target.value)} 
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={color2.toUpperCase()}
                      onChange={(e) => setColor2(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-mono focus:outline-none uppercase"
                    />
                 </div>
               </div>
             </div>
          </div>

          {/* Gradient Type */}
          <div className="space-y-4 pt-4 border-t border-border">
             <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
             <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border">
               <button 
                 onClick={() => setType('linear')}
                 className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'linear' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Linear
               </button>
               <button 
                 onClick={() => setType('radial')}
                 className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'radial' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Radial
               </button>
             </div>
          </div>

          {/* Direction (Only for linear) */}
          {type === 'linear' && (
            <div className="space-y-4 pt-4 border-t border-border">
               <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">Direction</label>
               <div className="grid grid-cols-4 gap-2">
                 {[
                   { label: '↘', val: 'to bottom right' },
                   { label: '↓', val: 'to bottom' },
                   { label: '↙', val: 'to bottom left' },
                   { label: '→', val: 'to right' },
                   { label: '←', val: 'to left' },
                   { label: '↗', val: 'to top right' },
                   { label: '↑', val: 'to top' },
                   { label: '↖', val: 'to top left' },
                 ].map((dir) => (
                   <button
                     key={dir.val}
                     onClick={() => setDirection(dir.val)}
                     className={`py-3 text-lg rounded-lg border transition-all ${
                       direction === dir.val 
                         ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105' 
                         : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                     }`}
                   >
                     {dir.label}
                   </button>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GradientGenerator;
