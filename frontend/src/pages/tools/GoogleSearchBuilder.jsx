import { useState, useEffect } from 'react';
import { 
  Search, Sparkles, Copy, ExternalLink, Trash2, 
  Globe, FileCode, Terminal, BookOpen, HelpCircle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_DOMAINS = [
  { label: 'All Web', value: '' },
  { label: 'StackOverflow', value: 'stackoverflow.com' },
  { label: 'GitHub', value: 'github.com' },
  { label: 'Reddit', value: 'reddit.com' },
  { label: 'MDN Web Docs', value: 'developer.mozilla.org' },
  { label: 'Wikipedia', value: 'wikipedia.org' },
  { label: 'Dev.to', value: 'dev.to' },
  { label: 'YouTube', value: 'youtube.com' }
];

const FILE_TYPES = [
  { label: 'Any File', value: '' },
  { label: 'PDF Document (.pdf)', value: 'pdf' },
  { label: 'Word Document (.docx)', value: 'docx' },
  { label: 'Excel Spreadsheet (.xlsx)', value: 'xlsx' },
  { label: 'JSON Data (.json)', value: 'json' },
  { label: 'XML File (.xml)', value: 'xml' },
  { label: 'Text File (.txt)', value: 'txt' }
];

const SEARCH_LOCATIONS = [
  { label: 'Anywhere in page', value: '' },
  { label: 'In Page Title (intitle:)', value: 'intitle' },
  { label: 'In Page URL (inurl:)', value: 'inurl' },
  { label: 'In Page Text (intext:)', value: 'intext' }
];

const DATE_FILTERS = [
  { label: 'Anytime', value: '' },
  { label: 'Past 24 Hours', value: 'd' },
  { label: 'Past Week', value: 'w' },
  { label: 'Past Month', value: 'm' },
  { label: 'Past Year', value: 'y' }
];

const TEMPLATES = [
  {
    title: 'Find Public PDF Tutorials',
    icon: BookOpen,
    desc: 'Locate freely accessible tutorial/guide books on any topic.',
    config: {
      keywords: 'javascript tutorial',
      exactPhrase: 'for beginners',
      fileType: 'pdf',
      searchLocation: '',
      domain: '',
      dateFilter: ''
    }
  },
  {
    title: 'StackOverflow Error Search',
    icon: Terminal,
    desc: 'Find StackOverflow threads addressing specific exact errors.',
    config: {
      keywords: 'TypeError: Cannot read property',
      exactPhrase: 'of undefined',
      fileType: '',
      searchLocation: '',
      domain: 'stackoverflow.com',
      dateFilter: ''
    }
  },
  {
    title: 'GitHub Configs or Repos',
    icon: FileCode,
    desc: 'Search public repositories for specific configuration templates.',
    config: {
      keywords: 'docker-compose',
      exactPhrase: 'version: "3.8"',
      fileType: 'xml', // or keep empty
      searchLocation: 'inurl',
      domain: 'github.com',
      dateFilter: ''
    }
  },
  {
    title: 'Open Directory Indexes',
    icon: Globe,
    desc: 'Find open web directories containing downloadable assets.',
    config: {
      keywords: 'movies',
      exactPhrase: 'index of',
      fileType: '',
      searchLocation: 'intitle',
      domain: '',
      dateFilter: ''
    }
  }
];

const GoogleSearchBuilder = () => {
  const [keywords, setKeywords] = useState('');
  const [exactPhrase, setExactPhrase] = useState('');
  const [orWords, setOrWords] = useState('');
  const [excludeWords, setExcludeWords] = useState('');
  
  const [customDomain, setCustomDomain] = useState('');
  const [domain, setDomain] = useState('');
  
  const [customFileType, setCustomFileType] = useState('');
  const [fileType, setFileType] = useState('');
  
  const [searchLocation, setSearchLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [compiledQuery, setCompiledQuery] = useState('');

  // Auto compile query in real-time
  useEffect(() => {
    let parts = [];

    // Keywords
    if (keywords.trim()) {
      parts.push(keywords.trim());
    }

    // Exact Phrase "..."
    if (exactPhrase.trim()) {
      parts.push(`"${exactPhrase.trim()}"`);
    }

    // OR Words
    if (orWords.trim()) {
      const splitOr = orWords.split(',').map(w => w.trim()).filter(Boolean);
      if (splitOr.length > 0) {
        parts.push(`(${splitOr.join(' OR ')})`);
      }
    }

    // Excluded words -word
    if (excludeWords.trim()) {
      const splitExclude = excludeWords.split(',').map(w => w.trim()).filter(Boolean);
      splitExclude.forEach(word => {
        parts.push(`-${word}`);
      });
    }

    // Domain / Site
    const activeDomain = domain === 'custom' ? customDomain.trim() : domain;
    if (activeDomain) {
      parts.push(`site:${activeDomain}`);
    }

    // File type
    const activeFileType = fileType === 'custom' ? customFileType.trim() : fileType;
    if (activeFileType) {
      parts.push(`filetype:${activeFileType}`);
    }

    // Search Location (intitle, inurl, intext)
    if (searchLocation) {
      // If searchLocation is set, wrap the primary keyword in it if present, or add it alone
      if (keywords.trim()) {
        // Replace keyword part with location prefix
        parts = parts.map(part => {
          if (part === keywords.trim()) {
            return `${searchLocation}:${part}`;
          }
          return part;
        });
      } else {
        parts.push(`${searchLocation}:search`);
      }
    }

    setCompiledQuery(parts.join(' '));
  }, [keywords, exactPhrase, orWords, excludeWords, domain, customDomain, fileType, customFileType, searchLocation]);

  const handleCopy = () => {
    if (!compiledQuery.trim()) {
      toast.error('Query is empty. Please add search terms.');
      return;
    }
    navigator.clipboard.writeText(compiledQuery);
    toast.success('Query copied to clipboard!');
  };

  const handleSearch = () => {
    if (!compiledQuery.trim()) {
      toast.error('Query is empty. Please add search terms.');
      return;
    }
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(compiledQuery)}`;
    if (dateFilter) {
      searchUrl += `&tbs=qdr:${dateFilter}`;
    }
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setKeywords('');
    setExactPhrase('');
    setOrWords('');
    setExcludeWords('');
    setDomain('');
    setCustomDomain('');
    setFileType('');
    setCustomFileType('');
    setSearchLocation('');
    setDateFilter('');
    toast.success('All parameters reset.');
  };

  const loadTemplate = (config) => {
    setKeywords(config.keywords);
    setExactPhrase(config.exactPhrase);
    setOrWords(config.orWords || '');
    setExcludeWords(config.excludeWords || '');
    
    // Check if domain is standard
    const isStandardDomain = PRESET_DOMAINS.some(d => d.value === config.domain);
    if (config.domain === '') {
      setDomain('');
    } else if (isStandardDomain) {
      setDomain(config.domain);
    } else {
      setDomain('custom');
      setCustomDomain(config.domain);
    }

    // Check if file type is standard
    const isStandardFileType = FILE_TYPES.some(f => f.value === config.fileType);
    if (config.fileType === '') {
      setFileType('');
    } else if (isStandardFileType) {
      setFileType(config.fileType);
    } else {
      setFileType('custom');
      setCustomFileType(config.fileType);
    }

    setSearchLocation(config.searchLocation);
    setDateFilter(config.dateFilter);
    toast.success('Template loaded!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      {/* Title Header */}
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Search size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Google Search Builder</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Build advanced Google search queries and dorks with full parameters in a clean UI.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Param Fields Workspace */}
        <div className="flex-1 w-full bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Main Keyword Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Keywords */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Primary Search Terms
                <span className="text-[10px] text-muted-foreground font-medium">(Standard Search)</span>
              </label>
              <input 
                type="text" 
                value={keywords} 
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. react hooks lifecycle"
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Exact Phrase */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Exact Phrase Match
                <span className="text-[10px] text-muted-foreground font-medium">(Quotes "...")</span>
              </label>
              <input 
                type="text" 
                value={exactPhrase} 
                onChange={(e) => setExactPhrase(e.target.value)}
                placeholder="e.g. TypeError: Cannot read property"
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* OR Words */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Any of These Words (OR)
                <span className="text-[10px] text-muted-foreground font-medium">(Comma separated)</span>
              </label>
              <input 
                type="text" 
                value={orWords} 
                onChange={(e) => setOrWords(e.target.value)}
                placeholder="e.g. tutorial, guide, book"
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Exclude Words */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Exclude Words (-)
                <span className="text-[10px] text-muted-foreground font-medium">(Comma separated)</span>
              </label>
              <input 
                type="text" 
                value={excludeWords} 
                onChange={(e) => setExcludeWords(e.target.value)}
                placeholder="e.g. video, course, commercial"
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
            </div>

          </div>

          <div className="border-t border-border pt-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> Advanced Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Site / Domain */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground">Restrict to Site/Domain (site:)</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent outline-none transition-all text-sm font-medium cursor-pointer"
                  >
                    {PRESET_DOMAINS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                    <option value="custom">-- Custom Site --</option>
                  </select>
                  {domain === 'custom' && (
                    <input 
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g. stackexchange.com"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                    />
                  )}
                </div>
              </div>

              {/* File Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground">File Format (filetype:)</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={fileType} 
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent outline-none transition-all text-sm font-medium cursor-pointer"
                  >
                    {FILE_TYPES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                    <option value="custom">-- Custom Extension --</option>
                  </select>
                  {fileType === 'custom' && (
                    <input 
                      type="text"
                      value={customFileType}
                      onChange={(e) => setCustomFileType(e.target.value)}
                      placeholder="e.g. pdf, csv, zip"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                    />
                  )}
                </div>
              </div>

              {/* Search Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground">Search In Location</label>
                <select 
                  value={searchLocation} 
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent outline-none transition-all text-sm font-medium cursor-pointer"
                >
                  {SEARCH_LOCATIONS.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>

              {/* Last Updated */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground">Last Updated Filter</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary focus:bg-transparent outline-none transition-all text-sm font-medium cursor-pointer"
                >
                  {DATE_FILTERS.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Quick Dork templates */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Quick Search Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {TEMPLATES.map((tmpl, idx) => {
                const IconComp = tmpl.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => loadTemplate(tmpl.config)}
                    className="border border-border hover:border-primary/40 bg-muted/10 hover:bg-primary/5 p-4 rounded-xl text-left transition-all duration-300 flex flex-col gap-2 group active:scale-[0.98]"
                  >
                    <div className="p-2 bg-primary/10 text-primary rounded-lg self-start group-hover:scale-110 transition-transform">
                      <IconComp size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{tmpl.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{tmpl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Live Preview Panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-6">
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
              <Search size={16} /> Compiled Query
            </h3>

            {/* Compiled Query box */}
            <div className="relative">
              <textarea 
                readOnly
                value={compiledQuery || '(Add parameters to build search query)'}
                className="w-full h-32 p-4 rounded-xl border border-border bg-muted/30 text-foreground text-xs font-mono select-all resize-none outline-none leading-relaxed"
              />
              {compiledQuery && (
                <button 
                  onClick={handleCopy}
                  className="absolute right-3 bottom-3 p-2 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors shadow-sm"
                  title="Copy Query"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>

            {/* Date filter notice */}
            {dateFilter && (
              <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-xl border border-primary/10 text-xs text-muted-foreground leading-normal">
                <Info size={14} className="text-primary mt-0.5 shrink-0" />
                <p>Google will filter results from the <strong>{DATE_FILTERS.find(d => d.value === dateFilter)?.label}</strong>.</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSearch}
                disabled={!compiledQuery.trim()}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <Search size={18} />
                <span>Search on Google</span>
                <ExternalLink size={14} />
              </button>

              <button 
                onClick={handleReset}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-border"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>

          {/* Dorking cheat sheet */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <HelpCircle size={16} /> Quick Cheat Sheet
            </h4>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="font-bold text-foreground">"exact phrase"</p>
                <p>Matches the exact words in order.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">site:website.com</p>
                <p>Searches only within this domain.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">filetype:pdf</p>
                <p>Restricts results to files of this extension.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">-exclude</p>
                <p>Hides pages containing the word.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">intitle: / inurl:</p>
                <p>Finds terms in the page title or URL.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default GoogleSearchBuilder;
