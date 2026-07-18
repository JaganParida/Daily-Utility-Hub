import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Layers, Download, Upload, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const DataCleaner = () => {
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
  const [cleanLog, setCleanLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setCleanLog([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bytes = new Uint8Array(event.target.result);
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        setData(json);
        toast.success('Spreadsheet loaded!');
      } catch (err) {
        toast.error('Failed to parse spreadsheet file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const cleanSpreadsheet = () => {
    if (data.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const initialCount = data.length;
      const log = [];

      // 1. Deduplicate by converting to JSON strings and checking uniqueness
      const uniqueMap = new Map();
      data.forEach(row => {
        const key = JSON.stringify(row);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, row);
        }
      });
      const deduplicated = Array.from(uniqueMap.values());
      const duplicatesRemoved = initialCount - deduplicated.length;
      if (duplicatesRemoved > 0) {
        log.push(`Removed ${duplicatesRemoved} duplicate row(s).`);
      }

      // 2. Trim whitespace & handle empty values
      let spacesTrimmed = 0;
      let nullsReplaced = 0;
      const cleaned = deduplicated.map(row => {
        const newRow = {};
        Object.keys(row).forEach(key => {
          let val = row[key];
          if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed !== val) {
              val = trimmed;
              spacesTrimmed++;
            }
            if (trimmed === '') {
              val = 'N/A';
              nullsReplaced++;
            }
          }
          newRow[key] = val;
        });
        return newRow;
      });

      if (spacesTrimmed > 0) log.push(`Trimmed leading/trailing spaces in ${spacesTrimmed} cell(s).`);
      if (nullsReplaced > 0) log.push(`Replaced ${nullsReplaced} empty cell(s) with "N/A".`);
      if (log.length === 0) log.push('No anomalies detected. Spreadsheet is already clean!');

      setData(cleaned);
      setCleanLog(log);
      setIsProcessing(false);
      toast.success('Deduplication & cleaning complete!');
    }, 1000);
  };

  const downloadCleanedFile = () => {
    if (data.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned_${file?.name || 'spreadsheet.xlsx'}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Cleaned spreadsheet workbook downloaded!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Spreadsheet Deduplicator & Cleaner</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Normalize columns, prune empty cells, strip leading/trailing spaces, and filter duplicates in CSV or Excel sheets locally.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Column */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select File</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload Workbook</p>
              <p className="text-xs text-muted-foreground">Supports .csv, .xlsx, and .xls files</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <Layers className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {data.length > 0 && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sanitation Controls</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={cleanSpreadsheet}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Clean Sheet'}
                </button>
                <button
                  onClick={downloadCleanedFile}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clean Log Board */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Sanitation Audit Log
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {cleanLog.length === 0 ? (
              <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                <Layers size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Operations Executed</p>
                <p className="text-xs max-w-xs leading-normal">Load a sheet and trigger the clean operation to check and verify rows and columns.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cleanLog.map((log, idx) => (
                  <div key={idx} className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-xs font-bold text-foreground">{log}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataCleaner;
