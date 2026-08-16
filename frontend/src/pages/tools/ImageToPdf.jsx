import { useState, useEffect } from 'react';
import ToolHeader from '../../components/ToolHeader';
import { FileText, Download, Loader2, Trash2, ArrowUp, ArrowDown, Settings2, ChevronDown, CheckCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropzoneComponent from '../../components/DropzoneComponent';
import { jsPDF } from 'jszip'; // wait, jsPDF is from jspdf, JSZip is from jszip
import JSZip from 'jszip';
import { jsPDF as JsPdfDoc } from 'jspdf';
import { toast } from 'react-hot-toast';

const PAGE_SIZES = [
  { id: 'a3',      name: 'A3  (297 × 420 mm)' },
  { id: 'a4',      name: 'A4  (210 × 297 mm)' },
  { id: 'a5',      name: 'A5  (148 × 210 mm)' },
  { id: 'b4',      name: 'B4  (250 × 353 mm)' },
  { id: 'b5',      name: 'B5  (176 × 250 mm)' },
  { id: 'letter',  name: 'Letter  (8.5 × 11 in)' },
  { id: 'legal',   name: 'Legal  (8.5 × 14 in)' },
  { id: 'tabloid', name: 'Tabloid  (11 × 17 in)' },
];

const ImageToPdf = () => {
  const [images, setImages] = useState([]); // [{ file, url }]
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'generating' | 'done'

  const [pdfOrientation, setPdfOrientation] = useState('p'); // 'p' portrait, 'l' landscape
  const [pageSize, setPageSize] = useState('a4');
  const [margin, setMargin] = useState(10); // mm
  const [exportMode, setExportMode] = useState('combined'); // 'combined' | 'separate'

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => images.forEach(img => URL.revokeObjectURL(img.url));
  }, []);

  const handleFilesAccepted = (files) => {
    if (!files.length) return;
    const newImages = Array.from(files).map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const n = [...prev];
      URL.revokeObjectURL(n[index].url);
      n.splice(index, 1);
      return n;
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const n = [...prev];
      [n[index - 1], n[index]] = [n[index], n[index - 1]];
      return n;
    });
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const n = [...prev];
      [n[index + 1], n[index]] = [n[index], n[index + 1]];
      return n;
    });
  };

  const generatePDF = async () => {
    if (!images.length) return;
    setDownloadState('generating');
    
    // Yield to the event loop for 150ms so the button morph state renders smoothly before CPU-heavy PDF generation starts
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const startTime = Date.now();

    try {
      if (exportMode === 'combined') {
        // Combined mode: Single multi-page PDF document
        const doc = new JsPdfDoc(pdfOrientation, 'mm', pageSize);
        const pageWidth  = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableW = pageWidth  - margin * 2;
        const usableH = pageHeight - margin * 2;

        for (let i = 0; i < images.length; i++) {
          const { url, file } = images[i];
          const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
          });

          if (i > 0) doc.addPage();

          const imgRatio  = img.width / img.height;
          const pageRatio = usableW / usableH;
          let finalW = usableW, finalH = usableH;
          if (imgRatio > pageRatio) finalH = usableW / imgRatio;
          else                      finalW = usableH * imgRatio;

          const x = margin + (usableW - finalW) / 2;
          const y = margin + (usableH - finalH) / 2;
          const imgType = file.type === 'image/png' ? 'PNG' : 'JPEG';
          doc.addImage(img, imgType, x, y, finalW, finalH);
        }

        const elapsed = Date.now() - startTime;
        if (elapsed < 900) await new Promise(r => setTimeout(r, 900 - elapsed));

        doc.save('converted_document.pdf');
      } else {
        // Separate mode: Create individual single-page PDFs, bundle them in a ZIP archive
        const zip = new JSZip();

        for (let i = 0; i < images.length; i++) {
          const { url, file } = images[i];
          const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
          });

          const singleDoc = new JsPdfDoc(pdfOrientation, 'mm', pageSize);
          const pageWidth  = singleDoc.internal.pageSize.getWidth();
          const pageHeight = singleDoc.internal.pageSize.getHeight();
          const usableW = pageWidth  - margin * 2;
          const usableH = pageHeight - margin * 2;

          const imgRatio  = img.width / img.height;
          const pageRatio = usableW / usableH;
          let finalW = usableW, finalH = usableH;
          if (imgRatio > pageRatio) finalH = usableW / imgRatio;
          else                      finalW = usableH * imgRatio;

          const x = margin + (usableW - finalW) / 2;
          const y = margin + (usableH - finalH) / 2;
          const imgType = file.type === 'image/png' ? 'PNG' : 'JPEG';
          singleDoc.addImage(img, imgType, x, y, finalW, finalH);

          // Get raw PDF output as array buffer and save it to the zip file
          const pdfOutput = singleDoc.output('arraybuffer');
          const originalNameBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          zip.file(`${originalNameBase}.pdf`, pdfOutput);
        }

        const elapsed = Date.now() - startTime;
        if (elapsed < 900) await new Promise(r => setTimeout(r, 900 - elapsed));

        const content = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `pdf_documents_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);
      }

      toast.success('PDF documents exported successfully!');
      setDownloadState('done');
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setDownloadState('idle'), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
      setDownloadState('idle');
    }
  };

  const clear = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasImages = images.length > 0;

  return (
    <div className="tool-page-container">

      {/* Header */}
      <ToolHeader
        title="Advanced Image to PDF"
        description="Convert photos to printable PDF documents — A4, Letter, and more."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Images to PDF Document"
        extraBadge="Page Margin Controls"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* Left: Upload + Page Queue */}
        <motion.div
          layout
          className={`flex-1 w-full tool-card flex flex-col transition-all duration-500 ease-out ${
            !hasImages ? 'min-h-[50vh] items-stretch p-4 md:p-5' : 'min-h-0 p-4 md:p-6 space-y-5'
          }`}
        >
          <DropzoneComponent
            className={hasImages ? 'shrink-0' : 'flex-1 justify-center'}
            onFilesAccepted={handleFilesAccepted}
            accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
            maxFiles={50}
            title="Drag & drop images here (multi-page supported)"
          />

          <AnimatePresence mode="popLayout">
            {hasImages && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-[#f8f9fa] border border-[#dadce0] p-4 md:p-5 rounded-2xl flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-2">
                    <Layers size={14} className="text-[#1a73e8]" /> Pages ({images.length})
                  </h3>
                  <button onClick={clear} className="text-xs text-[#d93025] hover:text-[#b3261e] font-semibold hover:underline cursor-pointer">
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar min-h-0">
                  <AnimatePresence mode="popLayout">
                    {images.map((img, idx) => (
                      <motion.div
                        layout
                        key={img.url}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#dadce0] group hover:border-[#1a73e8]/60 transition-colors duration-200 shadow-2xs"
                      >
                        {/* Page number */}
                        <span className="w-6 text-center text-xs font-bold text-[#5f6368] shrink-0">{idx + 1}</span>

                        {/* Thumbnail */}
                        <img
                          src={img.url}
                          alt={`page-${idx + 1}`}
                          className="w-12 h-12 object-cover rounded-lg border border-[#dadce0] shrink-0 bg-white"
                        />

                        {/* File info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#202124] truncate">{img.file.name}</p>
                          <p className="text-[11px] text-[#5f6368]">{(img.file.size / 1024).toFixed(1)} KB</p>
                        </div>

                        {/* Page controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => moveImage(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] disabled:opacity-30 transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveImage(idx, 1)}
                            disabled={idx === images.length - 1}
                            className="p-1 rounded-lg text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] disabled:opacity-30 transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeImage(idx)}
                            className="p-1 rounded-lg text-[#d93025] hover:bg-[#fce8e6] transition-colors cursor-pointer"
                            title="Remove Page"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Settings */}
        <div className={`w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasImages ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>

          <div className="tool-sidebar p-5 sm:p-6 space-y-5">

            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Settings2 size={15} className="text-[#1a73e8]" /> Document Layout
            </h3>

            {/* Export Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">Export Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'combined', label: 'Single PDF' },
                  { id: 'separate', label: 'Separate PDFs (ZIP)' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setExportMode(mode.id)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      exportMode === mode.id
                        ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">Paper Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="google-select w-full text-xs font-semibold"
              >
                {PAGE_SIZES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'p', label: 'Portrait' }, { id: 'l', label: 'Landscape' }].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPdfOrientation(mode.id)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      pdfOrientation === mode.id
                        ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Slider */}
            <div className="space-y-2 pt-3 border-t border-[#dadce0]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">White Margin</label>
                <span className="text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] px-2 py-0.5 rounded-md">{margin} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none bg-[#e8eaed] accent-[#1a73e8]"
              />
              <p className="text-[11px] text-[#5f6368] leading-relaxed">Leave clean white border spacing around images.</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#dadce0] flex flex-col gap-2.5">
              <button
                onClick={generatePDF}
                disabled={downloadState !== 'idle' || !hasImages}
                className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
              >
                {downloadState === 'done' ? (
                  <>
                    <CheckCircle size={16} /> Exported Successfully!
                  </>
                ) : downloadState === 'generating' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {exportMode === 'combined' ? 'Generating PDF…' : 'Generating ZIP…'}
                  </>
                ) : (
                  <>
                    <Download size={16} /> {exportMode === 'combined' ? 'Generate & Download PDF' : 'Generate PDFs (ZIP)'}
                  </>
                )}
              </button>

              <button
                onClick={clear}
                disabled={downloadState === 'generating' || !hasImages}
                className="w-full btn-google-secondary text-xs py-2 justify-center"
              >
                <Trash2 size={14} /> Clear Queue
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ImageToPdf;
