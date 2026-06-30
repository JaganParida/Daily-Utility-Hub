import { useState, useEffect, useRef } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ColorPicker = () => {
  const [color, setColor] = useState('#3b82f6'); // Default primary blue
  const [copiedFormat, setCopiedFormat] = useState(null);
  
  // Color formats
  const [rgb, setRgb] = useState('');
  const [hsl, setHsl] = useState('');

  // Native color picker ref
  const colorInputRef = useRef(null);

  // Convert Hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
    return null;
  };

  // Convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
      : 0;
    return {
      h: Math.round(60 * h < 0 ? 60 * h + 360 : 60 * h),
      s: Math.round(100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0)),
      l: Math.round((100 * (2 * l - s)) / 2),
    };
  };

  useEffect(() => {
    const rgbVal = hexToRgb(color);
    if (rgbVal) {
      setRgb(`rgb(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b})`);
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setHsl(`hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`);
    }
  }, [color]);

  const handleCopy = (value, formatName) => {
    navigator.clipboard.writeText(value);
    setCopiedFormat(formatName);
    toast.success(`${formatName} copied to clipboard!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
          <Palette size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Color Picker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Select colors and instantly get HEX, RGB, and HSL values.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Color Preview & Picker */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
          <div 
            className="w-full aspect-video rounded-xl shadow-inner border border-black/10 cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: color }}
            onClick={() => colorInputRef.current.click()}
          />
          <input 
            type="color" 
            ref={colorInputRef}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="opacity-0 w-0 h-0"
          />
          <button 
            onClick={() => colorInputRef.current.click()}
            className="mt-6 px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors w-full"
          >
            Click to Select Color
          </button>
        </div>

        {/* Color Values */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">HEX</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-lg text-foreground">
                {color.toUpperCase()}
              </div>
              <button 
                onClick={() => handleCopy(color.toUpperCase(), 'HEX')}
                className={`p-3 rounded-lg transition-colors border ${
                  copiedFormat === 'HEX' ? 'bg-green-500/20 border-green-500/30 text-green-600' : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {copiedFormat === 'HEX' ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">RGB</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-lg text-foreground">
                {rgb}
              </div>
              <button 
                onClick={() => handleCopy(rgb, 'RGB')}
                className={`p-3 rounded-lg transition-colors border ${
                  copiedFormat === 'RGB' ? 'bg-green-500/20 border-green-500/30 text-green-600' : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {copiedFormat === 'RGB' ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">HSL</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-lg text-foreground">
                {hsl}
              </div>
              <button 
                onClick={() => handleCopy(hsl, 'HSL')}
                className={`p-3 rounded-lg transition-colors border ${
                  copiedFormat === 'HSL' ? 'bg-green-500/20 border-green-500/30 text-green-600' : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {copiedFormat === 'HSL' ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
