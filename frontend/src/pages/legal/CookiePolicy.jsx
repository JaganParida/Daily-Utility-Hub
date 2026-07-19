import LegalLayout from "../../components/LegalLayout";
import { Cookie, Server, HardDrive } from "lucide-react";

const CookiePolicy = () => {
  const lastUpdated = "October 24, 2026";
  const sections = [
    { id: "what-are-cookies", label: "What are Cookies?" },
    { id: "how-we-use", label: "How We Use Storage" },
    { id: "types-of-storage", label: "Types of Storage Used" },
    { id: "management", label: "Managing Your Data" }
  ];

  return (
    <LegalLayout title="Cookie & Storage Policy" lastUpdated={lastUpdated} sections={sections}>
      <h2 id="what-are-cookies">1. What are Cookies and Local Storage?</h2>
      <p>
        Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
        However, modern web applications like <strong>UtilityHub</strong> rely more heavily on advanced browser storage mechanisms like <code>localStorage</code> and <code>sessionStorage</code>.
      </p>
      <p>
        These modern storage APIs allow us to save your preferences directly on your device without sending that data back and forth to a server with every network request, enhancing both your privacy and the application's speed.
      </p>

      <h2 id="how-we-use">2. How We Use Storage (Zero Tracking Promise)</h2>
      <p>
        We take a minimalist, privacy-first approach to browser storage. 
        <strong>We do not use any third-party marketing cookies, cross-site trackers, or analytics pixels.</strong>
      </p>
      <p>
        The storage we use is strictly necessary to provide the core functionality of the application, such as remembering which tools you have pinned to your dashboard or maintaining your active login session if you choose to authenticate.
      </p>

      <h2 id="types-of-storage">3. Types of Storage Used</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        
        {/* LocalStorage Card */}
        <div className="bg-[#111116] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-lg bg-[#2563eb]/20 text-[#60a5fa] flex items-center justify-center mb-4 border border-[#2563eb]/30">
            <HardDrive size={24} />
          </div>
          <h4 className="text-white font-bold text-lg mb-2">Local Storage</h4>
          <p className="text-sm text-[#a1a1aa] mb-4 flex-1">
            Persistent storage that remains on your device even after you close the browser. Used for non-sensitive preferences.
          </p>
          <div className="bg-[#18181b] rounded-lg p-3 text-xs border border-[#27272a]">
            <strong className="text-[#d4d4d8] block mb-1">What we store:</strong>
            <ul className="list-disc pl-4 space-y-1 mb-0 mt-1">
              <li>Pinned/Favorite tools</li>
              <li>Theme preferences (Dark/Light mode)</li>
              <li>Recent tool history</li>
              <li>Locally generated API keys (saved only on your machine)</li>
            </ul>
          </div>
        </div>

        {/* SessionStorage Card */}
        <div className="bg-[#111116] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-lg bg-[#10b981]/20 text-[#34d399] flex items-center justify-center mb-4 border border-[#10b981]/30">
            <Server size={24} />
          </div>
          <h4 className="text-white font-bold text-lg mb-2">Session Storage</h4>
          <p className="text-sm text-[#a1a1aa] mb-4 flex-1">
            Temporary storage that is automatically cleared the moment you close your browser tab or window.
          </p>
          <div className="bg-[#18181b] rounded-lg p-3 text-xs border border-[#27272a]">
            <strong className="text-[#d4d4d8] block mb-1">What we store:</strong>
            <ul className="list-disc pl-4 space-y-1 mb-0 mt-1">
              <li>Temporary authentication tokens</li>
              <li>In-progress file processing states</li>
              <li>Volatile workspace configurations</li>
            </ul>
          </div>
        </div>

      </div>

      <h2 id="management">4. Managing Your Data</h2>
      <p>
        Because we rely on standard browser storage, you have complete control over this data. You can manage or delete this data at any time through your browser settings.
      </p>
      
      <div className="bg-[#18181b] border-l-4 border-[#2563eb] p-5 rounded-r-lg my-6">
        <h4 className="text-white font-bold mb-2">How to clear your storage manually:</h4>
        <ul className="text-sm space-y-2 mb-0">
          <li><strong>Google Chrome:</strong> Settings {'>'} Privacy and security {'>'} Clear browsing data (Select "Cookies and other site data").</li>
          <li><strong>Mozilla Firefox:</strong> Options {'>'} Privacy & Security {'>'} Cookies and Site Data {'>'} Clear Data.</li>
          <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Manage Website Data {'>'} Remove.</li>
        </ul>
      </div>

      <p>
        Additionally, if you are logged into UtilityHub, you can navigate to the <strong>Developer Profile</strong> section and click the "Clear Local Data" button to instantly wipe all saved preferences from your current device.
      </p>
      
      <p className="text-xs text-[#71717a] mt-12 border-t border-[#27272a] pt-6">
        By continuing to use UtilityHub, you acknowledge that we use local browser storage to provide our core services as outlined above.
      </p>
    </LegalLayout>
  );
};

export default CookiePolicy;
