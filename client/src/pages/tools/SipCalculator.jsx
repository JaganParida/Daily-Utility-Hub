import { useState } from 'react';
import { TrendingUp, CheckCircle2, CircleDollarSign } from 'lucide-react';

const SipCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000); // default 5000/mo
  const [returnRate, setReturnRate] = useState(12); // default 12% returns
  const [duration, setDuration] = useState(10); // default 10 years

  const calculateSip = () => {
    const P = monthlyInvestment;
    const i = (returnRate / 12) / 100;
    const n = duration * 12;

    if (P <= 0 || i < 0 || n <= 0) return { invested: 0, returns: 0, total: 0, yearlyData: [] };

    // Future value formula: M * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
    const totalAmount = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = P * n;
    const wealthGain = totalAmount - investedAmount;

    // Generate yearly growth projection data for SVG chart
    const yearlyData = [];
    for (let yr = 1; yr <= duration; yr++) {
      const months = yr * 12;
      const fValue = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
      const invested = P * months;
      yearlyData.push({
        year: yr,
        invested: invested,
        futureValue: fValue
      });
    }

    return {
      invested: investedAmount,
      returns: wealthGain,
      total: totalAmount,
      yearlyData: yearlyData
    };
  };

  const { invested, returns, total, yearlyData } = calculateSip();

  // SVG Chart path calculation helper
  const svgWidth = 320;
  const svgHeight = 150;
  const padding = 20;

  const getSvgCoordinates = () => {
    if (yearlyData.length === 0) return { investedPath: '', futureValuePath: '' };

    const maxVal = Math.max(...yearlyData.map(d => d.futureValue), 1000);
    const minVal = 0;

    const points = yearlyData.map((d, index) => {
      const x = padding + (index / (yearlyData.length - 1)) * (svgWidth - 2 * padding);
      const yInvested = svgHeight - padding - ((d.invested - minVal) / (maxVal - minVal)) * (svgHeight - 2 * padding);
      const yFValue = svgHeight - padding - ((d.futureValue - minVal) / (maxVal - minVal)) * (svgHeight - 2 * padding);
      return { x, yInvested, yFValue };
    });

    const investedPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yInvested}`).join(' ');
    const futureValuePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yFValue}`).join(' ');
    
    // Create fill path for future value area
    const firstPoint = points[0] || { x: padding, yFValue: svgHeight - padding };
    const lastPoint = points[points.length - 1] || { x: svgWidth - padding, yFValue: svgHeight - padding };
    const futureValueAreaPath = `${futureValuePath} L ${lastPoint.x} ${svgHeight - padding} L ${firstPoint.x} ${svgHeight - padding} Z`;

    return { investedPath, futureValuePath, futureValueAreaPath, points };
  };

  const { investedPath, futureValuePath, futureValueAreaPath, points = [] } = getSvgCoordinates();

  const totalReturnsPct = total > 0 ? (invested / total) * 100 : 50;
  const returnsPct = 100 - totalReturnsPct;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shadow-sm">
          <TrendingUp size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SIP Calculator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Estimate future values of your Systematic Investment Plans (SIP) and calculate your compound returns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        
        {/* Left Inputs Card */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Monthly Investment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Monthly Investment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                <input 
                  type="number"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-background border border-border rounded-xl pl-6 pr-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/55 w-32"
                />
              </div>
            </div>
            <input 
              type="range" min="500" max="100000" step="500"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹500</span>
              <span>₹1 Lakh</span>
            </div>
          </div>

          {/* Expected Return Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Expected Return Rate (P.A.)</label>
              <div className="relative">
                <input 
                  type="number" step="0.5"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/55 w-24 text-right pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
              </div>
            </div>
            <input 
              type="range" min="1" max="30" step="0.5"
              value={returnRate}
              onChange={(e) => setReturnRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Investment Period</label>
              <div className="relative">
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/55 w-24 text-right pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Yrs</span>
              </div>
            </div>
            <input 
              type="range" min="1" max="40"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 Year</span>
              <span>40 Years</span>
            </div>
          </div>

        </div>

        {/* Right Output Results Card */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="text-center pb-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Expected Amount</h3>
            <p className="text-3xl font-black text-emerald-500">₹{Math.round(total).toLocaleString('en-IN')}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invested Amount</span>
              <span className="font-bold text-foreground">₹{invested.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dashed border-border pb-4">
              <span className="text-muted-foreground">Est. Wealth Gains</span>
              <span className="font-bold text-foreground text-emerald-600">₹{Math.round(returns).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* SVG Line / Area Projection Chart */}
          {yearlyData.length > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                <span>Wealth Projection Chart</span>
                <span>Yr 1 to Yr {duration}</span>
              </div>
              <div className="flex justify-center bg-muted/10 border border-border p-2 rounded-xl">
                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                  {/* Grid Lines */}
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="var(--border)" strokeWidth="1" />
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="var(--border)" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Future Value Area Fill */}
                  <path d={futureValueAreaPath} fill="rgba(16, 185, 129, 0.12)" />

                  {/* Invested line */}
                  <path d={investedPath} fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Future value line */}
                  <path d={futureValuePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                  {/* End Data Points */}
                  {points.length > 0 && (
                    <>
                      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].yInvested} r="4" fill="#6b7280" />
                      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].yFValue} r="4" fill="#10b981" />
                    </>
                  )}
                </svg>
              </div>
              
              {/* Legends */}
              <div className="flex justify-center gap-4 text-[10.5px] font-bold pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-500 rounded-full" />
                  <span className="text-muted-foreground">Invested Amount ({Math.round(totalReturnsPct)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-muted-foreground">Wealth Growth ({Math.round(returnsPct)}%)</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Projection details table */}
      <div className="mt-6 bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <CircleDollarSign className="text-emerald-500" size={20} />
          Year-on-Year Growth Projection
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-bold border-b border-border">
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3">Total Invested</th>
                <th className="px-6 py-3">Future Value</th>
                <th className="px-6 py-3">Est. Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground font-semibold">
              {yearlyData.map((row) => (
                <tr key={row.year} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-3 text-muted-foreground">Year {row.year}</td>
                  <td className="px-6 py-3">₹{Math.round(row.invested).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 text-emerald-600">₹{Math.round(row.futureValue).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3 text-blue-500">₹{Math.round(row.futureValue - row.invested).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SipCalculator;
