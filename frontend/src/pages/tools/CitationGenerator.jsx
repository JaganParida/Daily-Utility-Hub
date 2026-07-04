import { useState, useMemo } from 'react';
import { 
  BookMarked, Copy, CheckCircle2, ChevronRight, Book, Globe, User, 
  Calendar, Link as LinkIcon, Building2, BookOpen, Trash2, Plus, Sparkles, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CitationGenerator = () => {
  const [format, setFormat] = useState('APA');
  const [sourceType, setSourceType] = useState('website');
  const [isCopied, setIsCopied] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Bibliography list
  const [bibliography, setBibliography] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    publisher: '',
    year: '',
    url: '',
    dateAccessed: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateCitationText = (data, style, type) => {
    const { firstName, lastName, title, publisher, year, url, dateAccessed } = data;
    
    // Formatting authors
    const authorAPA = lastName ? `${lastName}${firstName ? `, ${firstName.charAt(0)}.` : '.'}` : '';
    const authorMLA = lastName ? `${lastName}${firstName ? `, ${firstName}` : ''}.` : '';
    const authorChicago = lastName ? `${lastName}${firstName ? `, ${firstName}` : ''}.` : '';
    
    const formattedTitle = title ? `"${title}."` : '';
    const italicTitle = title ? `*${title}*.` : '';

    if (style === 'APA') {
      if (type === 'website') {
        return `${authorAPA} (${year || 'n.d.'}). ${italicTitle} ${publisher ? `${publisher}. ` : ''}${url ? `Retrieved ${dateAccessed ? `${dateAccessed}, ` : ''}from ${url}` : ''}`.trim();
      } else {
        return `${authorAPA} (${year || 'n.d.'}). ${italicTitle} ${publisher}.`.trim();
      }
    } 
    else if (style === 'MLA') {
      if (type === 'website') {
        return `${authorMLA} ${formattedTitle} *${publisher || 'Website'}*, ${year || 'n.d.'}, ${url ? `${url}. ` : ''}${dateAccessed ? `Accessed ${dateAccessed}.` : ''}`.trim();
      } else {
        return `${authorMLA} ${italicTitle} ${publisher}, ${year || 'n.d.'}.`.trim();
      }
    }
    else if (style === 'Chicago') {
      if (type === 'website') {
        return `${authorChicago} ${formattedTitle} *${publisher || 'Website'}*. Last modified ${year || 'n.d.'}. ${url ? `${url}.` : ''}`.trim();
      } else {
        return `${authorChicago} ${italicTitle} ${publisher}, ${year || 'n.d.'}.`.trim();
      }
    }
    return '';
  };

  const citation = useMemo(() => {
    return generateCitationText(formData, format, sourceType);
  }, [formData, format, sourceType]);

  const copyToClipboard = async () => {
    if (!citation) return;
    try {
      const plainTextCitation = citation.replace(/\*/g, '');
      await navigator.clipboard.writeText(plainTextCitation);
      setIsCopied(true);
      toast.success('Citation copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const addToBibliography = () => {
    if (!citation || citation.length < 10) return;
    
    // Check for duplicates
    if (bibliography.some(item => item.text === citation)) {
      toast.error('Citation is already in the bibliography!');
      return;
    }

    const newItem = {
      id: `cit-${Date.now()}`,
      text: citation,
      style: format,
      authorKey: formData.lastName || formData.title || 'Untitled'
    };

    setBibliography(prev => [...prev, newItem]);
    toast.success('Added to bibliography!');
  };

  const removeBibliographyItem = (id) => {
    setBibliography(prev => prev.filter(item => item.id !== id));
  };

  const clearBibliography = () => {
    setBibliography([]);
    toast.success('Bibliography cleared!');
  };

  const copyAllBibliography = () => {
    if (bibliography.length === 0) return;
    const sorted = [...bibliography].sort((a, b) => a.authorKey.localeCompare(b.authorKey));
    const fullText = sorted.map(item => item.text.replace(/\*/g, '')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    toast.success('All citations copied in alphabetical order!');
  };

  const autofillMetadata = async () => {
    if (!formData.url.trim()) {
      toast.error('Please enter a website URL first');
      return;
    }

    setIsFetchingUrl(true);
    const toastId = toast.loading('Fetching webpage metadata...');

    try {
      // Use standard free CORS proxy to download page HTML
      const targetUrl = formData.url.trim().startsWith('http') ? formData.url.trim() : `https://${formData.url.trim()}`;
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error('CORS proxy lookup failed');

      const data = await res.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      const pageTitle = doc.querySelector('title')?.innerText || doc.querySelector('meta[property="og:title"]')?.content || '';
      const siteName = doc.querySelector('meta[property="og:site_name"]')?.content || '';
      
      // Try to parse year from dates
      let pubYear = new Date().getFullYear().toString();
      const pubDateStr = doc.querySelector('meta[property="article:published_time"]')?.content || 
                         doc.querySelector('meta[name="pubdate"]')?.content || '';
      if (pubDateStr) {
        const parsedYear = new Date(pubDateStr).getFullYear();
        if (!isNaN(parsedYear)) pubYear = parsedYear.toString();
      }

      setFormData(prev => ({
        ...prev,
        title: pageTitle.trim() || prev.title,
        publisher: siteName.trim() || prev.publisher,
        year: pubYear,
        url: targetUrl
      }));

      toast.success('Metadata fetched successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Could not auto-fetch metadata. Please enter manually.', { id: toastId });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const clearForm = () => {
    setFormData({ 
      firstName: '', 
      lastName: '', 
      title: '', 
      publisher: '', 
      year: '', 
      url: '', 
      dateAccessed: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    });
  };

  const renderCitationHTML = (text) => {
    if (!text) return <span className="text-muted-foreground italic">Your generated citation will appear here...</span>;
    const parts = text.split('*');
    return parts.map((part, index) => 
      index % 2 === 1 ? <em key={index} className="font-semibold">{part}</em> : <span key={index}>{part}</span>
    );
  };

  // Sort bibliography alphabetically by author/title key
  const sortedBibliography = useMemo(() => {
    return [...bibliography].sort((a, b) => a.authorKey.localeCompare(b.authorKey));
  }, [bibliography]);

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
              {sourceType === 'website' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><LinkIcon size={14}/> URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      name="url" 
                      value={formData.url} 
                      onChange={handleInputChange} 
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" 
                      placeholder="https://example.com" 
                    />
                    <button
                      onClick={autofillMetadata}
                      disabled={isFetchingUrl || !formData.url.trim()}
                      className="px-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                      title="Auto-fill Metadata"
                    >
                      {isFetchingUrl ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><User size={14}/> Author First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="Jane" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><User size={14}/> Author Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><BookOpen size={14}/> Title of Source</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="The Art of Software Engineering" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Building2 size={14}/> Publisher / Site</label>
                  <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="O'Reilly Media" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Calendar size={14}/> Year Published</label>
                  <input type="text" name="year" value={formData.year} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="2024" />
                </div>
              </div>

              {sourceType === 'website' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Calendar size={14}/> Date Accessed</label>
                  <input type="text" name="dateAccessed" value={formData.dateAccessed} onChange={handleInputChange} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="e.g. October 12, 2024" />
                </div>
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

        {/* Right: Output & Bibliography Pane */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <motion.div 
            layout
            className="w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[300px] lg:min-h-[400px]"
          >
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} className="text-primary" />
                Generated Citation
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={addToBibliography}
                  disabled={!citation || citation.length < 10}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} /> Add to Works Cited
                </button>
                <button 
                  onClick={copyToClipboard}
                  disabled={!citation || citation.length < 10}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isCopied ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                  {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center bg-[#0d1117] relative">
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

          {/* Bibliography List Section */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                  <BookMarked size={16} className="text-indigo-500" /> Compiled Works Cited / Bibliography ({bibliography.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Citations are sorted alphabetically in standard assignment formatting.</p>
              </div>
              
              {bibliography.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={copyAllBibliography}
                    className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-all flex items-center gap-1"
                  >
                    <Copy size={14} /> Copy All
                  </button>
                  <button
                    onClick={clearBibliography}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg border border-red-500/20 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Clear List
                  </button>
                </div>
              )}
            </div>

            {sortedBibliography.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Your bibliography is empty. Generate and add citations above!</p>
            ) : (
              <div className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-6 font-serif">
                {sortedBibliography.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 border-b border-border/30 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm text-foreground flex-1 leading-relaxed" style={{ textIndent: '-1.5rem', paddingLeft: '1.5rem' }}>
                      {renderCitationHTML(item.text)}
                    </p>
                    <button
                      onClick={() => removeBibliographyItem(item.id)}
                      className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors shrink-0"
                      title="Remove from Bibliography"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CitationGenerator;
