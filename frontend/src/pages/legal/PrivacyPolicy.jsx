import LegalLayout from "../../components/LegalLayout";
import { ShieldCheck, Cpu, CloudOff, Lock, Database, Globe, Key, EyeOff, Server, Terminal, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "July 20, 2026";
  const readTime = "3 min read";
  const subtitle = "How Daily Utility Hub (daily-utility-hub-orpin.vercel.app) protects your data through offline browser processing and zero server storage.";

  const sections = [
    { id: "overview", label: "1. Privacy Overview" },
    { id: "local-processing", label: "2. Client-Side Processing Guarantee" },
    { id: "data-handling", label: "3. What Data We Handle" },
    { id: "third-party-ai", label: "4. Third-Party AI Integration" },
    { id: "cookies-storage", label: "5. Local Storage & Security" },
    { id: "user-rights", label: "6. Developer Contact & Rights" }
  ];

  return (
    <LegalLayout 
      title="Privacy Policy" 
      subtitle={subtitle} 
      lastUpdated={lastUpdated} 
      readTime={readTime}
      sections={sections}
    >
      <div className="space-y-12 text-[#d4d4d8]">

        {/* Section 1: Overview */}
        <section id="overview" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              1. Privacy Overview
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            Welcome to <strong className="text-white">Daily Utility Hub</strong> (accessible at <a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-primary hover:underline">daily-utility-hub-orpin.vercel.app</a>). 
            Our platform is designed to provide developers, students, and professionals with fast, free, everyday web utilities without collecting or uploading your files to any external server.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            The core philosophy of Daily Utility Hub is simple: <strong className="text-white">your files and inputs remain strictly inside your web browser.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <EyeOff size={24} className="text-primary mb-2" />
              <span className="text-xs font-bold text-white mb-1">No Server Uploads</span>
              <span className="text-[11px] text-[#a1a1aa]">Your files are processed directly on your computer.</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <CloudOff size={24} className="text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-white mb-1">Offline Capable</span>
              <span className="text-[11px] text-[#a1a1aa]">Most tools run entirely offline after page load.</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <Lock size={24} className="text-blue-400 mb-2" />
              <span className="text-xs font-bold text-white mb-1">100% Private</span>
              <span className="text-[11px] text-[#a1a1aa]">We never track or monetize your personal documents.</span>
            </div>
          </div>
        </section>

        {/* Section 2: Client Side Guarantee */}
        <section id="local-processing" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              2. Client-Side Local Processing Guarantee
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            Tools on Daily Utility Hub—such as PDF converters, image resizers, format converters, hash generators, and text tools—execute locally in your browser using JavaScript and WebAssembly (WASM).
          </p>

          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 shadow-inner relative overflow-hidden my-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              
              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-white shadow-md">
                  <Terminal size={28} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-white">Your Input File</span>
                <span className="text-[10px] text-[#a1a1aa]">Stays on your device</span>
              </div>

              <div className="flex md:flex-1 items-center justify-center w-full my-2 md:my-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-500/20 via-primary to-emerald-500/20 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] border border-[#27272a] px-3 py-1 rounded-full text-[10px] font-mono font-bold text-primary">
                    Browser JS / WASM Sandbox
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Cpu size={28} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-white">Local CPU Processing</span>
                <span className="text-[10px] text-[#a1a1aa]">0 bytes sent to server</span>
              </div>

              <div className="flex md:flex-1 items-center justify-center w-full my-2 md:my-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-primary via-emerald-500 to-emerald-400 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] border border-[#27272a] px-3 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-400">
                    Direct Output
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <ShieldCheck size={28} />
                </div>
                <span className="text-xs font-bold text-white">Processed Result</span>
                <span className="text-[10px] text-[#a1a1aa]">Downloaded instantly</span>
              </div>

            </div>

            <div className="mt-6 border-t border-[#27272a]/80 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a1a1aa]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 size={14} /> Verified Client-Side Operations
              </span>
              <span className="text-[11px] font-mono bg-[#18181b] px-2.5 py-1 rounded border border-[#27272a]">
                Host: Vercel Static CDN
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Data Handling */}
        <section id="data-handling" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              3. Data Collection & Account Details
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We store only minimal account information if you choose to sign up or log in using Firebase Authentication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What We Never Collect */}
            <div className="bg-[#18181b] border border-red-500/20 rounded-xl p-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={15} /> Files We Never Store
              </h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2.5 pl-4 list-disc">
                <li>Your PDF, Word, or text files.</li>
                <li>Your images, photos, or videos.</li>
                <li>Your generated passwords or code snippets.</li>
                <li>Your search queries or document contents.</li>
              </ul>
            </div>

            {/* Account Data */}
            <div className="bg-[#18181b] border border-primary/20 rounded-xl p-5">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck size={15} /> Account Information (Firebase)
              </h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2.5 pl-4 list-disc">
                <li>Email address (for account login).</li>
                <li>Display name & profile avatar (optional).</li>
                <li>Pinned tools & theme preference (saved in browser).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Third Party AI */}
        <section id="third-party-ai" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Globe size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              4. AI Features (Google Gemini API)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            Certain AI features like the <strong className="text-white">AI Audio & Video Captioner</strong> or <strong className="text-white">AI Code Playground</strong> connect directly to Google's official Gemini API from your browser.
          </p>
          <ul className="text-xs text-[#a1a1aa] space-y-2 pl-5 list-disc mb-6">
            <li>Your audio/prompt payload is sent over HTTPS straight to Google Gemini.</li>
            <li>Daily Utility Hub does not intercept or store your AI inputs on any intermediate database.</li>
            <li>Under Google's API Privacy Policy, API payloads are not used to train Google's AI models.</li>
          </ul>
        </section>

        {/* Section 5: Cookies & Storage */}
        <section id="cookies-storage" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Key size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              5. Local Browser Storage
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            We do not use advertising or tracking cookies. We only use browser <code className="text-primary font-mono text-xs">localStorage</code> to remember your UI settings:
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs text-[#a1a1aa]">
            <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
              <span className="font-bold text-white font-mono">user_theme</span>
              <span>Remembers dark or light mode preference</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
              <span className="font-bold text-white font-mono">pinned_tools</span>
              <span>Saves your shortcut tools on the dashboard</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white font-mono">recent_history</span>
              <span>Saves your recently opened tools locally</span>
            </div>
          </div>
        </section>

        {/* Section 6: Contact */}
        <section id="user-rights" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Server size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              6. Developer Contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            If you have any questions or feedback regarding Daily Utility Hub, please feel free to contact the developer directly:
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block mb-0.5">Jagan Parida (Creator & Developer)</span>
              <a href="mailto:jaganparida39064@gmail.com" className="text-xs text-primary font-bold hover:underline">
                jaganparida39064@gmail.com
              </a>
            </div>
            <a 
              href="mailto:jaganparida39064@gmail.com"
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/25 shrink-0 text-center"
            >
              Contact Developer
            </a>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
