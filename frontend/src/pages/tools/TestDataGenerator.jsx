import { useState } from 'react';
import { Layers, Download, Plus, Trash2, CheckCircle2, Play, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const COLUMNS_PRESETS = [
  { id: 'id', name: 'Sequential ID' },
  { id: 'name', name: 'Full Name' },
  { id: 'email', name: 'Email Address' },
  { id: 'phone', name: 'Phone Number' },
  { id: 'company', name: 'Company Name' },
  { id: 'city', name: 'City' },
  { id: 'date', name: 'Random Date' }
];

const MOCK_NAMES = ['Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Costanza', 'Helen Parr'];
const MOCK_COMPANIES = ['Acme Corp', 'Stark Industries', 'Wayne Enterprises', 'Globex Corporation', 'Initech LLC', 'Umbrella Corp'];
const MOCK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Seattle', 'Miami', 'Boston', 'Austin'];

const TestDataGenerator = () => {
  const [rowCount, setRowCount] = useState(25);
  const [selectedColumns, setSelectedColumns] = useState(['id', 'name', 'email', 'company']);
  const [generatedData, setGeneratedData] = useState([]);
  const [format, setFormat] = useState('Excel');

  const addColumn = (colId) => {
    if (selectedColumns.includes(colId)) return;
    setSelectedColumns([...selectedColumns, colId]);
  };

  const removeColumn = (colId) => {
    setSelectedColumns(selectedColumns.filter(c => c !== colId));
  };

  const generateData = () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to generate!');
      return;
    }

    const rows = [];
    for (let i = 1; i <= rowCount; i++) {
      const row = {};
      selectedColumns.forEach(col => {
        if (col === 'id') row['ID'] = i;
        if (col === 'name') row['Full Name'] = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
        if (col === 'email') {
          const name = row['Full Name'] ? row['Full Name'].toLowerCase().replace(' ', '.') : `user_${i}`;
          row['Email Address'] = `${name}@example.com`;
        }
        if (col === 'phone') row['Phone Number'] = `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (col === 'company') row['Company Name'] = MOCK_COMPANIES[Math.floor(Math.random() * MOCK_COMPANIES.length)];
        if (col === 'city') row['City'] = MOCK_CITIES[Math.floor(Math.random() * MOCK_CITIES.length)];
        if (col === 'date') {
          const date = new Date(Date.now() - Math.random() * 10000000000);
          row['Date'] = date.toISOString().split('T')[0];
        }
      });
      rows.push(row);
    }

    setGeneratedData(rows);
    toast.success(`Generated ${rowCount} mock records!`);
  };

  const downloadData = () => {
    if (generatedData.length === 0) return;

    if (format === 'Excel') {
      const worksheet = XLSX.utils.json_to_sheet(generatedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mock Data');
      XLSX.writeFile(workbook, `mock_dataset_${Date.now()}.xlsx`);
    } else {
      const json = JSON.stringify(generatedData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mock_dataset_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    toast.success('Mock dataset downloaded successfully!');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Hash size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Random Test Data Generator</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Compile high-quality custom mock datasets with customizable schemas and export them to Excel, CSV, or JSON.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Generator Controls */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Number of Rows</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Configure Schema Columns</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedColumns.map(col => {
                    const label = COLUMNS_PRESETS.find(p => p.id === col)?.name || col;
                    return (
                      <span key={col} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-semibold">
                        {label}
                        <button onClick={() => removeColumn(col)} className="hover:text-red-500 font-bold ml-1">&times;</button>
                      </span>
                    );
                  })}
                </div>
                
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Add Column Fields:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMNS_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addColumn(p.id)}
                      disabled={selectedColumns.includes(p.id)}
                      className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground border border-border text-xs rounded-lg transition-all disabled:opacity-50"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              <div>
                <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider font-sans">Export Format</label>
                <div className="flex bg-background border border-border rounded-xl p-1 shrink-0">
                  {['Excel', 'JSON'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={generateData}
                  className="py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} /> Generate Data
                </button>
                <button
                  onClick={downloadData}
                  disabled={generatedData.length === 0}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Preview */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              Mock Dataset Preview
            </h2>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-4">
            {generatedData.length === 0 ? (
              <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                <Layers size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">Preview Grid Empty</p>
                <p className="text-xs max-w-xs leading-normal">Configure columns and rows in the side panel to generate synthetic test datasets.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground border-b border-border font-bold">
                    {Object.keys(generatedData[0]).map(col => (
                      <th key={col} className="p-3 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {generatedData.slice(0, 10).map((row, idx) => (
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
    </div>
  );
};

export default TestDataGenerator;
