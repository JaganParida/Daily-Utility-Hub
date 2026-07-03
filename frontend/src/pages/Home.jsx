import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Download,
  PlayCircle,
  Code,
  FileJson,
  Cpu,
  Check,
  ArrowUpRight,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

// FAQ Component (Modern Minimalist)
const FaqItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-8 text-left focus:outline-none group"
      >
        <span className="font-semibold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors">
          {question}
        </span>
        <div
          className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${isOpen ? "bg-foreground text-background" : "group-hover:border-primary"}`}
        >
          <span className="text-xl font-light">{isOpen ? "−" : "+"}</span>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-muted-foreground text-lg leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Interactive Features (Tabs)
const InteractiveFeatures = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: "Absolute Privacy",
      description:
        "Everything happens in your browser. We never see your data, files, or sensitive strings.",
      icon: <Lock size={24} />,
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
          <ShieldCheck size={80} className="text-emerald-400 mb-6" />
          <p className="text-emerald-400 font-mono text-sm">
            Local Execution Environment Active
          </p>
        </div>
      ),
    },
    {
      title: "Zero Latency",
      description:
        "No waiting for server responses. Formatting, encoding, and calculations are instantaneous.",
      icon: <Zap size={24} />,
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 rounded-3xl p-8 border border-zinc-800 relative overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-0 w-1/3 h-[2px] bg-indigo-500"
          />
          <Zap size={80} className="text-indigo-400 mb-6 relative z-10" />
          <p className="text-indigo-400 font-mono text-sm relative z-10">
            0ms Network Latency
          </p>
        </div>
      ),
    },
    {
      title: "Cross-Device Sync",
      description:
        "Pin your favorite tools on your desktop, and they instantly appear on your mobile device.",
      icon: <Cpu size={24} />,
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
          <Cpu size={80} className="text-purple-400 mb-6" />
          <p className="text-purple-400 font-mono text-sm">
            Cloud Synchronization: Active
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center min-h-[500px]">
      <div className="w-full lg:w-1/2 flex flex-col gap-2">
        {features.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`text-left p-6 md:p-8 rounded-3xl transition-all duration-300 border-l-4 ${activeTab === idx ? "bg-muted/30 border-primary" : "hover:bg-muted/10 border-transparent opacity-60 hover:opacity-100"}`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className={`p-2 rounded-xl ${activeTab === idx ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                {feature.title}
              </h3>
            </div>
            <p className="text-lg text-muted-foreground ml-14">
              {feature.description}
            </p>
          </button>
        ))}
      </div>
      <div className="w-full lg:w-1/2 h-[400px] md:h-[500px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {features[activeTab].visual}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Sticky Scroll Steps
const StickyScrollSteps = () => {
  const steps = [
    {
      title: "Locate instantly",
      description:
        "Hit CMD+K anywhere on the platform to open the global command palette. Search by name, category, or functionality. Your tool is always just keystrokes away.",
      icon: <Search size={32} />,
    },
    {
      title: "Execute locally",
      description:
        "Paste your payload or drop your files. Because everything runs securely in your browser's local sandbox, there are no file size limits or upload delays.",
      icon: <PlayCircle size={32} />,
    },
    {
      title: "Export effortlessly",
      description:
        "Copy your formatted code with one click, or instantly download your processed images. Zero friction between you and your finished work.",
      icon: <Download size={32} />,
    },
  ];

  return (
    <div className="relative">
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-border -translate-x-1/2" />

      <div className="flex flex-col gap-24 lg:gap-40">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${idx % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
          >
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <div
                className={`w-full max-w-md ${idx % 2 !== 0 ? "lg:text-left lg:mr-auto" : "lg:text-right lg:ml-auto"}`}
              >
                <span className="text-primary font-mono text-sm tracking-widest uppercase mb-4 block">
                  0{idx + 1} // Step
                </span>
                <h3 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 bg-background border-4 border-card rounded-full items-center justify-center text-foreground z-10 shadow-lg">
              {step.icon}
            </div>

            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div
                className={`w-full max-w-md aspect-square bg-muted/20 rounded-3xl border border-border flex items-center justify-center p-8 ${idx % 2 !== 0 ? "lg:ml-auto" : "lg:mr-auto"}`}
              >
                <div className="w-full h-full border border-dashed border-muted-foreground/30 rounded-2xl flex flex-col items-center justify-center gap-6 text-muted-foreground">
                  {step.icon}
                  <span className="font-mono text-sm">
                    Visual Interface for Step 0{idx + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { currentUser } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <PageTransition className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* 1. HERO SECTION (Minimalist Typography) */}
      <section className="pt-24 pb-12 sm:pt-48 sm:pb-32 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col items-start relative z-10 w-full">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.h1
              variants={fadeUp}
              className="text-5xl min-[400px]:text-6xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter leading-[0.9] mb-6 sm:mb-8"
            >
              Work <span className="text-muted-foreground">faster</span>
              <br />
              Think <span className="text-primary">bigger</span>
            </motion.h1>

            <motion.div
              variants={fadeUp}
              className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-6 md:gap-10"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed font-medium">
                The modern utility hub for developers, designers, and
                professionals. 50+ tools executing instantly in your browser.
              </p>

              <div className="flex flex-row items-center gap-4 w-auto shrink-0 mt-1 md:mt-0">
                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 sm:px-8 sm:py-5 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-full transition-all flex items-center gap-3 text-sm sm:text-lg w-fit justify-center hover:scale-105 active:scale-95 shadow-xl"
                >
                  Enter Platform <ArrowUpRight size={18} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. HIGHLIGHTS BANNER (No Cards, pure typography) */}
      <section className="py-5 sm:py-8 border-b border-border bg-muted/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-3.5 sm:gap-8 text-foreground font-bold text-xs min-[400px]:text-sm md:text-lg uppercase tracking-widest w-full">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />{" "}
              100% Free Access
            </div>
            <div className="flex items-center gap-3">
              <Lock className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />{" "}
              Strict Privacy
            </div>
            <div className="flex items-center gap-3">
              <Cpu className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />{" "}
              Zero Latency
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE FEATURES (Hover Tabs replacing grid) */}
      <section className="py-32 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Designed for <br />
              professionals.
            </h2>
            <p className="text-2xl text-muted-foreground max-w-2xl font-medium">
              We discarded the bloat and focused purely on performance, privacy,
              and speed.
            </p>
          </motion.div>

          <InteractiveFeatures />
        </div>
      </section>

      {/* 4. HOW IT WORKS (Sticky Scroll style replacing grid) */}
      <section className="py-32 px-4 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-32 text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              A frictionless <br />
              workflow.
            </h2>
          </motion.div>

          <StickyScrollSteps />
        </div>
      </section>

      {/* 5. TOOL CATEGORIES (Modern layout) */}
      <section className="py-32 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <motion.h2
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-8"
              >
                Everything you
                <br />
                might need.
              </motion.h2>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors group"
              >
                Explore all 50+ tools
                <span className="bg-primary/10 p-2 rounded-full group-hover:translate-x-2 transition-transform">
                  <ArrowRight size={20} />
                </span>
              </Link>
            </div>

            <div className="flex flex-col gap-12">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group border-b border-border pb-12 cursor-default"
              >
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-4">
                  <Code className="text-blue-500" /> Developer Utilities
                </h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  JSON formatting, JWT decoding, Base64 encoding, Hash
                  generation, and UUID generation.
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group border-b border-border pb-12 cursor-default"
              >
                <h3 className="text-3xl font-bold mb-4 flex items-center gap-4">
                  <FileJson className="text-emerald-500" /> Data Converters
                </h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  CSV to JSON, XML validation, Markdown previewing, and SQL
                  formatters.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PREMIUM COMPARISON TABLE */}
      <section className="py-32 px-4 bg-[#0a0a0a] text-zinc-100 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-20 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white">
              Transparent Access.
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">
              No paywalls. Use the platform anonymously, or register to unlock
              cross-device synchronization.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 relative z-20">
              <div className="p-2 md:p-6"></div>
              <div className="p-2 sm:p-4 md:p-6 text-center rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-md flex flex-col justify-center items-center">
                <h3 className="text-sm sm:text-lg md:text-xl font-bold text-zinc-300 leading-tight mb-1">
                  Guest
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-zinc-500 leading-tight hidden sm:block">
                  No registration
                </p>
              </div>
              <div className="p-2 sm:p-4 md:p-6 text-center rounded-2xl border-2 border-primary/40 bg-primary/5 backdrop-blur-md relative overflow-hidden shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)] scale-105 z-10 flex flex-col justify-center items-center">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
                <h3 className="text-sm sm:text-lg md:text-xl font-bold text-primary leading-tight mb-1">
                  Registered
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-primary/70 leading-tight hidden sm:block">
                  100% Free
                </p>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col gap-2 relative">
              {/* Highlight Background column for Registered */}
              <div className="absolute top-0 bottom-0 right-0 w-[calc(33.333%-0.5rem)] md:w-[calc(33.333%-1rem)] bg-gradient-to-b from-primary/5 to-transparent border-x border-primary/10 rounded-2xl pointer-events-none -z-10 translate-x-[0.25rem] md:translate-x-[0.5rem] scale-105" />

              {[
                { name: "Access to 50+ Tools", guest: true, reg: true },
                { name: "Local Client-Side Execution", guest: true, reg: true },
                { name: "Zero Tracking & No Ads", guest: true, reg: true },
                { name: "Recent History Log", guest: false, reg: true },
                { name: "Pin Favorite Tools", guest: false, reg: true },
                { name: "Cloud Sync Across Devices", guest: false, reg: true },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="group grid grid-cols-3 gap-2 md:gap-4 items-center p-2 rounded-2xl transition-all duration-300 hover:bg-zinc-800/40 relative z-20"
                >
                  <div className="p-2 md:p-4 font-medium text-zinc-300 text-[11px] min-[400px]:text-sm md:text-lg pl-1 md:pl-6 col-span-1 leading-tight">
                    {row.name}
                  </div>

                  <div className="p-2 md:p-4 flex justify-center items-center col-span-1">
                    {row.guest ? (
                      <div className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 md:w-8 md:h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-600 border border-zinc-800/80">
                        <span className="text-[10px] md:text-sm">✕</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 md:p-4 flex justify-center items-center col-span-1">
                    {row.reg ? (
                      <div className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 md:w-8 md:h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-600 border border-zinc-800/80">
                        <span className="text-[10px] md:text-sm">✕</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!currentUser && (
              <div className="flex justify-center mt-20">
                <Link
                  to="/register"
                  className="px-8 md:px-10 py-4 md:py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-full transition-all text-lg md:text-xl hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] flex items-center gap-3"
                >
                  Create Free Account <ArrowRight size={20} />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 7. INTERACTIVE FAQ */}
      <section className="py-32 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
              Questions?
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <FaqItem
              question="Is this platform really 100% free?"
              answer="Yes. We do not charge for access to any of our tools, and there are no premium tiers hidden behind a paywall. The entire library is free to use."
              isOpen={openFaq === 0}
              onClick={() => setOpenFaq(openFaq === 0 ? -1 : 0)}
            />
            <FaqItem
              question="Are my files and data secure?"
              answer="Absolutely. Over 90% of our tools execute directly in your browser using client-side JavaScript. This means your files, images, and text never touch our servers."
              isOpen={openFaq === 1}
              onClick={() => setOpenFaq(openFaq === 1 ? -1 : 1)}
            />
            <FaqItem
              question="Why should I create an account if it's free?"
              answer="Creating a free account enables cross-device synchronization. If you pin a tool or view your recent history on your laptop, it will instantly sync to your mobile phone."
              isOpen={openFaq === 2}
              onClick={() => setOpenFaq(openFaq === 2 ? -1 : 2)}
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default Home;
