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
      <div className="space-y-10 text-slate-700">

        {/* Section 1: Overview */}
        <section id="overview" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              1. Privacy Overview
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            Welcome to <strong className="text-slate-900">Daily Utility Hub</strong> (accessible at <a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">daily-utility-hub-orpin.vercel.app</a>). 
            Our platform is designed to provide developers, students, and professionals with fast, free, everyday web utilities without collecting or uploading your files to any external server.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            The core philosophy of Daily Utility Hub is simple: <strong className="text-slate-900">your files and inputs remain strictly inside your web browser.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
              <EyeOff size={24} className="text-blue-600 mb-2" />
              <span className="text-xs font-bold text-slate-900 mb-1">No Server Uploads</span>
              <span className="text-[11px] text-slate-500">Your files are processed directly on your computer.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
              <CloudOff size={24} className="text-emerald-600 mb-2" />
              <span className="text-xs font-bold text-slate-900 mb-1">Offline Capable</span>
              <span className="text-[11px] text-slate-500">Most tools run entirely offline after page load.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
              <Lock size={24} className="text-indigo-600 mb-2" />
              <span className="text-xs font-bold text-slate-900 mb-1">100% Private</span>
              <span className="text-[11px] text-slate-500">We never track or monetize your personal documents.</span>
            </div>
          </div>
        </section>

        {/* Section 2: Client Side Guarantee */}
        <section id="local-processing" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <Cpu size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              2. Client-Side Local Processing Guarantee
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            Tools on Daily Utility Hub—such as PDF converters, image resizers, format converters, hash generators, and text tools—execute locally in your browser using JavaScript and WebAssembly (WASM).
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs relative overflow-hidden my-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              
              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-xs">
                  <Terminal size={26} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-900">Your Input File</span>
                <span className="text-[10px] text-slate-500 font-medium">Stays on your device</span>
              </div>

              <div className="flex md:flex-1 items-center justify-center w-full my-2 md:my-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-400/30 via-blue-600 to-emerald-400/30 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-blue-600 shadow-2xs">
                    Browser JS / WASM Sandbox
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                  <Cpu size={26} />
                </div>
                <span className="text-xs font-bold text-slate-900">Local CPU Processing</span>
                <span className="text-[10px] text-slate-500 font-medium">0 bytes sent to server</span>
              </div>

              <div className="flex md:flex-1 items-center justify-center w-full my-2 md:my-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-600 shadow-2xs">
                    Direct Output
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 text-center w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <ShieldCheck size={26} />
                </div>
                <span className="text-xs font-bold text-slate-900">Processed Result</span>
                <span className="text-[10px] text-slate-500 font-medium">Downloaded instantly</span>
              </div>

            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 size={14} /> Verified Client-Side Operations
              </span>
              <span className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                Host: Vercel Static CDN
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Data Handling */}
        <section id="data-handling" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shadow-2xs">
              <Database size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              3. Data Collection & Account Details
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            We store only minimal account information if you choose to sign up or log in using Firebase Authentication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What We Never Collect */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={15} /> Files We Never Store
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 pl-4 list-disc">
                <li>Your PDF, Word, or text files.</li>
                <li>Your images, photos, or videos.</li>
                <li>Your generated passwords or code snippets.</li>
                <li>Your search queries or document contents.</li>
              </ul>
            </div>

            {/* Account Data */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck size={15} /> Account Information (Firebase)
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 pl-4 list-disc">
                <li>Email address (for account login).</li>
                <li>Display name & profile avatar (optional).</li>
                <li>Pinned tools & theme preference (saved in browser).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Third Party AI */}
        <section id="third-party-ai" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-2xs">
              <Globe size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              4. AI Features (Google Gemini API)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            Certain AI features like the <strong className="text-slate-900">AI Audio & Video Transcriber</strong> or <strong className="text-slate-900">AI Code Playground</strong> connect directly to Google's official Gemini API from your browser.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 pl-5 list-disc mb-6">
            <li>Your audio/prompt payload is sent over HTTPS straight to Google Gemini.</li>
            <li>Daily Utility Hub does not intercept or store your AI inputs on any intermediate database.</li>
            <li>Under Google's API Privacy Policy, API payloads are not used to train Google's AI models.</li>
          </ul>
        </section>

        {/* Section 5: Cookies & Storage */}
        <section id="cookies-storage" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-2xs">
              <Key size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              5. Local Browser Storage
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            We do not use advertising or tracking cookies. We only use browser <code className="text-blue-600 font-mono text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">localStorage</code> to remember your UI settings:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs text-slate-600">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 font-mono">user_theme</span>
              <span>Remembers light mode preference</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 font-mono">pinned_tools</span>
              <span>Saves your shortcut utilities on the dashboard</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 font-mono">recent_history</span>
              <span>Saves your recently opened utilities locally</span>
            </div>
          </div>
        </section>

        {/* Section 6: Contact */}
        <section id="user-rights" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <Server size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              6. Developer Contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            If you have any questions or feedback regarding Daily Utility Hub, please feel free to contact the developer directly:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block mb-0.5">Jagan Parida (Creator & Developer)</span>
              <a href="mailto:jaganparida39064@gmail.com" className="text-xs text-blue-600 font-bold hover:underline">
                jaganparida39064@gmail.com
              </a>
            </div>
            <a 
              href="mailto:jaganparida39064@gmail.com"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 shrink-0 text-center active:scale-[0.98]"
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
