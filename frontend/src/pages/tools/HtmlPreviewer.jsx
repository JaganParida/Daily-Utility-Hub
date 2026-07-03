import { useState, useEffect, useRef } from 'react';
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

  const generateShareLink = () => {
    try {
      const data = { h: html, c: css, j: js };
      const str = JSON.stringify(data);
      const utf8Bytes = new TextEncoder().encode(str);
      const base64 = btoa(String.fromCharCode(...utf8Bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      return `${window.location.origin}${window.location.pathname}?code=${base64}`;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const copyShareLink = () => {
    const url = generateShareLink();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
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
    try {
      const data = { h: html, c: css, j: js };
      const str = JSON.stringify(data);
      const utf8Bytes = new TextEncoder().encode(str);
      const base64 = btoa(String.fromCharCode(...utf8Bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const url = `/tools/html-previewer/sandbox?code=${base64}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Failed to open preview in new tab.');
    }
  };

  const generateCombinedSrc = () => {
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
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">HTML Live Preview & Static Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Build, edit, sandbox HTML/CSS/JS, and download fully packaged static code or ZIP templates.</p>
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
              }
            `}</style>

            {/* Header / Device controls */}
            <div className="flex justify-between items-center border-b border-border/80 pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Eye size={16} /> Live Sandbox View
              </h3>

              <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex bg-muted/20 rounded-lg p-0.5 border border-border/50">
                  <button
                    onClick={copyShareLink}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title="Share Sandbox Link"
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
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
            <div className="w-full flex justify-center bg-background/30 rounded-xl p-3 border border-border/80 shadow-inner">
              <div
                id="preview-frame-container"
                className="transition-all duration-300 overflow-hidden bg-white border border-border rounded-lg shadow-lg relative"
                style={{
                  width: previewDevice === 'phone' ? '360px' : previewDevice === 'tablet' ? '768px' : '100%',
                  height: '520px'
                }}
              >
                <iframe
                  srcDoc={srcDoc}
                  title="html-preview"
                  className="w-full h-full border-none block"
                  sandbox="allow-scripts"
                  scrolling="yes"
                  style={{ overflow: 'auto' }}
                />
              </div>
            </div>
          </div>

          {/* Export Actions Footer */}
          <div className="pt-6 border-t border-border/50 mt-6 grid grid-cols-2 gap-4">
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
