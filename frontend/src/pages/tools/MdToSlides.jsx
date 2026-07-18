import { useState, useEffect } from 'react';
import { Layers, Download, Play, ChevronLeft, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

const MdToSlides = () => {
  const defaultMd = `# Slide 1: Welcome\n- Daily Utility Hub Slide Deck\n- Convert Markdown to presentation slides instantly.\n\n# Slide 2: Dynamic Features\n- 100% Client-side conversion\n- Fully responsive layout structures\n- SVG rendering and styling\n\n# Slide 3: Export Formats\n- Download as print-ready PDF\n- Interactive slides controls\n- Simple, clean formatting`;

  const [markdown, setMarkdown] = useState(defaultMd);
  const [slides, setSlides] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  useEffect(() => {
    parseMarkdown();
  }, [markdown]);

  const parseMarkdown = () => {
    // Split slides by H1 headings e.g. # Slide Title
    const sections = markdown.split(/\n(?=# )/g);
    const parsed = sections.map((sec, idx) => {
      const lines = sec.split('\n').filter(Boolean);
      const titleLine = lines.find(l => l.startsWith('# '));
      const title = titleLine ? titleLine.replace('# ', '').trim() : `Slide ${idx + 1}`;
      
      const bullets = lines
        .filter(l => l.startsWith('- ') || l.startsWith('* '))
        .map(l => l.replace(/^[-*]\s+/, '').trim());

      return { title, bullets };
    });

    setSlides(parsed);
    if (currentSlideIdx >= parsed.length) {
      setCurrentSlideIdx(0);
    }
  };

  const nextSlide = () => {
    if (currentSlideIdx < slides.length - 1) {
      setCurrentSlideIdx(currentSlideIdx + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIdx > 0) {
      setCurrentSlideIdx(currentSlideIdx - 1);
    }
  };

  const exportPDF = () => {
    if (slides.length === 0) return;
    // Standard presentation PDF is landscape (A4 landscape is 297mm x 210mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage();
      
      // Background Accent
      doc.setFillColor(30, 27, 75); // Dark blue background
      doc.rect(0, 0, 297, 210, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text(slide.title, 20, 40);
      doc.line(20, 48, 277, 48);

      // Bullets
      doc.setFontSize(16);
      let y = 70;
      slide.bullets.forEach(bullet => {
        const splitBullet = doc.splitTextToSize(`* ${bullet}`, 250);
        doc.text(splitBullet, 25, y);
        y += (splitBullet.length * 8) + 10;
      });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Daily Utility Hub | Page ${idx + 1} of ${slides.length}`, 20, 195);
    });

    doc.save(`presentation_slide_deck_${Date.now()}.pdf`);
    toast.success('Presentation slides exported as PDF!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Markdown to Slide Deck</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compile Markdown headers and list bullets directly into elegant, interactive landscape presentation slides, ready for PDF export.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Markdown Editor */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText size={16} /> Markdown Deck Editor
              </h3>
              <button
                onClick={exportPDF}
                disabled={slides.length === 0}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} /> Export Slide Deck PDF
              </button>
            </div>
            
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder="Start each slide with a '# ' header..."
            />
          </div>
        </div>

        {/* Live Slide Presentation Deck */}
        <div className="w-full lg:w-[500px] xl:w-[550px] shrink-0 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Play size={16} /> Interactive Slides Player
              </h3>
              <span className="text-xs font-bold text-muted-foreground font-mono">
                Slide {slides.length > 0 ? currentSlideIdx + 1 : 0} of {slides.length}
              </span>
            </div>

            <div className="flex-1 p-6 bg-neutral-950 aspect-[4/3] flex justify-center items-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {slides.length > 0 && (
                  <motion.div
                    key={currentSlideIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full h-full p-8 flex flex-col justify-between text-white font-sans"
                  >
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white border-b border-white/20 pb-3 mb-6">
                        {slides[currentSlideIdx].title}
                      </h2>
                      <ul className="space-y-3.5 pl-2">
                        {slides[currentSlideIdx].bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm opacity-90 leading-relaxed">
                            <span className="text-indigo-400 mt-1">&bull;</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="text-[10px] opacity-40 font-mono tracking-wider">DAILY UTILITY HUB DECK ENGINE</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Slides Controller Navigation */}
            <div className="p-3 border-t border-border bg-muted/20 flex justify-between items-center shrink-0">
              <button
                onClick={prevSlide}
                disabled={currentSlideIdx === 0}
                className="p-2 hover:bg-muted text-foreground disabled:opacity-30 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlideIdx === slides.length - 1}
                className="p-2 hover:bg-muted text-foreground disabled:opacity-30 rounded-xl transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MdToSlides;
