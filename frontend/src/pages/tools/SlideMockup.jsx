import { useState, useRef, useEffect } from 'react';
import { Palette, Download, Trash2, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SlideMockup = () => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#818cf8'); // default indigo
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set default whiteboard background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success('Whiteboard cleared!');
  };

  const downloadMockup = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `slide_mockup_${Date.now()}.png`;
    link.click();
    toast.success('Slide mockup drawing saved as PNG image!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Palette size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Slide Canvas Whiteboard</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Sketch flow diagrams, design slide layouts, and draw wireframes on an interactive whiteboard, exporting drafts as PNG images.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Brush Controller Sidebar */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Brush Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Brush Color</label>
                <div className="flex gap-2">
                  {['#818cf8', '#10b981', '#f59e0b', '#ef4444', '#0f172a'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border transition-transform ${color === c ? 'scale-110 ring-2 ring-primary/45' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Brush Size ({brushSize}px)</label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={clearCanvas}
                  className="py-3 px-4 bg-background hover:bg-muted text-red-500 border border-border font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Clear Canvas
                </button>
                <button
                  onClick={downloadMockup}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawing Board Canvas */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Layers size={16} className="text-primary" />
              Sketch Presentation Whiteboard
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-8 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="max-w-full aspect-[4/3] bg-white rounded-xl shadow-2xl cursor-crosshair border border-slate-700 select-none touch-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SlideMockup;
