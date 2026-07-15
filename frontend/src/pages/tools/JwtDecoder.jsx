import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Key, Copy, Check, AlertCircle, CheckCircle2, Clock, Clipboard, Shield, Info, FileJson, Timer, Hash, Eye, Lock, Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

// ─── Sample JWT (expires far in the future so the countdown demo works) ──────
const SAMPLE_JWT = (() => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: '1234567890',
    name: 'Jane Doe',
    iss: 'daily-utility-hub',
    aud: 'https://example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    nbf: Math.floor(Date.now() / 1000) - 60,
    jti: 'abc-def-123-456',
    admin: true,
  };

  const b64url = (obj) => {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = b64url(header);
  const payloadB64 = b64url(payload);
  const sig = CryptoJS.HmacSHA256(`${headerB64}.${payloadB64}`, 'secret');
  const sigB64 = CryptoJS.enc.Base64.stringify(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');

  return `${headerB64}.${payloadB64}.${sigB64}`;
})();

// ─── Known JWT claim definitions ─────────────────────────────────────────────
const KNOWN_CLAIMS = {
  iss: { label: 'Issuer', icon: Shield, color: 'text-primary' },
  sub: { label: 'Subject', icon: Eye, color: 'text-purple-500' },
  aud: { label: 'Audience', icon: Eye, color: 'text-indigo-500' },
  exp: { label: 'Expiration', icon: Timer, color: 'text-red-500' },
  nbf: { label: 'Not Before', icon: Clock, color: 'text-amber-500' },
  iat: { label: 'Issued At', icon: Clock, color: 'text-emerald-500' },
  jti: { label: 'JWT ID', icon: Hash, color: 'text-primary' },
};

// ─── Tabs for decoded output ─────────────────────────────────────────────────
const OUTPUT_TABS = [
  { id: 'claims', label: 'Claims', icon: Info },
  { id: 'header', label: 'Header', icon: FileJson },
  { id: 'payload', label: 'Payload', icon: FileJson },
  { id: 'signature', label: 'Signature', icon: Lock },
];

// ─── Helper: base64url → base64 ─────────────────────────────────────────────
const b64url2b64 = (str) => {
  return str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - str.length % 4) % 4);
};

// ─── Helper: format Unix timestamp to human-readable ─────────────────────────
const formatTimestamp = (ts) => {
  try {
    const d = new Date(ts * 1000);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return String(ts);
  }
};

// ─── Helper: format countdown ────────────────────────────────────────────────
const formatCountdown = (seconds) => {
  if (seconds <= 0) return null;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

const JwtDecoder = () => {
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');

  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [parsedPayload, setParsedPayload] = useState(null);
  const [parsedHeader, setParsedHeader] = useState(null);

  const [isValid, setIsValid] = useState(null); // null | true | false
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState('claims');

  // Expiration countdown state
  const [countdown, setCountdown] = useState(null); // seconds remaining, null if no exp, -1 if expired
  const countdownRef = useRef(null);

  // ── Decode token whenever it changes ───────────────────────────────────────
  useEffect(() => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setSignature('');
      setParsedPayload(null);
      setParsedHeader(null);
      setError(null);
      setIsValid(null);
      return;
    }

    const parts = token.trim().split('.');

    if (parts.length !== 3) {
      setError('Invalid JWT format. Expected 3 parts separated by dots.');
      setHeader('');
      setPayload('');
      setSignature('');
      setParsedPayload(null);
      setParsedHeader(null);
      setIsValid(null);
      return;
    }

    try {
      const decodedHeader = decodeURIComponent(escape(atob(b64url2b64(parts[0]))));
      const decodedPayload = decodeURIComponent(escape(atob(b64url2b64(parts[1]))));

      const hObj = JSON.parse(decodedHeader);
      const pObj = JSON.parse(decodedPayload);

      setHeader(JSON.stringify(hObj, null, 2));
      setPayload(JSON.stringify(pObj, null, 2));
      setSignature(parts[2]);
      setParsedPayload(pObj);
      setParsedHeader(hObj);
      setError(null);

      // Verify signature if secret is provided
      if (secret) {
        verifySignature(parts[0], parts[1], parts[2], secret, hObj.alg);
      } else {
        setIsValid(null);
      }
    } catch {
      setError('Failed to decode token. It might not be a valid base64url string.');
      setParsedPayload(null);
      setParsedHeader(null);
    }
  }, [token, secret]);

  // ── Live expiration countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!parsedPayload || parsedPayload.exp === undefined) {
      setCountdown(null);
      return;
    }

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = parsedPayload.exp - now;
      setCountdown(remaining > 0 ? remaining : -1);
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);

    return () => clearInterval(countdownRef.current);
  }, [parsedPayload]);

  // ── HMAC signature verification (HS256/384/512) ────────────────────────────
  const verifySignature = useCallback((headerB64, payloadB64, signatureB64, secretKey, alg) => {
    if (!alg || !alg.startsWith('HS')) {
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

    const base64Signature = CryptoJS.enc.Base64.stringify(generatedSignature);
    const base64urlSignature = base64Signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    setIsValid(base64urlSignature === signatureB64);
  }, []);

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopy = useCallback((text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // ── Paste from clipboard ───────────────────────────────────────────────────
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setToken(text);
        toast.success('Pasted from clipboard!');
      }
    } catch {
      toast.error('Failed to read clipboard. Check browser permissions.');
    }
  }, []);

  // ── Load sample JWT ────────────────────────────────────────────────────────
  const handleLoadSample = useCallback(() => {
    setToken(SAMPLE_JWT);
    setSecret('secret');
    toast.success('Sample JWT loaded! Secret: "secret"');
  }, []);

  // ── Clear all ──────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setToken('');
    setSecret('');
    setActiveTab('claims');
  }, []);

  // ── Token structure bar segment widths (based on character positions) ──────
  const tokenSegments = useMemo(() => {
    if (!token.trim()) return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const total = token.trim().length;
    return {
      header: (parts[0].length / total) * 100,
      payload: ((parts[1].length + 1) / total) * 100, // +1 for the dot
      signature: ((parts[2].length + 1) / total) * 100,
    };
  }, [token]);

  // ── Token statistics ───────────────────────────────────────────────────────
  const tokenStats = useMemo(() => {
    if (!token.trim() || !parsedPayload) return null;
    return {
      chars: token.trim().length,
      bytes: new Blob([token.trim()]).size,
      claims: Object.keys(parsedPayload).length,
    };
  }, [token, parsedPayload]);

  // ── Claims analysis data ───────────────────────────────────────────────────
  const claimsData = useMemo(() => {
    if (!parsedPayload) return [];
    return Object.entries(parsedPayload).map(([key, value]) => {
      const known = KNOWN_CLAIMS[key];
      const isTimestamp = ['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number';
      return {
        key,
        value,
        label: known?.label || key,
        icon: known?.icon || null,
        color: known?.color || 'text-muted-foreground',
        isKnown: !!known,
        isTimestamp,
        formattedValue: isTimestamp ? formatTimestamp(value) : JSON.stringify(value),
      };
    });
  }, [parsedPayload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Key size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Advanced JWT Decoder</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
            Decode, inspect claims, and mathematically verify HMAC signatures with live expiry tracking.
          </p>
        </div>
      </div>

      {/* ── Main Split Layout ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LEFT SIDE — Token Input + Verify Signature                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full space-y-6">

          {/* ── Token Input Card ──────────────────────────────────────── */}
          <div className="bg-card border border-border/80 p-6 md:p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-3 mb-5 gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileJson size={16} /> Encoded Token
              </h3>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 hover:bg-muted/40 border border-border/50 hover:border-border text-foreground text-xs font-semibold rounded-lg transition-all active:scale-[0.97] cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard size={14} /> Paste
                </button>
                <button
                  onClick={handleLoadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded-lg transition-all active:scale-[0.97] cursor-pointer"
                  title="Load sample JWT"
                >
                  <Sparkles size={14} /> Sample
                </button>
                {token && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 hover:bg-muted/40 border border-border/50 hover:border-border text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-all active:scale-[0.97] cursor-pointer"
                    title="Clear all"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>

            <textarea
              className={`w-full min-h-[220px] p-4 bg-background/40 border rounded-xl resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 custom-scrollbar transition-all leading-relaxed ${
                error ? 'border-red-500 focus:ring-red-500/50 text-red-500' : 'border-border/80 text-foreground'
              }`}
              placeholder="Paste your JWT here (e.g. eyJhbGci...)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              spellCheck="false"
            />

            {/* Token structure color bar */}
            <AnimatePresence>
              {tokenSegments && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <div className="flex rounded-lg overflow-hidden h-2.5 shadow-inner">
                    <div
                      className="bg-red-500 transition-all duration-300 animate-none"
                      style={{ width: `${tokenSegments.header}%` }}
                      title={`Header (${Math.round(tokenSegments.header)}%)`}
                    />
                    <div
                      className="bg-purple-500 transition-all duration-300 animate-none"
                      style={{ width: `${tokenSegments.payload}%` }}
                      title={`Payload (${Math.round(tokenSegments.payload)}%)`}
                    />
                    <div
                      className="bg-primary transition-all duration-300 animate-none"
                      style={{ width: `${tokenSegments.signature}%` }}
                      title={`Signature (${Math.round(tokenSegments.signature)}%)`}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-red-500">Header</span>
                    <span className="text-purple-500">Payload</span>
                    <span className="text-primary">Signature</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Token statistics row */}
            <AnimatePresence>
              {tokenStats && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-center gap-2.5 flex-wrap"
                >
                  <span className="text-[11px] font-bold bg-muted/40 text-muted-foreground border border-border/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <Hash size={12} /> {tokenStats.chars} chars
                  </span>
                  <span className="text-[11px] font-bold bg-muted/40 text-muted-foreground border border-border/50 px-2.5 py-1 rounded-md">
                    {tokenStats.bytes} bytes
                  </span>
                  <span className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md">
                    {tokenStats.claims} claims
                  </span>

                  {/* Expiry badge */}
                  {countdown !== null && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        countdown === -1
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : countdown < 300
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-primary/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      <Timer size={12} />
                      {countdown === -1 ? 'EXPIRED' : formatCountdown(countdown)}
                    </motion.span>
                  )}

                  {parsedHeader?.alg && (
                    <span className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md">
                      {parsedHeader.alg}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Verify Signature Card ─────────────────────────────────── */}
          <div className="bg-card border border-border/80 p-6 md:p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield size={16} /> Verify Signature
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Secret Key</label>
                <input
                  type="text"
                  placeholder="Enter secret key (for HS256/384/512 algorithms)"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full bg-background/40 border border-border/80 rounded-xl px-4 py-3 text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 shadow-sm transition-all"
                />
              </div>

              <AnimatePresence>
                {secret && token && !error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div
                      className={`p-4 rounded-xl border flex items-center gap-3 ${
                        isValid === true
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : isValid === false
                            ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {isValid === true && <CheckCircle2 size={24} />}
                      {isValid === false && <AlertCircle size={24} />}
                      <div>
                        <h4 className="font-bold text-sm">
                          {isValid === true
                            ? 'Signature Verified'
                            : isValid === false
                              ? 'Invalid Signature'
                              : 'Cannot Verify'}
                        </h4>
                        <p className="text-xs opacity-85 mt-0.5">
                          {isValid === true
                            ? 'The token is authentic and has not been tampered with.'
                            : isValid === false
                              ? 'The token has been tampered with or the secret is wrong.'
                              : 'Algorithm unsupported for client-side verification.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RIGHT SIDE — Tabbed Decoded Output                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-300">
            {/* Tab bar */}
            <div className="p-2.5 border-b border-border/80 bg-muted/20 shrink-0">
              <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner relative">
                {OUTPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 relative z-10 py-2.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === tab.id
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="jwt-tab-active"
                        className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <tab.icon size={13} className="shrink-0 hidden sm:inline-block" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-5 min-h-[440px] max-h-[68vh] overflow-y-auto custom-scrollbar flex flex-col">
              {!token.trim() || error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <div className="p-3 bg-muted/35 border border-border/50 rounded-2xl mb-4 text-muted-foreground/60">
                    <Info size={32} />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Decoded Token Payload</h4>
                  <p className="text-xs leading-relaxed max-w-[220px]">Paste a valid JWT encoded token on the left to analyze its claims, headers, and signatures.</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* ── Claims Analysis Tab ─────────────────────────────── */}
                  {activeTab === 'claims' && (
                    <motion.div
                      key="claims"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3.5 flex-1"
                    >
                      {claimsData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm flex-1 flex flex-col items-center justify-center">
                          <Info size={32} className="mx-auto mb-3 opacity-40" />
                          <p>No claims found in this token.</p>
                        </div>
                      ) : (
                        claimsData.map((claim, i) => {
                          const ClaimIcon = claim.icon;
                          return (
                            <motion.div
                              key={claim.key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="bg-muted/10 border border-border/50 rounded-xl p-3 hover:border-border transition-colors group relative"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  {ClaimIcon && <ClaimIcon size={14} className={claim.color} />}
                                  <span className={`text-xs font-bold uppercase tracking-wider ${claim.isKnown ? claim.color : 'text-muted-foreground'}`}>
                                    {claim.label}
                                  </span>
                                  {claim.isKnown && (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                                      {claim.key}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleCopy(String(claim.value), `claim-${claim.key}`)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1 rounded-md hover:bg-muted/30 cursor-pointer"
                                >
                                  {copied === `claim-${claim.key}` ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                              <div className="text-sm font-mono text-foreground break-all leading-relaxed">
                                {claim.isTimestamp ? (
                                  <div>
                                    <span className="text-foreground">{claim.formattedValue}</span>
                                    <span className="text-muted-foreground text-[10px] ml-2 block sm:inline">({claim.value})</span>
                                  </div>
                                ) : (
                                  <span>{claim.formattedValue}</span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  )}

                  {/* ── Header Tab ──────────────────────────────────────── */}
                  {activeTab === 'header' && (
                    <motion.div
                      key="header"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-red-500">
                            Header (Algorithm & Type)
                          </label>
                          <button
                            onClick={() => handleCopy(header, 'header')}
                            className="text-xs font-medium text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {copied === 'header' ? <Check size={13} /> : <Copy size={13} />} Copy
                          </button>
                        </div>
                        <pre className="w-full p-4 bg-red-500/5 border border-red-500/20 rounded-xl font-mono text-xs text-red-500 dark:text-red-400 whitespace-pre-wrap break-all custom-scrollbar min-h-[150px] leading-relaxed shadow-inner">
                          {header}
                        </pre>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Payload Tab ─────────────────────────────────────── */}
                  {activeTab === 'payload' && (
                    <motion.div
                      key="payload"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-purple-500">
                            Payload (Data)
                          </label>
                          <button
                            onClick={() => handleCopy(payload, 'payload')}
                            className="text-xs font-medium text-purple-500 hover:bg-purple-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {copied === 'payload' ? <Check size={13} /> : <Copy size={13} />} Copy
                          </button>
                        </div>
                        <pre className="w-full p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl font-mono text-xs text-purple-500 dark:text-purple-400 whitespace-pre-wrap break-all custom-scrollbar min-h-[250px] leading-relaxed shadow-inner">
                          {payload}
                        </pre>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Signature Tab ───────────────────────────────────── */}
                  {activeTab === 'signature' && (
                    <motion.div
                      key="signature"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-primary">
                            Signature
                          </label>
                          <button
                            onClick={() => handleCopy(signature, 'signature')}
                            className="text-xs font-medium text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {copied === 'signature' ? <Check size={13} /> : <Copy size={13} />} Copy
                          </button>
                        </div>
                        <pre className="w-full p-4 bg-primary/5 border border-primary/20 rounded-xl font-mono text-xs text-blue-500 dark:text-blue-400 break-all min-h-[100px] leading-relaxed shadow-inner">
                          {signature}
                        </pre>

                        {/* Algorithm info */}
                        {parsedHeader && (
                          <div className="mt-4 p-3.5 bg-muted/15 border border-border/50 rounded-xl">
                            <p className="text-xs font-bold text-muted-foreground mb-1 bg-muted/30 px-2 py-0.5 rounded inline-block">
                              {parsedHeader.alg || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                              {parsedHeader.alg?.startsWith('HS')
                                ? 'HMAC with SHA — symmetric key. You can verify this client-side by entering the secret above.'
                                : parsedHeader.alg?.startsWith('RS') || parsedHeader.alg?.startsWith('ES') || parsedHeader.alg?.startsWith('PS')
                                  ? 'Asymmetric algorithm — requires the public key for verification (not supported client-side).'
                                  : 'Algorithm details unavailable.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JwtDecoder;
