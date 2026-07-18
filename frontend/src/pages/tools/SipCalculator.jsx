import { useState, useMemo } from 'react';
import { TrendingUp, PieChart, Info, BarChart3, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SipCalculator = () => {
  const [mode, setMode] = useState('SIP'); // 'SIP' or 'LUMPSUM'
  const [investment, setInvestment] = useState(10000); // 10k monthly or 1 Lakh lumpsum
  const [returnRate, setReturnRate] = useState(12); // 12%
  const [tenureYears, setTenureYears] = useState(10); // 10 Years
  
  // Advanced features
  const [stepUpPercent, setStepUpPercent] = useState(0); // For SIP only
  const [inflationRate, setInflationRate] = useState(6); // Standard 6% inflation
  const [adjustInflation, setAdjustInflation] = useState(false);

  // Switch modes gracefully
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    if (newMode === 'LUMPSUM') {
      setInvestment(100000); // Default for lumpsum
      setStepUpPercent(0); // Lumpsum doesn't have stepup
    } else {
      setInvestment(10000); // Default for SIP
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const calculateReturns = () => {
    const P = investment;
    const r = returnRate / 100;
    const n = tenureYears;
    
    let totalInvested = 0;
    let expectedValue = 0;
    const schedule = [];

    if (mode === 'LUMPSUM') {
      totalInvested = P;
      expectedValue = P * Math.pow(1 + r, n);
      
      let currentValue = P;
      for (let i = 1; i <= n; i++) {
        currentValue = currentValue * (1 + r);
        schedule.push({ year: i, invested: P, total: currentValue });
      }
    } else {
      // SIP with Step-up Calculation
      let currentMonthlySIP = P;
      let totalAccumulated = 0;
      let cumulativeInvested = 0;
      const monthlyRate = r / 12;

      for (let i = 1; i <= n; i++) {
        let yearInvested = 0;
        for (let m = 1; m <= 12; m++) {
          cumulativeInvested += currentMonthlySIP;
          yearInvested += currentMonthlySIP;
          // Compounding formula per month: A = P * (((1 + r)^n - 1) / r) * (1 + r)
          // Since we are stepping through each month, we can just compound the running total:
          totalAccumulated = (totalAccumulated + currentMonthlySIP) * (1 + monthlyRate);
        }
        
        schedule.push({ year: i, invested: cumulativeInvested, total: totalAccumulated });
        
        // Apply step up at end of year
        if (stepUpPercent > 0) {
          currentMonthlySIP = currentMonthlySIP * (1 + (stepUpPercent / 100));
        }
      }
      
      totalInvested = cumulativeInvested;
      expectedValue = totalAccumulated;
    }

    const wealthGained = expectedValue - totalInvested;

    // Inflation Adjustment (Future Value / (1 + inflationRate)^n )
    let inflationAdjustedValue = expectedValue;
    if (adjustInflation) {
      inflationAdjustedValue = expectedValue / Math.pow(1 + (inflationRate / 100), n);
    }

    return {
      totalInvested,
      expectedValue,
      wealthGained,
      inflationAdjustedValue,
      schedule
    };
  };

  const results = useMemo(() => calculateReturns(), [mode, investment, returnRate, tenureYears, stepUpPercent, inflationRate, adjustInflation]);

  // Donut chart calculations
  const totalForChart = results.expectedValue;
  const investedPct = totalForChart > 0 ? (results.totalInvested / totalForChart) * 100 : 100;
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(investedPct / 100) * circumference} ${circumference}`;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <TrendingUp size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced Wealth Calculator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Calculate SIPs or Lumpsum growth with Step-up and Inflation adjustments.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Input Dashboard */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            {/* Mode Switcher */}
            <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner">
              <button onClick={() => handleModeSwitch('SIP')} className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all ${mode === 'SIP' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Monthly SIP</button>
              <button onClick={() => handleModeSwitch('LUMPSUM')} className={`flex-1 text-sm py-2 rounded-lg font-bold transition-all ${mode === 'LUMPSUM' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Lumpsum</button>
            </div>

            <div className="space-y-6 pt-2">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">{mode === 'SIP' ? 'Monthly Investment' : 'Total Investment'}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                    <input 
                      type="number"
                      value={investment || ''}
                      onChange={(e) => setInvestment(Number(e.target.value))}
                      className="bg-background border border-border rounded-xl pl-6 pr-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-32 text-right"
                    />
                  </div>
                </div>
                <input 
                  type="range" min={mode === 'SIP' ? 500 : 5000} max={mode === 'SIP' ? 1000000 : 50000000} step={mode === 'SIP' ? 500 : 5000}
                  value={investment} onChange={(e) => setInvestment(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Expected Return Rate (p.a)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={returnRate || ''}
                      onChange={(e) => setReturnRate(Number(e.target.value))}
                      className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-24 text-right pr-6"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
                  </div>
                </div>
                <input 
                  type="range" min="1" max="40" step="0.5"
                  value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Time Period (Years)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={tenureYears || ''}
                      onChange={(e) => setTenureYears(Number(e.target.value))}
                      className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-24 text-right pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Yr</span>
                  </div>
                </div>
                <input 
                  type="range" min="1" max="40" step="1"
                  value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="w-full h-px bg-border"></div>

            {/* Advanced Options */}
            <div className="space-y-5">
              <h3 className="font-bold uppercase tracking-wider text-primary text-xs">Advanced Options</h3>
              
              {mode === 'SIP' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center group relative">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 cursor-help">
                      Step-up SIP (% yearly) <HelpCircle size={12}/>
                      <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-foreground text-background text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Automatically increases your SIP amount every year by this percentage. A massive wealth booster!
                      </div>
                    </label>
                    <span className="text-xs font-bold text-foreground">{stepUpPercent}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="25" step="1"
                    value={stepUpPercent} onChange={(e) => setStepUpPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={adjustInflation} onChange={(e) => setAdjustInflation(e.target.checked)} className="sr-only" />
                    <div className={`w-10 h-6 rounded-full transition-colors ${adjustInflation ? 'bg-primary' : 'bg-muted border border-border'}`}></div>
                    <div className={`absolute left-1 w-4 h-4 rounded-full bg-background transition-transform ${adjustInflation ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Adjust for Inflation</span>
                </label>
                
                <AnimatePresence>
                  {adjustInflation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 overflow-hidden">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-muted-foreground">Expected Inflation Rate</label>
                          <span className="text-xs font-bold text-foreground">{inflationRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="15" step="0.5"
                          value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Top Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Invested</h4>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(results.totalInvested)}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">Wealth Gained</h4>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(results.wealthGained)}</p>
            </div>

            <div className={`p-5 rounded-2xl shadow-lg relative overflow-hidden xl:col-span-1 md:col-span-2 ${adjustInflation ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-primary border border-primary/20 shadow-primary/20 text-primary-foreground'}`}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
                {adjustInflation ? 'Inflation Adjusted Value (Real Value)' : 'Total Expected Value'}
              </h4>
              <p className="text-3xl font-black">{formatCurrency(adjustInflation ? results.inflationAdjustedValue : results.expectedValue)}</p>
            </div>
            
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Visual Chart */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm xl:col-span-1 flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="font-bold text-foreground mb-6 self-start flex items-center gap-2"><PieChart size={18}/> Portfolio Breakup</h3>
              <div className="relative flex items-center justify-center w-full aspect-square max-w-[200px]">
                <svg viewBox="0 0 160 160" className="transform -rotate-90 w-full h-full">
                  <circle cx="80" cy="80" r={radius} strokeWidth="24" className="stroke-emerald-500" fill="transparent" />
                  <circle cx="80" cy="80" r={radius} strokeWidth="24" className="stroke-primary" fill="transparent"
                    strokeDasharray={strokeDasharray} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{Math.round(100 - investedPct)}%</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest mt-1">Growth</span>
                </div>
              </div>
              <div className="flex gap-6 mt-6 w-full justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-semibold text-muted-foreground">Invested</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-muted-foreground">Gains</span>
                </div>
              </div>
            </div>

            {/* Growth Bar Chart */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm xl:col-span-2 overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-foreground flex items-center gap-2"><BarChart3 size={18}/> Year-on-Year Growth Projection</h3>
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-primary/80"></div> Invested</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80"></div> Gains</div>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto custom-scrollbar -mx-2 px-2">
                <div className="h-full flex flex-col justify-end pt-20 pb-4" style={{ minWidth: `${Math.max(100, results.schedule.length * 32)}px` }}>
                  <div className="flex items-end justify-between gap-1.5 h-[200px]">
                    {results.schedule.map((yearObj, idx) => {
                      const maxTotal = results.schedule[results.schedule.length - 1].total;
                      const investedHeightPct = (yearObj.invested / maxTotal) * 100;
                      const gainHeightPct = ((yearObj.total - yearObj.invested) / maxTotal) * 100;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold py-1.5 px-2 rounded pointer-events-none whitespace-nowrap z-10 flex flex-col gap-1 text-center">
                            <span className="text-emerald-400">Total: {formatCurrency(yearObj.total)}</span>
                            <span className="text-muted-foreground">Invested: {formatCurrency(yearObj.invested)}</span>
                          </div>
                          
                          <div className="w-full bg-transparent flex flex-col justify-end rounded-t-sm relative h-[200px]">
                            {/* Gains Bar */}
                            <div className="w-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors rounded-t-sm" style={{ height: `${gainHeightPct}%` }}></div>
                            {/* Invested Bar */}
                            <div className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-b-sm" style={{ height: `${investedHeightPct}%` }}></div>
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Yr {yearObj.year}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SipCalculator;
