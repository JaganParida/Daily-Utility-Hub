import LegalLayout from "../../components/LegalLayout";
import { FileText, CheckCircle, ShieldAlert, RefreshCcw, AlertTriangle, HelpCircle } from "lucide-react";

const TermsOfService = () => {
  const lastUpdated = "July 20, 2026";
  const readTime = "4 min read";
  const subtitle = "Terms of Service for using Daily Utility Hub (daily-utility-hub-orpin.vercel.app).";

  const sections = [
    { id: "acceptance", label: "1. Acceptance of Terms" },
    { id: "license-scope", label: "2. Permitted Use" },
    { id: "user-responsibilities", label: "3. File Ownership & Backups" },
    { id: "ai-terms", label: "4. AI Features & Usage" },
    { id: "disclaimers", label: "5. Disclaimer of Warranties" },
    { id: "updates", label: "6. Modifications & Contact" }
  ];

  return (
    <LegalLayout 
      title="Terms of Service" 
      subtitle={subtitle} 
      lastUpdated={lastUpdated} 
      readTime={readTime}
      sections={sections}
    >
      <div className="space-y-10 text-slate-700">

        {/* Section 1: Acceptance */}
        <section id="acceptance" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <FileText size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              1. Acceptance of Terms
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            By visiting or using <strong className="text-slate-900">Daily Utility Hub</strong> at <a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">daily-utility-hub-orpin.vercel.app</a>, you agree to these Terms of Service and our Privacy Policy.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Daily Utility Hub is a free, web-based platform providing client-side developer and document tools. If you do not agree with these terms, please discontinue using the website.
          </p>
        </section>

        {/* Section 2: Permitted Use */}
        <section id="license-scope" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-2xs">
              <CheckCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              2. Permitted Use
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            You are welcome to use all utilities on Daily Utility Hub for both personal and commercial purposes free of charge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Allowed Uses</h3>
              <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc">
                <li>Converting, editing, or compressing your files locally.</li>
                <li>Generating code, passwords, hashes, and UUIDs for projects.</li>
                <li>Using the output in personal, commercial, or open-source work.</li>
              </ul>
            </div>
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Prohibited Uses</h3>
              <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc">
                <li>Automated bot attacks or DDoS targeting the site host.</li>
                <li>Using AI tools to generate illegal or harmful content.</li>
                <li>Claiming the Daily Utility Hub platform software as your own.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: File Ownership */}
        <section id="user-responsibilities" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-2xs">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              3. File Ownership & Backups
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            You retain 100% full ownership of all files and content you process using Daily Utility Hub.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Because Daily Utility Hub does not store your files on cloud servers, you are responsible for maintaining backups of your original documents before running conversions or compressions.
          </p>
        </section>

        {/* Section 4: AI Features */}
        <section id="ai-terms" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shadow-2xs">
              <RefreshCcw size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              4. AI Features & Accuracy
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            AI features like the Audio & Video Transcriber leverage the Google Gemini API. Generative AI outputs may occasionally contain inaccuracies. Users should verify transcribed text or AI-suggested code before using it in production systems.
          </p>
        </section>

        {/* Section 5: Disclaimers */}
        <section id="disclaimers" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shadow-2xs">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              5. Disclaimer of Warranties
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Daily Utility Hub is provided on an <strong className="text-slate-900">"as is" and "as available" basis</strong> without warranties of any kind. While we work to ensure high performance, we are not liable for lost data or browser issues during local operations.
          </p>
        </section>

        {/* Section 6: Modifications & Contact */}
        <section id="updates" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              6. Modifications & Contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            We may update these terms as new tools are added. For any questions regarding terms of use, please reach out directly:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block mb-0.5">Developer Contact</span>
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

export default TermsOfService;
