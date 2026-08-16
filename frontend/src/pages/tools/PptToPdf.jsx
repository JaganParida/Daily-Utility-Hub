import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
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
        for (let i = 0; i < splitBullet.length; i++) {
            if (y > 190) {
              doc.addPage();
              doc.setFillColor(15, 23, 42);
              doc.rect(0, 0, 297, 210, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(14);
              y = 30;
            }
            doc.text(splitBullet[i], 25, y);
            y += 7;
        }
        y += 8;
      });
    });

    doc.save(`${file?.name.replace('.pptx', '') || 'presentation'}_export.pdf`);
    toast.success('Presentation converted and downloaded as PDF!');
  };

  const downloadPNG = async () => {
    if (slides.length === 0) return;
    toast.loading('Generating images...', { id: 'png-export' });
    const zip = new JSZip();

    for (let idx = 0; idx < slides.length; idx++) {
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
      ctx.fillText(slides[idx].title, 50, 80);
      
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
      slides[idx].bullets.forEach(bullet => {
        const words = `• ${bullet}`.split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          let word = words[i];
          if (ctx.measureText(currentLine + " " + word).width < 700) {
            currentLine += " " + word;
          } else {
            ctx.fillText(currentLine, 60, y);
            y += 30;
            currentLine = "  " + word; // Indent wrapped line
          }
        }
        ctx.fillText(currentLine, 60, y);
        y += 40;
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      zip.file(`slide_${idx + 1}.png`, blob);
    }
    
    const contentZip = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(contentZip);
    link.download = `${file?.name.replace('.pptx', '') || 'presentation'}_slides.zip`;
    link.click();
    toast.success('All slides downloaded as a ZIP of PNGs!', { id: 'png-export' });
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PowerPoint to PDF Converter"
        description="Convert Microsoft PowerPoint slides (.pptx) client-side into structured PDF documents or individual PNG images."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="PowerPoint to PDF"
        extraBadge="PPTX Document Converter"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Column */}
        <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3">Select Presentation</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#c2d7fb] bg-white hover:border-[#1a73e8] hover:bg-[#f8fbff] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 bg-[#e8f0fe] text-[#1a73e8] rounded-2xl flex items-center justify-center border border-[#d2e3fc] group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-bold text-[#202124]">Upload PPTX / PPT</p>
                <p className="text-[11px] text-[#5f6368] mt-0.5">Drag and drop or click to browse</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pptx,.ppt" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] flex items-center gap-3">
                <div className="p-2 bg-[#e8f0fe] text-[#1a73e8] rounded-lg shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-[#202124] truncate">{file.name}</p>
                  <p className="text-[11px] text-[#5f6368]">{(file.size / 1024).toFixed(1)} KB &bull; {slides.length} slides</p>
                </div>
              </div>
            )}

            {slides.length > 0 && (
              <div className="pt-3 border-t border-[#dadce0] space-y-2.5">
                <button
                  onClick={exportPDF}
                  className="w-full btn-google-primary text-xs sm:text-sm py-2.5 justify-center shadow-xs"
                >
                  <Download size={15} /> Export & Download PDF
                </button>
                <button
                  onClick={downloadPNG}
                  className="w-full btn-google-secondary text-xs sm:text-sm py-2.5 justify-center"
                >
                  <FileImage size={15} /> Download All as PNG (ZIP)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Presentation Canvas Preview */}
        <div className="flex-1 w-full tool-card overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-3 sm:p-4 border-b border-[#dadce0] bg-[#f8f9fa] flex flex-wrap justify-between items-center gap-2 shrink-0">
            <h2 className="font-bold text-[#202124] flex items-center gap-2 text-xs uppercase tracking-wider">
              <Sparkles size={15} className="text-[#1a73e8]" />
              Presentation Slides Preview
            </h2>
            {slides.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIdx(idx)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeSlideIdx === idx 
                        ? 'bg-[#1a73e8] text-white shadow-2xs' 
                        : 'bg-white text-[#5f6368] border border-[#dadce0] hover:border-[#1a73e8]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 md:p-10 bg-[#f8f9fa] flex justify-center items-center overflow-auto custom-scrollbar">
            {slides.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl aspect-[4/3] bg-white text-[#202124] p-8 sm:p-10 shadow-md rounded-2xl border border-[#dadce0] flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black border-b border-[#dadce0] pb-3 mb-5 text-[#202124]">{slides[activeSlideIdx].title}</h2>
                  <ul className="space-y-3 pl-2">
                    {slides[activeSlideIdx].bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-[#5f6368]">
                        <span className="text-[#1a73e8] mt-0.5 font-bold">&bull;</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#5f6368] border-t border-[#dadce0] pt-3 mt-4 font-mono">
                  <span>Slide {activeSlideIdx + 1} of {slides.length}</span>
                  <span className="text-[#1a73e8] font-bold">POWERPOINT CONVERTER</span>
                </div>
              </motion.div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="text-center text-[#5f6368] p-10 flex flex-col items-center justify-center gap-2 h-full cursor-pointer hover:bg-white/80 border border-dashed border-[#dadce0] rounded-2xl transition-all"
              >
                <FileText size={44} className="text-[#dadce0]" />
                <p className="text-sm font-bold text-[#202124]">No Presentation Uploaded</p>
                <p className="text-xs max-w-xs leading-normal text-[#5f6368]">Upload a PPTX presentation file to preview and convert slides.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PptToPdf;
