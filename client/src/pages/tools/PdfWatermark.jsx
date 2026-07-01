import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Droplets, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfWatermark = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#e61a1a'); // default red
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState('center'); // center, top-left, top-right, bottom-left, bottom-right
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const colors = [
    { name: 'Red', value: '#e61a1a' },
    { name: 'Blue', value: '#1a56e6' },
    { name: 'Grey', value: '#6b7280' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Black', value: '#0f172a' }
  ];

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleClear = () => {
    setFile(null);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFile(droppedFile);
    setPreviewUrl(URL.createObjectURL(droppedFile));
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleWatermark = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (!watermarkText.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('watermarkText', watermarkText);
    formData.append('color', color);
    formData.append('opacity', opacity);
    formData.append('fontSize', fontSize);
    formData.append('rotation', rotation);
    formData.append('position', position);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Applying watermark securely on server...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/watermark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.name.replace('.pdf', '')}_watermarked.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Watermark applied successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const backendMsg = error.response?.data?.message || 'Failed to apply watermark.';
      toast.error(backendMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to determine CSS placement for the Live Preview
  const getPreviewAlignmentClass = () => {
    if (position === 'top-left') return 'items-start justify-start p-4';
    if (position === 'top-right') return 'items-start justify-end p-4';
    if (position === 'bottom-left') return 'items-end justify-start p-4';
    if (position === 'bottom-right') return 'items-end justify-end p-4';
    return 'items-center justify-center';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-0">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shadow-sm">
          <Droplets size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced PDF Watermark</h1>
          <p className="text-muted-foreground mt-1 text-sm">Stamp documents with customized text, positioning, colors, and opacity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        
        {/* Upload & Preview Area */}
        <div className="flex flex-col gap-6 w-full min-h-0">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-64 shrink-0">
            {/* Dropzone */}
            {!file ? (
              <div 
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-64 md:h-full ${
                  isDragging ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-card hover:border-purple-500/50 hover:bg-muted/30'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-4 pointer-events-none">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
                <p className="text-xs text-muted-foreground pointer-events-none">Drag & drop or click to browse</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-center items-center h-64 md:h-full relative group min-w-0">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 shrink-0">
                  <FileText size={32} />
                </div>
                <h3 className="font-bold text-foreground text-center truncate w-full px-4 min-w-0" title={file.name}>{file.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5"
                  >
                    <Eye size={12} />
                    {showPreview ? 'Hide' : 'Preview'}
                  </button>
                  <button onClick={handleClear} className="text-xs text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Visual Live Preview */}
            <div className="bg-card rounded-2xl border border-border p-4 relative overflow-hidden h-64 md:h-full flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Live Preview</span>
              <div className={`flex-1 bg-background rounded-xl border border-dashed border-border flex relative ${getPreviewAlignmentClass()}`}>
                <span 
                  className="font-bold whitespace-nowrap select-none transition-all duration-100"
                  style={{ 
                    color: color, 
                    opacity: opacity, 
                    fontSize: `${fontSize * 0.4}px`, // scaled for preview box
                    transform: `rotate(${rotation}deg)` 
                  }}
                >
                  {watermarkText || 'PREVIEW'}
                </span>
                
                {/* Background paper lines placeholder to show transparency */}
                <div className="absolute inset-x-4 top-1/4 h-2 bg-muted/40 rounded pointer-events-none z-0" />
                <div className="absolute inset-x-4 top-1/2 h-2 bg-muted/40 rounded pointer-events-none z-0" />
                <div className="absolute inset-x-4 top-3/4 h-2 bg-muted/40 rounded pointer-events-none z-0" />
              </div>
            </div>
          </div>

          {file && showPreview && previewUrl && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Document Preview</h4>
                <a 
                  href={previewUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  Open in New Tab <ExternalLink size={12} />
                </a>
              </div>
              <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/10 relative">
                <object 
                  data={previewUrl} 
                  type="application/pdf" 
                  className="w-full h-full"
                >
                  <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                    </div>
                  </iframe>
                </object>
              </div>
            </div>
          )}

          {/* Watermark Configuration Options */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
             
             {/* Text Input */}
             <div>
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-2">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL or DRAFT"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg font-medium"
                  maxLength={30}
                />
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                
                {/* Color Selector */}
                <div>
                   <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-3">Color</label>
                   <div className="flex flex-wrap gap-2 items-center">
                      {colors.map(c => (
                         <button 
                           key={c.value} 
                           onClick={() => setColor(c.value)}
                           className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c.value ? 'scale-110 border-foreground shadow' : 'border-transparent'}`}
                           style={{ backgroundColor: c.value }}
                           title={c.name}
                         />
                      ))}
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 cursor-pointer rounded-full" 
                      />
                   </div>
                </div>

                {/* Position Selector */}
                <div>
                   <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-2">Position</label>
                   <div className="grid grid-cols-3 gap-1.5 w-44">
                      {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(pos => {
                        const isSelected = position === pos;
                        let label = pos.split('-').map(w => w[0]).join('').toUpperCase() || 'C';
                        if (pos === 'center') label = 'C';
                        return (
                          <button
                            key={pos}
                            onClick={() => setPosition(pos)}
                            className={`py-1 text-xs font-bold border rounded-lg transition-colors uppercase ${isSelected ? 'bg-purple-500 border-purple-500 text-white shadow-sm' : 'bg-background hover:bg-muted text-foreground border-border'}`}
                            style={pos === 'center' ? { gridColumn: '2', gridRow: '2' } : pos === 'bottom-left' ? { gridColumn: '1', gridRow: '3' } : pos === 'bottom-right' ? { gridColumn: '3', gridRow: '3' } : pos === 'top-left' ? { gridColumn: '1', gridRow: '1' } : { gridColumn: '3', gridRow: '1' }}
                            title={pos.replace('-', ' ')}
                          >
                            {label}
                          </button>
                        );
                      })}
                   </div>
                </div>

             </div>

             {/* Sliders Block */}
             <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border">
                
                {/* Opacity */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opacity</label>
                      <span className="text-xs font-mono font-bold text-foreground">{Math.round(opacity * 100)}%</span>
                   </div>
                   <input 
                     type="range" min="0.1" max="1.0" step="0.05"
                     value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))}
                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500" 
                   />
                </div>

                {/* Font Size */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font Size</label>
                      <span className="text-xs font-mono font-bold text-foreground">{fontSize}px</span>
                   </div>
                   <input 
                     type="range" min="14" max="96" step="2"
                     value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500" 
                   />
                </div>

                {/* Rotation */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rotation</label>
                      <span className="text-xs font-mono font-bold text-foreground">{rotation}°</span>
                   </div>
                   <input 
                     type="range" min="-90" max="90" step="5"
                     value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500" 
                   />
                </div>

             </div>

          </div>

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Watermark Details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Applies clean text formatting across every single page.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Fully adjustable opacity prevents blocking content.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>We delete files immediately after processing.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleWatermark}
            disabled={!file || !watermarkText.trim() || isProcessing}
            className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Droplets size={18} />
            {isProcessing ? 'Applying...' : 'Stamp PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfWatermark;
