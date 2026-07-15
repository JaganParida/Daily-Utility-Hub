import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Braces, Download, Upload, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const SheetConverter = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileUpload({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('JSON'); // JSON, XML, SQL
  const [parsedData, setParsedData] = useState([]);
  const [output, setOutput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
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
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        setParsedData(json);
        generateOutput(json, format);
        toast.success('Spreadsheet parsed successfully!');
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse spreadsheet file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const generateOutput = (data, outputFormat) => {
    if (data.length === 0) return;

    let result = '';
    if (outputFormat === 'JSON') {
      result = JSON.stringify(data, null, 2);
    } 
    else if (outputFormat === 'XML') {
      result = '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n';
      data.forEach(row => {
        result += '  <row>\n';
        Object.keys(row).forEach(key => {
          const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_');
          result += `    <${cleanKey}>${row[key]}</${cleanKey}>\n`;
        });
        result += '  </row>\n';
      });
      result += '</rows>';
    } 
    else if (outputFormat === 'SQL') {
      const tableName = file?.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_(csv|xlsx)$/i, '') || 'my_table';
      data.forEach(row => {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const values = Object.values(row).map(v => typeof v === 'number' ? v : `'${v.toString().replace(/'/g, "\\'")}'`).join(', ');
        result += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      });
    }

    setOutput(result);
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    generateOutput(parsedData, newFormat);
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    toast.success('Copied output to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadOutput = () => {
    if (!output) return;
    const extensions = { JSON: 'json', XML: 'xml', SQL: 'sql' };
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_sheet_${Date.now()}.${extensions[format]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Converted file downloaded!');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Braces size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Spreadsheet to JSON/XML Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Upload CSV or Excel sheets, extract data client-side, and convert to structured code schemas instantly.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload & Format Selector */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upload Spreadsheet</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload Excel / CSV</p>
              <p className="text-xs text-muted-foreground">Supports .csv, .xlsx, and .xls files</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <Braces className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {parsedData.length > 0 && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Target Schema Format</h3>
              
              <div className="flex bg-background border border-border rounded-xl p-1 shrink-0">
                {['JSON', 'XML', 'SQL'].map(f => (
                  <button
                    key={f}
                    onClick={() => handleFormatChange(f)}
                    className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${format === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={copyOutput}
                  className={`py-3 px-4 font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-foreground hover:bg-muted/50'}`}
                >
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  Copy Code
                </button>
                <button
                  onClick={downloadOutput}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Code Output Panel */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Converted Schema Output
            </h2>
            {isProcessing && <RefreshCw size={16} className="animate-spin text-primary" />}
          </div>

          <textarea
            readOnly
            value={output}
            className="w-full flex-1 bg-[#0d1117] text-[#e6edf3] border-none p-6 text-xs focus:outline-none font-mono resize-none custom-scrollbar leading-relaxed min-h-[400px]"
            placeholder="Parsed spreadsheet data code will be rendered here..."
          />
        </div>

      </div>
    </div>
  );
};

export default SheetConverter;
