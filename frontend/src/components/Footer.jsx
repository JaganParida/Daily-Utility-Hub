import { Link } from "react-router-dom";
import {
  Globe,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Sparkles,
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer className="w-full relative z-10 mt-auto bg-white border-t border-[#dadce0] overflow-hidden shrink-0">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-12 relative z-10">
        
        {/* Top CTA Section */}
        <div className="py-10 md:py-14 border-b border-[#dadce0] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-[#202124] tracking-tight mb-2 flex items-center justify-center md:justify-start gap-2">
              Ready to process files locally?{" "}
              <Sparkles className="text-[#1a73e8]" size={24} />
            </h2>
            <p className="text-[#5f6368] text-sm md:text-base leading-relaxed">
              Join thousands of developers and creators using UtilityHub to process data
              safely, entirely inside the browser. No cloud uploads. Zero telemetry.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            {!currentUser && (
              <Link
                to="/register"
                className="w-full sm:w-auto whitespace-nowrap h-11 px-6 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm flex items-center justify-center transition-all shadow-xs active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            )}
            <Link
              to="/search"
              className="w-full sm:w-auto whitespace-nowrap h-11 px-6 rounded-full bg-white hover:bg-[#f8f9fa] text-[#202124] font-bold text-sm border border-[#dadce0] hover:border-[#bdc1c6] flex items-center justify-center transition-colors shadow-2xs"
            >
              Explore 90+ Tools <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8] shadow-2xs transition-transform group-hover:scale-105">
                <Zap size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-[#202124]">
                Utility<span className="text-[#1a73e8]">Hub</span>
              </span>
            </Link>
            <p className="text-[#5f6368] text-xs leading-relaxed mb-6 max-w-[280px]">
              A beautifully crafted, offline-first developer suite. Built with
              maximum performance, privacy, and client-side security in mind.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.jaganparida.com/projects/daily-utility-hub"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-all shadow-2xs"
                title="Website"
              >
                <Globe size={15} />
              </a>
              <a
                href="https://github.com/JaganParida"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-all shadow-2xs"
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
                className="w-9 h-9 rounded-full bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-all shadow-2xs"
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
                className="w-9 h-9 rounded-full bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-all shadow-2xs"
                title="Contact"
              >
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Links Cols */}
          <div className="col-span-1 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[#202124] text-xs font-bold uppercase tracking-wider mb-1">
                Product
              </h3>
              <Link
                to="/"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                All Tools
              </Link>
              <Link
                to="/pinned"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Pinned Utilities
              </Link>
              <Link
                to="/recent"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Recent History
              </Link>
              <Link
                to="/tools/developer-profile"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Developer Profile
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="text-[#202124] text-xs font-bold uppercase tracking-wider mb-1">
                Solutions
              </h3>
              <Link
                to="/tools/uuid-generator"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                For Developers
              </Link>
              <Link
                to="/tools/readme-generator"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                For Students
              </Link>
              <Link
                to="/privacy-policy"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Offline Engine
              </Link>
              <Link
                to="/tools/file-vault"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Security Vault
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="text-[#202124] text-xs font-bold uppercase tracking-wider mb-1">
                Account
              </h3>
              <Link
                to="/profile"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                User Profile
              </Link>
              {!currentUser ? (
                <>
                  <Link
                    to="/login"
                    className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-[#137333] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
                  Active Session
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="text-[#202124] text-xs font-bold uppercase tracking-wider mb-1">
                Legal
              </h3>
              <Link
                to="/privacy-policy"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-xs text-[#5f6368] hover:text-[#1a73e8] transition-colors"
              >
                Cookie Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[#dadce0] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5f6368] text-center md:text-left">
            © {new Date().getFullYear()} Daily Utility Hub. All operations executed client-side in your browser.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
            <Shield size={14} className="text-[#34a853]" />
            <span className="font-medium text-[#137333]">100% Private & Offline-Capable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
