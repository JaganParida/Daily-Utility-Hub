import { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const JwtDecoder = () => {
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  
  const [isValid, setIsValid] = useState(null); // null, true, false
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  // Convert base64url to base64
  const b64url2b64 = (str) => {
    return str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - str.length % 4) % 4);
  };

  useEffect(() => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setSignature('');
      setError(null);
      setIsValid(null);
      return;
    }

    const parts = token.split('.');
    
    if (parts.length !== 3) {
      setError('Invalid JWT format. Expected 3 parts separated by dots.');
      setHeader('');
      setPayload('');
      setSignature('');
      setIsValid(null);
      return;
    }

    try {
      const decodedHeader = decodeURIComponent(escape(atob(b64url2b64(parts[0]))));
      const decodedPayload = decodeURIComponent(escape(atob(b64url2b64(parts[1]))));
      
      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      setPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
      setSignature(parts[2]);
      setError(null);

      // Verify Signature if secret is provided
      if (secret) {
        verifySignature(parts[0], parts[1], parts[2], secret, JSON.parse(decodedHeader).alg);
      } else {
        setIsValid(null);
      }
    } catch (e) {
      setError('Failed to decode token. It might not be a valid base64url string.');
    }
  }, [token, secret]);

  const verifySignature = (headerB64, payloadB64, signatureB64, secretKey, alg) => {
    if (!alg || !alg.startsWith('HS')) {
      // We only support HMAC (HS256, HS384, HS512) for client-side secret verification
      setIsValid(false);
      return;
    }

    const dataToSign = `${headerB64}.${payloadB64}`;
    let generatedSignature = '';

    if (alg === 'HS256') {
      generatedSignature = CryptoJS.HmacSHA256(dataToSign, secretKey);
    } else if (alg === 'HS384') {
      generatedSignature = CryptoJS.HmacSHA384(dataToSign, secretKey);
    } else if (alg === 'HS512') {
      generatedSignature = CryptoJS.HmacSHA512(dataToSign, secretKey);
    }

    // Convert CryptoJS word array to base64url
    const base64Signature = CryptoJS.enc.Base64.stringify(generatedSignature);
    const base64urlSignature = base64Signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    setIsValid(base64urlSignature === signatureB64);
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-[700px]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Key size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced JWT Decoder</h1>
          <p className="text-muted-foreground mt-1 text-sm">Decode JSON Web Tokens and mathematically verify HMAC signatures.</p>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_1.5fr] gap-6 min-h-0">
        
        {/* Input Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Encoded Token</h3>
            <textarea
              className={`w-full flex-1 p-4 bg-background border rounded-xl resize-none font-mono text-sm focus:outline-none focus:ring-2 custom-scrollbar ${
                error ? 'border-red-500 focus:ring-red-500/50 text-red-500' : 'border-border focus:ring-pink-500/50 text-foreground'
              }`}
              placeholder="Paste your JWT here (e.g. eyJhbGci...)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              spellCheck="false"
            />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Verify Signature</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter secret key (for HS256/384/512 algorithms)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              
              {secret && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isValid === true 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : isValid === false 
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                      : 'bg-muted border-border text-muted-foreground'
                }`}>
                  {isValid === true && <CheckCircle2 size={24} />}
                  {isValid === false && <AlertCircle size={24} />}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isValid === true ? 'Signature Verified' : isValid === false ? 'Invalid Signature' : 'Cannot Verify'}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      {isValid === true ? 'The token is authentic and has not been tampered with.' : isValid === false ? 'The token has been tampered with or the secret is wrong.' : 'Algorithm unsupported for client-side verification.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decoded Output Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Decoded Data</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-red-500">Header (Algorithm & Type)</label>
                <button onClick={() => handleCopy(header, 'header')} className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                  {copied === 'header' ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
              <textarea
                readOnly
                value={header}
                className="w-full min-h-[100px] p-4 bg-red-500/5 border border-red-500/20 rounded-xl resize-none text-red-600 dark:text-red-400 font-mono text-sm focus:outline-none custom-scrollbar"
              />
            </div>

            {/* Payload */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-500">Payload (Data)</label>
                <button onClick={() => handleCopy(payload, 'payload')} className="text-xs font-medium text-purple-500 hover:bg-purple-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                  {copied === 'payload' ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
              <textarea
                readOnly
                value={payload}
                className="w-full min-h-[200px] p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl resize-none text-purple-600 dark:text-purple-400 font-mono text-sm focus:outline-none custom-scrollbar"
              />
            </div>

            {/* Signature */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-500">Signature</label>
                <button onClick={() => handleCopy(signature, 'signature')} className="text-xs font-medium text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                  {copied === 'signature' ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
              <div className="w-full p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
                {signature || '...'}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default JwtDecoder;
