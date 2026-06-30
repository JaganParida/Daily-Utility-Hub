import { useState } from 'react';
import { ShieldCheck, Copy, Check, RefreshCw, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const BcryptGenerator = () => {
  const [plainText, setPlainText] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [hash, setHash] = useState('');
  
  const [comparePlain, setComparePlain] = useState('');
  const [compareHash, setCompareHash] = useState('');
  const [compareResult, setCompareResult] = useState(null); // null, true, false
  
  const [copied, setCopied] = useState(false);
  const [isHashing, setIsHashing] = useState(false);

  const generateHash = async () => {
    if (!plainText) return;
    setIsHashing(true);
    
    // Use setTimeout to allow React to render loading state before heavy sync operation
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(saltRounds);
        const result = bcrypt.hashSync(plainText, salt);
        setHash(result);
      } catch (error) {
        toast.error('Error generating hash');
      } finally {
        setIsHashing(false);
      }
    }, 50);
  };

  const handleCompare = () => {
    if (!comparePlain || !compareHash) return;
    try {
      const match = bcrypt.compareSync(comparePlain, compareHash);
      setCompareResult(match);
    } catch (err) {
      setCompareResult(false);
      toast.error('Invalid hash format');
    }
  };

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shadow-sm">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bcrypt Generator & Checker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Hash passwords or check if a plaintext string matches an existing bcrypt hash.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        
        {/* Generator Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Lock size={18} className="text-rose-500" /> Generate Hash
          </h2>
          
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Plain Text Password</label>
            <input 
              type="text"
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="Enter string to hash..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Salt Rounds</label>
              <span className="text-xs font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md">{saltRounds}</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="16" 
              step="1"
              value={saltRounds}
              onChange={(e) => setSaltRounds(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <p className="text-[10px] text-muted-foreground">Note: Higher rounds take exponentially longer to compute.</p>
          </div>

          <button 
            onClick={generateHash}
            disabled={!plainText || isHashing}
            className="w-full py-3 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-500/20 disabled:opacity-50"
          >
            {isHashing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
            Generate Hash
          </button>

          {hash && (
            <div className="pt-4 border-t border-border mt-4">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Result</label>
              <div className="relative">
                <div className="w-full bg-muted/30 border border-border rounded-lg p-3 pr-12 break-all font-mono text-sm text-foreground">
                  {hash}
                </div>
                <button 
                  onClick={handleCopy}
                  className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-background border border-border rounded-md text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 transition-colors shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checker Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Unlock size={18} className="text-emerald-500" /> Compare Hash
          </h2>
          
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Plain Text String</label>
            <input 
              type="text"
              value={comparePlain}
              onChange={(e) => {
                setComparePlain(e.target.value);
                setCompareResult(null);
              }}
              placeholder="e.g. mysecretpassword"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bcrypt Hash</label>
            <input 
              type="text"
              value={compareHash}
              onChange={(e) => {
                setCompareHash(e.target.value);
                setCompareResult(null);
              }}
              placeholder="e.g. $2a$10$..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <button 
            onClick={handleCompare}
            disabled={!comparePlain || !compareHash}
            className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
          >
            <ShieldCheck size={18} /> Check Match
          </button>

          {compareResult !== null && (
            <div className={`mt-4 p-4 rounded-xl border flex items-center justify-center gap-3 ${
              compareResult 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            }`}>
              {compareResult ? (
                <>
                  <Check size={24} />
                  <span className="font-bold text-lg">Match! The strings match.</span>
                </>
              ) : (
                <>
                  <Unlock size={24} />
                  <span className="font-bold text-lg">Does not match.</span>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BcryptGenerator;
