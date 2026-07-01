import { useState } from 'react';
import { Percent, CheckCircle2, DollarSign } from 'lucide-react';

const GstCalculator = () => {
  const [amount, setAmount] = useState(10000); // default amount
  const [taxRate, setTaxRate] = useState(18); // default rate 18%
  const [isInclusive, setIsInclusive] = useState(false); // default Exclusive (Add GST)

  const calculateGst = () => {
    const originalAmount = amount;
    const rate = taxRate;

    if (originalAmount <= 0 || rate < 0) return { net: 0, tax: 0, cgst: 0, sgst: 0, gross: 0 };

    let netAmount = 0;
    let taxAmount = 0;
    let grossAmount = 0;

    if (isInclusive) {
      // Inclusive formula: Net = Gross / (1 + (Rate/100))
      grossAmount = originalAmount;
      netAmount = grossAmount / (1 + (rate / 100));
      taxAmount = grossAmount - netAmount;
    } else {
      // Exclusive formula: Gross = Net * (1 + (Rate/100))
      netAmount = originalAmount;
      taxAmount = netAmount * (rate / 100);
      grossAmount = netAmount + taxAmount;
    }

    return {
      net: netAmount,
      tax: taxAmount,
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      gross: grossAmount
    };
  };

  const { net, tax, cgst, sgst, gross } = calculateGst();

  const presets = [5, 12, 18, 28];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <Percent size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">GST / VAT Calculator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Calculate tax inclusive or exclusive prices and see detailed SGST and CGST breakdowns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        
        {/* Left Inputs Block */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Original Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-extrabold text-sm">₹</span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-3 text-lg font-black text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/55"
                placeholder="Enter Base Amount"
              />
            </div>
          </div>

          {/* Toggle inclusive/exclusive */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Calculation Mode</label>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-1.5 rounded-2xl border border-border">
              <button 
                onClick={() => setIsInclusive(false)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${!isInclusive ? 'bg-background shadow text-indigo-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Exclusive (Add GST)
              </button>
              <button 
                onClick={() => setIsInclusive(true)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${isInclusive ? 'bg-background shadow text-indigo-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Inclusive (Remove GST)
              </button>
            </div>
          </div>

          {/* Tax Slabs presets */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">GST Slabs (%)</label>
            <div className="grid grid-cols-4 gap-3">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setTaxRate(p)}
                  className={`py-3.5 rounded-xl font-black text-sm border transition-all ${taxRate === p ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500 shadow-sm shadow-indigo-500/10' : 'border-border bg-muted/10 hover:bg-muted/35 text-muted-foreground hover:text-foreground'}`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tax Rate Slider */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
              <span>CUSTOM TAX RATE</span>
              <span className="text-indigo-500 text-sm">{taxRate}%</span>
            </div>
            <input 
              type="range" min="1" max="40" step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1%</span>
              <span>40%</span>
            </div>
          </div>

        </div>

        {/* Right Output results */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">Tax Breakdown</h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Net Price (Base Value)</span>
              <span className="font-semibold text-foreground">₹{Math.round(net).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">CGST (Central Tax - {taxRate/2}%)</span>
              <span className="font-semibold text-foreground text-amber-600">₹{Math.round(cgst).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">SGST (State Tax - {taxRate/2}%)</span>
              <span className="font-semibold text-foreground text-amber-600">₹{Math.round(sgst).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-border pt-4">
              <span className="text-muted-foreground font-bold">Total GST Amount</span>
              <span className="font-extrabold text-indigo-500">₹{Math.round(tax).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-4">
              <span className="text-muted-foreground font-bold">Total Gross Amount</span>
              <span className="font-black text-2xl text-foreground">₹{Math.round(gross).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={14} />
              <p>Exclusive Mode adds {taxRate}% GST to your Base value.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={14} />
              <p>Inclusive Mode splits tax content inside your Base value.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default GstCalculator;
