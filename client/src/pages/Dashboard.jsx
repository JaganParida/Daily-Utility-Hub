import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText, Braces, Search, Calculator, TrendingUp, Percent, Landmark, FolderArchive, Pin, Clock, ArrowRight, Stamp, Palette, Volume2, FileAudio } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const toolCategories = {
    'Image Tools': [
      { name: 'Image Compressor', description: 'Compress images locally without server upload.', icon: ImageIcon, to: '/tools/image-compressor', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Image Resizer', description: 'Change image dimensions instantly.', icon: Expand, to: '/tools/image-resizer', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Image Cropper', description: 'Crop images visually in your browser.', icon: Crop, to: '/tools/image-cropper', color: 'text-purple-500 bg-purple-500/10' },
      { name: 'Image Converter', description: 'Convert between PNG, JPEG, WEBP, and BMP.', icon: ArrowRightLeft, to: '/tools/image-converter', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'Image Collage', description: 'Combine multiple images into stunning grid collages.', icon: LayoutGrid, to: '/tools/image-collage', color: 'text-yellow-500 bg-yellow-500/10' },
      { name: 'Image to PDF', description: 'Convert multiple images into a multi-page PDF.', icon: FileText, to: '/tools/image-to-pdf', color: 'text-red-500 bg-red-500/10' },
      { name: 'Image Watermark', description: 'Add text or logo watermarks, or erase them using Magic Brush.', icon: Stamp, to: '/tools/image-watermark', color: 'text-pink-500 bg-pink-500/10' },
      { name: 'Color Extractor', description: 'Pick colors and generate palette swatch codes.', icon: Palette, to: '/tools/image-color-extractor', color: 'text-teal-500 bg-teal-500/10' },
    ],
    'Text Tools': [
      { name: 'Word Counter', description: 'Count words, characters, and sentences in your text.', icon: Type, to: '/tools/word-counter', color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Case Converter', description: 'Convert text to lowercase, UPPERCASE, Title Case, etc.', icon: Type, to: '/tools/case-converter', color: 'text-indigo-500 bg-indigo-500/10' },
      { name: 'Font Converter', description: 'Generate stylish Instagram fonts from regular text.', icon: Type, to: '/tools/font-converter', color: 'text-rose-500 bg-rose-500/10' },
      { name: 'Lorem Ipsum', description: 'Generate dummy text for your designs and mockups.', icon: AlignLeft, to: '/tools/lorem-ipsum', color: 'text-orange-500 bg-orange-500/10' },
      { name: 'Text Line Editor', description: 'Sort, deduplicate, and clean up lists of text.', icon: Layers, to: '/tools/text-line-editor', color: 'text-pink-500 bg-pink-500/10' },
      { name: 'Find & Replace', description: 'Find and replace text with Regex support.', icon: Type, to: '/tools/find-replace', color: 'text-cyan-500 bg-cyan-500/10' },
      { name: 'Voice Helper', description: 'Dictate text via mic or read text with system voices.', icon: Volume2, to: '/tools/voice-helper', color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Audio/Video Captioner', description: 'Extract timestamped text & subtitles from audio & video.', icon: FileAudio, to: '/tools/audio-video-transcriber', color: 'text-violet-500 bg-violet-500/10' },
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
      { name: 'Readme Generator', description: 'Generate professional, structured README.md files instantly.', icon: FileText, to: '/tools/readme-generator', color: 'text-emerald-500 bg-emerald-500/10' },
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
  const { currentUser } = useAuth();
  
  // Flatten all tools for quick lookup
  const allTools = Object.values(toolCategories).flat();
  const pinnedToolObjects = pinnedTools.map(path => allTools.find(t => t.to === path)).filter(Boolean);
  
  const displayLimit = currentUser ? 8 : 4;
  const recentToolObjects = recentTools
    .map(path => allTools.find(t => t.to === path))
    .filter(Boolean)
    .slice(0, displayLimit);

  const isPinLimitReached = pinnedTools.length >= displayLimit;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const renderToolCard = (tool) => {
    const Icon = tool.icon;
    const isPinned = pinnedTools.includes(tool.to);
    const showPinButton = isPinned || !isPinLimitReached;
    
    // Extract color classes (e.g. "text-emerald-500 bg-emerald-500/10")
    const colorClasses = tool.color.split(' ');
    const textColor = colorClasses[0];
    // Find the hover border color based on the text color (e.g., text-emerald-500 -> border-emerald-500/50)
    const borderColor = textColor.replace('text-', 'border-') + '/50';

    return (
      <motion.div 
        key={tool.name} 
        variants={cardVariants}
        whileHover={{ y: -5, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        className="group relative"
      >
        <Link 
          to={tool.to}
          className={`relative flex flex-col h-full p-6 transition-colors duration-300 bg-card/40 hover:bg-card/80 backdrop-blur-md border border-border/50 hover:${borderColor} rounded-2xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.03)] overflow-hidden`}
        >
          {/* Subtle gradient background on hover */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 ${tool.color.split(' ')[1].replace('/10', '')} pointer-events-none rounded-2xl`}></div>
          
          <div className="flex items-start justify-between mb-5">
            <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
              <Icon size={28} />
            </div>
            
            {/* PIN BUTTON (Inside Link but with stopPropagation) */}
            {showPinButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePin(tool.to);
                }}
                className={`p-2 rounded-xl transition-all duration-300 z-30 ${
                  isPinned 
                    ? 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 group-hover:scale-100'
                }`}
                title={isPinned ? "Unpin Tool" : "Pin Tool"}
              >
                <Pin size={18} className={isPinned ? "fill-current" : ""} />
              </button>
            )}
          </div>
          
          <h3 className="font-bold text-xl text-foreground tracking-tight mb-3 group-hover:text-primary transition-colors">{tool.name}</h3>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow font-medium">{tool.description}</p>
          
          <div className="mt-auto flex items-center font-semibold text-sm text-muted-foreground group-hover:text-primary transition-colors">
            Launch Tool 
            <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <PageTransition className="space-y-12 max-w-[1600px] mx-auto pb-20 px-4 md:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-6 pt-16 md:pt-28 pb-12"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Daily Utility Hub</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto font-medium">
          Your all-in-one platform for everyday utilities. Select a tool below to get started. No installation required.
        </p>
      </motion.div>

      <div className="space-y-16">
        {/* Dynamic Analytics Sections */}
        {pinnedToolObjects.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-indigo-500 mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Pin size={22} className="fill-current" /></div>
              Pinned Tools
            </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              {pinnedToolObjects.map(renderToolCard)}
            </motion.div>
          </div>
        )}

        {recentToolObjects.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg"><Clock size={22} className="text-muted-foreground" /></div>
              Recently Used
            </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              {recentToolObjects.map(renderToolCard)}
            </motion.div>
          </div>
        )}

        {/* Regular Categories */}
        {Object.entries(toolCategories).map(([categoryName, tools]) => (
          <div key={categoryName}>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 border-b border-border/50 pb-4">
              {categoryName}
            </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              {tools.map(renderToolCard)}
            </motion.div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
