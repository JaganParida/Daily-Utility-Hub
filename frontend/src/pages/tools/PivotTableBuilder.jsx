import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { TrendingUp, Download, Upload, RefreshCw, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PivotTableBuilder = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileUpload({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [pivotRow, setPivotRow] = useState('');
  const [pivotValue, setPivotValue] = useState('');
  const [pivotData, setPivotData] = useState([]);
  const [chartType, setChartType] = useState('bar'); // bar, line
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bytes = new Uint8Array(event.target.result);
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        if (json.length > 0) {
          setData(json);
          const cols = Object.keys(json[0]);
          setColumns(cols);
          setPivotRow(cols[0]);
          if (cols.length > 1) setPivotValue(cols[1]);
        }
        toast.success('Spreadsheet data loaded!');
      } catch (err) {
        toast.error('Failed to parse sheet data.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const calculatePivot = () => {
    if (data.length === 0 || !pivotRow || !pivotValue) {
      toast.error('Please configure pivot columns first!');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const summaryMap = new Map();
      data.forEach(row => {
        const key = row[pivotRow] || 'Unknown';
        const rawVal = parseFloat(row[pivotValue]);
        const val = isNaN(rawVal) ? 1 : rawVal; // Count if not numeric, sum otherwise

        if (summaryMap.has(key)) {
          summaryMap.set(key, summaryMap.get(key) + val);
        } else {
          summaryMap.set(key, val);
        }
      });

      const pivotList = Array.from(summaryMap.entries()).map(([label, value]) => ({
        label: label.toString(),
        value: Math.round(value * 100) / 100
      })).slice(0, 8); // Limit to top 8 rows for clean visualization

      setPivotData(pivotList);
      setIsProcessing(false);
      toast.success('Pivot summary calculated!');
    }, 800);
  };

  const downloadCSV = () => {
    if (pivotData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(pivotData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Summary');
    XLSX.writeFile(workbook, `pivot_summary_${Date.now()}.xlsx`);
    toast.success('Pivot workbook downloaded!');
  };

  // SVG Chart rendering helper calculations
  const maxVal = pivotData.length > 0 ? Math.max(...pivotData.map(d => d.value)) : 100;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <TrendingUp size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Pivot Table & Chart Builder</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Group rows, aggregate values, compile instant pivot summaries, and visualize spreadsheet trends using custom SVG charts.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Configure Panel */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Source Workbook</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload File</p>
              <p className="text-xs text-muted-foreground">CSV or Excel workbook</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <TrendingUp className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {columns.length > 0 && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pivot Setup</h3>
              
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Group By (Row labels)</label>
                <select
                  value={pivotRow}
                  onChange={(e) => setPivotRow(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Aggregate (Sum value)</label>
                <select
                  value={pivotValue}
                  onChange={(e) => setPivotValue(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={calculatePivot}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Build Pivot'}
                </button>
                <button
                  onClick={downloadCSV}
                  disabled={pivotData.length === 0}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Display */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Pivot Chart & Data Dashboard
            </h2>
            {pivotData.length > 0 && (
              <div className="flex bg-background border border-border rounded-lg p-0.5">
                {['bar', 'line'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 font-bold rounded ${chartType === type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {pivotData.length > 0 ? (
              <div className="space-y-8">
                {/* SVG Visual Chart */}
                <div className="bg-muted/10 border border-border/50 rounded-2xl p-6 flex flex-col justify-center items-center">
                  <svg className="w-full max-w-xl h-64 overflow-visible" viewBox="0 0 500 240">
                    {/* Render Bar Chart */}
                    {chartType === 'bar' && (
                      pivotData.map((item, idx) => {
                        const barWidth = 35;
                        const spacing = 15;
                        const x = 50 + idx * (barWidth + spacing);
                        const scaleHeight = maxVal > 0 ? (item.value / maxVal) * 150 : 0;
                        const y = 200 - scaleHeight;
                        
                        return (
                          <g key={idx} className="group">
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={scaleHeight}
                              fill="url(#indigoGrad)"
                              rx="4"
                              className="transition-all duration-300 hover:fill-primary"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              textAnchor="middle"
                              fill="currentColor"
                              className="text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {item.value}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y="218"
                              textAnchor="middle"
                              fill="currentColor"
                              className="text-[9px] text-muted-foreground font-semibold"
                            >
                              {item.label.substring(0, 5)}
                            </text>
                          </g>
                        );
                      })
                    )}

                    {/* Render Line Chart */}
                    {chartType === 'line' && (
                      <g>
                        {/* Line Path */}
                        <path
                          d={pivotData.map((item, idx) => {
                            const x = 50 + idx * 55;
                            const scaleHeight = maxVal > 0 ? (item.value / maxVal) * 150 : 0;
                            const y = 200 - scaleHeight;
                            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                          className="transition-all duration-500"
                        />
                        {/* Nodes */}
                        {pivotData.map((item, idx) => {
                          const x = 50 + idx * 55;
                          const scaleHeight = maxVal > 0 ? (item.value / maxVal) * 150 : 0;
                          const y = 200 - scaleHeight;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#6366f1"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="transition-all duration-200 hover:scale-125 origin-center cursor-pointer"
                            />
                          );
                        })}
                      </g>
                    )}

                    <defs>
                      <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Summarized Pivot Data Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground border-b border-border font-bold">
                        <th className="p-3 uppercase tracking-wider">{pivotRow}</th>
                        <th className="p-3 uppercase tracking-wider">{pivotValue} (Total)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {pivotData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 text-foreground">
                          <td className="p-3 font-semibold">{row.label}</td>
                          <td className="p-3 font-mono font-bold text-primary">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => !file && fileInputRef.current?.click()}
                className={`text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full ${!file ? 'cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all' : ''}`}
              >
                <BarChart2 size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">{!file ? 'No Spreadsheet Loaded' : 'No Summary Compiled'}</p>
                <p className="text-xs max-w-xs leading-normal">
                  {!file ? 'Click here to load a CSV/Excel sheet to start pivot reporting.' : 'Configure columns and aggregate functions to display interactive spreadsheet visual dashboards.'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PivotTableBuilder;
