import LegalLayout from "../../components/LegalLayout";
import { FileText, CheckCircle, ShieldAlert, Scale, RefreshCcw, AlertTriangle, HelpCircle } from "lucide-react";

const TermsOfService = () => {
  const lastUpdated = "July 20, 2026";
  const readTime = "5 min read";
  const subtitle = "Please read these Terms of Service carefully before using the developer utilities, converters, and processing features on UtilityHub.";

  const sections = [
    { id: "acceptance", label: "1. Acceptance of Terms" },
    { id: "license-scope", label: "2. Permitted Use & Scope" },
    { id: "user-responsibilities", label: "3. User Responsibilities & Conduct" },
    { id: "ai-terms", label: "4. AI & External Cloud Services" },
    { id: "disclaimers", label: "5. Disclaimers & Data Mutations" },
    { id: "liability", label: "6. Limitation of Liability" },
    { id: "updates", label: "7. Term Modifications & Contact" }
  ];

  return (
    <LegalLayout 
      title="Terms of Service & User Agreement" 
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
            By accessing or using <strong className="text-white">UtilityHub</strong> (available at utilityhub.app or affiliated domains), you enter into a binding agreement to comply with these Terms of Service and our Privacy Policy.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa]">
            If you do not agree to these terms, you must discontinue using our platform immediately. These terms apply to all visitors, registered account holders, developers, and guests.
          </p>
        </section>

        {/* Section 2: Permitted Use */}
        <section id="license-scope" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              2. Permitted Use & Software License
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            UtilityHub grants you a non-exclusive, royalty-free, revocable worldwide license to access and use our suite of web utilities for personal, commercial, educational, and developer workflows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Allowed Activities</h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2 pl-4 list-disc">
                <li>Processing proprietary or open-source files locally in your browser.</li>
                <li>Generating code snippets, UUIDs, hashes, and document templates.</li>
                <li>Integrating outputs into personal or commercial client projects.</li>
                <li>Running offline file operations without restriction.</li>
              </ul>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Prohibited Actions</h3>
              <ul className="text-xs text-[#a1a1aa] space-y-2 pl-4 list-disc">
                <li>Attempting to reverse-engineer server endpoints to bypass rate limits.</li>
                <li>Automated bot scraping that degrades platform performance.</li>
                <li>Using AI tools to generate illegal, malicious, or abusive payloads.</li>
                <li>Reselling raw application code as a competing standalone service.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: User Responsibilities */}
        <section id="user-responsibilities" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              3. User Data Ownership & Client Responsibilities
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            Because UtilityHub operates as a client-side platform:
          </p>
          <ul className="text-xs text-[#a1a1aa] space-y-3 pl-5 list-disc mb-6">
            <li><strong className="text-white">You maintain 100% ownership</strong> of all files, text inputs, images, and converted outputs processed through our tools.</li>
            <li><strong className="text-white">You are responsible for backing up your files.</strong> Because we do not store your uploaded files on cloud servers, we cannot recover lost or modified data once your browser session closes.</li>
            <li><strong className="text-white">Account Credential Security:</strong> You are responsible for keeping your login credentials secure.</li>
          </ul>
        </section>

        {/* Section 4: AI & External Cloud Services */}
        <section id="ai-terms" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <RefreshCcw size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              4. AI Models & External Cloud Integration
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            Certain features utilize cloud APIs (such as Google Gemini). When using these AI tools:
          </p>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs text-[#a1a1aa]">
            <p className="m-0">
              <strong className="text-white">Output Accuracy:</strong> Generative AI models may occasionally produce inaccurate, incomplete, or unexpected outputs. UtilityHub does not guarantee the correctness of AI-generated transcriptions or code suggestions.
            </p>
            <p className="m-0 border-t border-[#27272a] pt-3">
              <strong className="text-white">Third-Party Terms:</strong> AI requests are subject to Google's Generative AI Additional Terms of Service.
            </p>
          </div>
        </section>

        {/* Section 5: Disclaimers */}
        <section id="disclaimers" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              5. Warranties Disclaimer ("As Is" Provision)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            UTILITYHUB AND ALL OF ITS TOOLS, CONVERTERS, RUNTIMES, AND UTILITIES ARE PROVIDED ON AN <strong className="text-white">"AS IS" AND "AS AVAILABLE" BASIS</strong> WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa]">
            WE DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
        </section>

        {/* Section 6: Liability */}
        <section id="liability" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Scale size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              6. Limitation of Liability
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            TO THE FULLEST EXTENT PERMITTED BY LAW, UTILITYHUB AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS OR DATA RESULTING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.
          </p>
        </section>

        {/* Section 7: Updates & Contact */}
        <section id="updates" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              7. Updates to Terms & Contact Information
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We reserve the right to modify these Terms of Service at any time. When updates occur, we will update the "Last Updated" date at the top of this document. Continued use of the service constitutes acceptance of modified terms.
          </p>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block mb-0.5">Questions regarding these terms?</span>
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
