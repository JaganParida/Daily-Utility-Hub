import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, CheckCircle2, LayoutTemplate, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';

const INITIAL_STATE = {
  title: 'Project Name',
  description: 'A brief description of what this project does and who it is for.',
  badges: {
    npm: false,
    mit: true,
    build: false
  },
  installation: '```bash\nnpm install my-project\n```',
  usage: '```javascript\nimport myProject from "my-project";\n\nmyProject.init();\n```',
  features: '- Feature 1\n- Feature 2\n- Feature 3',
  contributing: 'Contributions are always welcome!\n\nSee `contributing.md` for ways to get started.',
  license: 'MIT'
};

const ReadmeGenerator = () => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [markdown, setMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // editor or preview (on small screens)
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    generateMarkdown();
  }, [formData]);

  const generateMarkdown = () => {
    let md = `# ${formData.title}\n\n`;

    // Badges
    const badgeStr = [];
    if (formData.badges.mit) badgeStr.push(`![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)`);
    if (formData.badges.npm) badgeStr.push(`![npm version](https://img.shields.io/npm/v/${formData.title.toLowerCase().replace(/\\s+/g, '-')}.svg?style=flat)`);
    if (formData.badges.build) badgeStr.push(`![Build Status](https://img.shields.io/travis/user/repo/master.svg?style=flat-square)`);
    
    if (badgeStr.length > 0) {
      md += badgeStr.join(' ') + '\n\n';
    }

    if (formData.description) md += `${formData.description}\n\n`;

    if (formData.features) {
      md += `## ✨ Features\n\n${formData.features}\n\n`;
    }

    if (formData.installation) {
      md += `## 🛠️ Installation\n\n${formData.installation}\n\n`;
    }

    if (formData.usage) {
      md += `## 🚀 Usage/Examples\n\n${formData.usage}\n\n`;
    }

    if (formData.contributing) {
      md += `## 🤝 Contributing\n\n${formData.contributing}\n\n`;
    }

    if (formData.license) {
      md += `## 📝 License\n\n[${formData.license}](https://choosealicense.com/licenses/${formData.license.toLowerCase()}/)\n`;
    }

    setMarkdown(md);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleBadge = (badgeName) => {
    setFormData(prev => ({
      ...prev,
      badges: {
        ...prev.badges,
        [badgeName]: !prev.badges[badgeName]
      }
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    toast.success("README copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([markdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "README.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded README.md");
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate className="text-indigo-500" />
            Readme Generator
          </h1>
          <p className="text-muted-foreground mt-1">Create professional documentation for your projects instantly.</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={copyToClipboard}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors font-medium border border-border"
          >
            {isCopied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={downloadMarkdown}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
          >
            <Download size={18} />
            Download.md
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex lg:hidden mb-4 bg-muted p-1 rounded-lg shrink-0">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings2 size={16} /> Editor
          </div>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={16} /> Preview
          </div>
        </button>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT: FORM BUILDER */}
        <div className={`flex-1 overflow-y-auto bg-card rounded-xl border border-border shadow-sm flex flex-col ${activeTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-border bg-muted/30 sticky top-0 z-10">
            <h2 className="font-semibold flex items-center gap-2 text-foreground">
              <Settings2 size={18} className="text-indigo-500" />
              Configure README
            </h2>
          </div>
          
          <div className="p-5 space-y-6">
            
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Project Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[60px]"
                  placeholder="What does your project do?"
                />
              </div>
            </div>

            <hr className="border-border" />

            {/* Badges */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Include Badges</label>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => toggleBadge('mit')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.badges.mit ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                >
                  MIT License
                </button>
                <button 
                  onClick={() => toggleBadge('npm')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.badges.npm ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                >
                  NPM Version
                </button>
                <button 
                  onClick={() => toggleBadge('build')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.badges.build ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                >
                  Build Status
                </button>
              </div>
            </div>

            <hr className="border-border" />

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Features (Markdown supported)</label>
              <textarea 
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm resize-y"
              />
            </div>

            {/* Installation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Installation</label>
              <textarea 
                name="installation"
                value={formData.installation}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm resize-y"
              />
            </div>

            {/* Usage */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Usage / Example</label>
              <textarea 
                name="usage"
                value={formData.usage}
                onChange={handleInputChange}
                rows={5}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm resize-y"
              />
            </div>

            {/* Contributing */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contributing Info</label>
              <textarea 
                name="contributing"
                value={formData.contributing}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm resize-y"
              />
            </div>

          </div>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className={`flex-1 overflow-hidden bg-[#0d1117] rounded-xl border border-border shadow-sm flex flex-col ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-border bg-[#161b22] sticky top-0 z-10 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2 text-[#e6edf3]">
              <FileText size={18} className="text-emerald-500" />
              Live Preview
            </h2>
            <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded">README.md</span>
          </div>
          
          <div className="p-6 overflow-y-auto markdown-preview-container prose prose-invert max-w-none text-[#e6edf3] pb-24">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md my-4 !bg-[#161b22] border border-[#30363d]"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-[#161b22] px-1.5 py-0.5 rounded text-[#e6edf3] font-mono text-[0.9em]" {...props}>
                      {children}
                    </code>
                  )
                },
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold border-b border-[#21262d] pb-2 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold border-b border-[#21262d] pb-2 mt-6 mb-4" {...props} />,
                a: ({node, ...props}) => <a className="text-[#58a6ff] hover:underline" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                img: ({node, ...props}) => <img className="inline-block mr-1 max-w-full" {...props} />
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReadmeGenerator;
