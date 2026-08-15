import { Link } from "react-router-dom";
import {
  Globe,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer className="w-full relative z-10 mt-auto bg-[#0b141a] border-t border-[#222d34] overflow-hidden shrink-0">
      {/* Subtle background ambient emerald light glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00a884]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-12 relative z-10">
        {/* Top CTA Section */}
        <div className="py-12 md:py-16 border-b border-[#222d34] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-[#e9edef] tracking-tight mb-3 flex items-center justify-center md:justify-start gap-2">
              Ready to process files locally?{" "}
              <Sparkles className="text-[#00a884]" size={24} />
            </h2>
            <p className="text-[#8696a0] text-sm md:text-base leading-relaxed">
              Join thousands of developers and creators using UtilityHub to process data
              safely, entirely inside the browser. No servers. Zero telemetry.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto mt-6 md:mt-0">
            {!currentUser && (
              <Link
                to="/register"
                className="w-full sm:w-auto whitespace-nowrap h-11 px-5 sm:px-6 rounded-xl bg-[#00a884] hover:bg-[#25d366] text-white font-bold text-sm flex items-center justify-center transition-all shadow-md shadow-[#00a884]/25 active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            )}
            <Link
              to="/search"
              className="w-full sm:w-auto whitespace-nowrap h-11 px-5 sm:px-6 rounded-xl bg-[#202c33] hover:bg-[#222e35] text-[#e9edef] font-bold text-sm border border-[#2a3942] flex items-center justify-center transition-colors shadow-xs"
            >
              Explore 90+ Tools <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center text-white shadow-md shadow-[#00a884]/25 transition-transform group-hover:scale-105">
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
              <span className="font-black text-2xl tracking-tight text-[#e9edef]">
                Utility<span className="text-[#00a884]">Hub</span>
              </span>
            </Link>
            <p className="text-[#8696a0] text-xs leading-relaxed mb-6 max-w-[280px]">
              A beautifully crafted, offline-first developer suite. Built with
              maximum performance, privacy, and client-side security in mind.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.jaganparida.com/projects/daily-utility-hub"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] hover:bg-[#00a884] hover:text-white hover:border-[#00a884] transition-all shadow-xs"
                title="Website"
              >
                <Globe size={16} />
              </a>
              <a
                href="https://github.com/JaganParida"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] hover:bg-[#00a884] hover:text-white hover:border-[#00a884] transition-all shadow-xs"
                title="GitHub"
              >
                <svg
                  className="w-4 h-4"
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
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] hover:bg-[#00a884] hover:text-white hover:border-[#00a884] transition-all shadow-xs"
                title="Twitter"
              >
                <svg
                  className="w-4 h-4"
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
                className="w-9 h-9 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] hover:bg-[#00a884] hover:text-white hover:border-[#00a884] transition-all shadow-xs"
                title="Contact"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Links Cols */}
          <div className="col-span-1 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="flex flex-col gap-3">
              <h3 className="text-[#e9edef] text-xs font-bold tracking-widest uppercase mb-2">
                Product
              </h3>
              <Link
                to="/"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                All Tools
              </Link>
              <Link
                to="/pinned"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Pinned Utilities
              </Link>
              <Link
                to="/recent"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Recent History
              </Link>
              <Link
                to="/tools/developer-profile"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Developer Profile
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[#e9edef] text-xs font-bold tracking-widest uppercase mb-2">
                Solutions
              </h3>
              <Link
                to="/tools/uuid-generator"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                For Developers
              </Link>
              <Link
                to="/tools/readme-generator"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                For Students
              </Link>
              <Link
                to="/privacy-policy"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Offline Engine
              </Link>
              <Link
                to="/tools/file-vault"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Security Vault
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[#e9edef] text-xs font-bold tracking-widest uppercase mb-2">
                Account
              </h3>
              <Link
                to="/profile"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                User Profile
              </Link>
              {!currentUser ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <span className="text-[11px] text-[#00a884] font-bold">
                  ✓ Session Active
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[#e9edef] text-xs font-bold tracking-widest uppercase mb-2">
                Legal
              </h3>
              <Link
                to="/privacy-policy"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-[#8696a0] hover:text-[#00a884] transition-colors font-medium"
              >
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[#222d34] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#8696a0] font-medium text-center md:text-left flex items-center gap-1.5">
            © {new Date().getFullYear()} UtilityHub. All operations executed client-side.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
            <Shield size={13} className="text-[#00a884]" />
            <span>100% Private & Offline-Capable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
