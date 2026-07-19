import { useState } from "react";
import LegalLayout from "../../components/LegalLayout";
import { Cookie, HardDrive, Server, ShieldCheck, Trash2, CheckCircle2, Info } from "lucide-react";
import { toast } from "react-hot-toast";

const CookiePolicy = () => {
  const lastUpdated = "July 20, 2026";
  const readTime = "3 min read";
  const subtitle = "Cookie & Local Storage Policy for Daily Utility Hub (daily-utility-hub-orpin.vercel.app).";
  const [cleared, setCleared] = useState(false);

  const sections = [
    { id: "cookie-overview", label: "1. Zero Tracking Cookies" },
    { id: "storage-breakdown", label: "2. Browser Storage Explanation" },
    { id: "data-table", label: "3. Storage Keys Registry" },
    { id: "manage-clear", label: "4. Clear Local Data" }
  ];

  const handleClearLocalData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setCleared(true);
      toast.success("Local browser storage cleared!");
      setTimeout(() => setCleared(false), 3000);
    } catch (e) {
      toast.error("Failed to clear storage.");
    }
  };

  return (
    <LegalLayout 
      title="Cookie Settings & Storage Policy" 
      subtitle={subtitle} 
      lastUpdated={lastUpdated} 
      readTime={readTime}
      sections={sections}
    >
      <div className="space-y-12 text-[#d4d4d8]">

        {/* Section 1: Overview */}
        <section id="cookie-overview" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Cookie size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              1. Zero Tracking Cookies Policy
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-4">
            <strong className="text-white">Daily Utility Hub</strong> (<a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-primary hover:underline">daily-utility-hub-orpin.vercel.app</a>) does not use third-party advertising cookies or cross-site tracking pixels.
          </p>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We do not sell advertising data or profile user activity across the web.
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block mb-0.5">First-Party Browser Storage Only</span>
              <p className="text-xs text-[#a1a1aa] m-0">
                All data stored by Daily Utility Hub stays inside your local web browser and cannot be accessed by external sites.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Storage Types */}
        <section id="storage-breakdown" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <HardDrive size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              2. How Web Storage is Used
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            We use standard browser storage APIs (<code className="text-primary font-mono text-xs">localStorage</code> & <code className="text-primary font-mono text-xs">sessionStorage</code>) exclusively to save your tool choices and dark mode preferences:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LocalStorage */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <HardDrive size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    Local Storage
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Local Storage (localStorage)</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                  Saves UI preferences directly in your browser so you don't lose your dashboard layout when you reload.
                </p>
              </div>
              <div className="bg-[#141417] rounded-lg p-3 border border-[#27272a] text-xs text-[#a1a1aa]">
                <strong className="text-white block mb-1">Items saved:</strong>
                Dark/Light theme, pinned tools, recent tool history.
              </div>
            </div>

            {/* SessionStorage */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Server size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Session Memory
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Session Storage (sessionStorage)</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                  Temporary browser memory that is automatically cleared when you close the browser tab.
                </p>
              </div>
              <div className="bg-[#141417] rounded-lg p-3 border border-[#27272a] text-xs text-[#a1a1aa]">
                <strong className="text-white block mb-1">Items saved:</strong>
                Dashboard scroll position during navigation.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Table */}
        <section id="data-table" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Info size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              3. Storage Registry
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            The keys used by Daily Utility Hub in your browser storage:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#18181b]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141417] text-[#a1a1aa] uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-white">Storage Key</th>
                  <th className="py-3.5 px-4 font-bold text-white">Storage Type</th>
                  <th className="py-3.5 px-4 font-bold text-white">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 text-[#a1a1aa]">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-primary">user_theme</td>
                  <td className="py-3 px-4"><span className="bg-[#27272a] px-2 py-0.5 rounded text-[10px] text-white">localStorage</span></td>
                  <td className="py-3 px-4">Saves dark/light mode preference.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-primary">pinned_tools</td>
                  <td className="py-3 px-4"><span className="bg-[#27272a] px-2 py-0.5 rounded text-[10px] text-white">localStorage</span></td>
                  <td className="py-3 px-4">Saves pinned tool shortcuts.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-primary">recent_history</td>
                  <td className="py-3 px-4"><span className="bg-[#27272a] px-2 py-0.5 rounded text-[10px] text-white">localStorage</span></td>
                  <td className="py-3 px-4">Saves list of recent tools visited.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-primary">custom_gemini_key</td>
                  <td className="py-3 px-4"><span className="bg-[#27272a] px-2 py-0.5 rounded text-[10px] text-white">localStorage</span></td>
                  <td className="py-3 px-4">Saves user's custom API key (if set).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Clear Storage */}
        <section id="manage-clear" className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              4. Clear Storage
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#a1a1aa] mb-6">
            You can clear all stored site data at any time using this button:
          </p>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Clear Local Browser Data</h3>
              <p className="text-xs text-[#a1a1aa] m-0">
                Resets pinned tools and saved theme settings on this browser.
              </p>
            </div>

            <button
              onClick={handleClearLocalData}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg ${
                cleared 
                  ? "bg-emerald-600 text-white shadow-emerald-600/30" 
                  : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95"
              }`}
            >
              {cleared ? (
                <>
                  <CheckCircle2 size={16} />
                  Cleared!
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Clear All Storage Now
                </>
              )}
            </button>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default CookiePolicy;
