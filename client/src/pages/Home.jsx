import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, FileText, Calculator, 
  CheckCircle2, XCircle, UserPlus, LogIn, LayoutGrid, MonitorSmartphone, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <PageTransition className="flex flex-col min-h-screen bg-background selection:bg-indigo-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 lg:py-40 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="max-w-5xl space-y-8 animate-fadeIn relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-sm mb-4 border border-indigo-500/20">
            <Zap size={16} className="text-indigo-400" />
            <span>50+ Premium Tools, 100% Free</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            The Ultimate <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-emerald-400 drop-shadow-sm">
              Utility Hub
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stop endlessly searching the web for basic tools. Get instant access to powerful image converters, PDF editors, developer utilities, and finance calculators all in one beautiful, privacy-first platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] hover:-translate-y-1 flex items-center gap-2 text-lg w-full sm:w-auto justify-center"
            >
              <LayoutGrid size={20} />
              Open Dashboard
            </Link>
            
            {!currentUser && (
              <Link 
                to="/register" 
                className="px-8 py-4 bg-card hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center gap-2 text-lg border border-border w-full sm:w-auto justify-center hover:-translate-y-1 shadow-sm"
              >
                <UserPlus size={20} />
                Create Free Account
              </Link>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-6 opacity-70">
            No Credit Card Required • No Installation • No Hidden Fees
          </p>
        </div>
      </section>

      {/* 2. WHY USE THIS PLATFORM? */}
      <section className="py-24 px-4 bg-card/30 border-y border-border/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Why Choose Daily Utility Hub?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We built the platform we always wished existed. No ads, no popups, just pure productivity.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-card border border-border/60 p-8 rounded-[2rem] flex flex-col items-start gap-5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Lock size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Absolute Privacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Over 90% of our utilities (including all PDF and Image tools) process your files <b>100% locally</b> in your web browser. Your sensitive data never leaves your device.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-card border border-border/60 p-8 rounded-[2rem] flex flex-col items-start gap-5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.15)] transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Zero server latency. Because tools run locally, formatting JSON, compressing images, and editing text happens instantly. Say goodbye to loading spinners.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-card border border-border/60 p-8 rounded-[2rem] flex flex-col items-start gap-5 hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.15)] transition-all duration-300">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MonitorSmartphone size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Any Device, Anywhere</h3>
              <p className="text-muted-foreground leading-relaxed">
                Fully responsive design works flawlessly on your phone, tablet, or desktop. It looks and feels like a native app on every single screen size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get your tasks done in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-10"></div>
            
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black text-indigo-500 z-10">
                1
              </div>
              <h3 className="text-2xl font-bold">Search</h3>
              <p className="text-muted-foreground">Hit <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+K</kbd> or browse the sidebar to find the exact tool you need.</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black text-indigo-500 z-10">
                2
              </div>
              <h3 className="text-2xl font-bold">Execute</h3>
              <p className="text-muted-foreground">Upload your files or paste your text. The tool processes everything instantly right in your browser.</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black text-indigo-500 z-10">
                3
              </div>
              <h3 className="text-2xl font-bold">Download</h3>
              <p className="text-muted-foreground">Copy the results or download your processed files immediately. No waiting required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING / COMPARISON TABLE */}
      <section className="py-24 px-4 bg-[#0a0a0a] border-t border-border relative overflow-hidden">
        {/* Glow behind table */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Simple. Transparent. Free.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              You can use all 50+ tools without ever creating an account. But if you want a personalized experience across your devices, a free account makes it better.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#111111] overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b border-zinc-800 bg-[#161616]">
              <div className="p-6 md:p-8 flex items-center">
                <span className="text-lg md:text-xl font-semibold text-zinc-300">Features</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center border-l border-zinc-800">
                <span className="text-lg md:text-xl font-bold text-zinc-100">Guest User</span>
                <span className="text-xs md:text-sm text-zinc-500 mt-1">No Sign In</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center border-l border-zinc-800 bg-gradient-to-b from-emerald-500/10 to-transparent relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <span className="text-lg md:text-xl font-bold text-emerald-400">Registered</span>
                <span className="text-xs md:text-sm text-emerald-500/70 mt-1">Free Account</span>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {[
                { name: 'Access to 50+ Tools', guest: true, reg: true },
                { name: '100% Free Forever', guest: true, reg: true },
                { name: 'Local Execution (Privacy)', guest: true, reg: true },
                { name: 'No Ads or Popups', guest: true, reg: true },
                { name: 'Recent History Tracking', guest: 'Local Only', reg: 'Cloud Sync' },
                { name: 'Pin Favorite Tools', guest: 'Local Only', reg: 'Cloud Sync' },
                { name: 'Access Data on Any Device', guest: false, reg: true },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <div className="p-5 md:p-6 flex items-center text-sm md:text-base text-zinc-300 font-medium">
                    {row.name}
                  </div>
                  <div className="p-5 md:p-6 flex justify-center items-center border-l border-zinc-800">
                    {row.guest === true ? (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : row.guest === false ? (
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                        <XCircle size={18} />
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-sm font-medium">{row.guest}</span>
                    )}
                  </div>
                  <div className="p-5 md:p-6 flex justify-center items-center border-l border-zinc-800 bg-emerald-500/[0.02]">
                    {row.reg === true ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-sm font-medium">{row.reg}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            {!currentUser && (
              <div className="grid grid-cols-3 bg-[#161616]">
                <div className="col-span-1 p-6 border-r border-zinc-800"></div>
                <div className="col-span-1 p-6 border-r border-zinc-800 flex justify-center">
                  <Link to="/dashboard" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">Continue as Guest</Link>
                </div>
                <div className="col-span-1 p-6 flex justify-center">
                  <Link to="/register" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
                    Create Account <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 px-4 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Daily Utility Hub</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Daily Utility Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            {!currentUser && <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>}
          </div>
        </div>
      </footer>

    </PageTransition>
  );
};

export default Home;
