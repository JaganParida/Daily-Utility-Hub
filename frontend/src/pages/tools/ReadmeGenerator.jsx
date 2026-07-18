import React, { useState, useEffect } from 'react';
import { FileText, Copy, Download, CheckCircle2, LayoutTemplate, Settings2, GitBranch, Loader2, RefreshCw, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const README_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Project',
    data: {
      title: 'My Awesome App',
      description: 'A brief description of what this project does and who it is for.',
      badges: { mit: true, npm: false, build: false },
      techStack: 'React, Tailwind CSS, TypeScript',
      features: '- ✨ Fast & Lightweight\n- 📱 Fully Responsive layout\n- 🔒 Secure client-side hashing',
      installation: '```bash\nnpm install my-project\n```',
      usage: '```javascript\nimport myProject from "my-project";\nmyProject.init();\n```',
      contributing: 'Contributions are always welcome!\n\nSee `contributing.md` for ways to get started.',
      license: 'MIT'
    }
  },
  {
    id: 'library',
    name: 'Open Source Library',
    data: {
      title: 'FastCacheJS',
      description: 'High-performance, reactive in-memory cache library for JavaScript and Node.js with LRU eviction policy.',
      badges: { mit: true, npm: true, build: true },
      techStack: 'Node.js, TypeScript, Docker',
      features: '- ⚡ Sub-millisecond read/writes\n- 🎯 Smart LRU/LFU cache eviction policies\n- 📦 Tiny footprint (<2KB gzipped)',
      installation: '```bash\nnpm install fastcachejs\n```',
      usage: '```typescript\nimport { FastCache } from "fastcachejs";\nconst cache = new FastCache({ maxSize: 100 });\ncache.set("key", "value");\n```',
      contributing: 'Please read our [Code of Conduct](CODE_OF_CONDUCT.md) and submit PRs for any improvements.',
      license: 'MIT'
    }
  },
  {
    id: 'academic',
    name: 'Student Lab/Assignment',
    data: {
      title: 'Lab Assignment 3: Leader Election',
      description: 'Course: CS401 Distributed Computing System. Submitted under the supervision of Dr. Alan Turing.',
      badges: { mit: false, npm: false, build: false },
      techStack: 'Java, Gradle',
      features: '**Student Details**:\n- **Name**: Jane Doe\n- **Roll No**: CS2026-9045\n- **Group**: CSE-A\n- **Institution**: Stanford University',
      installation: '### Prerequisites\n- JDK 17+\n- Gradle 8.0+',
      usage: '### Execution\n```bash\ngradle clean build\njava -jar build/libs/bully-election.jar\n```',
      contributing: '### Objective\nTo implement the Bully algorithm for leader election and verify consensus stability during nodes crash tests.',
      license: 'None'
    }
  }
];

const ReadmeGenerator = () => {
  const [formData, setFormData] = useState(README_TEMPLATES[0].data);
  const [markdown, setMarkdown] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [includeToc, setIncludeToc] = useState(true);

  // Github Feature
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  useEffect(() => {
    generateMarkdown();
  }, [formData, includeToc]);

  const handleTemplateChange = (templateId) => {
    const t = README_TEMPLATES.find(x => x.id === templateId);
    if (t) {
      setSelectedTemplate(templateId);
      setFormData(t.data);
      toast.success(`Loaded ${t.name} template!`);
    }
  };

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

    // Custom Tech Badges
    if (formData.techStack) {
      const techs = formData.techStack.split(',').map(t => t.trim());
      const techBadges = [];
      techs.forEach(t => {
        const lower = t.toLowerCase();
        if (lower === 'react') techBadges.push('![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)');
        else if (lower === 'node' || lower === 'node.js') techBadges.push('![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)');
        else if (lower === 'typescript' || lower === 'ts') techBadges.push('![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)');
        else if (lower === 'javascript' || lower === 'js') techBadges.push('![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)');
        else if (lower === 'python') techBadges.push('![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)');
        else if (lower === 'tailwind css' || lower === 'tailwind') techBadges.push('![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)');
        else if (lower === 'docker') techBadges.push('![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)');
        else if (lower === 'kubernetes' || lower === 'k8s') techBadges.push('![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)');
        else if (lower === 'mongodb') techBadges.push('![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)');
        else if (lower === 'postgresql' || lower === 'postgres') techBadges.push('![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)');
        else if (lower === 'aws') techBadges.push('![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)');
        else if (t) {
          techBadges.push(`![${t}](https://img.shields.io/badge/${encodeURIComponent(t)}-blue.svg?style=for-the-badge)`);
        }
      });
      if (techBadges.length > 0) {
        md += `### 🛠️ Tech Stack & Badges\n\n` + techBadges.join(' ') + '\n\n';
      }
    }

    // Table of contents
    if (includeToc) {
      md += `## 📋 Table of Contents\n\n`;
      if (formData.features) md += `- [✨ Features](#-features)\n`;
      if (formData.installation) md += `- [🛠️ Installation](#️-installation)\n`;
      if (formData.usage) md += `- [🚀 Usage/Examples](#-usageexamples)\n`;
      if (formData.contributing) md += `- [🤝 Contributing](#-contributing)\n`;
      if (formData.license && formData.license !== 'None') md += `- [📝 License](#-license)\n`;
      md += `\n`;
    }

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

    if (formData.license && formData.license !== 'None') {
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
      let repoPath = githubUrl.trim();
      if (repoPath.includes('github.com')) {
        const url = new URL(repoPath.startsWith('http') ? repoPath : `https://${repoPath}`);
        repoPath = url.pathname.substring(1);
      }
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

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <LayoutTemplate size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Readme Generator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Auto-generate professional documentation from GitHub or build it manually.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left pane: Config & Github Fetch */}
        <motion.div 
          layout
          className="flex-1 w-full flex flex-col gap-6 relative"
        >
          {/* GitHub Auto-Fetch & Templates selector */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <GitBranch size={16} /> Fetch Repo Info
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchGithubRepo()}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none"
                  placeholder="e.g. facebook/react"
                />
                <button 
                  onClick={fetchGithubRepo}
                  disabled={isFetchingGithub || !githubUrl.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isFetchingGithub ? <Loader2 size={16} className="animate-spin" /> : 'Fetch'}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3.5 flex items-center gap-2">
                  <LayoutTemplate size={16} /> Choose Outline Template
                </h3>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none capitalize"
                >
                  {README_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Builder */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">Configure content</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeToc} 
                  onChange={(e) => setIncludeToc(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4" 
                />
                <span className="text-xs font-bold text-muted-foreground">Auto Table of Contents</span>
              </label>
            </div>
            
            <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Project Title</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-y min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Tech Stack (comma-separated list for colorful badges)</label>
                  <input 
                    type="text" 
                    name="techStack"
                    value={formData.techStack || ''}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                    placeholder="e.g. React, Node.js, Tailwind, Docker"
                  />
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Badges */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Include Badges</label>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => toggleBadge('mit')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${formData.badges.mit ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground'}`}
                  >
                    {formData.badges.mit && <CheckCircle2 size={14} />} MIT License
                  </button>
                  <button 
                    onClick={() => toggleBadge('npm')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${formData.badges.npm ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-background border-border text-muted-foreground'}`}
                  >
                    {formData.badges.npm && <CheckCircle2 size={14} />} NPM Version
                  </button>
                  <button 
                    onClick={() => toggleBadge('build')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${formData.badges.build ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500' : 'bg-background border-border text-muted-foreground'}`}
                  >
                    {formData.badges.build && <CheckCircle2 size={14} />} Build Status
                  </button>
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Features */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Features</label>
                <textarea 
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none font-mono resize-y"
                />
              </div>

              {/* Installation */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Installation Instructions</label>
                <textarea 
                  name="installation"
                  value={formData.installation}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none font-mono resize-y"
                />
              </div>

              {/* Usage */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Usage Examples</label>
                <textarea 
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none font-mono resize-y"
                />
              </div>

              {/* Contributing */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Contributing Info</label>
                <textarea 
                  name="contributing"
                  value={formData.contributing}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none font-mono resize-y"
                />
              </div>

              {/* License */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">License Name</label>
                <input 
                  type="text" 
                  name="license"
                  value={formData.license}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  placeholder="MIT"
                />
              </div>

            </div>
          </div>
        </motion.div>

        {/* Right Action panel & Live Preview */}
        <div className="w-full lg:w-[450px] xl:w-[550px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)] font-sans">
          
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm shrink-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
              <span>{wordCount} Words</span>
              <span>⏱️ {readTime} min read</span>
            </div>
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
