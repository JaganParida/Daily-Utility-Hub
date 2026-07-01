import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Globe, FileText, Calculator, ImageIcon, Layers } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Home = () => {
  return (
    <PageTransition className="flex flex-col min-h-[90vh]">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 lg:py-32 px-4 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background"></div>
        <div className="max-w-4xl space-y-8 animate-fadeIn">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Utility Hub</span> for Everyone
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop searching for individual tools. Get access to 50+ completely free, privacy-first developer, student, and finance utilities in one seamless platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 flex items-center gap-2 text-lg w-full sm:w-auto justify-center"
            >
              Browse Tools <ArrowRight size={20} />
            </Link>
            <Link 
              to="/register" 
              className="px-8 py-4 bg-muted/50 hover:bg-muted text-foreground font-bold rounded-2xl transition-all flex items-center gap-2 text-lg border border-border w-full sm:w-auto justify-center"
            >
              Create Free Account
            </Link>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-4">
            No Installation • No Credit Card • 100% Free
          </p>
        </div>
      </section>

      {/* Pillars / Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Privacy First & Secure</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              90% of our tools (like PDF Editor, Zip Archiver, and Compressions) run 100% locally in your browser. Your sensitive files never leave your device.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Blazing Fast</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Built with modern web technologies, the utility hub is optimized for instantaneous loading. Say goodbye to slow websites filled with ads.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Cross-Device Sync</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Use anonymously for free, or create an optional account to sync your Pinned Bookmarks and custom dashboard layouts across all your devices.
            </p>
          </div>

        </div>
      </section>

      {/* Highlighted Tools Showcase */}
      <section className="py-20 px-4 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Tools built for productivity.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Explore some of our most popular premium tools that are completely free to use.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Link to="/dashboard" className="group bg-card border border-border p-6 rounded-2xl hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Advanced PDF Editor</h3>
              <p className="text-xs text-muted-foreground">Draw, sign, highlight, and redact directly on PDFs in your browser.</p>
            </Link>

            <Link to="/dashboard" className="group bg-card border border-border p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calculator size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Financial Calculators</h3>
              <p className="text-xs text-muted-foreground">EMI schedules, SIP returns, Income Tax regimes, and GST breakdowns.</p>
            </Link>

            <Link to="/dashboard" className="group bg-card border border-border p-6 rounded-2xl hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Image Utilities</h3>
              <p className="text-xs text-muted-foreground">Compress, crop, resize, and convert images entirely client-side.</p>
            </Link>

            <Link to="/dashboard" className="group bg-card border border-border p-6 rounded-2xl hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Developer Tools</h3>
              <p className="text-xs text-muted-foreground">UUIDs, JWT decoding, Base64, JSON formatting, and Regex testing.</p>
            </Link>

          </div>
          
          <div className="text-center pt-8">
            <Link to="/dashboard" className="inline-flex items-center gap-2 font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
              View all 50+ tools <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="mt-auto py-8 text-center text-sm font-semibold text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} Daily Utility Hub. Fast. Private. Free.</p>
      </footer>
    </PageTransition>
  );
};

export default Home;
