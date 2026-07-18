import { useState, useEffect } from 'react';
import { Landmark, Download, Play, CheckCircle2, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const AmortizationScheduler = () => {
  const [principal, setPrincipal] = useState(250000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(15);
  const [schedule, setSchedule] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Run initial calculation silently on mount to populate layout
    const P = parseFloat(principal);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseInt(years) * 12;

    if (!isNaN(P) && !isNaN(r) && !isNaN(n) && P > 0 && r > 0 && n > 0) {
      const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      let balance = P;
      let totalInterest = 0;
      const list = [];

      for (let month = 1; month <= n; month++) {
        const interest = balance * r;
        const principalPaid = monthlyPayment - interest;
        balance -= principalPaid;
        totalInterest += interest;

        if (month % 12 === 0 || month === n) {
          list.push({
            year: Math.ceil(month / 12),
            payment: Math.round(monthlyPayment * 12 * 100) / 100,
            principalPaid: Math.round(principalPaid * 12 * 100) / 100,
            interestPaid: Math.round(interest * 12 * 100) / 100,
            balance: Math.max(0, Math.round(balance * 100) / 100)
          });
        }
      }

      setSchedule(list);
      setSummary({
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayment: Math.round((monthlyPayment * n) * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100
      });
    }
  }, []);

  const calculateAmortization = () => {
    const P = parseFloat(principal);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseInt(years) * 12;

    if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || r <= 0 || n <= 0) {
      toast.error('Please enter valid numeric inputs!');
      return;
    }

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    let balance = P;
    let totalInterest = 0;
    const list = [];

    for (let month = 1; month <= n; month++) {
      const interest = balance * r;
      const principalPaid = monthlyPayment - interest;
      balance -= principalPaid;
      totalInterest += interest;

      // Log only yearly checkpoints for cleaner dashboard view
      if (month % 12 === 0 || month === n) {
        list.push({
          year: Math.ceil(month / 12),
          payment: Math.round(monthlyPayment * 12 * 100) / 100,
          principalPaid: Math.round(principalPaid * 12 * 100) / 100,
          interestPaid: Math.round(interest * 12 * 100) / 100,
          balance: Math.max(0, Math.round(balance * 100) / 100)
        });
      }
    }

    setSchedule(list);
    setSummary({
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round((monthlyPayment * n) * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100
    });
    toast.success('Amortization schedule calculated!');
  };

  const exportExcel = () => {
    if (schedule.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(schedule);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Amortization Schedule');
    XLSX.writeFile(workbook, `amortization_schedule_${Date.now()}.xlsx`);
    toast.success('Excel amortization workbook downloaded!');
  };

  const exportPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Amortization & Loan Payment Report", 15, 20);
    doc.line(15, 24, 195, 24);

    doc.setFontSize(12);
    doc.text(`Principal Loan: $${principal}`, 15, 34);
    doc.text(`Annual Interest Rate: ${rate}%`, 15, 42);
    doc.text(`Loan Duration: ${years} Years`, 15, 50);

    doc.text(`Estimated Monthly Payment: $${summary.monthlyPayment}`, 15, 64);
    doc.text(`Total Accumulative Interest: $${summary.totalInterest}`, 15, 72);
    doc.text(`Total Investment Liability: $${summary.totalPayment}`, 15, 80);

    doc.save("amortization_report.pdf");
    toast.success("Amortization PDF report saved!");
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Amortization & Financial Planner</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compute principal debt repayments, compound growth, and amortization tables with high-res PDF & Excel spreadsheet exports.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Loan settings panel */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Loan Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Loan Principal Amount ($)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Duration Term (Years)</label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={calculateAmortization}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Calculator size={16} /> Calculate
                </button>
                <button
                  onClick={exportExcel}
                  disabled={schedule.length === 0}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} /> Excel Sheet
                </button>
              </div>
            </div>
          </div>

          {summary && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Financial Summary</h3>
              <div className="space-y-2 text-xs">
                <p className="flex justify-between"><span className="text-muted-foreground">Monthly Payment:</span> <span className="font-bold text-foreground font-mono">${summary.monthlyPayment}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Total Interest:</span> <span className="font-bold text-primary font-mono">${summary.totalInterest}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Total Payments:</span> <span className="font-bold text-foreground font-mono">${summary.totalPayment}</span></p>
              </div>
              <button
                onClick={exportPDF}
                className="w-full py-2 bg-background hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Download PDF Report
              </button>
            </div>
          )}
        </div>

        {/* Schedule Preview Grid */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Yearly Principal & Interest Breakdown
            </h2>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-4">
            {schedule.length === 0 ? (
              <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                <Landmark size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">Schedule Grid Empty</p>
                <p className="text-xs max-w-xs leading-normal">Enter parameters and run the amortization solver to generate full payment projection spreadsheets.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground border-b border-border font-bold">
                    <th className="p-3 uppercase tracking-wider">Year</th>
                    <th className="p-3 uppercase tracking-wider">Yearly Payments</th>
                    <th className="p-3 uppercase tracking-wider">Principal Paid</th>
                    <th className="p-3 uppercase tracking-wider">Interest Paid</th>
                    <th className="p-3 uppercase tracking-wider">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {schedule.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 text-foreground">
                      <td className="p-3 font-bold font-mono text-primary">{row.year}</td>
                      <td className="p-3 font-semibold font-mono">${row.payment}</td>
                      <td className="p-3 font-semibold font-mono text-emerald-500">${row.principalPaid}</td>
                      <td className="p-3 font-semibold font-mono text-red-400">${row.interestPaid}</td>
                      <td className="p-3 font-bold font-mono">${row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AmortizationScheduler;
