import { Link } from 'react-router-dom';
import { Globe, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full pt-20 pb-12 px-6 md:px-12 border-t border-[#1e1e28] bg-[#0b0b0f] relative z-10 mt-auto overflow-hidden">
      {/* Subtle modern purple glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#7C5CFC]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-start text-left">
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg shadow-[#7C5CFC]/20 transition-transform group-hover:scale-105">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
              </div>
              <span className="font-black text-xl tracking-tight text-white">
                UtilityHub
              </span>
            </Link>
            <p className="text-[#8a8a9a] text-sm leading-relaxed mb-6 max-w-sm">
              A meticulously crafted suite of tools for modern developers and professionals. Process your data safely and entirely local on your browser.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg border border-[#222230] flex items-center justify-center text-[#6a6a7a] hover:bg-[#7C5CFC]/10 hover:text-white transition-colors" title="Website"><Globe size={14} /></a>
              <a href="#" className="w-8 h-8 rounded-lg border border-[#222230] flex items-center justify-center text-[#6a6a7a] hover:bg-[#7C5CFC]/10 hover:text-white transition-colors" title="GitHub">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-[#222230] flex items-center justify-center text-[#6a6a7a] hover:bg-[#7C5CFC]/10 hover:text-white transition-colors" title="Twitter">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-[#222230] flex items-center justify-center text-[#6a6a7a] hover:bg-[#7C5CFC]/10 hover:text-white transition-colors" title="Contact"><Mail size={14} /></a>
            </div>
          </div>
 
          {/* Links Cols */}
          <div className="col-span-1 md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-2">Platform</h3>
              <Link to="/dashboard" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">All Tools</Link>
              <Link to="/login" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Account Access</Link>
              <Link to="/register" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Sign Up</Link>
            </div>
            
            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-2">Resources</h3>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Documentation</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Status Check</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Help Desk</a>
            </div>
 
            <div className="flex flex-col gap-3">
              <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-2">Legal</h3>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Terms of Service</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-[#7C5CFC] transition-colors font-medium">Security Info</a>
            </div>
          </div>
        </div>
 
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1e1e28]/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#5a5a6a] font-medium text-center md:text-left">
            © {new Date().getFullYear()} Daily Utility Hub. All tools run 100% locally.
          </p>
          <div className="flex items-center gap-3 bg-[#121216] px-4 py-2 rounded-full border border-[#222230]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-bold text-white tracking-widest uppercase">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
