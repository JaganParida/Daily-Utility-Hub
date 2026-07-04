import { useState, useRef } from 'react';
import { Layers, Download, Upload, Trash2, CheckCircle2, Split } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const ExcelMergeSplit = () => {
  const [mode, setMode] = useState('merge'); // merge, split
  const [files, setFiles] = useState([]);
  const [splitSheets, setSplitSheets] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    
    if (mode === 'merge') {
      const readPromises = uploadedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              resolve({
                name: file.name,
                sheetName: sheetName.substring(0, 30), // Excel limit is 31 chars
                worksheet: worksheet
              });
            } catch (err) {
              resolve(null);
            }
          };
          reader.readAsArrayBuffer(file);
        });
      });

      Promise.all(readPromises).then(results => {
        const valid = results.filter(Boolean);
        setFiles(prev => [...prev, ...valid]);
        toast.success(`Loaded ${valid.length} sheets for merging.`);
      });
    } 
    else {
      // Split Mode: Read sheets from a single workbook
      const file = uploadedFiles[0];
      if (!file) return;

      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets = workbook.SheetNames.map(name => ({
            name: name,
            worksheet: workbook.Sheets[name]
          }));
          setSplitSheets(sheets);
          toast.success(`Identified ${sheets.length} sheets to split!`);
        } catch (err) {
          toast.error('Failed to parse workbook.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = null;
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const executeMerge = () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const newWorkbook = XLSX.utils.book_new();
      files.forEach((file, idx) => {
        // Append each sheet into the single workbook
        XLSX.utils.book_append_sheet(newWorkbook, file.worksheet, `${idx + 1}_${file.sheetName}`);
      });

      const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_workbook_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setIsProcessing(false);
      toast.success('Workbooks merged and downloaded!');
    }, 1000);
  };

  const executeSplit = async () => {
    if (splitSheets.length === 0) return;
    setIsProcessing(true);

    const zip = new JSZip();
    splitSheets.forEach(sheet => {
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, sheet.worksheet, sheet.name);
      const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
      zip.file(`${sheet.name}.xlsx`, excelBuffer);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `split_sheets_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setIsProcessing(false);
    toast.success('ZIP archive containing split sheets downloaded!');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Split size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Excel File Merger & Splitter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Combine sheets from multiple spreadsheet files, or split workbook sheets into separate Excel files client-side.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Settings Column */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Mode</label>
            <div className="flex bg-background border border-border rounded-xl p-1 shrink-0">
              <button
                onClick={() => { setMode('merge'); setFiles([]); setSplitSheets([]); }}
                className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${mode === 'merge' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Merge Files
              </button>
              <button
                onClick={() => { setMode('split'); setFiles([]); setSplitSheets([]); }}
                className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${mode === 'split' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Split Sheets
              </button>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">
                {mode === 'merge' ? 'Upload Spreadsheets' : 'Upload Workbook'}
              </p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" multiple={mode === 'merge'} onChange={handleFileUpload} />
            </div>

            <div className="pt-2">
              {mode === 'merge' && files.length > 0 && (
                <button
                  onClick={executeMerge}
                  disabled={isProcessing}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Merge to Single Workbook
                </button>
              )}
              {mode === 'split' && splitSheets.length > 0 && (
                <button
                  onClick={executeSplit}
                  disabled={isProcessing}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Split Sheets to ZIP
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Workspace */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              {mode === 'merge' ? 'Selected Sheets to Merge' : 'Identified Sheets to Split'}
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {mode === 'merge' ? (
              files.length === 0 ? (
                <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                  <Layers size={48} className="text-muted-foreground/35" />
                  <p className="text-sm font-bold">Workspace Empty</p>
                  <p className="text-xs max-w-xs leading-normal">Upload spreadsheets to compile them into a unified multi-sheet workbook.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="p-4 border border-border bg-muted/20 rounded-xl relative group flex flex-col justify-between min-h-[100px]">
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-4 right-4 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div>
                        <p className="text-xs font-bold text-foreground truncate pr-6">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sheet: "{file.sheetName}"</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                        <CheckCircle2 size={12} /> Staged for Merge
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              splitSheets.length === 0 ? (
                <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                  <Split size={48} className="text-muted-foreground/35" />
                  <p className="text-sm font-bold">No Workbook Loaded</p>
                  <p className="text-xs max-w-xs leading-normal">Upload a multi-sheet spreadsheet file to audit and split pages.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {splitSheets.map((sheet, idx) => (
                    <div key={idx} className="p-4 border border-border bg-muted/20 rounded-xl relative group flex flex-col justify-between min-h-[80px]">
                      <div>
                        <p className="text-xs font-bold text-foreground truncate">Sheet Name: "{sheet.name}"</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Ready for split export</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExcelMergeSplit;
