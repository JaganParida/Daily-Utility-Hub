import { useState, useMemo } from 'react';
import { Percent, Receipt, Plus, Trash2, IndianRupee, FileText, CheckCircle2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const GstCalculator = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Product 1', price: 1000, qty: 1, gstRate: 18, isInclusive: false }
  ]);
  const [interState, setInterState] = useState(false); // If true, use IGST instead of CGST+SGST

  const GST_RATES = [0, 5, 12, 18, 28];

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: `Product ${items.length + 1}`,
      price: 0,
      qty: 1,
      gstRate: 18,
      isInclusive: false
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const invoice = useMemo(() => {
    let subTotal = 0;
    let totalTaxAmount = 0;
    let grandTotal = 0;
    const itemsData = [];

    items.forEach(item => {
      const { price, qty, gstRate, isInclusive } = item;
      const baseTotal = (parseFloat(price) || 0) * (parseFloat(qty) || 1);
      
      let itemSubTotal = 0;
      let taxAmount = 0;
      let itemTotal = 0;

      if (isInclusive) {
        // Price includes GST
        // Original Price = Total / (1 + GST%)
        itemSubTotal = baseTotal / (1 + (gstRate / 100));
        taxAmount = baseTotal - itemSubTotal;
        itemTotal = baseTotal;
      } else {
        // Price excludes GST
        itemSubTotal = baseTotal;
        taxAmount = baseTotal * (gstRate / 100);
        itemTotal = baseTotal + taxAmount;
      }

      subTotal += itemSubTotal;
      totalTaxAmount += taxAmount;
      grandTotal += itemTotal;

      itemsData.push({
        ...item,
        itemSubTotal,
        taxAmount,
        itemTotal
      });
    });

    return {
      subTotal,
      totalTaxAmount,
      grandTotal,
      itemsData
    };
  }, [items]);

  const copyInvoiceText = () => {
    const text = `Invoice Summary\nSubtotal: ${formatCurrency(invoice.subTotal)}\nTotal GST: ${formatCurrency(invoice.totalTaxAmount)}\nGrand Total: ${formatCurrency(invoice.grandTotal)}`;
    navigator.clipboard.writeText(text);
    toast.success('Invoice Summary copied');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Percent size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced GST Calculator</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Build multi-item invoices, extract inclusive taxes, and view detailed CGST/SGST breakdowns.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Interactive Invoice Builder */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[600px]">
          
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <FileText size={16} className="text-primary" /> Invoice Items
            </h2>
            <button 
              onClick={addItem}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="p-2 md:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-background border border-border p-4 rounded-xl shadow-sm relative group"
                >
                  <div className="absolute -left-2 -top-2 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10">
                    {index + 1}
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className={`absolute -right-2 -top-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all shadow-md z-10 ${items.length > 1 ? 'bg-rose-500 hover:bg-rose-600 scale-100' : 'bg-muted scale-0'}`}
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Item Name</label>
                      <input 
                        type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Product Name"
                      />
                    </div>
                    
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Price (₹)</label>
                      <input 
                        type="number" value={item.price || ''} onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="0.00" min="0" step="0.01"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Qty</label>
                      <input 
                        type="number" value={item.qty || ''} onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="1" min="1"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">GST %</label>
                      <select 
                        value={item.gstRate} onChange={(e) => updateItem(item.id, 'gstRate', Number(e.target.value))}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {GST_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}%</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group/toggle">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={item.isInclusive} onChange={(e) => updateItem(item.id, 'isInclusive', e.target.checked)} className="sr-only" />
                        <div className={`w-8 h-4 rounded-full transition-colors ${item.isInclusive ? 'bg-primary' : 'bg-muted border border-border'}`}></div>
                        <div className={`absolute left-0.5 w-3 h-3 rounded-full bg-background transition-transform ${item.isInclusive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground group-hover/toggle:text-foreground transition-colors uppercase tracking-wider">
                        {item.isInclusive ? 'Tax Inclusive (MRP)' : 'Tax Exclusive (Base)'}
                      </span>
                    </label>

                    <div className="text-right">
                      <span className="text-sm font-black text-foreground">{formatCurrency(invoice.itemsData.find(i => i.id === item.id)?.itemTotal || 0)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Invoice Summary */}
        <div className="w-full lg:w-[450px] shrink-0 lg:sticky lg:top-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
            
            {/* receipt cutout styling */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgNSwxMCAxMCwwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-20"></div>

            <div className="p-6 bg-muted/20 border-b border-border flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-wider text-foreground flex items-center gap-2"><Receipt size={18} className="text-primary"/> Invoice Summary</h3>
              
              {/* Inter/Intra state toggle */}
              <label className="flex items-center gap-2 cursor-pointer group" title="Toggle IGST vs CGST/SGST">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${!interState ? 'text-primary' : 'text-muted-foreground'}`}>Intra</span>
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} className="sr-only" />
                  <div className="w-8 h-4 rounded-full bg-muted border border-border"></div>
                  <div className={`absolute left-0.5 w-3 h-3 rounded-full bg-primary transition-transform ${interState ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${interState ? 'text-primary' : 'text-muted-foreground'}`}>Inter</span>
              </label>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Calculations */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Total Base Amount</span>
                  <span className="font-bold text-foreground">{formatCurrency(invoice.subTotal)}</span>
                </div>
                
                <div className="w-full h-px bg-border border-dashed"></div>

                {!interState ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Total CGST</span>
                      <span className="font-bold text-foreground">{formatCurrency(invoice.totalTaxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Total SGST</span>
                      <span className="font-bold text-foreground">{formatCurrency(invoice.totalTaxAmount / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Total IGST</span>
                    <span className="font-bold text-foreground">{formatCurrency(invoice.totalTaxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground font-bold">Total Tax Amount</span>
                  <span className="font-black text-rose-500">{formatCurrency(invoice.totalTaxAmount)}</span>
                </div>
              </div>

              {/* Grand Total Container */}
              <div className="bg-primary border border-primary/20 p-5 rounded-xl shadow-inner text-primary-foreground relative overflow-hidden mt-4">
                <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 text-primary-foreground/10" />
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1">Grand Total</h4>
                <p className="text-3xl font-black">{formatCurrency(invoice.grandTotal)}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-primary-foreground/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                  <CheckCircle2 size={12}/> Tax {items.every(i => i.isInclusive) ? 'Inclusive' : items.every(i => !i.isInclusive) ? 'Exclusive' : 'Mixed'}
                </div>
              </div>
              
              <button 
                onClick={copyInvoiceText}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl border border-border transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Copy size={14}/> Copy Summary
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GstCalculator;
