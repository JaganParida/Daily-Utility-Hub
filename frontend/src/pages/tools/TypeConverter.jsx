import { useState, useEffect } from 'react';
import { 
  FileJson, Copy, Check, Download, RefreshCw, Trash2, 
  Code2, CheckCircle2, AlertTriangle, Settings2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const LANGS = [
  { id: 'typescript', name: 'TypeScript' },
  { id: 'mongodb', name: 'MongoDB (Mongoose)' },
  { id: 'python', name: 'Python' },
  { id: 'sql', name: 'SQL Schema' }
];

const TypeConverter = () => {
  const [jsonInput, setJsonInput] = useState(`{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  },
  "isActive": true,
  "roles": ["admin", "editor"]
}`);

  const [activeLang, setActiveLang] = useState('typescript');
  const [outputCode, setOutputCode] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const getJsType = (val) => {
    if (val === null) return 'any';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      return `${getJsType(val[0])}[]`;
    }
    return typeof val;
  };

  const getMongooseType = (val) => {
    if (val === null) return 'Schema.Types.Mixed';
    if (typeof val === 'string') return 'String';
    if (typeof val === 'number') return 'Number';
    if (typeof val === 'boolean') return 'Boolean';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const inner = getMongooseType(val[0]);
      return `[${inner}]`;
    }
    return 'Object';
  };

  const getPyType = (val) => {
    if (val === null) return 'Any';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'int' : 'float';
    }
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'string') return 'str';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List[Any]';
      return `List[${getPyType(val[0])}]`;
    }
    return 'Any';
  };

  const getSqlType = (val) => {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'INT' : 'DECIMAL(10,2)';
    }
    if (typeof val === 'boolean') return 'BOOLEAN';
    return 'VARCHAR(255)';
  };

  // Main converter function
  const convertJson = () => {
    if (!jsonInput.trim()) {
      setOutputCode('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);

      if (activeLang === 'typescript') {
        let code = '';
        
        const generateTs = (obj, name = 'Root') => {
          let fields = '';
          const nested = [];

          Object.entries(obj).forEach(([key, val]) => {
            const isObj = val !== null && typeof val === 'object' && !Array.isArray(val);
            if (isObj) {
              const typeName = capitalize(key);
              fields += `  ${key}: ${typeName};\n`;
              nested.push({ val, typeName });
            } else {
              fields += `  ${key}: ${getJsType(val)};\n`;
            }
          });

          code += `interface ${name} {\n${fields}}\n\n`;
          nested.forEach((item) => generateTs(item.val, item.typeName));
        };

        generateTs(parsed);
        setOutputCode(code.trim());
      } 
      
      else if (activeLang === 'mongodb') {
        let code = '';

        const generateMongoose = (obj, name = 'Root') => {
          let fields = '';
          const nested = [];

          Object.entries(obj).forEach(([key, val]) => {
            const isObj = val !== null && typeof val === 'object' && !Array.isArray(val);
            if (isObj) {
              const subSchemaName = `${capitalize(key)}Schema`;
              fields += `  ${key}: ${subSchemaName},\n`;
              nested.push({ val, typeName: subSchemaName });
            } else if (Array.isArray(val)) {
              if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
                const subSchemaName = `${capitalize(key)}Schema`;
                fields += `  ${key}: [${subSchemaName}],\n`;
                nested.push({ val: val[0], typeName: subSchemaName });
              } else {
                fields += `  ${key}: [${getMongooseType(val[0])}],\n`;
              }
            } else {
              fields += `  ${key}: ${getMongooseType(val)},\n`;
            }
          });

          // Strip trailing comma
          fields = fields.replace(/,\n$/, '\n');
          code = `const ${name}Schema = new mongoose.Schema({\n${fields}});\n\n` + code;
          nested.forEach((item) => generateMongoose(item.val, item.typeName));
        };

        generateMongoose(parsed);
        setOutputCode(code.trim());
      }

      else if (activeLang === 'python') {
        let code = 'from typing import List, Any\nfrom dataclasses import dataclass\n\n';

        const generatePy = (obj, name = 'Root') => {
          let fields = '';
          const nested = [];

          Object.entries(obj).forEach(([key, val]) => {
            const isObj = val !== null && typeof val === 'object' && !Array.isArray(val);
            if (isObj) {
              const typeName = capitalize(key);
              fields += `    ${key}: '${typeName}'\n`;
              nested.push({ val, typeName });
            } else {
              fields += `    ${key}: ${getPyType(val)}\n`;
            }
          });

          code += `@dataclass\nclass ${name}:\n${fields || '    pass'}\n\n`;
          nested.forEach((item) => generatePy(item.val, item.typeName));
        };

        generatePy(parsed);
        setOutputCode(code.trim());
      }

      else if (activeLang === 'sql') {
        let fields = '  id INT AUTO_INCREMENT PRIMARY KEY,\n';
        
        Object.entries(parsed).forEach(([key, val]) => {
          if (key === 'id') return; // Skip default primary key
          if (typeof val === 'object' && val !== null) return; // Skip complex relations for simple SQL flat columns
          fields += `  ${key} ${getSqlType(val)},\n`;
        });

        // Strip trailing comma
        fields = fields.replace(/,\n$/, '\n');
        const code = `CREATE TABLE users (\n${fields});`;
        setOutputCode(code);
      }

    } catch (err) {
      setError(err.message);
      setOutputCode('');
    }
  };

  useEffect(() => {
    const timer = setTimeout(convertJson, 300);
    return () => clearTimeout(timer);
  }, [jsonInput, activeLang]);

  const handleCopy = () => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success('Generated code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setJsonInput('');
    setOutputCode('');
    setError(null);
    toast.success('Workspace cleared');
  };

  const downloadCode = () => {
    const extensions = {
      typescript: 'ts',
      mongodb: 'js',
      python: 'py',
      sql: 'sql'
    };
    const ext = extensions[activeLang] || 'txt';
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded schema.${ext}`);
  };

  const isInputEmpty = !jsonInput.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">JSON to Types & Schema Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Paste JSON payload data to instantly map out TypeScript interfaces, Go structures, Python dataclasses, or SQL schemas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        
        {/* Left: Input Panel */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[520px]">
          <div className="flex justify-between items-center mb-6 border-b border-border/80 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileJson size={16} /> JSON Input
            </h3>
            
            <button
              onClick={clear}
              disabled={isInputEmpty}
              className="text-xs px-3.5 py-2 bg-red-500/10 disabled:bg-muted/10 text-red-500 disabled:text-muted-foreground hover:bg-red-500/20 border border-red-500/20 disabled:border-border/50 font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          <div className="relative flex-1 flex flex-col">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full flex-1 p-4 bg-background/40 border border-border/80 rounded-xl resize-none font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 custom-scrollbar min-h-[360px] leading-relaxed shadow-inner"
              placeholder="Paste raw JSON here..."
              spellCheck="false"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono flex items-center gap-2"
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span>Invalid JSON: {error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Output/Target code Panel */}
        <div className="w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[520px] justify-between">
          <div className="space-y-6">
            {/* Lang switcher */}
            <div className="flex overflow-x-auto md:grid md:grid-cols-4 scrollbar-none whitespace-nowrap p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
              {LANGS.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveLang(lang.id)}
                  className={`flex-1 md:flex-none relative z-10 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0 px-4 md:px-0 ${
                    activeLang === lang.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeLang === lang.id && (
                    <motion.div
                      layoutId="lang-converter-active"
                      className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Generated Code Area */}
            <div className="relative border border-border/80 rounded-xl overflow-hidden bg-background/30 flex flex-col min-h-[320px]">
              <div className="px-4 py-2.5 border-b border-border/80 bg-muted/20 text-xs font-bold text-muted-foreground flex justify-between items-center">
                <span>GENERATED SCHEMA ({activeLang.toUpperCase()})</span>
                <button
                  onClick={handleCopy}
                  disabled={!outputCode}
                  className="text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 overflow-auto custom-scrollbar font-mono text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap max-h-[340px]">
                {outputCode || '// Generated type definitions will appear here...'}
              </pre>
            </div>
          </div>

          {/* Export Actions Footer */}
          <div className="pt-6 border-t border-border/50 mt-6">
            <button
              onClick={downloadCode}
              disabled={!outputCode}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Download size={15} /> Download Generated Schema File
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default TypeConverter;
