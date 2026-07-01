import { Link } from 'react-router-dom';
import { Instagram, Linkedin, MessageSquare, Youtube, Twitter, Mail, MapPin, Clock, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full pt-16 pb-8 px-6 md:px-12 border-t border-border/40 bg-[#09090b]/80 backdrop-blur-3xl relative z-10 mt-auto">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Logo & Socials - takes up more space on large screens */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                D
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground">
                Daily Utility Hub
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs">
              Your ultimate all-in-one platform for everyday utilities. Work faster, smarter, and absolutely free.
            </p>
            
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-indigo-500 hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-blue-500 hover:text-white transition-all duration-300">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-indigo-500 hover:text-white transition-all duration-300">
                <MessageSquare size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-all duration-300">
                <Youtube size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-gray-800 hover:text-white transition-all duration-300">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            
            {/* PLATFORM */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">Platform</h3>
              <Link to="/dashboard" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Dashboard</Link>
              <Link to="/tools/image-compressor" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Image Tools</Link>
              <Link to="/tools/pdf-merge" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">PDF Tools</Link>
              <Link to="/tools/json-formatter" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Developer Tools</Link>
              <Link to="/tools/emi-calculator" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Calculators</Link>
            </div>

            {/* COMPANY */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">Company</h3>
              <Link to="#" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">About Us</Link>
              <Link to="#" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Privacy Policy</Link>
              <Link to="#" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Terms of Service</Link>
              <Link to="#" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Cookie Policy</Link>
              <Link to="#" className="text-muted-foreground hover:text-indigo-400 transition-colors text-sm font-medium">Submit Request</Link>
            </div>

            {/* CONTACT */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">Contact</h3>
              <div className="flex items-start gap-3 text-muted-foreground text-sm font-medium">
                <Clock size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                <div>
                  <p>Support: 24/7 Online</p>
                  <p className="text-xs opacity-70 mt-1">Average response time: 2h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium group">
                <Mail size={16} className="shrink-0 text-indigo-500" />
                <a href="mailto:support@dailyutilityhub.com" className="group-hover:text-indigo-400 transition-colors">support@dailyutilityhub.com</a>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground text-sm font-medium">
                <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                <p className="leading-relaxed">123 Innovation Drive,<br/>Tech City, TC 10010</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} Daily Utility Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-500 tracking-wide uppercase">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
