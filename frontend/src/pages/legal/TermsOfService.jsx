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
      <div className="space-y-12 text-[#d4d4d8]">

        {/* Section 1: Acceptance */}
        <section id="acceptance" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FileText size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              1. Acceptance of Terms
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            By visiting or using <strong className="text-white">Daily Utility Hub</strong> at <a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-primary hover:underline">daily-utility-hub-orpin.vercel.app</a>, you agree to these Terms of Service and our Privacy Policy.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa]">
            Daily Utility Hub is a free, web-based platform providing client-side developer and document tools. If you do not agree with these terms, please discontinue using the website.
          </p>
        </section>

        {/* Section 2: Permitted Use */}
        <section id="license-scope" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              2. Permitted Use
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            You are welcome to use all utilities on Daily Utility Hub for both personal and commercial purposes free of charge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Allowed Uses</h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2 pl-4 list-disc">
                <li>Converting, editing, or compressing your files locally.</li>
                <li>Generating code, passwords, hashes, and UUIDs for projects.</li>
                <li>Using the output in personal, commercial, or open-source work.</li>
              </ul>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Prohibited Uses</h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2 pl-4 list-disc">
                <li>Automated bot attacks or DDoS targeting the site host.</li>
                <li>Using AI tools to generate illegal or harmful content.</li>
                <li>Claiming the Daily Utility Hub platform software as your own.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: File Ownership */}
        <section id="user-responsibilities" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              3. File Ownership & Backups
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            You retain 100% full ownership of all files and content you process using Daily Utility Hub.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa]">
            Because Daily Utility Hub does not store your files on cloud servers, you are responsible for maintaining backups of your original documents before running conversions or compressions.
          </p>
        </section>

        {/* Section 4: AI Features */}
        <section id="ai-terms" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <RefreshCcw size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              4. AI Features & Accuracy
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            AI features like the Audio & Video Captioner leverage the Google Gemini API. Generative AI outputs may occasionally contain inaccuracies. Users should verify transcribed text or AI-suggested code before using it in production systems.
          </p>
        </section>

        {/* Section 5: Disclaimers */}
        <section id="disclaimers" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              5. Disclaimer of Warranties
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa]">
            Daily Utility Hub is provided on an <strong className="text-white">"as is" and "as available" basis</strong> without warranties of any kind. While we work to ensure high performance, we are not liable for lost data or browser issues during local operations.
          </p>
        </section>

        {/* Section 6: Modifications & Contact */}
        <section id="updates" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              6. Modifications & Contact
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We may update these terms as new tools are added. For any questions regarding terms of use, please reach out directly:
          </p>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block mb-0.5">Developer Contact</span>
              <a href="mailto:jaganparida39064@gmail.com" className="text-xs text-primary font-bold hover:underline">
                jaganparida39064@gmail.com
              </a>
            </div>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default TermsOfService;
