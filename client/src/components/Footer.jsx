import { Link } from 'react-router-dom';
import { Layers, Globe, MessageSquare, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full pt-20 pb-12 px-6 md:px-12 border-t border-border bg-background relative z-10 mt-auto overflow-hidden">
      {/* Subtle modern glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-start text-left">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background shadow-md transition-transform group-hover:scale-105">
                <Layers size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-2xl tracking-tighter text-foreground">
                UtilityHub
              </span>
            </Link>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-sm font-medium">
              A meticulously crafted suite of tools for modern professionals. Execute locally, work faster.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"><Globe size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"><MessageSquare size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"><Mail size={18} /></a>
            </div>
          </div>

          {/* Links Cols */}
          <div className="col-span-1 md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-bold tracking-tight mb-2">Platform</h3>
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">All Utilities</Link>
              <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors font-medium">Create Account</Link>
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors font-medium">Sign In</Link>
            </div>
            
            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-bold tracking-tight mb-2">Top Categories</h3>
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">Developer Tools</Link>
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">Image Compressors</Link>
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">Data Converters</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-bold tracking-tight mb-2">Legal</h3>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Terms of Service</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground font-medium text-center md:text-left">
            © {new Date().getFullYear()} Daily Utility Hub. Local by design.
          </p>
          <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-full border border-border/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-foreground tracking-widest uppercase">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
