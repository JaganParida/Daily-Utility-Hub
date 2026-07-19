import LegalLayout from "../../components/LegalLayout";
import { ShieldCheck, Cpu, CloudOff } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "October 24, 2026";
  const sections = [
    { id: "introduction", label: "Introduction" },
    { id: "local-processing", label: "Local Processing Guarantee" },
    { id: "data-collection", label: "Data Collection & Storage" },
    { id: "third-party", label: "Third-Party Services" },
    { id: "security", label: "Security Measures" },
    { id: "contact", label: "Contact Us" }
  ];

  return (
    <LegalLayout title="Privacy Policy" lastUpdated={lastUpdated} sections={sections}>
      <h2 id="introduction">1. Introduction</h2>
      <p>
        At <strong>UtilityHub</strong>, we believe that privacy is a fundamental human right. 
        Unlike traditional web applications that upload your files to a server for processing, 
        UtilityHub is architected entirely as an offline-first, client-side application.
      </p>
      <p>
        This Privacy Policy explains how your data is handled when you use our services. 
        The core principle of UtilityHub is simple: <strong>Your data remains yours, and it never leaves your device unless you explicitly instruct it to.</strong>
      </p>

      <h2 id="local-processing">2. The Local Processing Guarantee</h2>
      <p>
        Most of the tools provided by UtilityHub—including PDF merging, image compression, 
        format conversion, and data generation—are powered by <strong>WebAssembly (WASM)</strong> and 
        modern browser APIs.
      </p>
      
      {/* Visual Diagram */}
      <div className="my-10 bg-[#111116] border border-[#27272a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 text-center">Data Flow Architecture</h4>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-2xl mx-auto relative z-10">
          
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-white shadow-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </div>
            <span className="text-xs font-bold text-[#d4d4d8]">Your File</span>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center px-4">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#2563eb] to-transparent relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#2563eb] rounded-full" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2563eb] border border-[#3b82f6] flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Cpu size={32} />
            </div>
            <span className="text-xs font-bold text-[#d4d4d8]">Local Browser</span>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center px-4">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#10b981] to-transparent relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#10b981] rounded-full" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#064e3b] border border-[#059669] flex items-center justify-center text-[#10b981] shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <span className="text-xs font-bold text-[#d4d4d8]">Secure Output</span>
          </div>
          
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 py-2 px-4 rounded-lg w-max mx-auto border border-red-500/20">
          <CloudOff size={14} /> NO CLOUD SERVERS INVOLVED
        </div>
      </div>

      <p>
        When you select a file to process, the computation happens entirely on your own device's CPU/GPU. 
        We do not have access to your documents, images, code, or any other data you input into these offline tools.
      </p>

      <h2 id="data-collection">3. Data Collection & Storage</h2>
      <h3>A. Account Information</h3>
      <p>
        If you choose to create an account, we use Firebase Authentication to manage your login credentials. 
        We store only the minimum necessary information:
      </p>
      <ul>
        <li>Your email address (for authentication purposes)</li>
        <li>Your display name (optional)</li>
        <li>Your profile picture URL (optional)</li>
      </ul>

      <h3>B. Local Storage</h3>
      <p>
        To provide a seamless experience, we use your browser's <code>localStorage</code> and <code>sessionStorage</code>. 
        This is used to remember your pinned tools, dark/light mode preferences, and recent tool history. 
        This data is stored on your device and is never transmitted to us.
      </p>

      <h2 id="third-party">4. Third-Party AI Services</h2>
      <p>
        Certain advanced features (like AI Audio Transcription or AI Code Playgrounds) require cloud computing power that cannot run locally. 
        For these specific features, we utilize the <strong>Google Gemini API</strong>.
      </p>
      <blockquote>
        When you use an AI tool, only the specific data you submit to that tool (e.g., an audio file for transcription or a prompt for coding) is sent to Google's servers. 
        Google's API terms strictly state that your data is <strong>not</strong> used to train their foundational AI models.
      </blockquote>

      <h2 id="security">5. Security Measures</h2>
      <p>
        Because UtilityHub runs locally, the primary security boundary is your own browser. We enforce security through:
      </p>
      <ul>
        <li><strong>No external backend:</strong> Hackers cannot breach our database to steal your files, because we don't have a database of your files.</li>
        <li><strong>HTTPS encryption:</strong> The initial loading of the website is secured via standard SSL/TLS encryption.</li>
        <li><strong>Local sandboxing:</strong> WebAssembly modules operate in a strictly isolated browser sandbox, preventing them from accessing your local filesystem without your explicit permission.</li>
      </ul>

      <h2 id="contact">6. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, 
        please reach out to us at <a href="mailto:jaganparida39064@gmail.com">jaganparida39064@gmail.com</a>.
      </p>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
