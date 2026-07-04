import { useState, useEffect } from 'react';
import { Clock, Play, Pause, RefreshCw, LayoutTemplate } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PrompterTimer = () => {
  const [notes, setNotes] = useState(`[Slide 1] Hello everyone, welcome to the presentation. Today we will discuss client-side web utility architectures.\n\n[Slide 2] Moving on to performance, our goal is sub-second compilation and high-DPI canvas exporting.\n\n[Slide 3] To conclude, local sandbox applications guarantee complete data safety and privacy.`);
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Parse slides split by bracket markers [Slide X]
    const parsed = notes.split(/(?=\[Slide \d+\])/i).map(sec => {
      const match = sec.match(/\[Slide (\d+)\](.*)/is);
      if (match) {
        return {
          header: `Slide ${match[1]}`,
          content: match[2].trim()
        };
      }
      return { header: 'General Notes', content: sec.trim() };
    });
    setSlides(parsed.filter(s => s.content));
  }, [notes]);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const nextSlide = () => {
    if (activeSlideIdx < slides.length - 1) {
      setActiveSlideIdx(activeSlideIdx + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlideIdx > 0) {
      setActiveSlideIdx(activeSlideIdx - 1);
    }
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Clock size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Speaker Prompter & Timer</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Rehearse presentations, pace your slide transitions, track timings, and read prompter notes dynamically.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Presenter Notes Editor */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <LayoutTemplate size={16} /> Speaker Prompter Notes
              </h3>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
              placeholder="Tag slide segments with [Slide 1], [Slide 2], etc..."
            />
          </div>
        </div>

        {/* Live Prompter View */}
        <div className="w-full lg:w-[450px] xl:w-[480px] shrink-0 space-y-6">
          {/* Rehearsal Timer */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rehearsal Timer</h3>
            <div className="p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
              <p className="text-4xl font-black text-primary font-mono">{formatTime(seconds)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Pacing Duration</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleTimer}
                className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
                {isActive ? 'Pause Timer' : 'Start Rehearsal'}
              </button>
              <button
                onClick={resetTimer}
                className="py-3 px-4 bg-background hover:bg-muted text-foreground border border-border rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </div>

          {/* Active slide card prompter */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 min-h-[250px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {slides.length > 0 ? slides[activeSlideIdx].header : 'No Slides'}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {slides.length > 0 ? `${activeSlideIdx + 1} of ${slides.length}` : '0/0'}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {slides.length > 0 ? slides[activeSlideIdx].content : 'Enter slide tagged notes in the left editor panel to initialize prompter.'}
              </p>
            </div>

            {slides.length > 0 && (
              <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <button
                  onClick={prevSlide}
                  disabled={activeSlideIdx === 0}
                  className="px-4 py-2 bg-background hover:bg-muted text-foreground border border-border text-xs font-bold rounded-xl disabled:opacity-40 transition-colors"
                >
                  Back Slide
                </button>
                <button
                  onClick={nextSlide}
                  disabled={activeSlideIdx === slides.length - 1}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors"
                >
                  Next Slide
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrompterTimer;
