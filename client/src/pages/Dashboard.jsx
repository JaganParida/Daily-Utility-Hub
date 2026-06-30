import { Link } from 'react-router-dom';
import { Type, Hash, Key, Layers, AlignLeft, Image as ImageIcon, Expand, Crop, ArrowRightLeft } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
  const tools = [
    {
      name: 'Image Compressor',
      description: 'Compress images locally without server upload.',
      icon: ImageIcon,
      to: '/tools/image-compressor',
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      name: 'Image Resizer',
      description: 'Change image dimensions instantly.',
      icon: Expand,
      to: '/tools/image-resizer',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      name: 'Image Cropper',
      description: 'Crop images visually in your browser.',
      icon: Crop,
      to: '/tools/image-cropper',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      name: 'Image Converter',
      description: 'Convert between PNG, JPEG, WEBP, and BMP.',
      icon: ArrowRightLeft,
      to: '/tools/image-converter',
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      name: 'Word Counter',
      description: 'Count words, characters, and sentences in your text.',
      icon: Type,
      to: '/tools/word-counter',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      name: 'Case Converter',
      description: 'Convert text to lowercase, UPPERCASE, Title Case, etc.',
      icon: Type,
      to: '/tools/case-converter',
      color: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      name: 'Lorem Ipsum Generator',
      description: 'Generate dummy text for your designs and mockups.',
      icon: AlignLeft,
      to: '/tools/lorem-ipsum',
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      name: 'Remove Duplicate Lines',
      description: 'Clean up text lists by instantly removing duplicates.',
      icon: Layers,
      to: '/tools/remove-duplicates',
      color: 'bg-pink-500/10 text-pink-500',
    },
    {
      name: 'Sort Lines',
      description: 'Sort text lines alphabetically (A-Z or Z-A).',
      icon: Layers,
      to: '/tools/sort-lines',
      color: 'bg-rose-500/10 text-rose-500',
    },
    {
      name: 'Find & Replace',
      description: 'Find and replace text with Regex support.',
      icon: Type,
      to: '/tools/find-replace',
      color: 'bg-cyan-500/10 text-cyan-500',
    },
    {
      name: 'UUID Generator',
      description: 'Generate secure UUIDs for your applications.',
      icon: Hash,
      to: '/tools/uuid-generator',
      color: 'bg-green-500/10 text-green-500',
    },
    {
      name: 'Password Generator',
      description: 'Generate strong, secure passwords instantly.',
      icon: Key,
      to: '/tools/password-generator',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      name: 'Hash Generator',
      description: 'Generate MD5, SHA-1, SHA-256 hashes.',
      icon: Hash,
      to: '/tools/hash-generator',
      color: 'bg-teal-500/10 text-teal-500',
    },
    {
      name: 'JWT Decoder',
      description: 'Decode and view JSON Web Tokens.',
      icon: Hash,
      to: '/tools/jwt-decoder',
      color: 'bg-yellow-500/10 text-yellow-600',
    },
    {
      name: 'Regex Tester',
      description: 'Test and debug regular expressions.',
      icon: Type,
      to: '/tools/regex-tester',
      color: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      name: 'Color Picker',
      description: 'Select colors and get HEX, RGB, and HSL.',
      icon: Layers,
      to: '/tools/color-picker',
      color: 'bg-pink-500/10 text-pink-500',
    }
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
