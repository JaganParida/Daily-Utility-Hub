import { useState, useRef, useEffect } from 'react';
import { 
  Code2, Download, Copy, CheckCircle2, Plus, Trash2, Globe, 
  User, BookOpen, Briefcase, GraduationCap, Link as LinkIcon, Palette 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Github = ({ size = 24, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ size = 24, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ size = 24, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const PRESET_THEMES = [
  { id: 'dark-glass', name: 'Glassmorphism Dark', bg: 'bg-slate-950 text-slate-100', cardBg: 'bg-slate-900/50 backdrop-blur-md border-slate-800', primaryColor: 'text-indigo-400', accentBg: 'bg-indigo-500/10 border-indigo-500/30' },
  { id: 'neo-purple', name: 'Neon Cyber', bg: 'bg-neutral-950 text-neutral-100', cardBg: 'bg-neutral-900 border-fuchsia-500/40', primaryColor: 'text-fuchsia-500', accentBg: 'bg-fuchsia-500/10 border-fuchsia-500/30' },
  { id: 'emerald-mint', name: 'Emerald Forest', bg: 'bg-zinc-950 text-zinc-100', cardBg: 'bg-zinc-900/70 border-emerald-500/20', primaryColor: 'text-emerald-400', accentBg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'minimal-light', name: 'Minimalist Clean', bg: 'bg-white text-slate-950', cardBg: 'bg-slate-50 border-slate-200', primaryColor: 'text-blue-600', accentBg: 'bg-blue-50 border-blue-200' }
];

const SKILLS_LIST = [
  'React', 'Next.js', 'Vue', 'Node.js', 'TypeScript', 'JavaScript', 
  'Python', 'Go', 'Rust', 'Java', 'C++', 'Tailwind CSS', 'Docker', 
  'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Git', 'Linux'
];

const DevProfileGenerator = () => {
  const [activeTab, setActiveTab] = useState('bio');
  const [theme, setTheme] = useState(PRESET_THEMES[0]);
  const [isCopied, setIsCopied] = useState(false);

  // Profile data state
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    title: 'Senior Full Stack Developer',
    company: 'Tech Solutions Corp',
    bio: 'Passionate about building responsive, accessible web applications and distributed backend microservices.',
    location: 'San Francisco, CA',
    github: 'github_username',
    linkedin: 'linkedin_username',
    twitter: 'twitter_username',
    portfolio: 'https://example.com',
    customLinkText: 'My Blog',
    customLinkUrl: 'https://blog.example.com',
    showGithubStats: true,
    showTopLangs: true,
    selectedSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Docker'],
    projects: [
      { id: 'p1', title: 'Interactive Utility Hub', desc: 'A client-side developer productivity dashboard built with React and Tailwind CSS.', tech: 'React, Tailwind, Vite', url: 'https://github.com/github_username/hub' },
      { id: 'p2', title: 'Task Orchestrator API', desc: 'Distributed task queuing and load-balancing scheduler service written in Go.', tech: 'Go, Redis, Docker', url: 'https://github.com/github_username/orchestrator' }
    ]
  });

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillToggle = (skill) => {
    const isSelected = profile.selectedSkills.includes(skill);
    const updated = isSelected 
      ? profile.selectedSkills.filter(s => s !== skill)
      : [...profile.selectedSkills, skill];
    handleProfileChange('selectedSkills', updated);
  };

  const handleAddProject = () => {
    const newProject = {
      id: `p-${Date.now()}`,
      title: 'New Project',
      desc: 'Short description of what the project accomplishes.',
      tech: 'React, Node.js',
      url: 'https://github.com'
    };
    handleProfileChange('projects', [...profile.projects, newProject]);
  };

  const handleUpdateProject = (id, field, val) => {
    const updated = profile.projects.map(p => p.id === id ? { ...p, [field]: val } : p);
    handleProfileChange('projects', updated);
  };

  const handleRemoveProject = (id) => {
    const updated = profile.projects.filter(p => p.id !== id);
    handleProfileChange('projects', updated);
  };

  // Compile standalone HTML for download
  const generateStandaloneHTML = () => {
    const skillsHTML = profile.selectedSkills.map(s => 
      `<span style="display: inline-block; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 9999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: inherit; margin: 4px;">${s}</span>`
    ).join('');

    const projectsHTML = profile.projects.map(p => `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin-bottom: 16px; transition: transform 0.2s ease;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">${p.title}</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.8; line-height: 1.5;">${p.desc}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 12px; opacity: 0.6; font-family: monospace;">${p.tech}</span>
          <a href="${p.url}" target="_blank" style="font-size: 13px; font-weight: 600; text-decoration: none; color: #818cf8; display: inline-flex; align-items: center; gap: 4px;">Codebase &rarr;</a>
        </div>
      </div>
    `).join('');

    const statsHTML = profile.showGithubStats && profile.github ? `
      <div style="margin-top: 24px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; text-align: left;">📊 GitHub Analytics</h2>
        <img src="https://github-readme-stats.vercel.app/api?username=${profile.github}&show_icons=true&theme=dark" alt="GitHub Stats" style="width: 100%; max-width: 450px; border-radius: 12px; margin-bottom: 16px; display: inline-block;" />
        ${profile.showTopLangs ? `<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.github}&layout=compact&theme=dark" alt="Top Languages" style="width: 100%; max-width: 450px; border-radius: 12px; display: inline-block;" />` : ''}
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} - Developer Profile</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: ${theme.id === 'minimal-light' ? '#f8fafc' : '#030712'};
      color: ${theme.id === 'minimal-light' ? '#0f172a' : '#f3f4f6'};
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .profile-card {
      width: 100%;
      max-width: 600px;
      background: ${theme.id === 'minimal-light' ? '#ffffff' : '#0b0f19'};
      border: 1px solid ${theme.id === 'minimal-light' ? '#e2e8f0' : '#1f2937'};
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
    }
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #6366f1;
      display: block;
      margin: 0 auto 20px auto;
    }
    .text-center { text-align: center; }
    h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 800; }
    .title { font-size: 16px; opacity: 0.8; font-weight: 600; margin-bottom: 4px; }
    .company { font-size: 14px; opacity: 0.6; margin-bottom: 12px; }
    .location { font-size: 13px; opacity: 0.5; margin-bottom: 20px; }
    .bio { font-size: 15px; opacity: 0.85; line-height: 1.6; margin-bottom: 24px; text-align: center; }
    
    .social-links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }
    .social-btn {
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      color: white;
      background: #1f2937;
      border: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s;
    }
    .social-btn:hover { background: #374151; }
    
    .section-title { font-size: 20px; font-weight: 800; margin: 32px 0 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
  </style>
</head>
<body>
  <div class="profile-card">
    ${profile.avatarUrl ? `<img src="${profile.avatarUrl}" alt="${profile.name}" class="avatar" />` : ''}
    <div class="text-center">
      <h1>${profile.name}</h1>
      <div class="title">${profile.title}</div>
      <div class="company">${profile.company}</div>
      <div class="location">📍 ${profile.location}</div>
    </div>
    
    <p class="bio">${profile.bio}</p>
    
    <div class="social-links">
      ${profile.github ? `<a href="https://github.com/${profile.github}" class="social-btn" target="_blank">GitHub</a>` : ''}
      ${profile.linkedin ? `<a href="https://linkedin.com/in/${profile.linkedin}" class="social-btn" target="_blank">LinkedIn</a>` : ''}
      ${profile.twitter ? `<a href="https://twitter.com/${profile.twitter}" class="social-btn" target="_blank">Twitter</a>` : ''}
      ${profile.portfolio ? `<a href="${profile.portfolio}" class="social-btn" target="_blank">Portfolio</a>` : ''}
      ${profile.customLinkUrl ? `<a href="${profile.customLinkUrl}" class="social-btn" target="_blank">${profile.customLinkText || 'Link'}</a>` : ''}
    </div>
    
    <div class="section-title">⚡ Skills & Technologies</div>
    <div style="text-align: center; margin-bottom: 32px;">
      ${skillsHTML}
    </div>
    
    <div class="section-title">📂 Featured Projects</div>
    <div>
      ${projectsHTML}
    </div>
    
    ${statsHTML}
  </div>
</body>
</html>`;
  };

  const generateMarkdownProfile = () => {
    const skillsMD = profile.selectedSkills.map(s => `\`${s}\``).join(' | ');
    const projectsMD = profile.projects.map(p => `### 📁 [${p.title}](${p.url})\n* **Tech Stack**: ${p.tech}\n* ${p.desc}\n`).join('\n');
    const statsMD = profile.github ? `## 📊 GitHub Analytics\n\n![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${profile.github}&show_icons=true&theme=dark)\n\n${profile.showTopLangs ? `![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.github}&layout=compact&theme=dark)\n` : ''}` : '';

    return `# 👋 Hi, I am ${profile.name}

## 🚀 ${profile.title} at ${profile.company}

📍 Based in **${profile.location}**

${profile.bio}

---

### ⚡ Skills & Technologies
${skillsMD}

---

### 📂 Featured Projects
${projectsMD}

---

${statsMD}

### 📫 Contact & Socials
* **GitHub**: [github.com/${profile.github}](https://github.com/${profile.github})
* **LinkedIn**: [linkedin.com/in/${profile.linkedin}](https://linkedin.com/in/${profile.linkedin})
* **Portfolio**: [${profile.portfolio}](${profile.portfolio})
`;
  };

  const handleExportHTML = () => {
    const html = generateStandaloneHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.toLowerCase().replace(/\s+/g, '_')}_profile.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Successfully exported standalone HTML Page!');
  };

  const handleExportMarkdown = () => {
    const md = generateMarkdownProfile();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `README.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Successfully exported GitHub Profile README!');
  };

  const handleCopyHTML = () => {
    const html = generateStandaloneHTML();
    navigator.clipboard.writeText(html);
    setIsCopied(true);
    toast.success('Standalone HTML copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Dev Profile Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Create and host premium, responsive developer link trees and portfolio cards.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left Side: Builder Editor */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/20 overflow-x-auto custom-scrollbar shrink-0">
            {['bio', 'socials', 'skills', 'projects', 'github', 'theme'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6 flex-1 max-h-[65vh] overflow-y-auto custom-scrollbar">
            
            {/* TAB: Bio */}
            {activeTab === 'bio' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" 
                      value={profile.title}
                      onChange={(e) => handleProfileChange('title', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Company</label>
                    <input 
                      type="text" 
                      value={profile.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Location</label>
                    <input 
                      type="text" 
                      value={profile.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Avatar / Photo URL</label>
                  <input 
                    type="text" 
                    value={profile.avatarUrl}
                    onChange={(e) => handleProfileChange('avatarUrl', e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Professional Bio</label>
                  <textarea 
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                  />
                </div>
              </div>
            )}

            {/* TAB: Socials */}
            {activeTab === 'socials' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">GitHub Username</label>
                    <input 
                      type="text" 
                      value={profile.github}
                      onChange={(e) => handleProfileChange('github', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">LinkedIn Username</label>
                    <input 
                      type="text" 
                      value={profile.linkedin}
                      onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Twitter Username</label>
                    <input 
                      type="text" 
                      value={profile.twitter}
                      onChange={(e) => handleProfileChange('twitter', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Portfolio Website</label>
                    <input 
                      type="url" 
                      value={profile.portfolio}
                      onChange={(e) => handleProfileChange('portfolio', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="https://mywebsite.dev"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Custom Link Text</label>
                    <input 
                      type="text" 
                      value={profile.customLinkText}
                      onChange={(e) => handleProfileChange('customLinkText', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="My Technical Blog"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Custom Link URL</label>
                    <input 
                      type="url" 
                      value={profile.customLinkUrl}
                      onChange={(e) => handleProfileChange('customLinkUrl', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="https://blog.mywebsite.dev"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">Select Tech Stack & Languages</label>
                <div className="flex flex-wrap gap-2.5">
                  {SKILLS_LIST.map(skill => {
                    const isSelected = profile.selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isSelected ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'}`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">Featured Projects ({profile.projects.length})</label>
                  <button
                    onClick={handleAddProject}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                <div className="space-y-4">
                  {profile.projects.map((proj, idx) => (
                    <div key={proj.id} className="border border-border rounded-xl p-4 bg-muted/20 relative group space-y-3">
                      <button
                        onClick={() => handleRemoveProject(proj.id)}
                        className="absolute top-4 right-4 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Project Name</label>
                          <input 
                            type="text" 
                            value={proj.title}
                            onChange={(e) => handleUpdateProject(proj.id, 'title', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tech Stack Used</label>
                          <input 
                            type="text" 
                            value={proj.tech}
                            onChange={(e) => handleUpdateProject(proj.id, 'tech', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</label>
                        <textarea 
                          value={proj.desc}
                          onChange={(e) => handleUpdateProject(proj.id, 'desc', e.target.value)}
                          rows={2}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Project Link / Repo URL</label>
                        <input 
                          type="url" 
                          value={proj.url}
                          onChange={(e) => handleUpdateProject(proj.id, 'url', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GitHub Stats */}
            {activeTab === 'github' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">Configure Shields & API analytics cards</label>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={profile.showGithubStats}
                      onChange={(e) => handleProfileChange('showGithubStats', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground">Include General GitHub Stats Card</p>
                      <p className="text-xs text-muted-foreground">Displays stars, commits, PRs, and overall score.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={profile.showTopLangs}
                      onChange={(e) => handleProfileChange('showTopLangs', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground">Include Top Languages Card</p>
                      <p className="text-xs text-muted-foreground">Displays percentages of language usage across repositories.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB: Theme */}
            {activeTab === 'theme' && (
              <div className="grid md:grid-cols-2 gap-4">
                {PRESET_THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`p-4 border rounded-xl text-left transition-all ${theme.id === t.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/20 border-border hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Palette size={16} className={theme.id === t.id ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-sm font-bold text-foreground">{t.name}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="w-4 h-4 rounded bg-slate-900 border border-white/10" />
                      <span className="w-4 h-4 rounded bg-indigo-500" />
                      <span className="w-4 h-4 rounded bg-emerald-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Export Actions Footer */}
          <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap gap-3 shrink-0">
            <button
              onClick={handleExportHTML}
              className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <Download size={14} /> Download HTML Page
            </button>
            <button
              onClick={handleExportMarkdown}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <Download size={14} /> Download README.md
            </button>
            <button
              onClick={handleCopyHTML}
              className={`px-5 py-3 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${isCopied ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-foreground hover:bg-muted/50'}`}
            >
              {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied HTML!' : 'Copy Page HTML'}
            </button>
          </div>
        </div>

        {/* Right Side: Responsive Mobile Device Preview */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-4 rounded-3xl shadow-lg relative flex flex-col items-center justify-center">
            
            {/* Phone Screen Mockup Header */}
            <div className="w-full h-8 bg-muted/40 rounded-t-2xl flex items-center justify-center relative border-b border-border/40 shrink-0">
              <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center absolute">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 absolute left-2" />
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>

            {/* Mockup Body Content */}
            <div className={`w-full aspect-[9/16] rounded-b-2xl overflow-y-auto custom-scrollbar p-6 select-none border border-t-0 border-border/40 transition-all duration-500 ${theme.bg}`}>
              
              {/* Profile Card Mockup */}
              <div className="flex flex-col items-center text-center">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary mb-4 shadow-md" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                    <User size={36} />
                  </div>
                )}
                
                <h2 className="text-xl font-extrabold tracking-tight">{profile.name}</h2>
                <p className="text-xs font-bold opacity-80 mt-1">{profile.title}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{profile.company}</p>
                <p className="text-[10px] opacity-50 mt-1">📍 {profile.location}</p>
              </div>

              {/* Bio */}
              <p className="text-xs text-center opacity-85 leading-relaxed mt-4 px-2">{profile.bio}</p>

              {/* Social Links Mockup */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {profile.github && (
                  <span className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-[10px] font-bold border border-white/5 flex items-center gap-1">
                    <Github size={10} /> GitHub
                  </span>
                )}
                {profile.linkedin && (
                  <span className="px-3 py-1.5 bg-[#0077b5] text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Linkedin size={10} /> LinkedIn
                  </span>
                )}
                {profile.twitter && (
                  <span className="px-3 py-1.5 bg-[#1da1f2] text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Twitter size={10} /> Twitter
                  </span>
                )}
                {profile.portfolio && (
                  <span className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Globe size={10} /> Portfolio
                  </span>
                )}
                {profile.customLinkUrl && (
                  <span className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <LinkIcon size={10} /> {profile.customLinkText || 'Blog'}
                  </span>
                )}
              </div>

              {/* Skills Section */}
              <div className="mt-8">
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <Code2 size={12} className={theme.primaryColor} /> Tech Skills
                </h3>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {profile.selectedSkills.map(skill => (
                    <span 
                      key={skill} 
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${theme.accentBg}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              <div className="mt-8">
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <BookOpen size={12} className={theme.primaryColor} /> Featured Projects
                </h3>
                <div className="space-y-3">
                  {profile.projects.map(proj => (
                    <div key={proj.id} className={`p-3 rounded-xl border transition-colors ${theme.cardBg}`}>
                      <h4 className="text-xs font-bold">{proj.title}</h4>
                      <p className="text-[10px] opacity-75 mt-1 leading-normal">{proj.desc}</p>
                      <p className="text-[9px] opacity-50 mt-2 font-mono">{proj.tech}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Github Stats Section */}
              {profile.showGithubStats && profile.github && (
                <div className="mt-8">
                  <h3 className="text-xs font-black uppercase tracking-wider mb-3 pb-1 border-b border-white/10 flex items-center gap-1.5">
                    <Github size={12} className={theme.primaryColor} /> GitHub Stats
                  </h3>
                  <div className="space-y-3">
                    <img 
                      src={`https://github-readme-stats.vercel.app/api?username=${profile.github}&show_icons=true&theme=dark`} 
                      alt="GitHub Stats" 
                      className="w-full rounded-lg border border-white/10" 
                    />
                    {profile.showTopLangs && (
                      <img 
                        src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.github}&layout=compact&theme=dark`} 
                        alt="Top Languages" 
                        className="w-full rounded-lg border border-white/10" 
                      />
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DevProfileGenerator;
