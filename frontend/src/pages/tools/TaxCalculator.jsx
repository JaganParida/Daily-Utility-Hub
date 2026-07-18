import { useState, useMemo } from 'react';
import { Landmark, IndianRupee, ShieldCheck, Scale, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TaxCalculator = () => {
  const [grossIncome, setGrossIncome] = useState(1500000);
  const [otherIncome, setOtherIncome] = useState(0);
  
  // Deductions (Applicable mostly to Old Regime)
  const [sec80C, setSec80C] = useState(150000); // Max 1.5L
  const [sec80D, setSec80D] = useState(25000); // Med insurance
  const [hra, setHra] = useState(0); // House Rent Allowance exemption
  const [otherDeductions, setOtherDeductions] = useState(0);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const calculateTax = () => {
    const totalGross = (parseFloat(grossIncome) || 0) + (parseFloat(otherIncome) || 0);

    // Standard Deductions (FY 2024-25 Rules)
    const stdDedOld = 50000;
    const stdDedNew = 75000;

    // Deductions Input
    const ded80C = Math.min(parseFloat(sec80C) || 0, 150000); // Capped at 1.5L
    const ded80D = parseFloat(sec80D) || 0;
    const dedHRA = parseFloat(hra) || 0;
    const dedOther = parseFloat(otherDeductions) || 0;

    // Net Taxable Income
    const taxableOld = Math.max(0, totalGross - stdDedOld - ded80C - ded80D - dedHRA - dedOther);
    const taxableNew = Math.max(0, totalGross - stdDedNew);

    const calculateOldTax = (income) => {
      let tax = 0;
      if (income <= 250000) return 0;
      if (income <= 500000) {
        tax = (income - 250000) * 0.05;
      } else if (income <= 1000000) {
        tax = 12500 + (income - 500000) * 0.20;
      } else {
        tax = 112500 + (income - 1000000) * 0.30;
      }
      
      // Rebate 87A for Old Regime (Income up to 5L)
      if (income <= 500000) {
        tax = Math.max(0, tax - 12500);
      }
      return tax;
    };

    const calculateNewTax = (income) => {
      let tax = 0;
      if (income <= 300000) return 0;
      
      const slabs = [
        { limit: 300000, rate: 0 },
        { limit: 700000, rate: 0.05 },
        { limit: 1000000, rate: 0.10 },
        { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.20 },
        { limit: Infinity, rate: 0.30 }
      ];

      let previousLimit = slabs[0].limit;

      for (let i = 1; i < slabs.length; i++) {
        if (income > previousLimit) {
          const slabMax = slabs[i].limit;
          const slabMin = previousLimit;
          const taxableInThisSlab = Math.min(income - slabMin, slabMax - slabMin);
          tax += taxableInThisSlab * slabs[i].rate;
          previousLimit = slabMax;
        } else {
          break;
        }
      }

      // Rebate 87A for New Regime (Income up to 7L, effectively 7.75L with 75k std deduction)
      if (income <= 700000) {
        tax = Math.max(0, tax - 25000);
      }
      
      // Marginal Relief (simplified for 7L edge case)
      if (income > 700000 && income <= 727777) {
         const taxWithoutRelief = tax;
         const incomeAbove7L = income - 700000;
         tax = Math.min(taxWithoutRelief, incomeAbove7L);
      }

      return tax;
    };

    let taxOld = calculateOldTax(taxableOld);
    let taxNew = calculateNewTax(taxableNew);

    // Health & Education Cess (4%)
    const cessOld = taxOld * 0.04;
    const cessNew = taxNew * 0.04;

    const totalTaxOld = taxOld + cessOld;
    const totalTaxNew = taxNew + cessNew;

    const difference = Math.abs(totalTaxOld - totalTaxNew);
    let winner = 'EQUAL';
    if (totalTaxOld > totalTaxNew) winner = 'NEW';
    else if (totalTaxNew > totalTaxOld) winner = 'OLD';

    return {
      taxableOld, taxableNew,
      totalTaxOld, totalTaxNew,
      taxOld, taxNew,
      cessOld, cessNew,
      winner, difference
    };
  };

  const results = useMemo(() => calculateTax(), [grossIncome, otherIncome, sec80C, sec80D, hra, otherDeductions]);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Income Tax Planner (FY 2024-25)</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compare Old vs New tax regimes to maximize your savings. Includes Rebate 87A and Cess.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Input Dashboard */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            {/* Income */}
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs flex items-center gap-2">Income Sources</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Gross Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input 
                    type="number" value={grossIncome || ''} onChange={(e) => setGrossIncome(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Other Income (Rent, Interest)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input 
                    type="number" value={otherIncome || ''} onChange={(e) => setOtherIncome(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border"></div>

            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-primary text-xs flex items-center gap-2"><ShieldCheck size={14}/> Tax Exemptions (Old Regime)</h3>
              <p className="text-[11px] text-muted-foreground">Standard Deduction (₹50k/₹75k) is applied automatically.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Sec 80C (Max 1.5L)</label>
                  <input 
                    type="number" value={sec80C || ''} onChange={(e) => setSec80C(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Sec 80D (Health)</label>
                  <input 
                    type="number" value={sec80D || ''} onChange={(e) => setSec80D(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">HRA Exemption</label>
                  <input 
                    type="number" value={hra || ''} onChange={(e) => setHra(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Other Deductions</label>
                  <input 
                    type="number" value={otherDeductions || ''} onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Winner Banner */}
          <AnimatePresence mode="wait">
            {results.winner !== 'EQUAL' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className={`border p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${results.winner === 'NEW' ? 'bg-primary/10 border-primary/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl text-white ${results.winner === 'NEW' ? 'bg-primary' : 'bg-emerald-500'}`}>
                    <Scale size={28} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-black ${results.winner === 'NEW' ? 'text-primary' : 'text-emerald-500'}`}>
                      {results.winner} Regime is Better!
                    </h4>
                    <p className="text-sm font-medium text-foreground">Based on your inputs, you should opt for the {results.winner} Regime.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block text-xs uppercase tracking-wider font-bold mb-1 ${results.winner === 'NEW' ? 'text-primary/70' : 'text-emerald-500/70'}`}>Tax Saved</span>
                  <span className={`text-3xl font-black ${results.winner === 'NEW' ? 'text-primary' : 'text-emerald-500'}`}>{formatCurrency(results.difference)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regime Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NEW REGIME CARD */}
            <div className={`bg-card border-2 rounded-3xl p-1 overflow-hidden transition-all ${results.winner === 'NEW' ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'border-border'}`}>
              <div className="bg-muted/30 rounded-[22px] h-full flex flex-col">
                <div className={`p-4 text-center border-b border-border ${results.winner === 'NEW' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground'}`}>
                  <h3 className="text-lg font-black tracking-tight uppercase">New Regime</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${results.winner === 'NEW' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Default Option</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Net Taxable Income</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.taxableNew)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Income Tax</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.taxNew)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Health & Edu Cess (4%)</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.cessNew)}</span>
                    </div>
                  </div>
                  
                  <div className={`pt-4 border-t border-border mt-auto flex justify-between items-center ${results.winner === 'NEW' ? 'text-primary' : 'text-foreground'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Total Tax Payable</span>
                    <span className="text-3xl font-black">{formatCurrency(results.totalTaxNew)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OLD REGIME CARD */}
            <div className={`bg-card border-2 rounded-3xl p-1 overflow-hidden transition-all ${results.winner === 'OLD' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'border-border'}`}>
              <div className="bg-muted/30 rounded-[22px] h-full flex flex-col">
                <div className={`p-4 text-center border-b border-border ${results.winner === 'OLD' ? 'bg-emerald-500 text-white' : 'bg-transparent text-foreground'}`}>
                  <h3 className="text-lg font-black tracking-tight uppercase">Old Regime</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${results.winner === 'OLD' ? 'text-white/70' : 'text-muted-foreground'}`}>Exemptions Applied</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Net Taxable Income</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.taxableOld)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Income Tax</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.taxOld)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Health & Edu Cess (4%)</span>
                      <span className="font-bold text-foreground">{formatCurrency(results.cessOld)}</span>
                    </div>
                  </div>
                  
                  <div className={`pt-4 border-t border-border mt-auto flex justify-between items-center ${results.winner === 'OLD' ? 'text-emerald-500' : 'text-foreground'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Total Tax Payable</span>
                    <span className="text-3xl font-black">{formatCurrency(results.totalTaxOld)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-start gap-3">
            <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Note:</strong> Standard Deduction of ₹75,000 (New) and ₹50,000 (Old) is auto-applied. Rebate under Section 87A is automatically calculated if your taxable income is below ₹7 Lakhs (New Regime) or ₹5 Lakhs (Old Regime), effectively reducing your tax to zero.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;
