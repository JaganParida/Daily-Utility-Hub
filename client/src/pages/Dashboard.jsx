import { Link } from 'react-router-dom';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
  const tools = [
    // Image Tools
    { name: 'Image Compressor', description: 'Compress images locally without server upload.', icon: ImageIcon, to: '/tools/image-compressor', color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Image Resizer', description: 'Change image dimensions instantly.', icon: Expand, to: '/tools/image-resizer', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Image Cropper', description: 'Crop images visually in your browser.', icon: Crop, to: '/tools/image-cropper', color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Image Converter', description: 'Convert between PNG, JPEG, WEBP, and BMP.', icon: ArrowRightLeft, to: '/tools/image-converter', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Image Collage', description: 'Combine multiple images into stunning grid collages.', icon: LayoutGrid, to: '/tools/image-collage', color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Image to PDF', description: 'Convert multiple images into a multi-page PDF.', icon: FileText, to: '/tools/image-to-pdf', color: 'bg-red-500/10 text-red-500' },
    
    // Text Tools
    { name: 'Word Counter', description: 'Count words, characters, and sentences in your text.', icon: Type, to: '/tools/word-counter', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Case Converter', description: 'Convert text to lowercase, UPPERCASE, Title Case, etc.', icon: Type, to: '/tools/case-converter', color: 'bg-indigo-500/10 text-indigo-500' },
    { name: 'Lorem Ipsum Generator', description: 'Generate dummy text for your designs and mockups.', icon: AlignLeft, to: '/tools/lorem-ipsum', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Remove Duplicate Lines', description: 'Clean up text lists by instantly removing duplicates.', icon: Layers, to: '/tools/remove-duplicates', color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Sort Lines', description: 'Sort text lines alphabetically (A-Z or Z-A).', icon: Layers, to: '/tools/sort-lines', color: 'bg-rose-500/10 text-rose-500' },
    { name: 'Find & Replace', description: 'Find and replace text with Regex support.', icon: Type, to: '/tools/find-replace', color: 'bg-cyan-500/10 text-cyan-500' },
    
    // Developer Tools (NEW & OLD)
    { name: 'API Key Generator', description: 'Generate secure cryptographically strong API keys.', icon: Key, to: '/tools/api-key-generator', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'JSON Formatter', description: 'Format, validate, and minify JSON data instantly.', icon: Layers, to: '/tools/json-formatter', color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Base64 Converter', description: 'Encode and decode Base64 data with file support.', icon: Hash, to: '/tools/base64-converter', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'URL Converter', description: 'Safely encode and decode URLs and query parameters.', icon: Type, to: '/tools/url-converter', color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Bcrypt Generator', description: 'Generate and verify secure bcrypt password hashes.', icon: Key, to: '/tools/bcrypt-generator', color: 'bg-rose-500/10 text-rose-500' },
    { name: 'Cron Parser', description: 'Translate cron expressions into human-readable text.', icon: Layers, to: '/tools/cron-parser', color: 'bg-purple-500/10 text-purple-500' },
    
    { name: 'UUID Generator', description: 'Generate secure v1, v4, and v7 UUIDs in batches.', icon: Hash, to: '/tools/uuid-generator', color: 'bg-indigo-500/10 text-indigo-500' },
    { name: 'Password Generator', description: 'Generate strong passwords with strength analysis.', icon: Key, to: '/tools/password-generator', color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Hash Generator', description: 'Generate MD5, SHA-256, and HMAC signatures.', icon: Hash, to: '/tools/hash-generator', color: 'bg-teal-500/10 text-teal-500' },
    { name: 'JWT Decoder', description: 'Decode and mathematically verify JSON Web Tokens.', icon: Hash, to: '/tools/jwt-decoder', color: 'bg-yellow-500/10 text-yellow-600' },
    { name: 'Regex Tester', description: 'Test regex, highlight matches, and generate code.', icon: Type, to: '/tools/regex-tester', color: 'bg-sky-500/10 text-sky-500' },
    { name: 'Color Picker', description: 'WCAG contrast checker and palette generator.', icon: Layers, to: '/tools/color-picker', color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Gradient Generator', description: 'Create multi-stop linear, radial, and conic gradients.', icon: Layers, to: '/tools/gradient-generator', color: 'bg-fuchsia-500/10 text-fuchsia-500' }
  ];

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Daily Utility Hub</h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
          Your all-in-one platform for everyday utilities. Select a tool below to get started. No installation required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link 
              key={tool.name} 
              to={tool.to}
              className="group bg-card border border-border p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={28} />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
