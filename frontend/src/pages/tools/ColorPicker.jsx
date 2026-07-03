import { useState, useEffect, useCallback } from 'react';
import { 
  Palette, Copy, Check, Info, Shuffle, History, 
  Code2, Settings2, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Basic color list for name detection
const NAMED_COLORS = [
  { name: 'Red', hex: '#ff0000' },
  { name: 'Green', hex: '#00ff00' },
  { name: 'Blue', hex: '#0000ff' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
  { name: 'Yellow', hex: '#ffff00' },
  { name: 'Cyan', hex: '#00ffff' },
  { name: 'Magenta', hex: '#ff00ff' },
  { name: 'Orange', hex: '#ffa500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Dodger Blue', hex: '#1e90ff' },
  { name: 'Emerald', hex: '#50c878' },
  { name: 'Crimson', hex: '#dc143c' },
  { name: 'Slate Gray', hex: '#708090' },
  { name: 'Coral', hex: '#ff7f50' },
  { name: 'Gold', hex: '#ffd700' },
  { name: 'Pink', hex: '#ffc0cb' },
  { name: 'Indigo', hex: '#4b0082' },
  { name: 'Lime', hex: '#00ff00' },
  { name: 'Teal', hex: '#008080' }
];

// Tailwind color classes list mapping to approximate hex values
const TW_COLORS = [
  { name: 'slate-500', hex: '#64748b' },
  { name: 'red-500', hex: '#ef4444' },
  { name: 'orange-500', hex: '#f97316' },
  { name: 'amber-500', hex: '#f59e0b' },
  { name: 'yellow-500', hex: '#eab308' },
  { name: 'lime-500', hex: '#84cc16' },
  { name: 'green-500', hex: '#22c55e' },
  { name: 'emerald-500', hex: '#10b981' },
  { name: 'teal-500', hex: '#14b8a6' },
  { name: 'cyan-500', hex: '#06b6d4' },
  { name: 'sky-500', hex: '#0ea5e9' },
  { name: 'blue-500', hex: '#3b82f6' },
  { name: 'indigo-500', hex: '#6366f1' },
  { name: 'violet-500', hex: '#8b5cf6' },
  { name: 'purple-500', hex: '#a855f7' },
  { name: 'fuchsia-500', hex: '#d946ef' },
  { name: 'pink-500', hex: '#ec4899' },
  { name: 'rose-500', hex: '#f43f5e' }
];

const hexToRgb = (hex) => {
  let r = 0, g = 0, b = 0;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r, g, b };
};

const rgbToHex = (r, g, b) => {
  const toHex = (val) => {
    const hex = Math.max(0, Math.min(255, val)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
};

const rgbToCmyk = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
};

const getColorDistance = (rgb1, rgb2) => {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

const getLuminance = (r, g, b) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const calculateContrast = (rgb1, rgb2) => {
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
};

const ColorPicker = () => {
  const [color, setColor] = useState('#4f46e5');
  const [hsl, setHsl] = useState({ h: 244, s: 79, l: 58 });
  const [rgb, setRgb] = useState({ r: 79, g: 70, b: 229 });
  const [cmyk, setCmyk] = useState({ c: 65, m: 69, y: 0, k: 10 });
  const [copied, setCopied] = useState(null);
  
  const [history, setHistory] = useState([
    '#4f46e5', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'
  ]);

  const [contrastWhite, setContrastWhite] = useState({ ratio: 0, aa: false, aaa: false });
  const [contrastBlack, setContrastBlack] = useState({ ratio: 0, aa: false, aaa: false });

  const [shades, setShades] = useState([]);
  const [tints, setTints] = useState([]);

  const [colorName, setColorName] = useState('Indigo');
  const [twName, setTwName] = useState('indigo-500');

  const updateAllFromHex = useCallback((hexValue) => {
    if (!/^#[0-9A-F]{6}$/i.test(hexValue) && !/^#[0-9A-F]{3}$/i.test(hexValue)) return;
    
    const rgbVal = hexToRgb(hexValue);
    const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
    const cmykVal = rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b);

    setRgb(rgbVal);
    setHsl(hslVal);
    setCmyk(cmykVal);
    setColor(hexValue);

    // Color name detection
    let closestName = 'Custom';
    let minDistance = Infinity;
    NAMED_COLORS.forEach(c => {
      const distance = getColorDistance(rgbVal, hexToRgb(c.hex));
      if (distance < minDistance) {
        minDistance = distance;
        closestName = c.name;
      }
    });
    setColorName(closestName);

    // Tailwind suggest
    let closestTw = 'Custom';
    let minTwDistance = Infinity;
    TW_COLORS.forEach(c => {
      const distance = getColorDistance(rgbVal, hexToRgb(c.hex));
      if (distance < minTwDistance) {
        minTwDistance = distance;
        closestTw = c.name;
      }
    });
    setTwName(closestTw);

    // WCAG contrast
    const whiteRatio = calculateContrast(rgbVal, { r: 255, g: 255, b: 255 });
    const blackRatio = calculateContrast(rgbVal, { r: 0, g: 0, b: 0 });

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

    // Shades & Tints (10 steps)
    const newShades = [];
    const newTints = [];
    for (let i = 1; i <= 10; i++) {
      const shadeL = Math.max(0, hslVal.l - (hslVal.l * (i / 11)));
      const shadeRgb = hslToRgb(hslVal.h, hslVal.s, shadeL);
      newShades.push(rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b));

      const tintL = Math.min(100, hslVal.l + ((100 - hslVal.l) * (i / 11)));
      const tintRgb = hslToRgb(hslVal.h, hslVal.s, tintL);
      newTints.push(rgbToHex(tintRgb.r, tintRgb.g, tintRgb.b));
    }
    setShades(newShades);
    setTints(newTints);
  }, []);

  useEffect(() => {
    updateAllFromHex(color);
  }, [color, updateAllFromHex]);

  const handleHslSlider = (field, val) => {
    const newHsl = { ...hsl, [field]: Number(val) };
    setHsl(newHsl);
    const rgbVal = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const hexVal = rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b);
    setColor(hexVal);
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const generateRandom = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = rgbToHex(r, g, b);
    
    if (!history.includes(color)) {
      setHistory([color, ...history.slice(0, 11)]);
    }
    setColor(hex);
  };

  const selectFromSwatch = (hexVal) => {
    setColor(hexVal);
    toast.success(`Selected color ${hexVal}`);
  };

  const cssDeclaration = `/* CSS Variable */\n--color-primary: ${color};\n--color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Palette size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Advanced Color Picker</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Inspect and select color values, create shade scales, and test contrast ratios.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Main Visualizer Swatch */}
          <div 
            className="w-full h-48 rounded-2xl border border-border/80 relative flex items-center justify-center overflow-hidden shadow-inner group transition-colors duration-200"
            style={{ backgroundColor: color }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 text-left pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block">Name Matches</span>
              <span className="text-xl font-bold text-white drop-shadow">{colorName}</span>
            </div>
            {twName && (
              <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                Tailwind: {twName}
              </span>
            )}
          </div>

          {/* Interactive HSL Sliders */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adjust Colors</h4>
            
            {/* Hue Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Hue</span>
                <span className="font-bold font-mono bg-muted/50 px-2 py-0.5 rounded">{hsl.h}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="360" 
                value={hsl.h}
                onChange={(e) => handleHslSlider('h', e.target.value)}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>

            {/* Saturation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Saturation</span>
                <span className="font-bold font-mono bg-muted/50 px-2 py-0.5 rounded">{hsl.s}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={hsl.s}
                onChange={(e) => handleHslSlider('s', e.target.value)}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                style={{
                  background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%) 0%, hsl(${hsl.h}, 100%, ${hsl.l}%) 100%)`
                }}
              />
            </div>

            {/* Lightness Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Lightness</span>
                <span className="font-bold font-mono bg-muted/50 px-2 py-0.5 rounded">{hsl.l}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={hsl.l}
                onChange={(e) => handleHslSlider('l', e.target.value)}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                style={{
                  background: `linear-gradient(to right, #000000 0%, hsl(${hsl.h}, ${hsl.s}%, 50%) 50%, #ffffff 100%)`
                }}
              />
            </div>
          </div>

          {/* Shades & Tints Strips */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shades (Darker)</h4>
            <div className="flex rounded-xl overflow-hidden border border-border bg-muted/20 p-1 gap-1">
              {shades.map((c, idx) => (
                <div 
                  key={idx}
                  onClick={() => selectFromSwatch(c)}
                  className="flex-1 h-9 rounded-md cursor-pointer hover:scale-[1.1] transition-all shadow-sm relative group"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  <span className="absolute bottom-11 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-background text-foreground text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-border z-20 pointer-events-none transition-transform">
                    {c}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tints (Lighter)</h4>
            <div className="flex rounded-xl overflow-hidden border border-border bg-muted/20 p-1 gap-1">
              {tints.map((c, idx) => (
                <div 
                  key={idx}
                  onClick={() => selectFromSwatch(c)}
                  className="flex-1 h-9 rounded-md cursor-pointer hover:scale-[1.1] transition-all shadow-sm relative group"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  <span className="absolute bottom-11 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-background text-foreground text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-border z-20 pointer-events-none transition-transform">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WCAG Accessibility Contrast Checker */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info size={14} /> WCAG Accessibility Contrast
            </h4>

            <div className="grid md:grid-cols-2 gap-4">
              {/* White Text Contrast */}
              <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm" style={{ backgroundColor: color }}>
                <div className="p-6 text-center text-white">
                  <div className="text-3xl font-bold mb-1 drop-shadow-sm">White Text</div>
                  <div className="text-xs opacity-80 font-mono">Contrast: {contrastWhite.ratio} : 1</div>
                </div>
                <div className="bg-black/25 backdrop-blur-sm p-4 flex justify-around text-center text-xs">
                  <div>
                    <div className="text-[10px] text-white/70 mb-1 font-bold uppercase">AA (Large)</div>
                    <div className={`px-3 py-1 rounded-md text-[10px] font-bold ${contrastWhite.aa ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastWhite.aa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/70 mb-1 font-bold uppercase">AAA (Normal)</div>
                    <div className={`px-3 py-1 rounded-md text-[10px] font-bold ${contrastWhite.aaa ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastWhite.aaa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Black Text Contrast */}
              <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm" style={{ backgroundColor: color }}>
                <div className="p-6 text-center text-black">
                  <div className="text-3xl font-bold mb-1 drop-shadow-sm">Black Text</div>
                  <div className="text-xs opacity-85 font-mono">Contrast: {contrastBlack.ratio} : 1</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm p-4 flex justify-around text-center text-xs">
                  <div>
                    <div className="text-[10px] text-black/70 mb-1 font-bold uppercase">AA (Large)</div>
                    <div className={`px-3 py-1 rounded-md text-[10px] font-bold ${contrastBlack.aa ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastBlack.aa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-black/70 mb-1 font-bold uppercase">AAA (Normal)</div>
                    <div className={`px-3 py-1 rounded-md text-[10px] font-bold ${contrastBlack.aaa ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                      {contrastBlack.aaa ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> Color Values
              </h3>
            </div>

            {/* Inputs & Picker */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl border border-border/80 overflow-hidden shrink-0 relative cursor-pointer group shadow-sm">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-[1.5]"
                  />
                </div>
                <input
                  type="text"
                  value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none text-foreground"
                  placeholder="#000000"
                />
              </div>

              {/* Value Fields List */}
              <div className="space-y-2">
                {/* HEX */}
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/50 rounded-xl">
                  <div className="text-xs font-semibold text-muted-foreground">HEX</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{color.toUpperCase()}</span>
                    <button 
                      onClick={() => handleCopy(color.toUpperCase(), 'hex')} 
                      className="p-1 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                    >
                      {copied === 'hex' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* RGB */}
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/50 rounded-xl">
                  <div className="text-xs font-semibold text-muted-foreground">RGB</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}</span>
                    <button 
                      onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')} 
                      className="p-1 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                    >
                      {copied === 'rgb' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* HSL */}
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/50 rounded-xl">
                  <div className="text-xs font-semibold text-muted-foreground">HSL</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}</span>
                    <button 
                      onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')} 
                      className="p-1 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                    >
                      {copied === 'hsl' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* CMYK */}
                <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/50 rounded-xl">
                  <div className="text-xs font-semibold text-muted-foreground">CMYK</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`}</span>
                    <button 
                      onClick={() => handleCopy(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'cmyk')} 
                      className="p-1 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                    >
                      {copied === 'cmyk' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CSS Variable Block */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Code2 size={13} /> CSS Export
                  </label>
                  <button 
                    onClick={() => handleCopy(cssDeclaration, 'css-decl')}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <pre className="p-3.5 bg-muted/50 border border-border rounded-xl font-mono text-[11px] text-foreground overflow-x-auto custom-scrollbar leading-relaxed">
                  {cssDeclaration}
                </pre>
              </div>

              {/* History Swatches */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History size={13} /> Color History
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {history.map((hCode, idx) => (
                    <div 
                      key={idx}
                      onClick={() => selectFromSwatch(hCode)}
                      className="aspect-square rounded-lg border border-border/80 cursor-pointer hover:scale-[1.15] transition-transform shadow-sm"
                      style={{ backgroundColor: hCode }}
                      title={hCode}
                    />
                  ))}
                </div>
              </div>

              {/* Random button */}
              <div className="pt-4 border-t border-border/50">
                <button
                  onClick={generateRandom}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-sm"
                >
                  <Shuffle size={15} /> Random Color
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default ColorPicker;
