import { useState, useMemo } from 'react';
import { Calculator, CheckCircle2, TrendingDown, PiggyBank, Calendar, IndianRupee, PieChart, Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmiCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakhs
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState(20); // 20 Years
  
  // Advanced features
  const [monthlyPrepayment, setMonthlyPrepayment] = useState(0);
  const [yearlyPrepayment, setYearlyPrepayment] = useState(0);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const calculateAmortization = () => {
    const P = loanAmount;
    const r = (interestRate / 12) / 100;
    const n = tenureYears * 12;

    // Standard EMI without prepayments
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    if (P <= 0 || r <= 0 || n <= 0 || emi <= P * r) {
      return { emi: 0, totalInterest: 0, standardInterest: 0, totalAmount: P, months: 0, savings: 0, timeSaved: 0, schedule: [] };
    }
    
    const standardTotalInterest = (emi * n) - P;

    // Simulation with prepayments
    let balance = P;
    let totalInterestPaid = 0;
    let monthsElapsed = 0;
    const schedule = [];

    while (balance > 0 && monthsElapsed < n * 2) { // Safeguard loop
      monthsElapsed++;
      const interestForMonth = balance * r;
      totalInterestPaid += interestForMonth;

      let principalPaid = emi - interestForMonth;
      
      // Apply monthly prepayment
      principalPaid += monthlyPrepayment;

      // Apply yearly prepayment
      if (monthsElapsed % 12 === 0) {
        principalPaid += yearlyPrepayment;
      }

      // If paying more than balance
      if (principalPaid > balance) {
        principalPaid = balance;
      }

      balance = Math.max(0, balance - principalPaid);

      // Only save yearly snapshots to prevent huge arrays
      if (monthsElapsed % 12 === 0 || balance === 0) {
        schedule.push({
          year: Math.ceil(monthsElapsed / 12),
          balance: balance,
          principalPaidSoFar: P - balance,
          interestPaidSoFar: totalInterestPaid
        });
      }
    }

    const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, n - monthsElapsed);

    return {
      emi: emi,
      totalInterest: totalInterestPaid,
      standardInterest: standardTotalInterest,
      totalAmount: P + totalInterestPaid,
      months: monthsElapsed,
      savings: interestSaved,
      timeSaved: monthsSaved,
      schedule
    };
  };

  const results = useMemo(() => calculateAmortization(), [loanAmount, interestRate, tenureYears, monthlyPrepayment, yearlyPrepayment]);

  // Donut chart calculations
  const total = loanAmount + results.totalInterest;
  const principalPct = total > 0 ? (loanAmount / total) * 100 : 100;
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(principalPct / 100) * circumference} ${circumference}`;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced EMI Calculator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Calculate EMI, map amortization, and plan early prepayments to save massive interest.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Input Dashboard */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-6">
            
            {/* Core Loan Details */}
            <div className="space-y-6">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs flex items-center gap-2"><IndianRupee size={14}/> Core Loan Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Loan Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                    <input 
                      type="number"
                      value={loanAmount || ''}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="bg-background border border-border rounded-xl pl-6 pr-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-36 text-right"
                    />
                  </div>
                </div>
                <input 
                  type="range" min="10000" max="50000000" step="50000"
                  value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Interest Rate (% p.a)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={interestRate || ''}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-24 text-right pr-6"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
                  </div>
                </div>
                <input 
                  type="range" min="1" max="25" step="0.1"
                  value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Loan Tenure (Years)</label>
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

            {/* Advanced Prepayment Options */}
            <div className="space-y-6">
              <h3 className="font-bold uppercase tracking-wider text-primary text-xs flex items-center gap-2"><TrendingDown size={14}/> Prepayment Strategy (Optional)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Adding extra payments directly reduces your principal, massively cutting down interest and loan duration.</p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Extra Monthly Payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input 
                    type="number"
                    value={monthlyPrepayment || ''}
                    onChange={(e) => setMonthlyPrepayment(Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Extra Yearly Payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input 
                    type="number"
                    value={yearlyPrepayment || ''}
                    onChange={(e) => setYearlyPrepayment(Number(e.target.value))}
                    placeholder="e.g. 100000"
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Top Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-primary border border-primary/20 p-5 rounded-2xl shadow-lg shadow-primary/20 text-primary-foreground relative overflow-hidden">
              <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-primary-foreground/10" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70 mb-2">Monthly EMI</h4>
              <p className="text-3xl font-black">{formatCurrency(results.emi)}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Principal Amount</h4>
              <p className="text-xl font-bold text-foreground">{formatCurrency(loanAmount)}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Interest</h4>
              <p className="text-xl font-bold text-rose-500">{formatCurrency(results.totalInterest)}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Amount Payable</h4>
              <p className="text-xl font-bold text-foreground">{formatCurrency(results.totalAmount)}</p>
            </div>
          </div>

          {/* Savings Callout */}
          <AnimatePresence mode="wait">
            {(results.savings > 0 || results.timeSaved > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <PiggyBank className="text-emerald-500" size={32} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Prepayment Savings Activated!</h4>
                    <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">You are heavily crushing this debt.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-wider text-emerald-600/70 font-bold mb-1">Interest Saved</span>
                    <span className="text-xl font-black text-emerald-500">{formatCurrency(results.savings)}</span>
                  </div>
                  <div className="w-px bg-emerald-500/20"></div>
                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-wider text-emerald-600/70 font-bold mb-1">Time Saved</span>
                    <span className="text-xl font-black text-emerald-500">{Math.floor(results.timeSaved/12)}y {results.timeSaved%12}m</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Visual Chart */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm xl:col-span-1 flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="font-bold text-foreground mb-6 self-start flex items-center gap-2"><PieChart size={18}/> Breakup</h3>
              <div className="relative flex items-center justify-center w-full aspect-square max-w-[200px]">
                <svg viewBox="0 0 160 160" className="transform -rotate-90 w-full h-full">
                  <circle cx="80" cy="80" r={radius} strokeWidth="24" className="stroke-rose-500" fill="transparent" />
                  <circle cx="80" cy="80" r={radius} strokeWidth="24" className="stroke-primary" fill="transparent"
                    strokeDasharray={strokeDasharray} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{Math.round(principalPct)}%</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Principal</span>
                </div>
              </div>
              <div className="flex gap-6 mt-6 w-full justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-semibold text-muted-foreground">Principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-semibold text-muted-foreground">Interest</span>
                </div>
              </div>
            </div>

            {/* Amortization Timeline */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm xl:col-span-2 overflow-hidden flex flex-col">
              <h3 className="font-bold text-foreground mb-6 flex items-center gap-2"><Calendar size={18}/> Yearly Balance Decline</h3>
              <div className="flex-1 overflow-x-auto custom-scrollbar -mx-2 px-2">
                <div className="h-full flex flex-col justify-end pt-20 pb-4" style={{ minWidth: `${Math.max(100, results.schedule.length * 32)}px` }}>
                  <div className="flex items-end justify-between gap-1 h-[200px]">
                    {results.schedule.map((yearObj, idx) => {
                      const maxBalance = loanAmount;
                      const heightPct = maxBalance > 0 ? (yearObj.balance / maxBalance) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                            {formatCurrency(yearObj.balance)} left
                          </div>
                          <div className="w-full bg-muted rounded-t-sm relative overflow-hidden group-hover:bg-primary/20 transition-colors" style={{ height: `${Math.max(1, heightPct)}%` }}>
                            <div className="absolute bottom-0 w-full bg-primary transition-all duration-500" style={{ height: '100%' }}></div>
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

export default EmiCalculator;
