import { useState, useMemo } from 'react';
import { BookMarked, Copy, CheckCircle2, ChevronRight, Book, Globe, User, Calendar, Link as LinkIcon, Building2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CitationGenerator = () => {
  const [format, setFormat] = useState('APA');
  const [sourceType, setSourceType] = useState('website');
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    publisher: '',
    year: '',
    url: '',
    dateAccessed: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateCitation = () => {
    const { firstName, lastName, title, publisher, year, url, dateAccessed } = formData;
    
    // Formatting helpers
    const authorAPA = lastName ? `${lastName}${firstName ? `, ${firstName.charAt(0)}.` : '.'}` : '';
    const authorMLA = lastName ? `${lastName}${firstName ? `, ${firstName}` : ''}.` : '';
    const authorChicago = lastName ? `${lastName}${firstName ? `, ${firstName}` : ''}.` : '';
    
    const formattedTitle = title ? `"${title}."` : '';
    const italicTitle = title ? `*${title}*.` : '';

    if (format === 'APA') {
      if (sourceType === 'website') {
        return `${authorAPA} (${year || 'n.d.'}). ${italicTitle} ${publisher ? `${publisher}. ` : ''}${url ? `Retrieved ${dateAccessed ? `${dateAccessed}, ` : ''}from ${url}` : ''}`.trim();
      } else {
        return `${authorAPA} (${year || 'n.d.'}). ${italicTitle} ${publisher}.`.trim();
      }
    } 
    else if (format === 'MLA') {
      if (sourceType === 'website') {
        return `${authorMLA} ${formattedTitle} *${publisher || 'Website'}*, ${year || 'n.d.'}, ${url ? `${url}. ` : ''}${dateAccessed ? `Accessed ${dateAccessed}.` : ''}`.trim();
      } else {
        return `${authorMLA} ${italicTitle} ${publisher}, ${year || 'n.d.'}.`.trim();
      }
    }
    else if (format === 'Chicago') {
      if (sourceType === 'website') {
        return `${authorChicago} ${formattedTitle} *${publisher || 'Website'}*. Last modified ${year || 'n.d.'}. ${url ? `${url}.` : ''}`.trim();
      } else {
        return `${authorChicago} ${italicTitle} ${publisher}, ${year || 'n.d.'}.`.trim();
      }
    }
    return '';
  };

  const citation = useMemo(() => generateCitation(), [formData, format, sourceType]);

  const copyToClipboard = async () => {
    if (!citation) return;
    try {
      // Strip markdown italics before copying
      const plainTextCitation = citation.replace(/\*/g, '');
      await navigator.clipboard.writeText(plainTextCitation);
      setIsCopied(true);
      toast.success('Citation copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const clearForm = () => {
    setFormData({ firstName: '', lastName: '', title: '', publisher: '', year: '', url: '', dateAccessed: '' });
  };

  // Helper to render markdown italics as HTML
  const renderCitationHTML = (text) => {
    if (!text) return <span className="text-muted-foreground italic">Your generated citation will appear here...</span>;
    const parts = text.split('*');
    return parts.map((part, index) => 
      index % 2 === 1 ? <em key={index} className="font-semibold">{part}</em> : <span key={index}>{part}</span>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <BookMarked size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Citation & Bibliography Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Instantly format sources in APA, MLA, and Chicago styles.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Configuration Form */}
        <div className="w-full lg:w-[500px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            {/* Format & Source Type Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Citation Style</label>
                <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner">
                  {['APA', 'MLA', 'Chicago'].map(style => (
                    <button 
                      key={style}
                      onClick={() => setFormat(style)} 
                      className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all ${format === style ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Source Type</label>
                <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => setSourceType('website')} 
                    className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${sourceType === 'website' ? 'bg-muted text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    <Globe size={16}/> Website
                  </button>
                  <button 
                    onClick={() => setSourceType('book')} 
                    className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${sourceType === 'book' ? 'bg-muted text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    <Book size={16}/> Book/Journal
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border"></div>

            {/* Input Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><User size={14}/> First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="Jane" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><User size={14}/> Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><BookOpen size={14}/> Title of Source</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="The Art of Software Engineering" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Building2 size={14}/> Publisher / Site</label>
                  <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="O'Reilly Media" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Calendar size={14}/> Year Published</label>
                  <input type="text" name="year" value={formData.year} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="2024" />
                </div>
              </div>

              {sourceType === 'website' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><LinkIcon size={14}/> URL</label>
                    <input type="url" name="url" value={formData.url} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="https://example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Calendar size={14}/> Date Accessed</label>
                    <input type="text" name="dateAccessed" value={formData.dateAccessed} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="e.g. October 12, 2024" />
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={clearForm}
              className="w-full py-2.5 bg-background hover:bg-muted text-muted-foreground hover:text-rose-500 font-bold rounded-xl border border-border transition-colors text-sm uppercase tracking-wider"
            >
              Clear Fields
            </button>
          </div>
        </div>

        {/* Right: Output Pane */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[600px]"
        >
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <CheckCircle2 size={16} className="text-primary" />
              Generated Citation
            </h2>
            <button 
              onClick={copyToClipboard}
              disabled={!citation || citation.length < 10}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isCopied ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied to Clipboard' : 'Copy Citation'}
            </button>
          </div>

          <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center bg-[#0d1117] relative">
            
            {/* Hanging indent simulation container */}
            <div className="w-full max-w-3xl bg-[#161b22] border border-border/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              
              <div className="absolute top-0 left-0 w-2 h-full bg-primary/80"></div>
              
              <div className="pl-6">
                <span className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-4 block">
                  {format} Style Format
                </span>
                
                <p className="text-[#e6edf3] text-lg md:text-xl font-serif leading-relaxed" style={{ textIndent: '-2rem', paddingLeft: '2rem' }}>
                  {renderCitationHTML(citation)}
                </p>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CitationGenerator;
