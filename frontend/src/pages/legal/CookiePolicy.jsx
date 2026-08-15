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
      <div className="space-y-10 text-slate-700">

        {/* Section 1: Overview */}
        <section id="cookie-overview" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-2xs">
              <Cookie size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              1. Zero Tracking Cookies Policy
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">
            <strong className="text-slate-900">Daily Utility Hub</strong> (<a href="https://daily-utility-hub-orpin.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">daily-utility-hub-orpin.vercel.app</a>) does not use third-party advertising cookies or cross-site tracking pixels.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            We do not sell advertising data or profile user activity across the web.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block mb-0.5">First-Party Browser Storage Only</span>
              <p className="text-xs text-slate-500 m-0">
                All data stored by Daily Utility Hub stays inside your local web browser and cannot be accessed by external sites.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Storage Types */}
        <section id="storage-breakdown" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <HardDrive size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              2. How Web Storage is Used
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            We use standard browser storage APIs (<code className="text-blue-600 font-mono text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">localStorage</code> & <code className="text-blue-600 font-mono text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">sessionStorage</code>) exclusively to save your tool choices and layout preferences:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LocalStorage */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                    <HardDrive size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Local Storage
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Local Storage (localStorage)</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Saves UI preferences directly in your browser so you don't lose your dashboard layout when you reload.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs text-slate-600 shadow-2xs">
                <strong className="text-slate-900 block mb-1">Items saved:</strong>
                Pinned tools, recent tool history, favorites.
              </div>
            </div>

            {/* SessionStorage */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <Server size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Session Memory
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Session Storage (sessionStorage)</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Temporary browser memory that is automatically cleared when you close the browser tab.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs text-slate-600 shadow-2xs">
                <strong className="text-slate-900 block mb-1">Items saved:</strong>
                Dashboard active tab and temporary state during navigation.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Table */}
        <section id="data-table" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shadow-2xs">
              <Info size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              3. Storage Registry
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            The keys used by Daily Utility Hub in your browser storage:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Storage Key</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Storage Type</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">dashboardActiveTab</td>
                  <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-semibold">sessionStorage</span></td>
                  <td className="py-3 px-4">Saves active category tab selection.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">pinned_tools</td>
                  <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-semibold">localStorage</span></td>
                  <td className="py-3 px-4">Saves pinned tool shortcuts.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">recent_history</td>
                  <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-semibold">localStorage</span></td>
                  <td className="py-3 px-4">Saves list of recent tools visited.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">custom_gemini_key</td>
                  <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-semibold">localStorage</span></td>
                  <td className="py-3 px-4">Saves user's custom API key (if set).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Clear Storage */}
        <section id="manage-clear" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shadow-2xs">
              <Trash2 size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              4. Clear Storage
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 mb-6">
            You can clear all stored site data at any time using this button:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Clear Local Browser Data</h3>
              <p className="text-xs text-slate-500 m-0">
                Resets pinned tools and saved browser preferences.
              </p>
            </div>

            <button
              onClick={handleClearLocalData}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md ${
                cleared 
                  ? "bg-emerald-600 text-white shadow-emerald-500/20" 
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 active:scale-95"
              }`}
            >
              <Trash2 size={14} />
              {cleared ? "Storage Cleared!" : "Clear All Local Data"}
            </button>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default CookiePolicy;
