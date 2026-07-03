import { useState } from 'react';
import { 
  ShieldCheck, Copy, Check, RefreshCw, Lock, 
  Unlock, Settings2, Zap, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const BcryptGenerator = () => {
  const [plainText, setPlainText] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [hash, setHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [genTime, setGenTime] = useState(0);

  const [comparePlain, setComparePlain] = useState('');
  const [compareHash, setCompareHash] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('generate');

  const generateHash = async () => {
    if (!plainText) return;
    setIsHashing(true);
    
    setTimeout(() => {
      try {
        const t0 = performance.now();
        const salt = bcrypt.genSaltSync(saltRounds);
        const result = bcrypt.hashSync(plainText, salt);
        const t1 = performance.now();
        
        setHash(result);
        setGenTime(Math.round(t1 - t0));
        toast.success('Bcrypt hash generated!');
      } catch (error) {
        toast.error('Error generating hash');
      } finally {
        setIsHashing(false);
      }
    }, 60);
  };

  const handleCompare = () => {
    if (!comparePlain || !compareHash) return;
    setIsComparing(true);

    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(comparePlain, compareHash.trim());
        setCompareResult(match);
        if (match) {
          toast.success('Password matches the hash!');
        } else {
          toast.error('Password does not match.');
        }
      } catch (err) {
        setCompareResult(false);
        toast.error('Invalid hash format. Make sure it starts with $2a$ or $2b$');
      } finally {
        setIsComparing(false);
      }
    }, 60);
  };

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success('Hash copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getPasswordStrength = () => {
    if (!plainText) return { score: 0, label: 'None', color: 'bg-muted' };
    let score = 0;
    if (plainText.length >= 8) score++;
    if (plainText.length >= 12) score++;
    if (/[A-Z]/.test(plainText)) score++;
    if (/[0-9]/.test(plainText)) score++;
    if (/[^A-Za-z0-9]/.test(plainText)) score++;

    let label = 'Weak';
    let color = 'bg-red-500';
    if (score >= 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
    } else if (score >= 2) {
      label = 'Medium';
      color = 'bg-amber-500';
    }

    return { score, label, color };
  };

  const pwdStrength = getPasswordStrength();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Bcrypt Hash Generator & Verifier</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Securely hash passwords or verify plain text passwords against standard bcrypt hashes.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[440px]">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner mb-6 shrink-0 max-w-xs">
            {[
              { id: 'generate', label: 'Generate Hash', icon: Lock },
              { id: 'compare', label: 'Compare Hash', icon: Unlock }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`flex-1 relative py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === t.id && (
                  <motion.div
                    layoutId="bcrypt-mode-active"
                    className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Core Panel Content */}
          <div className="flex-grow flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {mode === 'generate' ? (
                <motion.div
                  key="gen-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Plain Text Password</label>
                      <input 
                        type="text"
                        value={plainText}
                        onChange={(e) => setPlainText(e.target.value)}
                        placeholder="Type password to hash..."
                        className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all shadow-inner text-foreground"
                      />
                    </div>

                    {plainText && (
                      <div className="space-y-1.5 pt-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-semibold">
                            Strength: <span className="font-bold">{pwdStrength.label}</span>
                          </span>
                          <span className="text-muted-foreground font-bold">{pwdStrength.score}/5 Criteria</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all ${pwdStrength.color}`} style={{ width: `${(pwdStrength.score/5)*100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {hash && (
                    <div className="pt-5 border-t border-border/80 mt-5 animate-in fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Bcrypt Hash</label>
                        {genTime > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Zap size={11} className="text-amber-500" /> Hashing took {genTime}ms
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="w-full bg-background/40 border border-border/80 rounded-xl p-4 pr-12 break-all font-mono text-sm text-foreground shadow-inner leading-relaxed">
                          {hash}
                        </div>
                        <button 
                          onClick={handleCopy}
                          className="absolute top-1/2 -translate-y-1/2 right-3 p-2 bg-background border border-border/80 hover:border-primary hover:text-primary rounded-lg text-muted-foreground transition-all shadow-sm cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="comp-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Plain Text Password</label>
                      <input 
                        type="text"
                        value={comparePlain}
                        onChange={(e) => {
                          setComparePlain(e.target.value);
                          setCompareResult(null);
                        }}
                        placeholder="e.g. mysecretpassword"
                        className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-inner font-mono text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Bcrypt Hash</label>
                      <input 
                        type="text"
                        value={compareHash}
                        onChange={(e) => {
                          setCompareHash(e.target.value);
                          setCompareResult(null);
                        }}
                        placeholder="e.g. $2a$10$..."
                        className="w-full p-4 bg-background/40 border border-border/80 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-inner text-foreground"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {compareResult !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`p-4.5 rounded-xl border flex items-center justify-center gap-2 mt-4 font-bold text-sm ${
                          compareResult 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {compareResult ? (
                          <>
                            <Check size={18} /> Match! The plain text password matches the hash.
                          </>
                        ) : (
                          <>
                            <Unlock size={18} /> Does not match. The password and hash do not match.
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 size={16} /> configurations
              </h3>
            </div>

            {/* Salt rounds slider */}
            {mode === 'generate' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-sm font-semibold text-foreground">Salt Rounds</label>
                  <span className="font-bold font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">{saltRounds}</span>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max="14" 
                  step="1"
                  value={saltRounds}
                  onChange={(e) => setSaltRounds(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none shadow-sm"
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${Math.round(((saltRounds-4)/(14-4))*100)}%, var(--muted) ${Math.round(((saltRounds-4)/(14-4))*100)}%)`
                  }}
                />
                
                {saltRounds > 12 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>Warning: Salt rounds &gt; 12 take significantly longer to generate (up to several seconds on typical machines).</span>
                  </div>
                )}
              </div>
            )}

            {/* Execute Buttons */}
            <div className="pt-2">
              {mode === 'generate' ? (
                <button
                  onClick={generateHash}
                  disabled={!plainText || isHashing}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm"
                >
                  {isHashing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
                  Generate Bcrypt Hash
                </button>
              ) : (
                <button
                  onClick={handleCompare}
                  disabled={!comparePlain || !compareHash || isComparing}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm"
                >
                  {isComparing ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  Verify Match
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid var(--primary);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        input[type=range]:hover::-webkit-slider-thumb {
          transform: scale(1.15);
        }
      ` }} />
    </motion.div>
  );
};

export default BcryptGenerator;
