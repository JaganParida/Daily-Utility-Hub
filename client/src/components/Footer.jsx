import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full pt-12 pb-8 px-6 md:px-12 border-t border-border/40 bg-[#09090b]/80 backdrop-blur-3xl relative z-10 mt-auto">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Layers size={22} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground">
                Daily Utility Hub
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your ultimate all-in-one platform for everyday utilities. Work faster, smarter, and absolutely free. No sign-ups required.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex gap-12">
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">Tools</h3>
              <Link to="/dashboard" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">All Tools</Link>
              <Link to="/tools/image-compressor" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Image Utilities</Link>
              <Link to="/tools/json-formatter" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Dev Utilities</Link>
            </div>
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">Legal</h3>
              <span className="text-muted-foreground text-sm font-medium">Privacy Policy</span>
              <span className="text-muted-foreground text-sm font-medium">Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-medium text-center sm:text-left">
            © {new Date().getFullYear()} Daily Utility Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-500 tracking-wide uppercase">Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
