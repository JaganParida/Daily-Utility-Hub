import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, FileText, Calculator, 
  CheckCircle2, XCircle, UserPlus, LogIn, LayoutGrid, MonitorSmartphone, Lock, Search, Download, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const Home = () => {
  const { currentUser } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  return (
    <PageTransition className="flex flex-col min-h-screen bg-background selection:bg-indigo-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center pt-10 pb-16 min-h-[calc(100vh-4rem)] sm:min-h-0 sm:pt-20 sm:pb-28 lg:pt-36 lg:pb-44 px-4 overflow-hidden">
        {/* Sleek Minimalist Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl flex flex-col items-center relative z-10 w-full"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-[11px] sm:text-sm mb-6 border border-indigo-500/20">
            <Zap size={14} className="text-indigo-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>50+ Premium Tools, 100% Free</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-tight sm:leading-[1.1] mb-5 sm:mb-6">
            <span className="block">The Ultimate</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-emerald-400 drop-shadow-sm block mt-1">
              Utility Hub
            </span>
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-1 mb-8 sm:mb-10">
            Stop endlessly searching the web for basic tools. Get instant access to powerful image converters, PDF editors, developer utilities, and finance calculators all in one beautiful, privacy-first platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full max-w-[280px] sm:max-w-none mx-auto mb-8">
            <Link 
              to="/dashboard" 
              className="px-5 py-3.5 sm:px-8 sm:py-4 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] hover:-translate-y-1 flex items-center gap-2 text-[15px] sm:text-lg w-full sm:w-auto justify-center"
            >
              <LayoutGrid size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
              Explore All Tools
            </Link>
            
            {!currentUser && (
              <Link 
                to="/register" 
                className="px-5 py-3.5 sm:px-8 sm:py-4 bg-card/50 backdrop-blur-md hover:bg-card text-foreground font-bold rounded-xl transition-all flex items-center gap-2 text-[15px] sm:text-lg border border-border w-full sm:w-auto justify-center hover:-translate-y-1 shadow-sm"
              >
                <UserPlus size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                Create Free Account
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-60 px-2">
            <span>No Credit Card</span>
            <span className="hidden sm:inline">•</span>
            <span>No Installation</span>
            <span className="hidden sm:inline">•</span>
            <span>No Hidden Fees</span>
          </div>
        </motion.div>

        {/* Floating Tool Badges to make it look professional */}
        <div className="absolute w-full max-w-6xl mx-auto inset-x-0 bottom-0 h-40 pointer-events-none hidden md:block">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute bottom-10 left-[10%] px-4 py-2 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 text-sm font-medium text-foreground backdrop-blur-xl">
            <FileText size={16} className="text-indigo-400"/> JSON Formatter
          </motion.div>
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute bottom-24 left-[25%] px-4 py-2 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 text-sm font-medium text-foreground backdrop-blur-xl">
             Image Compressor
          </motion.div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-8 right-[15%] px-4 py-2 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 text-sm font-medium text-foreground backdrop-blur-xl">
            <Calculator size={16} className="text-emerald-400"/> EMI Calculator
          </motion.div>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-20 right-[30%] px-4 py-2 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 text-sm font-medium text-foreground backdrop-blur-xl">
            JWT Decoder
          </motion.div>
        </div>
      </section>

      {/* 2. WHY USE THIS PLATFORM? (BENTO GRID DESIGN) */}
      <section className="py-24 px-4 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Why Choose Daily Utility Hub?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We built the platform we always wished existed. No ads, no popups, just pure productivity.</p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Feature 1 - Large Feature (Privacy) */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-12 lg:col-span-8 bg-gradient-to-br from-emerald-900/40 to-card border border-emerald-500/20 p-8 md:p-12 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-all group-hover:bg-emerald-500/20"></div>
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-emerald-500/30 group-hover:rotate-12 transition-transform">
                <Lock size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Absolute Privacy</h3>
                <p className="text-emerald-100/70 text-lg leading-relaxed max-w-xl">
                  Over 90% of our utilities process your files <b>100% locally</b> in your web browser. Your sensitive PDFs, images, and code never leave your device. We literally can't see your data.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Small Feature (Speed) */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-12 lg:col-span-4 bg-gradient-to-br from-indigo-900/40 to-card border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] transition-all group-hover:bg-indigo-500/20"></div>
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-indigo-500/30 group-hover:-rotate-12 transition-transform">
                <Zap size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Lightning Fast</h3>
                <p className="text-indigo-100/70 leading-relaxed">
                  Zero server latency. Operations like formatting JSON or editing text happen instantly.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Wide Feature (Responsive) */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-12 bg-gradient-to-r from-blue-900/30 via-card to-card border border-blue-500/20 p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] transition-all group-hover:bg-blue-500/20"></div>
              <div className="w-20 h-20 shrink-0 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-blue-500/30 group-hover:scale-110 transition-transform">
                <MonitorSmartphone size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Any Device, Anywhere</h3>
                <p className="text-blue-100/70 text-lg leading-relaxed">
                  Fully responsive design works flawlessly on your phone, tablet, or desktop. It looks and feels like a native app on every single screen size, allowing you to get work done on the go.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (INTERACTIVE TIMELINE) */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get your tasks done in three simple steps.</p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-border -z-10">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                viewport={{ once: true }}
              />
            </div>
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center relative group w-full lg:w-1/3"
            >
              <div className="w-20 h-20 rounded-full bg-card border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)] mb-8 group-hover:border-indigo-500 transition-colors z-10 bg-background relative overflow-hidden">
                 <motion.div className="absolute inset-0 bg-indigo-500/20" initial={{ y: "100%" }} whileHover={{ y: "0%" }} transition={{ duration: 0.3 }} />
                 <Search size={32} className="text-indigo-400 relative z-10" />
              </div>
              <div className="text-center w-full">
                <span className="text-indigo-500 font-bold tracking-widest text-sm uppercase mb-2 block">Step 1</span>
                <h3 className="text-2xl font-bold text-white mb-3">Search</h3>
                <p className="text-muted-foreground">Hit <kbd className="px-2 py-1 bg-muted rounded text-sm text-foreground">Ctrl+K</kbd> to instantly find the exact utility you need from our library of 50+ tools.</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center relative group w-full lg:w-1/3 mt-12 lg:mt-0"
            >
              <div className="w-20 h-20 rounded-full bg-card border-4 border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] mb-8 group-hover:border-purple-500 transition-colors z-10 bg-background relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-purple-500/20" initial={{ y: "100%" }} whileHover={{ y: "0%" }} transition={{ duration: 0.3 }} />
                <PlayCircle size={32} className="text-purple-400 relative z-10" />
              </div>
              <div className="text-center w-full">
                <span className="text-purple-500 font-bold tracking-widest text-sm uppercase mb-2 block">Step 2</span>
                <h3 className="text-2xl font-bold text-white mb-3">Execute</h3>
                <p className="text-muted-foreground">Upload your files or paste your text. The tool processes everything instantly right in your browser securely.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, type: "spring" }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center relative group w-full lg:w-1/3 mt-12 lg:mt-0"
            >
              <div className="w-20 h-20 rounded-full bg-card border-4 border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] mb-8 group-hover:border-emerald-500 transition-colors z-10 bg-background relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-emerald-500/20" initial={{ y: "100%" }} whileHover={{ y: "0%" }} transition={{ duration: 0.3 }} />
                <Download size={32} className="text-emerald-400 relative z-10" />
              </div>
              <div className="text-center w-full">
                <span className="text-emerald-500 font-bold tracking-widest text-sm uppercase mb-2 block">Step 3</span>
                <h3 className="text-2xl font-bold text-white mb-3">Download</h3>
                <p className="text-muted-foreground">Copy the results or download your processed files immediately. No waiting required, no hidden paywalls.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. PRICING / COMPARISON TABLE */}
      <section className="py-24 px-4 bg-[#0a0a0a] border-t border-border relative overflow-hidden">
        {/* Glow behind table */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Simple. Transparent. Free.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              You can use all 50+ tools without ever creating an account. But if you want a personalized experience across your devices, a free account makes it better.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-zinc-800 bg-[#111111] overflow-hidden shadow-2xl"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b border-zinc-800 bg-[#161616]">
              <div className="p-3 sm:p-4 md:p-8 flex items-center">
                <span className="text-sm sm:text-base md:text-xl font-semibold text-zinc-300">Features</span>
              </div>
              <div className="p-3 sm:p-4 md:p-8 flex flex-col items-center justify-center text-center border-l border-zinc-800">
                <span className="text-sm sm:text-base md:text-xl font-bold text-zinc-100">Guest User</span>
                <span className="text-[10px] sm:text-xs md:text-sm text-zinc-500 mt-1">No Sign In</span>
              </div>
              <div className="p-3 sm:p-4 md:p-8 flex flex-col items-center justify-center text-center border-l border-zinc-800 bg-gradient-to-b from-emerald-500/10 to-transparent relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <span className="text-sm sm:text-base md:text-xl font-bold text-emerald-400">Registered</span>
                <span className="text-[10px] sm:text-xs md:text-sm text-emerald-500/70 mt-1">Free Account</span>
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
                  <div className="p-3 sm:p-4 md:p-6 flex items-center text-xs sm:text-sm md:text-base text-zinc-300 font-medium">
                    {row.name}
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 flex justify-center items-center border-l border-zinc-800">
                    {row.guest === true ? (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                    ) : row.guest === false ? (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                        <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[10px] sm:text-xs md:text-sm font-medium">{row.guest}</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 flex justify-center items-center border-l border-zinc-800 bg-emerald-500/[0.02]">
                    {row.reg === true ? (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-[10px] sm:text-xs md:text-sm font-medium">{row.reg}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            {!currentUser && (
              <div className="grid grid-cols-3 bg-[#161616]">
                <div className="col-span-1 p-3 sm:p-4 md:p-6 border-r border-zinc-800"></div>
                <div className="col-span-1 p-3 sm:p-4 md:p-6 border-r border-zinc-800 flex justify-center text-center">
                  <Link to="/dashboard" className="text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors">Continue as Guest</Link>
                </div>
                <div className="col-span-1 p-3 sm:p-4 md:p-6 flex justify-center text-center">
                  <Link to="/register" className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 justify-center">
                    Create Account <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px]" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <Footer />
    </PageTransition>
  );
};

export default Home;
