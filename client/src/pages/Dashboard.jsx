import { Link } from 'react-router-dom';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText, Braces, Search, Calculator, TrendingUp, Percent, Landmark, FolderArchive, Pin, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAnalytics } from '../hooks/useAnalytics';
import { useState } from 'react';

const Dashboard = () => {
  const toolCategories = {
    'Image Tools': [
      { name: 'Image Compressor', description: 'Compress images locally without server upload.', icon: ImageIcon, to: '/tools/image-compressor', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Image Resizer', description: 'Change image dimensions instantly.', icon: Expand, to: '/tools/image-resizer', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Image Cropper', description: 'Crop images visually in your browser.', icon: Crop, to: '/tools/image-cropper', color: 'text-purple-500 bg-purple-500/10' },
      { name: 'Image Converter', description: 'Convert between PNG, JPEG, WEBP, and BMP.', icon: ArrowRightLeft, to: '/tools/image-converter', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'Image Collage', description: 'Combine multiple images into stunning grid collages.', icon: LayoutGrid, to: '/tools/image-collage', color: 'text-yellow-500 bg-yellow-500/10' },
      { name: 'Image to PDF', description: 'Convert multiple images into a multi-page PDF.', icon: FileText, to: '/tools/image-to-pdf', color: 'text-red-500 bg-red-500/10' },
    ],
    'Text Tools': [
      { name: 'Word Counter', description: 'Count words, characters, and sentences in your text.', icon: Type, to: '/tools/word-counter', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Case Converter', description: 'Convert text to lowercase, UPPERCASE, Title Case, etc.', icon: Type, to: '/tools/case-converter', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Font Converter', description: 'Generate stylish Instagram fonts from regular text.', icon: Type, to: '/tools/font-converter', color: 'text-rose-500 bg-rose-500/10' },
      { name: 'Lorem Ipsum', description: 'Generate dummy text for your designs and mockups.', icon: AlignLeft, to: '/tools/lorem-ipsum', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'Text Line Editor', description: 'Sort, deduplicate, and clean up lists of text.', icon: Layers, to: '/tools/text-line-editor', color: 'text-pink-500 bg-pink-500/10' },
      { name: 'Find & Replace', description: 'Find and replace text with Regex support.', icon: Type, to: '/tools/find-replace', color: 'text-cyan-500 bg-cyan-500/10' },
    ],
    'Developer Tools': [
      { name: 'UUID Generator', description: 'Generate secure v1, v4, and v7 UUIDs in batches.', icon: Hash, to: '/tools/uuid-generator', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Password Generator', description: 'Generate strong passwords with strength analysis.', icon: Key, to: '/tools/password-generator', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Hash Generator', description: 'Generate MD5, SHA-256, and HMAC signatures.', icon: Hash, to: '/tools/hash-generator', color: 'text-teal-500 bg-teal-500/10' },
      { name: 'JWT Decoder', description: 'Decode and mathematically verify JSON Web Tokens.', icon: Hash, to: '/tools/jwt-decoder', color: 'text-yellow-600 bg-yellow-500/10' },
      { name: 'Regex Tester', description: 'Test regex, highlight matches, and generate code.', icon: Type, to: '/tools/regex-tester', color: 'text-sky-500 bg-sky-500/10' },
      { name: 'Color Picker', description: 'WCAG contrast checker and palette generator.', icon: Layers, to: '/tools/color-picker', color: 'text-pink-500 bg-pink-500/10' },
      { name: 'Gradient Generator', description: 'Create multi-stop linear, radial, and conic gradients.', icon: Layers, to: '/tools/gradient-generator', color: 'text-fuchsia-500 bg-fuchsia-500/10' },
      { name: 'API Key Generator', description: 'Generate secure cryptographically strong API keys.', icon: Key, to: '/tools/api-key-generator', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'JSON Formatter', description: 'Format, validate, and minify JSON data instantly.', icon: Layers, to: '/tools/json-formatter', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Base64 Converter', description: 'Encode and decode Base64 data with file support.', icon: Hash, to: '/tools/base64-converter', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'URL Converter', description: 'Safely encode and decode URLs and query parameters.', icon: Type, to: '/tools/url-converter', color: 'text-pink-500 bg-pink-500/10' },
      { name: 'Bcrypt Generator', description: 'Generate and verify secure bcrypt password hashes.', icon: Key, to: '/tools/bcrypt-generator', color: 'text-rose-500 bg-rose-500/10' },
      { name: 'Cron Parser', description: 'Translate cron expressions into human-readable text.', icon: Layers, to: '/tools/cron-parser', color: 'text-purple-500 bg-purple-500/10' },
    ],
    'PDF Tools': [
      { name: 'Edit PDF', description: 'Draw, write text, highlight, and redact elements directly.', icon: FileText, to: '/tools/pdf-edit', color: 'text-red-500 bg-red-500/10' },
      { name: 'PDF Converter', description: 'Convert PDF documents into editable Word files or images.', icon: FileText, to: '/tools/pdf-converter', color: 'text-rose-500 bg-rose-500/10' },
      { name: 'Merge PDF', description: 'Combine multiple PDF files into one securely.', icon: FileText, to: '/tools/pdf-merge', color: 'text-red-500 bg-red-500/10' },
      { name: 'Split PDF', description: 'Extract specific pages or page ranges from a PDF.', icon: FileText, to: '/tools/pdf-split', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Watermark PDF', description: 'Add a text watermark across all pages of a PDF document.', icon: FileText, to: '/tools/pdf-watermark', color: 'text-purple-500 bg-purple-500/10' },
      { name: 'Lock PDF', description: 'Encrypt your PDF with a password and restrict permissions.', icon: FileText, to: '/tools/pdf-lock', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Unlock PDF', description: 'Remove password protection and restrictions from a PDF.', icon: FileText, to: '/tools/pdf-unlock', color: 'text-yellow-600 bg-yellow-500/10' },
      { name: 'Edit Metadata', description: 'Modify hidden document properties like Author and Title.', icon: FileText, to: '/tools/pdf-metadata', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Extract Text', description: 'Convert PDF documents into raw, editable text.', icon: FileText, to: '/tools/pdf-to-text', color: 'text-pink-500 bg-pink-500/10' },
    ],
    'Student & Docs': [
      { name: 'Code to Image', description: 'Create beautiful, shareable images of your code snippets.', icon: ImageIcon, to: '/tools/code-to-image', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Image to Text', description: 'Scan photos of documents and extract text instantly.', icon: Type, to: '/tools/image-to-text', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'Text Diff', description: 'Compare two pieces of text or code to see exactly what changed.', icon: FileText, to: '/tools/text-diff', color: 'text-rose-500 bg-rose-500/10' },
      { name: 'Markdown Editor', description: 'Write beautiful documentation with instant previews.', icon: FileText, to: '/tools/markdown-editor', color: 'text-blue-500 bg-blue-500/10' },
    ],
    'Finance & Productivity': [
      { name: 'EMI Calculator', description: 'Calculate monthly payments and total interest payable.', icon: Calculator, to: '/tools/emi-calculator', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'SIP Calculator', description: 'Estimate future values and compound growth on investments.', icon: TrendingUp, to: '/tools/sip-calculator', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'GST Calculator', description: 'Calculate tax inclusive or exclusive prices and SGST/CGST splits.', icon: Percent, to: '/tools/gst-calculator', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Income Tax', description: 'Compare old vs new tax regimes and calculate taxable income liabilities.', icon: Landmark, to: '/tools/tax-calculator', color: 'text-amber-500 bg-amber-500/10' },
    ],
    'File & Storage Tools': [
      { name: 'Temp File Share', description: 'Upload a file temporarily and share via secure links.', icon: FolderArchive, to: '/tools/temp-share', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Batch Renamer', description: 'Rename multiple files at once using custom numbering.', icon: FolderArchive, to: '/tools/batch-renamer', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Zip & Unzip', description: 'Compress files into a ZIP or extract existing ZIP files.', icon: FolderArchive, to: '/tools/zip-archiver', color: 'text-emerald-500 bg-emerald-500/10' },
    ]
  };

  const { recentTools, pinnedTools, togglePin } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Flatten all tools for quick lookup
  const allTools = Object.values(toolCategories).flat();
  const pinnedToolObjects = pinnedTools.map(path => allTools.find(t => t.to === path)).filter(Boolean);
  const recentToolObjects = recentTools.map(path => allTools.find(t => t.to === path)).filter(Boolean);

  const filteredTools = searchQuery.trim() !== '' 
    ? allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const renderToolCard = (tool) => {
    const Icon = tool.icon;
    const isPinned = pinnedTools.includes(tool.to);
    
    // Extract color classes (e.g. "text-emerald-500 bg-emerald-500/10")
    const colorClasses = tool.color.split(' ');
    const textColor = colorClasses[0];
    // Find the hover border color based on the text color (e.g., text-emerald-500 -> border-emerald-500/50)
    const borderColor = textColor.replace('text-', 'border-') + '/50';

    return (
      <Link 
        key={tool.name} 
        to={tool.to}
        className={`group relative bg-card/60 backdrop-blur-md border border-border/60 p-6 rounded-3xl hover:${borderColor} hover:bg-card/90 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.03)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden`}
      >
        {/* Subtle background glow on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 ${tool.color.split(' ')[1].replace('/10', '')}`}></div>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePin(tool.to);
          }}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 z-10 ${
            isPinned 
              ? 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20' 
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 group-hover:scale-100'
          }`}
          title={isPinned ? "Unpin Tool" : "Pin Tool"}
        >
          <Pin size={18} className={isPinned ? "fill-current" : ""} />
        </button>

        <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
          <Icon size={28} />
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors pr-8 tracking-tight">{tool.name}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{tool.description}</p>
      </Link>
    );
  };

  return (
    <PageTransition className="space-y-12 max-w-[1600px] mx-auto pb-12">
      <div className="text-center space-y-6 mt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Welcome to Daily Utility Hub
        </h1>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto group z-20">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-indigo-500/30 opacity-0 group-hover:opacity-100"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl flex items-center px-4 py-2 shadow-lg transition-all duration-300 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10">
            <Search className="text-muted-foreground w-6 h-6 ml-2" />
            <input 
              type="text" 
              placeholder="Search 50+ tools..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none p-4 text-foreground placeholder:text-muted-foreground text-lg"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-2 text-sm font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {searchQuery.trim() !== '' ? (
          // Search Results View
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              Search Results for "{searchQuery}"
            </h2>
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredTools.map(renderToolCard)}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">No tools found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          // Default Dashboard View
          <>
            {/* Dynamic Analytics Sections */}
            {pinnedToolObjects.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-indigo-500 mb-8 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg"><Pin size={22} className="fill-current" /></div>
                  Pinned Tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {pinnedToolObjects.map(renderToolCard)}
                </div>
              </div>
            )}

            {recentToolObjects.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg"><Clock size={22} className="text-muted-foreground" /></div>
                  Recently Used
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {recentToolObjects.map(renderToolCard)}
                </div>
              </div>
            )}

            {/* Regular Categories */}
            {Object.entries(toolCategories).map(([categoryName, tools]) => (
              <div key={categoryName}>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 border-b border-border/50 pb-4">
                  {categoryName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {tools.map(renderToolCard)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
