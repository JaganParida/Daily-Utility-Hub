import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, CheckCircle2, LayoutTemplate, Settings2, GitBranch, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isCopied, setIsCopied] = useState(false);
  
  // Github Feature
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  useEffect(() => {
    generateMarkdown();
  }, [formData]);

  const generateMarkdown = () => {
    let md = `# ${formData.title}\n\n`;

    // Badges
    const badgeStr = [];
    if (formData.badges.mit) badgeStr.push(`![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)`);
    if (formData.badges.npm) badgeStr.push(`![npm version](https://img.shields.io/npm/v/${formData.title.toLowerCase().replace(/\s+/g, '-')}.svg?style=flat)`);
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
      md += `## 📝 License\n\n[${formData.license}](https://choosealicense.com/licenses/${formData.license.toLowerCase().replace(/\s+/g, '-')}/)\n`;
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
    element.remove();
    toast.success("Downloaded README.md");
  };

  const fetchGithubRepo = async () => {
    if (!githubUrl.trim()) return toast.error("Please enter a valid GitHub repository URL");
    
    setIsFetchingGithub(true);
    
    try {
      // Parse URL like https://github.com/facebook/react or just facebook/react
      let repoPath = githubUrl.trim();
      if (repoPath.includes('github.com')) {
        const url = new URL(repoPath.startsWith('http') ? repoPath : `https://${repoPath}`);
        repoPath = url.pathname.substring(1); // removes leading slash
      }
      // Remove trailing slashes
      repoPath = repoPath.replace(/\/$/, '');
      
      const parts = repoPath.split('/');
      if (parts.length < 2) throw new Error("Invalid format. Use owner/repo");
      
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!res.ok) throw new Error("Repository not found or API rate limit exceeded.");
      
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        title: data.name || prev.title,
        description: data.description || prev.description,
        license: data.license?.spdx_id || prev.license,
        badges: {
          ...prev.badges,
          mit: data.license?.spdx_id === 'MIT'
        }
      }));
      
      toast.success("Successfully fetched repository info!");
      setGithubUrl('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch repository.");
    } finally {
      setIsFetchingGithub(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <LayoutTemplate size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Readme Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Auto-generate professional documentation from GitHub or build it manually.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left pane: Config & Github Fetch */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6 relative"
        >
          {/* GitHub Auto-Fetch Card */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <GitBranch size={16} className="text-foreground" /> Auto-Generate from GitHub
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchGithubRepo()}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. facebook/react or https://github.com/facebook/react"
                />
              </div>
              <button 
                onClick={fetchGithubRepo}
                disabled={isFetchingGithub || !githubUrl.trim()}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isFetchingGithub ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Fetch Repo
              </button>
            </div>
          </div>

          {/* Form Builder */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">Configure Markdown content</h2>
            </div>
            
            <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
              
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Project Title</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[60px]"
                    placeholder="What does your project do?"
                  />
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Badges */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Include Badges</label>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => toggleBadge('mit')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${formData.badges.mit ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'}`}
                  >
                    {formData.badges.mit && <CheckCircle2 size={14} />} MIT License
                  </button>
                  <button 
                    onClick={() => toggleBadge('npm')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${formData.badges.npm ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'}`}
                  >
                    {formData.badges.npm && <CheckCircle2 size={14} />} NPM Version
                  </button>
                  <button 
                    onClick={() => toggleBadge('build')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${formData.badges.build ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'}`}
                  >
                    {formData.badges.build && <CheckCircle2 size={14} />} Build Status
                  </button>
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Features */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Features (Markdown)</label>
                <textarea 
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                />
              </div>

              {/* Installation */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Installation Instructions</label>
                <textarea 
                  name="installation"
                  value={formData.installation}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                />
              </div>

              {/* Usage */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Usage Examples</label>
                <textarea 
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                />
              </div>

              {/* Contributing */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Contributing Info</label>
                <textarea 
                  name="contributing"
                  value={formData.contributing}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                />
              </div>

            </div>
          </div>
        </motion.div>

        {/* Right Action panel & Live Preview */}
        <div className="w-full lg:w-[450px] xl:w-[550px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={copyToClipboard}
              className={`py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] ${
                isCopied ? 'bg-primary/10 text-primary border border-primary/50 shadow-none' : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
              }`}
            >
              {isCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {isCopied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              onClick={downloadMarkdown}
              className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.98] hover:shadow-primary/30"
            >
              <Download size={18} />
              Download .md
            </button>
          </div>

          <div className="bg-[#0d1117] border border-border rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 border-b border-border/10 bg-[#161b22] flex justify-between items-center shrink-0">
              <h2 className="font-semibold flex items-center gap-2 text-[#e6edf3] text-sm uppercase tracking-wider">
                <FileText size={16} className="text-primary" />
                Live Preview
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-[#e6edf3] text-sm">
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
                        className="rounded-lg my-4 !bg-[#161b22] border border-[#30363d] !text-xs"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-[#161b22] px-1.5 py-0.5 rounded text-[#e6edf3] font-mono text-[0.9em] border border-[#30363d]" {...props}>
                        {children}
                      </code>
                    )
                  },
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold border-b border-[#21262d] pb-2 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold border-b border-[#21262d] pb-2 mt-6 mb-4" {...props} />,
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
    </div>
  );
};

export default ReadmeGenerator;
