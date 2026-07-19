import { Link } from "react-router-dom";
import {
  Globe,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer className="w-full relative z-10 mt-auto bg-[#050507] border-t border-[#27272a] overflow-hidden shrink-0">
      {/* Premium subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2563eb]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-12 relative z-10">
        {/* Top CTA Section */}
        <div className="py-12 md:py-16 border-b border-[#27272a]/60 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 flex items-center justify-center md:justify-start gap-2">
              Ready to optimize your workflow?{" "}
              <Sparkles className="text-[#2563eb]" size={24} />
            </h2>
            <p className="text-[#a1a1aa] text-sm md:text-base leading-relaxed">
              Join thousands of developers using UtilityHub to process data
              safely, entirely in the browser. No servers. No tracking.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto mt-6 md:mt-0">
            {!currentUser && (
              <Link
                to="/register"
                className="w-full sm:w-auto whitespace-nowrap h-11 px-4 sm:px-6 rounded-xl bg-[#2563eb] hover:bg-[#6A4BE0] text-white font-bold text-sm flex items-center justify-center transition-all shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]"
              >
                Get Started Free
              </Link>
            )}
            <Link
              to="/dashboard"
              className="w-full sm:w-auto whitespace-nowrap h-11 px-4 sm:px-6 rounded-xl bg-[#27272a] hover:bg-[#252532] text-white font-bold text-sm border border-[#2e2e3e] flex items-center justify-center transition-colors"
            >
              Explore Tools <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center text-white shadow-lg shadow-[#2563eb]/20 transition-transform group-hover:scale-105">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                UtilityHub
              </span>
            </Link>
            <p className="text-[#71717a] text-xs leading-relaxed mb-6 max-w-[280px]">
              A beautifully crafted, offline-first developer suite. Built with
              performance and security in mind.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.jaganparida.com/projects/daily-utility-hub"
                className="w-9 h-9 rounded-full bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-[#71717a] hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] transition-all"
                title="Website"
              >
                <Globe size={15} />
              </a>
              <a
                href="https://github.com/JaganParida"
                className="w-9 h-9 rounded-full bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-[#71717a] hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] transition-all"
                title="GitHub"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://x.com/JaganParida0504"
                className="w-9 h-9 rounded-full bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-[#71717a] hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] transition-all"
                title="Twitter"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="mailto:jaganparida39064@gmail.com"
                className="w-9 h-9 rounded-full bg-[#18181b] border border-[#3f3f46] flex items-center justify-center text-[#71717a] hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] transition-all"
                title="Contact"
              >
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Links Cols */}
          <div className="col-span-1 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-widest uppercase mb-3">
                Product
              </h3>
              <Link
                to="/"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                All Tools
              </Link>
              <Link
                to="/pinned"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Pinned Utilities
              </Link>
              <Link
                to="/recent"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Recent History
              </Link>
              <Link
                to="/tools/developer-profile"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Developer Profile
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-widest uppercase mb-3">
                Solutions
              </h3>
              <Link
                to="/tools/uuid-generator"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                For Developers
              </Link>
              <Link
                to="/tools/readme-generator"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                For Students
              </Link>
              <Link
                to="/privacy-policy#local-processing"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Offline-First Mode
              </Link>
              <Link
                to="/tools/file-vault"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Security Vault
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-widest uppercase mb-3">
                Resources
              </h3>
              <Link
                to="/profile"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                User Profile
              </Link>
              {!currentUser ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <span className="text-[10px] text-[#52525b] font-black uppercase tracking-wider">
                  Session Active
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-widest uppercase mb-3">
                Legal
              </h3>
              <Link
                to="/privacy-policy"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-[#a1a1aa] hover:text-[#2563eb] transition-colors font-medium"
              >
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[#27272a]/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#52525b] font-medium text-center md:text-left flex items-center gap-1.5">
            © {new Date().getFullYear()} UtilityHub.{" "}
            <Shield size={12} className="ml-1" /> Client-side processed.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
