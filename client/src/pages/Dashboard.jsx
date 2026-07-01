import { Link } from 'react-router-dom';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft, LayoutGrid, FileText, Braces, Search } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
  const toolCategories = {
    'Image Tools': [
      { name: 'Image Compressor', description: 'Compress images locally without server upload.', icon: ImageIcon, to: '/tools/image-compressor', color: 'bg-emerald-500/10 text-emerald-500' },
      { name: 'Image Resizer', description: 'Change image dimensions instantly.', icon: Expand, to: '/tools/image-resizer', color: 'bg-blue-500/10 text-blue-500' },
      { name: 'Image Cropper', description: 'Crop images visually in your browser.', icon: Crop, to: '/tools/image-cropper', color: 'bg-purple-500/10 text-purple-500' },
      { name: 'Image Converter', description: 'Convert between PNG, JPEG, WEBP, and BMP.', icon: ArrowRightLeft, to: '/tools/image-converter', color: 'bg-orange-500/10 text-orange-500' },
      { name: 'Image Collage', description: 'Combine multiple images into stunning grid collages.', icon: LayoutGrid, to: '/tools/image-collage', color: 'bg-yellow-500/10 text-yellow-500' },
      { name: 'Image to PDF', description: 'Convert multiple images into a multi-page PDF.', icon: FileText, to: '/tools/image-to-pdf', color: 'bg-red-500/10 text-red-500' },
    ],
    'Text Tools': [
      { name: 'Word Counter', description: 'Count words, characters, and sentences in your text.', icon: Type, to: '/tools/word-counter', color: 'bg-blue-500/10 text-blue-500' },
      { name: 'Case Converter', description: 'Convert text to lowercase, UPPERCASE, Title Case, etc.', icon: Type, to: '/tools/case-converter', color: 'bg-indigo-500/10 text-indigo-500' },
      { name: 'Font Converter', description: 'Generate stylish Instagram fonts from regular text.', icon: Type, to: '/tools/font-converter', color: 'bg-rose-500/10 text-rose-500' },
      { name: 'Lorem Ipsum Generator', description: 'Generate dummy text for your designs and mockups.', icon: AlignLeft, to: '/tools/lorem-ipsum', color: 'bg-orange-500/10 text-orange-500' },
      { name: 'Text Line Editor', description: 'Sort, deduplicate, and clean up lists of text.', icon: Layers, to: '/tools/text-line-editor', color: 'bg-pink-500/10 text-pink-500' },
      { name: 'Find & Replace', description: 'Find and replace text with Regex support.', icon: Type, to: '/tools/find-replace', color: 'bg-cyan-500/10 text-cyan-500' },
    ],
    'Developer Tools': [
      { name: 'UUID Generator', description: 'Generate secure v1, v4, and v7 UUIDs in batches.', icon: Hash, to: '/tools/uuid-generator', color: 'bg-indigo-500/10 text-indigo-500' },
      { name: 'Password Generator', description: 'Generate strong passwords with strength analysis.', icon: Key, to: '/tools/password-generator', color: 'bg-emerald-500/10 text-emerald-500' },
      { name: 'Hash Generator', description: 'Generate MD5, SHA-256, and HMAC signatures.', icon: Hash, to: '/tools/hash-generator', color: 'bg-teal-500/10 text-teal-500' },
      { name: 'JWT Decoder', description: 'Decode and mathematically verify JSON Web Tokens.', icon: Hash, to: '/tools/jwt-decoder', color: 'bg-yellow-500/10 text-yellow-600' },
      { name: 'Regex Tester', description: 'Test regex, highlight matches, and generate code.', icon: Type, to: '/tools/regex-tester', color: 'bg-sky-500/10 text-sky-500' },
      { name: 'Color Picker', description: 'WCAG contrast checker and palette generator.', icon: Layers, to: '/tools/color-picker', color: 'bg-pink-500/10 text-pink-500' },
      { name: 'Gradient Generator', description: 'Create multi-stop linear, radial, and conic gradients.', icon: Layers, to: '/tools/gradient-generator', color: 'bg-fuchsia-500/10 text-fuchsia-500' },
      { name: 'API Key Generator', description: 'Generate secure cryptographically strong API keys.', icon: Key, to: '/tools/api-key-generator', color: 'bg-orange-500/10 text-orange-500' },
      { name: 'JSON Formatter', description: 'Format, validate, and minify JSON data instantly.', icon: Layers, to: '/tools/json-formatter', color: 'bg-emerald-500/10 text-emerald-500' },
      { name: 'Base64 Converter', description: 'Encode and decode Base64 data with file support.', icon: Hash, to: '/tools/base64-converter', color: 'bg-blue-500/10 text-blue-500' },
      { name: 'URL Converter', description: 'Safely encode and decode URLs and query parameters.', icon: Type, to: '/tools/url-converter', color: 'bg-pink-500/10 text-pink-500' },
      { name: 'Bcrypt Generator', description: 'Generate and verify secure bcrypt password hashes.', icon: Key, to: '/tools/bcrypt-generator', color: 'bg-rose-500/10 text-rose-500' },
      { name: 'Cron Parser', description: 'Translate cron expressions into human-readable text.', icon: Layers, to: '/tools/cron-parser', color: 'bg-purple-500/10 text-purple-500' },
    ],
    'PDF Tools': [
      { name: 'Edit PDF', description: 'Draw, write text, highlight, and redact elements directly on your document.', icon: FileText, to: '/tools/pdf-edit', color: 'bg-red-500/10 text-red-500' },
      { name: 'PDF Converter', description: 'Convert PDF documents into editable Word files or high-quality PNG/JPG images.', icon: FileText, to: '/tools/pdf-converter', color: 'bg-rose-500/10 text-rose-500' },
      { name: 'Merge PDF', description: 'Combine multiple PDF files into one securely.', icon: FileText, to: '/tools/pdf-merge', color: 'bg-red-500/10 text-red-500' },
      { name: 'Split PDF', description: 'Extract specific pages or page ranges from a PDF.', icon: FileText, to: '/tools/pdf-split', color: 'bg-blue-500/10 text-blue-500' },
      { name: 'Watermark PDF', description: 'Add a text watermark across all pages of a PDF document.', icon: FileText, to: '/tools/pdf-watermark', color: 'bg-purple-500/10 text-purple-500' },
      { name: 'Lock PDF', description: 'Encrypt your PDF with a password and restrict permissions.', icon: FileText, to: '/tools/pdf-lock', color: 'bg-emerald-500/10 text-emerald-500' },
      { name: 'Unlock PDF', description: 'Remove password protection and restrictions from a PDF.', icon: FileText, to: '/tools/pdf-unlock', color: 'bg-yellow-500/10 text-yellow-600' },
      { name: 'Edit Metadata', description: 'Modify hidden document properties like Author, Title, and Creator.', icon: FileText, to: '/tools/pdf-metadata', color: 'bg-blue-500/10 text-blue-500' },
      { name: 'Extract Text', description: 'Convert PDF documents into raw, editable text.', icon: FileText, to: '/tools/pdf-to-text', color: 'bg-pink-500/10 text-pink-500' },
    ],
    'Student & Docs': [
      { name: 'Code to Image', description: 'Create beautiful, shareable images of your code snippets.', icon: ImageIcon, to: '/tools/code-to-image', color: 'bg-indigo-500/10 text-indigo-500' },
      { name: 'Image to Text', description: 'Scan photos of documents and extract text instantly using OCR.', icon: Type, to: '/tools/image-to-text', color: 'bg-orange-500/10 text-orange-500' },
      { name: 'Text Diff', description: 'Compare two pieces of text or code to see exactly what changed.', icon: FileText, to: '/tools/text-diff', color: 'bg-rose-500/10 text-rose-500' },
      { name: 'Markdown Editor', description: 'Write beautiful documentation with instant GitHub-flavored previews.', icon: FileText, to: '/tools/markdown-editor', color: 'bg-blue-500/10 text-blue-500' },
    ]
  };

  return (
    <PageTransition className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Daily Utility Hub</h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
          Your all-in-one platform for everyday utilities. Select a tool below to get started. No installation required.
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(toolCategories).map(([categoryName, tools]) => (
          <div key={categoryName}>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3">
              {categoryName}
            </h2>
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
          </div>
        ))}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
