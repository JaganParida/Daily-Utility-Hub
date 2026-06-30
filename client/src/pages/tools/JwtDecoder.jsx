import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const JwtDecoder = () => {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');

  const handleDecode = (inputToken) => {
    setToken(inputToken);
    if (!inputToken.trim()) {
      setDecoded(null);
      setError('');
      return;
    }

    try {
      // Decode header
      const parts = inputToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format (must have 3 parts separated by dots)');
      }
      
      const header = JSON.parse(atob(parts[0]));
      const payload = jwtDecode(inputToken);
      
      setDecoded({
        header,
        payload,
        signature: parts[2]
      });
      setError('');
    } catch (err) {
      setDecoded(null);
      setError('Invalid JWT Token: ' + err.message);
    }
  };

  const clear = () => {
    setToken('');
    setDecoded(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-lg">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JWT Decoder</h1>
          <p className="text-muted-foreground mt-1 text-sm">Decode JSON Web Tokens to view their header, payload, and signature.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Encoded Token</h2>
            <button 
              onClick={clear}
              className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600"
            >
              <RefreshCw size={12} /> Clear
            </button>
          </div>
          <textarea
            className="w-full flex-1 min-h-[400px] p-4 bg-card border border-border rounded-xl outline-none resize-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 font-mono text-sm leading-relaxed break-all shadow-sm"
            placeholder="Paste your JWT here... e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={token}
            onChange={(e) => handleDecode(e.target.value)}
          />
        </div>

        {/* Output Column */}
        <div className="flex flex-col h-full">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Decoded Data</h2>
          <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-sm overflow-y-auto">
            {error && (
              <div className="text-red-500 bg-red-500/10 border border-red-500/20 p-4 rounded-lg font-mono text-sm">
                {error}
              </div>
            )}
            
            {!token && !error && (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Decoded JWT will appear here
              </div>
            )}

            {decoded && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Header (Algorithm & Type)</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-red-600 dark:text-red-400">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Payload (Data)</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-purple-600 dark:text-purple-400">
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Signature</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-blue-600 dark:text-blue-400 break-all whitespace-pre-wrap">
                    {decoded.signature}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JwtDecoder;
