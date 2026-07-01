import { useState } from 'react';
import { Calculator, CheckCircle2, Table, Calendar } from 'lucide-react';

const EmiCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(1000000); // 10 Lakhs default
  const [interestRate, setInterestRate] = useState(8.5); // 8.5% default
  const [tenure, setTenure] = useState(5); // 5 Years default
  const [tenureType, setTenureType] = useState('years'); // 'years' or 'months'
  const [showAmortization, setShowAmortization] = useState(false);

  const calculateEmi = () => {
    const P = loanAmount;
    const r = (interestRate / 12) / 100;
    const n = tenureType === 'years' ? tenure * 12 : tenure;

    if (P <= 0 || r < 0 || n <= 0) return { emi: 0, interest: 0, total: 0, schedule: [] };

    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalAmount = emi * n;
    const totalInterest = totalAmount - P;

    // Generate amortization schedule
    const schedule = [];
    let balance = P;
    for (let i = 1; i <= n; i++) {
      const interestPaid = balance * r;
      const principalPaid = emi - interestPaid;
      balance = Math.max(0, balance - principalPaid);
      schedule.push({
        month: i,
        emi: emi,
        principal: principalPaid,
        interest: interestPaid,
        balance: balance
      });
    }

    return {
      emi: emi,
      interest: totalInterest,
      total: totalAmount,
      schedule: schedule
    };
  };

  const { emi, interest, total, schedule } = calculateEmi();

  const totalPayablePct = total > 0 ? (loanAmount / total) * 100 : 50;
  const interestPct = 100 - totalPayablePct;

  // Custom SVG Pie Chart calculations (stroke-dasharray mapping)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const principalStroke = (totalPayablePct / 100) * circumference;
  const interestStroke = circumference - principalStroke;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Calculator size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">EMI Calculator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Calculate monthly payments, total interest payable, and view your complete amortization schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        
        {/* Left Input Configuration Column */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Loan Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Loan Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                <input 
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-background border border-border rounded-xl pl-6 pr-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-36"
                />
              </div>
            </div>
            <input 
              type="range" min="10000" max="10000000" step="10000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹10,000</span>
              <span>₹1 Crore</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interest Rate (P.A.)</label>
              <div className="relative">
                <input 
                  type="number" step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-24 text-right pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
              </div>
            </div>
            <input 
              type="range" min="1" max="25" step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tenure</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-20 text-center"
                />
                <div className="flex bg-muted/40 p-1 rounded-xl">
                  <button 
                    onClick={() => { setTenureType('years'); setTenure(t => Math.max(1, Math.round(t / 12) || 1)); }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${tenureType === 'years' ? 'bg-background shadow text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Yr
                  </button>
                  <button 
                    onClick={() => { setTenureType('months'); setTenure(t => t * 12); }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${tenureType === 'months' ? 'bg-background shadow text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
            <input 
              type="range" min="1" max={tenureType === 'years' ? 30 : 360}
              value={tenure}
              onChange={(e) => setTenure(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 {tenureType === 'years' ? 'Year' : 'Month'}</span>
              <span>{tenureType === 'years' ? '30 Years' : '360 Months'}</span>
            </div>
          </div>

        </div>

        {/* Right Output Results Column */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="text-center pb-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Monthly EMI</h3>
            <p className="text-3xl font-black text-blue-500">₹{Math.round(emi).toLocaleString('en-IN')}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Principal Amount</span>
              <span className="font-bold text-foreground">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Interest Payable</span>
              <span className="font-bold text-foreground">₹{Math.round(interest).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-border pt-4">
              <span className="text-muted-foreground font-semibold">Total Amount</span>
              <span className="font-extrabold text-foreground">₹{Math.round(total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Custom SVG Pie Chart Graphic */}
          {total > 0 && (
            <div className="flex justify-center items-center py-2 relative">
              <svg width="150" height="150" viewBox="0 0 120 120" className="-rotate-90">
                <circle 
                  cx="60" cy="60" r={radius} 
                  fill="transparent" stroke="#f1f5f9" strokeWidth="12" 
                />
                <circle 
                  cx="60" cy="60" r={radius} 
                  fill="transparent" stroke="#3b82f6" strokeWidth="12" 
                  strokeDasharray={`${principalStroke} ${circumference}`}
                />
                <circle 
                  cx="60" cy="60" r={radius} 
                  fill="transparent" stroke="#f59e0b" strokeWidth="12" 
                  strokeDasharray={`${interestStroke} ${circumference}`}
                  strokeDashoffset={-principalStroke}
                />
              </svg>
              {/* Legends overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Break-up</p>
                <p className="text-[11px] font-black text-foreground">{Math.round(totalPayablePct)}% Principal</p>
              </div>
            </div>
          )}

          {/* Legend Labels */}
          <div className="flex justify-center gap-4 text-xs font-semibold pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">Principal ({Math.round(totalPayablePct)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-muted-foreground">Interest ({Math.round(interestPct)}%)</span>
            </div>
          </div>

        </div>

      </div>

      {/* Collapsible Amortization Schedule Section */}
      <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowAmortization(!showAmortization)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors border-b border-border"
        >
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Table size={18} className="text-blue-500" />
            <span>Show Amortization Schedule ({schedule.length} Months)</span>
          </div>
          <span className="text-xs text-blue-500 font-bold hover:underline">
            {showAmortization ? 'Hide Table' : 'Expand Table'}
          </span>
        </button>

        {showAmortization && (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-bold border-b border-border">
                  <th className="px-6 py-3 text-center">Month</th>
                  <th className="px-6 py-3">EMI Paid</th>
                  <th className="px-6 py-3">Principal paid</th>
                  <th className="px-6 py-3">Interest paid</th>
                  <th className="px-6 py-3">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground font-medium">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-3 text-center text-muted-foreground font-bold">{row.month}</td>
                    <td className="px-6 py-3">₹{Math.round(row.emi).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 text-blue-500">₹{Math.round(row.principal).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 text-amber-500">₹{Math.round(row.interest).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 text-emerald-600 font-bold">₹{Math.round(row.balance).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmiCalculator;
