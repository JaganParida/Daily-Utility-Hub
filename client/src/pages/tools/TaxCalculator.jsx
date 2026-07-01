import { useState } from 'react';
import { Landmark, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const TaxCalculator = () => {
  const [grossIncome, setGrossIncome] = useState(1200000); // 12 Lakhs default
  const [deduction80C, setDeduction80C] = useState(150000); // 1.5 Lakhs default
  const [deduction80D, setDeduction80D] = useState(25000); // 25k default
  const [hraExemption, setHraExemption] = useState(50000); // 50k default
  const [otherDeductions, setOtherDeductions] = useState(0);

  const [showDeductions, setShowDeductions] = useState(true);

  // Constants
  const OLD_STANDARD_DEDUCTION = 50000;
  const NEW_STANDARD_DEDUCTION = 75000; // Increased to 75k in Budget 2024

  const calculateTax = () => {
    // 1. Calculate Old Regime
    // Deductions allowed: 80C, 80D, HRA, Standard Deduction (50k)
    const oldDeductions = OLD_STANDARD_DEDUCTION + Math.min(150000, deduction80C) + Math.min(100000, deduction80D) + HRAExemptionCheck(hraExemption) + otherDeductions;
    const oldTaxableIncome = Math.max(0, grossIncome - oldDeductions);
    const oldTax = calculateOldRegimeTax(oldTaxableIncome);

    // 2. Calculate New Regime
    // Deductions allowed: Only Standard Deduction (75k under Budget 2024)
    const newDeductions = NEW_STANDARD_DEDUCTION;
    const newTaxableIncome = Math.max(0, grossIncome - newDeductions);
    const newTax = calculateNewRegimeTax(newTaxableIncome);

    return {
      oldTaxable: oldTaxableIncome,
      oldDeductions: oldDeductions,
      oldTax: oldTax,
      newTaxable: newTaxableIncome,
      newDeductions: newDeductions,
      newTax: newTax
    };
  };

  const HRAExemptionCheck = (val) => {
    return Math.max(0, parseFloat(val) || 0);
  };

  // Old Regime Slabs (Progressive)
  const calculateOldRegimeTax = (taxableIncome) => {
    if (taxableIncome <= 250000) return 0;
    
    let tax = 0;
    if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = (250000 * 0.05) + (taxableIncome - 500000) * 0.20;
    } else {
      tax = (250000 * 0.05) + (500000 * 0.20) + (taxableIncome - 1000000) * 0.30;
    }

    // Tax Rebate u/s 87A if taxable income is <= 5 Lakhs
    if (taxableIncome <= 500000) {
      tax = 0;
    }

    // Add 4% Health and Education Cess
    return tax * 1.04;
  };

  // New Regime Slabs (Progressive FY 2024-25 / AY 2025-26 - Budget 2024)
  const calculateNewRegimeTax = (taxableIncome) => {
    if (taxableIncome <= 300000) return 0;

    let tax = 0;
    if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = (400000 * 0.05) + (taxableIncome - 700000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = (400000 * 0.05) + (300000 * 0.10) + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = (400000 * 0.05) + (300000 * 0.10) + (200000 * 0.15) + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = (400000 * 0.05) + (300000 * 0.10) + (200000 * 0.15) + (300000 * 0.20) + (taxableIncome - 1500000) * 0.30;
    }

    // Tax Rebate u/s 87A in new regime up to 7 Lakhs taxable income
    if (taxableIncome <= 700000) {
      tax = 0;
    }

    // Add 4% Health and Education Cess
    return tax * 1.04;
  };

  const { oldTaxable, oldDeductions, oldTax, newTaxable, newDeductions, newTax } = calculateTax();

  const difference = Math.abs(oldTax - newTax);
  const bestRegime = oldTax < newTax ? 'Old Regime' : 'New Regime';
  const bestRegimeColor = oldTax < newTax ? 'text-blue-500' : 'text-emerald-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Landmark size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Income Tax Calculator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Compare tax liabilities under the Old and New Tax Regimes side-by-side with deductions support.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        
        {/* Left Inputs Block */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Gross income */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gross Annual Income</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
              <input 
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-2.5 text-base font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/55"
              />
            </div>
          </div>

          {/* Deductions collapsible wrapper */}
          <div className="border border-border rounded-xl overflow-hidden bg-muted/10">
            <button 
              onClick={() => setShowDeductions(!showDeductions)}
              className="w-full px-4 py-3 flex justify-between items-center bg-muted/20 hover:bg-muted/40 transition-colors font-bold text-sm text-foreground"
            >
              <span>Deductions & Exemptions (Old Regime Only)</span>
              {showDeductions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showDeductions && (
              <div className="p-4 space-y-4 text-xs font-semibold text-muted-foreground">
                
                {/* Standard deduction indicator */}
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span>Standard Deduction (Old / New)</span>
                  <span className="font-bold text-foreground">₹50,000 / ₹75,000</span>
                </div>

                {/* Section 80C */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Section 80C (PPF, ELSS, LIC - Max ₹1.5L)</span>
                    <span className="font-bold text-foreground">₹{deduction80C.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" min="0" max="150000" step="5000"
                    value={deduction80C}
                    onChange={(e) => setDeduction80C(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Section 80D */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Section 80D (Health Insurance - Max ₹1L)</span>
                    <span className="font-bold text-foreground">₹{deduction80D.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" min="0" max="100000" step="5000"
                    value={deduction80D}
                    onChange={(e) => setDeduction80D(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* HRA Exemption */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>HRA Exemption (House Rent Allowance)</span>
                    <span className="font-bold text-foreground">₹{hraExemption.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" min="0" max="300000" step="5000"
                    value={hraExemption}
                    onChange={(e) => setHraExemption(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Other Deductions */}
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs font-semibold">Other Deductions (NPS, Loan Interest, etc.)</label>
                  <input 
                    type="number"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-background border border-border rounded-lg px-2.5 py-1.5 font-bold text-foreground text-xs w-full focus:outline-none"
                  />
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right Output comparison results */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="text-center pb-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Regime Recommendation</h3>
            {difference === 0 ? (
              <div className="flex items-center justify-center gap-1.5 text-foreground font-black text-lg">
                <Sparkles className="text-indigo-500" size={18} />
                Both regimes yield identical tax.
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">You save <span className="font-black text-indigo-500">₹{Math.round(difference).toLocaleString('en-IN')}</span> by choosing:</p>
                <p className={`text-2xl font-black ${bestRegimeColor}`}>{bestRegime}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            
            {/* Old vs New side-by-side breakdown */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
              <span>Parameters</span>
              <div className="grid grid-cols-2 text-right">
                <span>Old</span>
                <span>New</span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-[1fr_150px] gap-2 items-center">
                <span className="text-muted-foreground text-xs">Total Deductions</span>
                <div className="grid grid-cols-2 text-right font-bold text-foreground text-xs">
                  <span>₹{oldDeductions.toLocaleString('en-IN')}</span>
                  <span>₹{newDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_150px] gap-2 items-center">
                <span className="text-muted-foreground text-xs">Taxable Income</span>
                <div className="grid grid-cols-2 text-right font-bold text-foreground text-xs">
                  <span>₹{Math.round(oldTaxable).toLocaleString('en-IN')}</span>
                  <span>₹{Math.round(newTaxable).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_150px] gap-2 items-center border-t border-dashed border-border pt-3">
                <span className="text-muted-foreground font-semibold text-xs">Total Tax Due</span>
                <div className="grid grid-cols-2 text-right font-black text-xs">
                  <span className={bestRegime === 'Old Regime' ? 'text-indigo-500' : 'text-foreground'}>₹{Math.round(oldTax).toLocaleString('en-IN')}</span>
                  <span className={bestRegime === 'New Regime' ? 'text-indigo-500' : 'text-foreground'}>₹{Math.round(newTax).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_150px] gap-2 items-center border-t border-border pt-3.5">
                <span className="text-muted-foreground font-semibold text-xs">Net Take-Home (P.A.)</span>
                <div className="grid grid-cols-2 text-right font-black text-xs">
                  <span className={bestRegime === 'Old Regime' ? 'text-indigo-500' : 'text-foreground'}>₹{Math.round(grossIncome - oldTax).toLocaleString('en-IN')}</span>
                  <span className={bestRegime === 'New Regime' ? 'text-indigo-500' : 'text-foreground'}>₹{Math.round(grossIncome - newTax).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={12} />
                <p>Old Regime allows standard deduction, HRA, 80C, 80D benefits.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={12} />
                <p>New Regime has lower progressive tax rates but no deduction benefits (except ₹75k standard deduction).</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default TaxCalculator;
