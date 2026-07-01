import { useState } from 'react';
import { ArrowRightLeft, Copy, Check, Hash, Globe, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EncoderDecoder = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('base64'); // 'base64' or 'url'
  const [action, setAction] = useState('encode'); // 'encode' or 'decode'
  const [copied, setCopied] = useState(false);

  const processText = (textToProcess = input, currentAction = action, currentMode = mode) => {
    if (!textToProcess) {
      setOutput('');
      return;
    }

    try {
      let result = '';
      if (currentMode === 'base64') {
        if (currentAction === 'encode') {
          result = btoa(unescape(encodeURIComponent(textToProcess)));
        } else {
          result = decodeURIComponent(escape(atob(textToProcess)));
        }
      } else if (currentMode === 'url') {
        if (currentAction === 'encode') {
          result = encodeURIComponent(textToProcess);
        } else {
          result = decodeURIComponent(textToProcess);
        }
      }
      setOutput(result);
    } catch (error) {
      setOutput('Error: Invalid input for decoding');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    processText(val, action, mode);
  };

  const swapAction = () => {
    const newAction = action === 'encode' ? 'decode' : 'encode';
    setAction(newAction);
    setInput(output); // Output becomes new input
    processText(output, newAction, mode); // Process immediately
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    processText(input, action, newMode);
  };

  const copyToClipboard = () => {
    if (!output || output.startsWith('Error:')) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-lg shadow-sm">
            <ArrowRightLeft size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Encoder / Decoder</h1>
            <p className="text-muted-foreground mt-1 text-sm">Convert text to Base64 or URL-encoded formats instantly.</p>
          </div>
        </div>

        <div className="flex bg-muted/50 p-1 rounded-xl">
          <button 
            onClick={() => changeMode('base64')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'base64' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Hash size={16} /> Base64
          </button>
          <button 
            onClick={() => changeMode('url')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'url' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Globe size={16} /> URL
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 flex-1 min-h-[500px] items-center">
        
        {/* Input Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {action === 'encode' ? 'Raw Text (Input)' : `${mode === 'base64' ? 'Base64' : 'URL'} (Input)`}
            </h3>
            <button onClick={() => { setInput(''); setOutput(''); }} className="text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition-colors flex items-center gap-1">
              <Trash2 size={12}/> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={handleInputChange}
            className="w-full flex-1 bg-background border-none p-4 text-sm text-foreground focus:outline-none font-mono resize-none custom-scrollbar"
            spellCheck="false"
            placeholder={`Paste text to ${action} here...`}
          />
        </div>

        {/* Swap Button */}
        <div className="flex flex-col items-center gap-2 px-2 hidden lg:flex">
           <button 
             onClick={swapAction}
             title="Swap input and output"
             className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:scale-110 active:scale-95 transition-all"
           >
             <ArrowRightLeft size={20} />
           </button>
           <span className="text-xs font-bold text-muted-foreground uppercase">{action}</span>
        </div>

        {/* Output Area */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {action === 'encode' ? `${mode === 'base64' ? 'Base64' : 'URL'} (Output)` : 'Raw Text (Output)'}
            </h3>
            <button 
               onClick={copyToClipboard}
               disabled={!output || output.startsWith('Error:')}
               className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
               {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            className={`w-full flex-1 bg-background border-none p-4 text-sm focus:outline-none font-mono resize-none custom-scrollbar ${output.startsWith('Error:') ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}
            spellCheck="false"
            placeholder="Result will appear here..."
          />
        </div>

      </div>

      {/* Mobile Swap Button */}
      <div className="mt-6 flex lg:hidden justify-center">
         <button 
           onClick={swapAction}
           className="px-6 py-3 bg-yellow-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-yellow-500/30 active:scale-95 transition-all"
         >
           <ArrowRightLeft size={20} /> Swap to {action === 'encode' ? 'Decode' : 'Encode'}
         </button>
      </div>

    </div>
  );
};

export default EncoderDecoder;
