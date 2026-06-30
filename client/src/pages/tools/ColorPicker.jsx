import { useState, useEffect } from 'react';
import { Palette, Copy, Check, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ColorPicker = () => {
  const [color, setColor] = useState('#3b82f6'); // Default primary blue
  const [copied, setCopied] = useState(null);
  
  const [rgb, setRgb] = useState('');
  const [hsl, setHsl] = useState('');
  
  // Contrast states
  const [contrastWhite, setContrastWhite] = useState({ ratio: 0, aa: false, aaa: false });
  const [contrastBlack, setContrastBlack] = useState({ ratio: 0, aa: false, aaa: false });
  
  // Palette states
  const [complementary, setComplementary] = useState('');
  const [analogous, setAnalogous] = useState([]);
  const [triadic, setTriadic] = useState([]);

  // --- Helper Functions ---
  
  const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const getLuminance = (r, g, b) => {
    const a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const calculateContrast = (rgb1, rgb2) => {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // --- Effects ---

  useEffect(() => {
    if (!/^#[0-9A-F]{6}$/i.test(color) && !/^#[0-9A-F]{3}$/i.test(color)) return;

    const currentRgb = hexToRgb(color);
    const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

    setRgb(`rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b})`);
    setHsl(`hsl(${currentHsl.h}, ${currentHsl.s}%, ${currentHsl.l}%)`);

    // Contrast
    const whiteRatio = calculateContrast(currentRgb, {r:255, g:255, b:255});
    const blackRatio = calculateContrast(currentRgb, {r:0, g:0, b:0});
    
    setContrastWhite({
      ratio: whiteRatio.toFixed(2),
      aa: whiteRatio >= 4.5,
      aaa: whiteRatio >= 7.0
    });
    
    setContrastBlack({
      ratio: blackRatio.toFixed(2),
      aa: blackRatio >= 4.5,
      aaa: blackRatio >= 7.0
    });

    // Palettes
    setComplementary(hslToHex((currentHsl.h + 180) % 360, currentHsl.s, currentHsl.l));
    setAnalogous([
      hslToHex((currentHsl.h + 330) % 360, currentHsl.s, currentHsl.l),
      color,
      hslToHex((currentHsl.h + 30) % 360, currentHsl.s, currentHsl.l)
    ]);
    setTriadic([
      color,
      hslToHex((currentHsl.h + 120) % 360, currentHsl.s, currentHsl.l),
      hslToHex((currentHsl.h + 240) % 360, currentHsl.s, currentHsl.l)
    ]);

  }, [color]);

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Palette size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Color Picker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pick colors, check accessibility contrast, and generate beautiful palettes.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        
        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center">
            
            <div 
              className="w-32 h-32 rounded-full border-4 border-background shadow-lg mb-6 transition-colors duration-200"
              style={{ backgroundColor: color }}
            />
            
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground w-full mb-2">Select Color</label>
            <div className="flex w-full h-12 rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500/50">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-full w-16 p-0 border-0 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={color.toUpperCase()}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 h-full bg-background px-3 font-mono text-sm focus:outline-none"
              />
            </div>
            
            <div className="w-full mt-4 space-y-2">
              <button onClick={() => handleCopy(color, 'hex')} className="w-full flex justify-between items-center p-3 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors group">
                <span className="font-mono text-xs">{color.toUpperCase()}</span>
                {copied === 'hex' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground group-hover:text-foreground" />}
              </button>
              <button onClick={() => handleCopy(rgb, 'rgb')} className="w-full flex justify-between items-center p-3 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors group">
                <span className="font-mono text-xs">{rgb}</span>
                {copied === 'rgb' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground group-hover:text-foreground" />}
              </button>
              <button onClick={() => handleCopy(hsl, 'hsl')} className="w-full flex justify-between items-center p-3 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors group">
                <span className="font-mono text-xs">{hsl}</span>
                {copied === 'hsl' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground group-hover:text-foreground" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          
          {/* Contrast Checker */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Info size={16} /> WCAG Accessibility Contrast
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: color }}>
                <div className="p-6 text-center text-white">
                  <div className="text-4xl font-bold mb-2 opacity-90">White Text</div>
                  <div className="text-sm opacity-80">Contrast Ratio: {contrastWhite.ratio}</div>
                </div>
                <div className="bg-black/20 backdrop-blur-sm p-4 flex justify-around">
                  <div className="text-center">
                    <div className="text-xs text-white/70 mb-1">AA (Large)</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${contrastWhite.aa ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastWhite.aa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/70 mb-1">AAA (Normal)</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${contrastWhite.aaa ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastWhite.aaa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: color }}>
                <div className="p-6 text-center text-black">
                  <div className="text-4xl font-bold mb-2 opacity-90">Black Text</div>
                  <div className="text-sm opacity-80">Contrast Ratio: {contrastBlack.ratio}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 flex justify-around">
                  <div className="text-center">
                    <div className="text-xs text-black/70 mb-1">AA (Large)</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${contrastBlack.aa ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastBlack.aa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-black/70 mb-1">AAA (Normal)</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${contrastBlack.aaa ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastBlack.aaa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Palette Generator */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Generated Palettes
            </h3>

            <div>
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Complementary</h4>
              <div className="flex h-24 rounded-xl overflow-hidden border border-border">
                <div 
                  className="flex-1 cursor-pointer transition-transform hover:scale-[1.02]" 
                  style={{ backgroundColor: color }}
                  onClick={() => handleCopy(color, 'comp1')}
                  title="Copy Hex"
                />
                <div 
                  className="flex-1 cursor-pointer transition-transform hover:scale-[1.02]" 
                  style={{ backgroundColor: complementary }}
                  onClick={() => handleCopy(complementary, 'comp2')}
                  title="Copy Hex"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Analogous</h4>
              <div className="flex h-24 rounded-xl overflow-hidden border border-border">
                {analogous.map((c, i) => (
                  <div 
                    key={i}
                    className="flex-1 cursor-pointer transition-transform hover:scale-[1.02]" 
                    style={{ backgroundColor: c }}
                    onClick={() => handleCopy(c, `ana${i}`)}
                    title="Copy Hex"
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Triadic</h4>
              <div className="flex h-24 rounded-xl overflow-hidden border border-border">
                {triadic.map((c, i) => (
                  <div 
                    key={i}
                    className="flex-1 cursor-pointer transition-transform hover:scale-[1.02]" 
                    style={{ backgroundColor: c }}
                    onClick={() => handleCopy(c, `tri${i}`)}
                    title="Copy Hex"
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
