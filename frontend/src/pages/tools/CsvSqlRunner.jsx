import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Database, Play, Download, Upload, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const CsvSqlRunner = () => {
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
  const [sql, setSql] = useState('SELECT * WHERE age > 25 LIMIT 5');
  const [results, setResults] = useState([]);
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
          setColumns(Object.keys(json[0]));
          setResults(json.slice(0, 5)); // Initial preview
          // Prepopulate template table name
          const tblName = uploadedFile.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_(csv|xlsx)$/i, '');
          setSql(`SELECT * FROM \`${tblName}\` WHERE \`Age\` > 25 LIMIT 5`);
        }
        toast.success('Spreadsheet loaded successfully!');
      } catch (err) {
        toast.error('Failed to parse sheet file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const executeQuery = () => {
    if (data.length === 0) {
      toast.error('Please upload a spreadsheet first!');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const query = sql.trim().toLowerCase();
        if (!query.startsWith('select')) {
          throw new Error('Only SELECT queries are supported.');
        }

        // Basic SQL parser
        let filtered = [...data];

        // 1. Where Clause
        const whereMatch = sql.match(/where\s+(.*?)(?:\s+limit|$)/i);
        if (whereMatch) {
          const condition = whereMatch[1];
          // E.g., `Age` > 25 or age > 25
          const condParts = condition.match(/`?(\w+)`?\s*([>=<]+)\s*(.*)/);
          if (condParts) {
            const col = condParts[1];
            const op = condParts[2];
            const rawVal = condParts[3].replace(/['"`]/g, '').trim();

            filtered = filtered.filter(row => {
              const cellVal = row[col];
              if (cellVal === undefined) return false;
              
              const valNum = parseFloat(rawVal);
              const cellNum = parseFloat(cellVal);

              if (!isNaN(valNum) && !isNaN(cellNum)) {
                if (op === '>') return cellNum > valNum;
                if (op === '<') return cellNum < valNum;
                if (op === '>=') return cellNum >= valNum;
                if (op === '<=') return cellNum <= valNum;
                if (op === '=') return cellNum === valNum;
              } else {
                if (op === '=') return cellVal.toString().toLowerCase() === rawVal.toLowerCase();
              }
              return false;
            });
          }
        }

        // 2. Select columns
        const selectColsMatch = sql.match(/select\s+(.*?)\s+from/i);
        let selectedCols = columns;
        if (selectColsMatch) {
          const colsStr = selectColsMatch[1].trim();
          if (colsStr !== '*') {
            selectedCols = colsStr.split(',').map(c => c.replace(/[`']/g, '').trim());
          }
        }

        // 3. Limit
        const limitMatch = sql.match(/limit\s+(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          filtered = filtered.slice(0, limit);
        }

        // Project results
        const projected = filtered.map(row => {
          const newRow = {};
          selectedCols.forEach(col => {
            if (row[col] !== undefined) newRow[col] = row[col];
          });
          return newRow;
        });

        setResults(projected);
        toast.success(`Query returned ${projected.length} rows.`);
      } catch (err) {
        toast.error(err.message || 'SQL Syntax Error. Check column names.');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Query Result');
    XLSX.writeFile(workbook, `sql_result_${Date.now()}.xlsx`);
    toast.success('Query output downloaded as Excel/CSV!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Database size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">SQL Sheet Query Runner</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Run local SQL database queries against your spreadsheets and download filtered results.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Editor controls */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-56">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Database size={16} /> SQL Query Editor
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={executeQuery}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                  Run SQL Query
                </button>
              </div>
            </div>
            
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full flex-1 bg-background border-none p-6 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Results Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Query Execution Output</h3>
              {results.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download size={14} /> Export Results
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-4">
              {results.length === 0 ? (
                <div 
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full ${!file ? 'cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all' : ''}`}
                >
                  <Layers size={48} className="text-muted-foreground/35" />
                  <p className="text-sm font-bold">{!file ? 'No Spreadsheet Loaded' : 'Query Result Empty'}</p>
                  <p className="text-xs max-w-xs leading-normal">
                    {!file ? 'Click here to load a CSV/Excel sheet to start querying.' : 'Write a query and check columns in real time.'}
                  </p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b border-border font-bold">
                      {Object.keys(results[0]).map(col => (
                        <th key={col} className="p-3 uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 text-foreground">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-3 font-semibold">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Upload File Panel */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Database Table</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload Source</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
                <p className="text-xs font-bold text-foreground truncate">Table: {file.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_(csv|xlsx)$/i, '')}</p>
                <div className="flex flex-wrap gap-1">
                  {columns.map(col => (
                    <span key={col} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-mono">{col}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CsvSqlRunner;
