import LegalLayout from "../../components/LegalLayout";
import { ShieldCheck, Cpu, CloudOff, Lock, Database, Globe, Key, EyeOff, Server, Terminal, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "July 20, 2026";
  const readTime = "4 min read";
  const subtitle = "Learn how UtilityHub protects your data through zero-server local processing, offline WebAssembly sandboxing, and strict privacy controls.";

  const sections = [
    { id: "overview", label: "1. Privacy Overview" },
    { id: "local-processing", label: "2. Client-Side Processing Guarantee" },
    { id: "data-handling", label: "3. What Data We Handle" },
    { id: "third-party-ai", label: "4. Third-Party AI Integration" },
    { id: "cookies-storage", label: "5. Local Storage & Security" },
    { id: "user-rights", label: "6. Your Data Rights & Contact" }
  ];

  return (
    <LegalLayout 
      title="Privacy Policy & Data Principles" 
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
              1. Privacy Overview & Core Philosophy
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            At <strong className="text-white">UtilityHub</strong>, we built our platform around a simple belief: <em className="text-white">your files, text, images, and code should never be uploaded to remote servers just to run routine utility operations.</em>
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            Traditional web converters and online developer tools send your private documents across the internet to unverified cloud servers. UtilityHub operates fundamentally differently. By compiling execution runtimes into WebAssembly (WASM) and browser-native JavaScript, <strong className="text-white">all computations occur locally on your machine.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <EyeOff size={24} className="text-primary mb-2" />
              <span className="text-xs font-bold text-white mb-1">Zero File Tracking</span>
              <span className="text-[11px] text-[#a1a1aa]">Your files are never saved or recorded by us.</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <CloudOff size={24} className="text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-white mb-1">Offline Capable</span>
              <span className="text-[11px] text-[#a1a1aa]">Works without internet once initial page loads.</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center text-center">
              <Lock size={24} className="text-blue-400 mb-2" />
              <span className="text-xs font-bold text-white mb-1">Browser Sandbox</span>
              <span className="text-[11px] text-[#a1a1aa]">Protected by your operating system's sandbox.</span>
            </div>
          </div>
        </section>

        {/* Section 2: Client Side Guarantee with Visual Flow */}
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
            When you use our PDF compressors, image converters, regex testers, JSON formatters, or hash generators, your browser executes the code locally using WebAssembly runtimes. No remote server receives a single byte of your file content.
          </p>

          {/* Enhanced Architecture Diagram */}
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 shadow-inner relative overflow-hidden my-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              
              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-white shadow-md">
                  <Terminal size={28} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-white">1. Input Payload</span>
                <span className="text-[10px] text-[#a1a1aa]">Your local files & text</span>
              </div>

              <div className="flex md:flex-1 items-center justify-center w-full my-2 md:my-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-500/20 via-primary to-emerald-500/20 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] border border-[#27272a] px-3 py-1 rounded-full text-[10px] font-mono font-bold text-primary">
                    Browser Memory Sandbox
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Cpu size={28} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-white">2. Local WASM Execution</span>
                <span className="text-[10px] text-[#a1a1aa]">Processed on your CPU</span>
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
                <span className="text-xs font-bold text-white">3. Ready Download</span>
                <span className="text-[10px] text-[#a1a1aa]">0 bytes transmitted</span>
              </div>

            </div>

            <div className="mt-6 border-t border-[#27272a]/80 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a1a1aa]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 size={14} /> 100% Client-Side Verified
              </span>
              <span className="text-[11px] font-mono bg-[#18181b] px-2.5 py-1 rounded border border-[#27272a]">
                Runtime: V8 Engine / WebAssembly
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
              3. What Data We Handle (and Don't Handle)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We collect only the absolute minimum data required to authenticate optional user accounts and sync UI settings across your devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What We Never Store */}
            <div className="bg-[#18181b] border border-red-500/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> What We Never Store
              </h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2.5 pl-4 list-disc">
                <li>Your uploaded PDF, Word, Excel, PowerPoint, or text files.</li>
                <li>Your uploaded image or video binaries.</li>
                <li>Your generated passwords, secret keys, or UUID values.</li>
                <li>Your unencrypted code snippets or text comparisons.</li>
                <li>Your precise geo-location or browsing history outside UtilityHub.</li>
              </ul>
            </div>

            {/* Account Data We Store */}
            <div className="bg-[#18181b] border border-primary/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck size={16} /> Optional Account Data
              </h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2.5 pl-4 list-disc">
                <li>Email address (managed via Firebase Authentication).</li>
                <li>Encrypted account password hashes (never stored in plaintext).</li>
                <li>Account profile settings (Display name & Avatar URL).</li>
                <li>List of tool IDs you explicitly pin to your sidebar.</li>
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
              4. Third-Party AI Integrations (Google Gemini API)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            A small set of specialized cloud utilities—such as the <strong className="text-white">AI Audio & Video Captioner</strong> and <strong className="text-white">AI Code Playground</strong>—require machine learning models that exceed local browser capabilities.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            When you invoke these specific AI tools:
          </p>
          <ul className="text-xs text-[#a1a1aa] space-y-2 pl-5 list-disc mb-6">
            <li>Your input payload is sent directly from your browser to Google's official Gemini API servers over encrypted HTTPS endpoints.</li>
            <li>We do not store or intermediate this API traffic on any secondary database.</li>
            <li>Under Google's API Privacy Terms, data submitted via paid/free API keys is <strong className="text-white">not used to train Google's AI models</strong>.</li>
          </ul>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200/90 leading-relaxed">
            <strong>Note on Custom API Keys:</strong> You can enter your own personal Gemini API key in tool settings. Your custom API key is saved solely inside your browser's local storage and is sent directly to Google.
          </div>
        </section>

        {/* Section 5: Cookies & Storage */}
        <section id="cookies-storage" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Key size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              5. Storage & Local Preference Management
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            UtilityHub does not use intrusive third-party tracking cookies or advertising pixels. We use standard browser storage (<code className="text-primary font-mono text-xs">localStorage</code> & <code className="text-primary font-mono text-xs">sessionStorage</code>) exclusively to store your workspace state:
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs text-[#a1a1aa]">
            <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
              <span className="font-bold text-white font-mono">user_theme</span>
              <span>Saves your preferred dark/light interface mode</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
              <span className="font-bold text-white font-mono">pinned_tools</span>
              <span>Saves your custom dashboard shortcuts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white font-mono">recent_history</span>
              <span>Saves your local tool access history list</span>
            </div>
          </div>
        </section>

        {/* Section 6: Rights & Contact */}
        <section id="user-rights" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Server size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              6. Your Data Rights & Contact Information
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            Because we do not hoard your files or data payloads, exercising your right to privacy is built right into the platform. You can clear your browser storage at any time by clicking <strong className="text-white">Clear Workspace Cache</strong> inside your Developer Profile page.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            If you wish to delete your Firebase authentication account or have any privacy questions, contact our lead developer directly:
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block mb-0.5">Jagan Parida — Lead Developer & Security Officer</span>
              <a href="mailto:jaganparida39064@gmail.com" className="text-xs text-primary font-bold hover:underline">
                jaganparida39064@gmail.com
              </a>
            </div>
            <a 
              href="mailto:jaganparida39064@gmail.com"
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/25 shrink-0 text-center"
            >
              Send Privacy Request
            </a>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
