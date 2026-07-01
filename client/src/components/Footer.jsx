import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full py-12 px-4 border-t border-border/50 bg-card/30 backdrop-blur-xl relative z-10 mt-auto">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Daily Utility Hub
          </span>
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">
            v1.0
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm font-medium">
          © {new Date().getFullYear()} Daily Utility Hub. All rights reserved.
        </p>
        
        <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/dashboard" className="hover:text-primary transition-colors">Tools Dashboard</Link>
          <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
