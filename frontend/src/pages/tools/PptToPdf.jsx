import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Upload, Copy, CheckCircle2, FileImage, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const PptToPdf = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileUpload({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.pptx') && !uploadedFile.name.endsWith('.ppt')) {
      toast.error('Please upload a valid PowerPoint presentation (.pptx)');
      return;
    }

    setFile(uploadedFile);
    toast.success('Presentation uploaded successfully!');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        const zip = await JSZip.loadAsync(buffer);
        
        // Find all slide XML files
        const slideFiles = Object.keys(zip.files).filter(name => 
          name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
        );

        if (slideFiles.length === 0) {
          toast.error("Invalid PPTX structure. Could not find slides.");
          return;
        }

        // Sort slide files numerically (e.g. slide1.xml, slide2.xml, slide10.xml)
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
          return numA - numB;
        });

        const parsedSlides = [];
        const parser = new DOMParser();

        for (let i = 0; i < slideFiles.length; i++) {
          const xmlText = await zip.file(slideFiles[i]).async("text");
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const tElements = xmlDoc.getElementsByTagName("a:t");
          const texts = Array.from(tElements).map(el => el.textContent.trim()).filter(Boolean);

          if (texts.length > 0) {
            const title = texts[0];
            const bullets = texts.slice(1);
            parsedSlides.push({
              title: title.length > 50 ? title.substring(0, 50) + "..." : title,
              bullets: bullets.length > 0 ? bullets.slice(0, 5) : ["No list items found on slide."]
            });
          } else {
            parsedSlides.push({
              title: `Slide ${i + 1}`,
              bullets: ["Image or shape-only content."]
            });
          }
        }

        setSlides(parsedSlides);
        setActiveSlideIdx(0);
        toast.success(`Presentation parsed successfully! Extracted ${parsedSlides.length} slides.`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse PowerPoint presentation.");
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const exportPDF = () => {
    if (slides.length === 0) return;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage();
      
      doc.setFillColor(15, 23, 42); // dark background
      doc.rect(0, 0, 297, 210, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text(slide.title, 20, 40);
      doc.line(20, 48, 277, 48);

      doc.setFontSize(14);
      let y = 70;
      slide.bullets.forEach(bullet => {
        const splitBullet = doc.splitTextToSize(`- ${bullet}`, 250);
        doc.text(splitBullet, 25, y);
        y += (splitBullet.length * 7) + 8;
      });
    });

    doc.save(`${file?.name.replace('.pptx', '') || 'presentation'}_export.pdf`);
    toast.success('Presentation converted and downloaded as PDF!');
  };

  const downloadPNG = () => {
    if (slides.length === 0) return;
    
    // Draw current active slide to canvas and download
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Helvetica';
    ctx.fillText(slides[activeSlideIdx].title, 50, 80);
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(750, 100);
    ctx.stroke();

    // Bullets
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '18px Arial';
    let y = 160;
    slides[activeSlideIdx].bullets.forEach(bullet => {
      ctx.fillText(`• ${bullet}`, 60, y);
      y += 40;
    });

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `slide_${activeSlideIdx + 1}.png`;
    link.click();
    toast.success(`Slide ${activeSlideIdx + 1} downloaded as PNG!`);
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">PowerPoint to PDF / Image Converter</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Convert Microsoft PowerPoint slides (.pptx) client-side into structured PDF documents or individual PNG images.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Column */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select presentation</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload PPTX / PPT</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pptx,.ppt" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <FileText className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {slides.length > 0 && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversion Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportPDF}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export to PDF
                </button>
                <button
                  onClick={downloadPNG}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <FileImage size={16} /> Download PNG
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Presentation Canvas Preview */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Sparkles size={16} className="text-primary" />
              Presentation Slides Preview
            </h2>
            {slides.length > 0 && (
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIdx(idx)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all ${activeSlideIdx === idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 md:p-12 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
            {slides.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl aspect-[4/3] bg-slate-900 text-slate-100 p-12 shadow-2xl rounded-xl border border-slate-800 flex flex-col justify-between font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black border-b border-slate-800 pb-3 mb-6">{slides[activeSlideIdx].title}</h2>
                  <ul className="space-y-4 pl-2">
                    {slides[activeSlideIdx].bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                        <span className="text-indigo-400 mt-1">&bull;</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Slide {activeSlideIdx + 1} of {slides.length}</span>
                  <span>POWERPOINT CONVERTER ENGINE</span>
                </div>
              </motion.div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full cursor-pointer hover:bg-neutral-800/40 border border-dashed border-slate-800/60 rounded-xl transition-all"
              >
                <FileText size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Presentation Uploaded</p>
                <p className="text-xs max-w-xs leading-normal">Click here or upload a PPTX presentation file to audit slide structures.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PptToPdf;
