import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { 
  Code2, Eye, Download, Play, RefreshCw, Trash2, 
  Sparkles, FileCode, Monitor, Tablet, Phone,
  Maximize, Share2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

// HTML Templates for quick loading
const TEMPLATES = {
  landing: {
    label: 'Modern Landing Page',
    html: `<div class="hero">
  <h1>Launch Your Dream Project</h1>
  <p>Building gorgeous, lightning-fast utilities in the browser with premium aesthetics.</p>
  <button class="btn" onclick="sayHello()">Get Started Now</button>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: #060608;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.hero {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: #0d0d10;
  border: 1px solid #1c1c21;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}
h1 {
  font-size: 2.5rem;
  background: linear-gradient(to right, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}
p {
  color: #a1a1aa;
  line-height: 1.6;
  margin-bottom: 24px;
}
.btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover {
  background: #4338ca;
  transform: translateY(-2px);
}`,
    js: `function sayHello() {
  alert("Welcome to the Future of Development!");
}`
  },
  game: {
    label: 'Reflex Speed Game',
    html: `<div class="game-container">
  <h1>Reflex Tester</h1>
  <p>Click the bubble as fast as you can! Score: <span id="score">0</span></p>
  <div id="target" onclick="hitTarget()">Click Me!</div>
</div>`,
    css: `body {
  margin: 0;
  background: #09090b;
  color: #fff;
  font-family: sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
}
.game-container {
  text-align: center;
}
#target {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, #ff007f, #7f00ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.15s ease-out;
  user-select: none;
  box-shadow: 0 0 20px rgba(127, 0, 255, 0.5);
}`,
    js: `let score = 0;
function hitTarget() {
  score++;
  document.getElementById('score').innerText = score;
  const target = document.getElementById('target');
  
  // Random position within limits
  const x = Math.random() * (window.innerWidth - 120) + 60;
  const y = Math.random() * (window.innerHeight - 120) + 60;
  
  target.style.left = x + 'px';
  target.style.top = y + 'px';
}`
  }
};

// Helper to load sharing state synchronously from URL query parameter
const getInitialState = (key, defaultValue) => {
  try {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      let base64 = codeParam.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const binString = atob(base64);
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
      const str = new TextDecoder().decode(bytes);
      const data = JSON.parse(str);
      if (data && data[key] !== undefined) {
        return data[key];
      }
    }
  } catch (err) {
    console.error('Failed to parse shared state:', err);
  }
  return defaultValue;
};

const HtmlPreviewer = () => {
  const [html, setHtml] = useState(() => getInitialState('h', '<!-- Write your HTML structure here -->\n<div class="card">\n  <h1>Hello World</h1>\n  <p>Build and preview static web structures instantly.</p>\n</div>'));
  const [css, setCss] = useState(() => getInitialState('c', '/* Write styling rules here */\nbody {\n  background: #060608;\n  color: #fff;\n  font-family: sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}\n.card {\n  padding: 30px;\n  border: 1px solid #1c1c21;\n  background: #0d0d10;\n  border-radius: 16px;\n  text-align: center;\n}'));
  const [js, setJs] = useState(() => getInitialState('j', '// Write code logic here\nconsole.log("Live Sandbox Ready!");'));

  const [activeEditorTab, setActiveEditorTab] = useState('html'); // 'html' | 'css' | 'js'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'phone'
  const [previewKey, setPreviewKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState('');
  const [shareExpiry, setShareExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [lastSharedState, setLastSharedState] = useState(null); // { h, c, j, url, expiresAt }
  const [isSharing, setIsSharing] = useState(false);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!shareExpiry) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = shareExpiry - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        return false;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`Expires in ${h}h ${m}m ${s}s`);
      return true;
    };
    
    updateTimer();
    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [shareExpiry]);

  useEffect(() => {
    // Auto-select device based on initial viewport size
    const width = window.innerWidth;
    if (width < 640) {
      setPreviewDevice('phone');
    } else if (width < 1024) {
      setPreviewDevice('tablet');
    } else {
      setPreviewDevice('desktop');
    }

    // Load shared code via API if ID is provided
    const loadSharedCode = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (hash && hash.startsWith('#code=')) {
        try {
          const base64 = hash.replace('#code=', '')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          let padded = base64;
          while (padded.length % 4) {
            padded += '=';
          }
          const binString = atob(padded);
          const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
          const str = new TextDecoder().decode(bytes);
          const data = JSON.parse(str);
          
          if (data) {
            if (data.expiresAt && Date.now() > data.expiresAt) {
              toast.error('This share link has expired.');
              setShareExpiry(data.expiresAt);
              return;
            }
            setHtml(data.h || '');
            setCss(data.c || '');
            setJs(data.j || '');
            if (data.expiresAt) setShareExpiry(data.expiresAt);
            toast.success('Shared code loaded!');
          }
        } catch (err) {
          console.error('Failed to load shared code from hash:', err);
          toast.error('Failed to load shared code.');
        }
      } else if (id) {
        const toastId = toast.loading('Loading shared code...');
        try {
          const res = await api.get(`/share/metadata/${id}`);
          if (res.data && res.data.content) {
            const data = JSON.parse(res.data.content);
            setHtml(data.h || '');
            setCss(data.c || '');
            setJs(data.j || '');
            if (res.data.expiresAt) setShareExpiry(res.data.expiresAt);
            toast.success('Shared code loaded!', { id: toastId });
          } else {
            toast.error('Failed to load shared code.', { id: toastId });
          }
        } catch (err) {
          toast.error('Failed to load shared code.', { id: toastId });
        }
      }
    };
    loadSharedCode();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  const generateHashLink = () => {
    try {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      const data = { h: html, c: css, j: js, expiresAt };
      const str = JSON.stringify(data);
      const utf8Bytes = new TextEncoder().encode(str);
      const binString = Array.from(utf8Bytes).map((byte) => String.fromCharCode(byte)).join('');
      const base64 = btoa(binString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      return `${window.location.origin}${window.location.pathname}#code=${base64}`;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const copyShareLink = async () => {
    const url = generateHashLink();
    if (url) {
      const previewUrl = url.replace('/tools/html-previewer', '/tools/html-previewer/sandbox');
      navigator.clipboard.writeText(previewUrl);
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      setShareExpiry(expiresAt);
      toast.success('Preview share link copied to clipboard!');
    } else {
      toast.error('Failed to generate share link.');
    }
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('preview-frame-container');
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      element.requestFullscreen().catch((err) => {
        toast.error(`Fullscreen error: ${err.message}`);
      });
    }
  };

  const openInNewTab = () => {
    const url = generateHashLink();
    if (url) {
      const sandboxUrl = url.replace('/tools/html-previewer', '/tools/html-previewer/sandbox');
      window.open(sandboxUrl, '_blank');
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      setShareExpiry(expiresAt);
    } else {
      toast.error('Failed to open preview.');
    }
  };

  const generateCombinedSrc = () => {
    const isFullHtmlDocument = html.trim().toLowerCase().startsWith('<!doctype html') || html.trim().toLowerCase().startsWith('<html');
    
    if (isFullHtmlDocument) {
      let fullHtml = html;
      if (css.trim()) {
        if (fullHtml.includes('</head>')) {
          fullHtml = fullHtml.replace('</head>', `<style>${css}</style></head>`);
        } else {
          fullHtml += `<style>${css}</style>`;
        }
      }
      if (js.trim()) {
        const jsString = `<script>try { ${js} } catch(e) { console.error(e); }</script>`;
        if (fullHtml.includes('</body>')) {
          fullHtml = fullHtml.replace('</body>', `${jsString}</body>`);
        } else {
          fullHtml += jsString;
        }
      }
      return fullHtml;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try {
      ${js}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSrcDoc(generateCombinedSrc());
    }, 600);
    return () => clearTimeout(timer);
  }, [html, css, js, previewKey]);

  const loadTemplate = (name) => {
    const t = TEMPLATES[name];
    if (!t) return;
    setHtml(t.html);
    setCss(t.css);
    setJs(t.js);
    toast.success(`Loaded template: ${t.label}`);
  };

  const clear = () => {
    setHtml('');
    setCss('');
    setJs('');
    toast.success('Workspace cleared');
  };

  const downloadSingleHtml = () => {
    const code = generateCombinedSrc();
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded index.html');
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    
    const isFullHtmlDocument = html.trim().toLowerCase().startsWith('<!doctype html') || html.trim().toLowerCase().startsWith('<html');
    
    if (isFullHtmlDocument) {
      zip.file('index.html', html);
      if (css.trim()) zip.file('style.css', css);
      if (js.trim()) zip.file('script.js', js);
    } else {
      zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${html}
  <script src="script.js"></script>
</body>
</html>`);
      zip.file('style.css', css);
      zip.file('script.js', js);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'static-website.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded static-website.zip!');
  };

  const isInputEmpty = !html.trim() && !css.trim() && !js.trim();

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
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">HTML Live Preview & Static Generator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Build, edit, sandbox HTML/CSS/JS, and download fully packaged static code or ZIP templates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        {/* Left Side: Code Editor Workspace */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col relative min-h-[520px]">
          {/* Controls Header */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4 shrink-0">
            <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner">
              {[
                { id: 'html', label: 'HTML', icon: FileCode },
                { id: 'css', label: 'CSS', icon: Code2 },
                { id: 'js', label: 'Javascript', icon: FileCode }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveEditorTab(t.id)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer relative ${
                    activeEditorTab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeEditorTab === t.id && (
                    <motion.div
                      layoutId="html-editor-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={clear}
              disabled={isInputEmpty}
              className="text-xs px-3.5 py-2 bg-red-500/10 disabled:bg-muted/10 text-red-500 disabled:text-muted-foreground hover:bg-red-500/20 border border-red-500/20 disabled:border-border/50 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Code Textarea Area */}
          <div className="flex-1 min-h-[380px] border border-border/80 rounded-xl overflow-hidden bg-background/30 relative flex flex-col">
            <div className="px-4 py-2.5 border-b border-border/80 bg-muted/20 text-xs font-bold text-muted-foreground flex justify-between items-center">
              <span>{activeEditorTab.toUpperCase()} EDITOR</span>
              <button 
                onClick={() => setSrcDoc(generateCombinedSrc())} 
                className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Play size={11} /> Refresh View
              </button>
            </div>

            <textarea
              value={activeEditorTab === 'html' ? html : activeEditorTab === 'css' ? css : js}
              onChange={(e) => {
                if (activeEditorTab === 'html') setHtml(e.target.value);
                else if (activeEditorTab === 'css') setCss(e.target.value);
                else setJs(e.target.value);
              }}
              className="w-full flex-1 p-4 bg-transparent border-none outline-none font-mono text-sm text-foreground resize-none custom-scrollbar min-h-[340px] leading-relaxed"
              placeholder={`Write your ${activeEditorTab.toUpperCase()} here...`}
              spellCheck="false"
            />
          </div>

          {/* Templates Drawer */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
              <Sparkles size={12} /> Quick Templates
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadTemplate('landing')}
                className="px-3 py-1.5 bg-muted/25 hover:bg-muted/50 border border-border/50 rounded-lg text-xs font-bold text-foreground cursor-pointer"
              >
                Landing Page
              </button>
              <button
                onClick={() => loadTemplate('game')}
                className="px-3 py-1.5 bg-muted/25 hover:bg-muted/50 border border-border/50 rounded-lg text-xs font-bold text-foreground cursor-pointer"
              >
                Reflex Game
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preview & Exporter Panel */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col relative min-h-[520px] justify-between">
          <div className="space-y-6">
            <style>{`
              #preview-frame-container:fullscreen {
                width: 100vw !important;
                height: 100vh !important;
                background: #000 !important;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 0 !important;
                border: none !important;
              }
              #preview-frame-container:fullscreen iframe {
                height: 100vh !important;
                width: 100vw !important;
                transform: none !important;
              }
            `}</style>

            {/* Header / Device controls */}
            <div className="flex justify-between items-center border-b border-border/80 pb-3 flex-wrap gap-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Eye size={16} /> Live Sandbox View
                </h3>
                {shareExpiry && (
                  <span className="text-xs font-mono text-orange-400 mt-1">
                    {timeLeft}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex bg-muted/20 rounded-lg p-0.5 border border-border/50">
                  <button
                    onClick={copyShareLink}
                    disabled={isSharing}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share Sandbox Link"
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={openInNewTab}
                    disabled={isSharing}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Open in New Tab"
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title="Fullscreen Mode"
                  >
                    <Maximize size={13} />
                  </button>
                </div>

                {/* Devices pills */}
                <div className="flex p-0.5 bg-muted/30 rounded-lg border border-border/50">
                  {[
                    { id: 'desktop', icon: Monitor },
                    { id: 'tablet', icon: Tablet },
                    { id: 'phone', icon: Phone }
                  ].map((device) => (
                    <button
                      key={device.id}
                      onClick={() => setPreviewDevice(device.id)}
                      className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer relative ${
                        previewDevice === device.id ? 'text-primary' : ''
                      }`}
                    >
                      {previewDevice === device.id && (
                        <motion.div
                          layoutId="preview-device-active"
                          className="absolute inset-0 bg-background border border-border/50 rounded-md shadow-sm -z-10 animate-none"
                        />
                      )}
                      <device.icon size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sandbox IFrame wrapper */}
            <div 
              ref={containerRef}
              className="w-full flex justify-center bg-background/30 rounded-xl p-3 border border-border/80 shadow-inner overflow-hidden"
            >
              {(() => {
                const targetWidth = previewDevice === 'phone' ? 360 : previewDevice === 'tablet' ? 768 : 1200;
                const targetHeight = previewDevice === 'phone' ? 640 : previewDevice === 'tablet' ? 900 : 768;

                const isDesktopOnLargeScreen = previewDevice === 'desktop' && containerWidth >= 1024;

                // Subtract padding of the wrapper
                const scale = isDesktopOnLargeScreen
                  ? 1
                  : containerWidth > 0
                  ? Math.min(1, (containerWidth - 24) / targetWidth)
                  : 1;

                return (
                  <div
                    id="preview-frame-container"
                    className="transition-all duration-300 bg-white border border-border rounded-lg shadow-lg relative overflow-hidden"
                    style={{
                      width: isDesktopOnLargeScreen ? '100%' : `${targetWidth * scale}px`,
                      height: isDesktopOnLargeScreen ? '520px' : `${targetHeight * scale}px`,
                    }}
                  >
                    <iframe
                      srcDoc={srcDoc}
                      key={previewKey}
                      title="html-preview"
                      className="border-none block"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                      scrolling="yes"
                      style={
                        isDesktopOnLargeScreen
                          ? { width: '100%', height: '100%', overflow: 'auto' }
                          : {
                              width: `${targetWidth}px`,
                              height: `${targetHeight}px`,
                              transform: `scale(${scale})`,
                              transformOrigin: 'top left',
                              overflow: 'auto',
                            }
                      }
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Export Actions Footer */}
          <div className="pt-6 border-t border-border/50 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={downloadSingleHtml}
              className="py-3 bg-muted/40 hover:bg-muted/65 border border-border/85 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm text-foreground active:scale-[0.98]"
            >
              <Download size={15} /> Single index.html
            </button>
            <button
              onClick={downloadZip}
              className="py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.98]"
            >
              <Download size={15} /> Export Static ZIP
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HtmlPreviewer;
