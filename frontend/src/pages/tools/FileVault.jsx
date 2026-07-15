import { useState, useRef } from 'react';
import { Lock, Unlock, Shield, File, Download, Key, CheckCircle2, AlertCircle, X, Eye, EyeOff, FileArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const FileVault = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('ENCRYPT'); // ENCRYPT or DECRYPT

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelection(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFileSelection(selectedFile);
  };

  const handleFileSelection = (selectedFile) => {
    // 50MB Limit for client-side JS memory safety
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size cannot exceed 50MB for client-side encryption');
      return;
    }
    setFile(selectedFile);
    if (selectedFile.name.endsWith('.vault')) {
      setMode('DECRYPT');
    } else {
      setMode('ENCRYPT');
    }
  };

  const handleProcess = () => {
    if (!file) return;
    if (!password || password.length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }

    setIsProcessing(true);
    
    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const fileData = e.target.result; // This is a Data URL (base64) for encrypt, or text for decrypt
          
          if (mode === 'ENCRYPT') {
            // Payload includes metadata and actual file data
            const payload = JSON.stringify({
              name: file.name,
              type: file.type,
              data: fileData
            });

            // Encrypt
            const ciphertext = CryptoJS.AES.encrypt(payload, password).toString();
            
            // Download as .vault
            const blob = new Blob([ciphertext], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name}.vault`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('File successfully encrypted and downloaded!');
          } else {
            // Decrypt Mode
            // fileData is the ciphertext string because we read as Text
            const bytes = CryptoJS.AES.decrypt(fileData, password);
            const decryptedPayload = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedPayload) {
              throw new Error('Incorrect password or corrupted file.');
            }

            const parsed = JSON.parse(decryptedPayload);
            
            // Local base64 parsing without using network-like fetch API
            const dataurl = parsed.data;
            const parts = dataurl.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = parsed.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('File successfully decrypted and downloaded!');
          }
        };

        reader.onerror = () => {
          throw new Error('Failed to read file');
        };

        if (mode === 'ENCRYPT') {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Processing failed. Incorrect password?');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Secure File Vault</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Military-grade AES-256 client-side encryption. Lock files before sharing them.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Interactive Dropzone */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-[500px]">
          
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              {mode === 'ENCRYPT' ? <Lock size={16} className="text-primary" /> : <Unlock size={16} className="text-primary" />} 
              {mode === 'ENCRYPT' ? 'Vault Lock' : 'Vault Unlock'}
            </h2>
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-lg h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-background shadow-sm text-muted-foreground'}`}>
                    <Shield size={32} />
                  </div>
                  <p className="text-sm font-bold text-foreground">Drag & Drop any file here</p>
                  <p className="text-xs text-muted-foreground mt-2 px-8 text-center leading-relaxed">
                    Max size 50MB. Processing happens 100% offline in your browser. No files are uploaded to any server.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="file-ready"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-lg bg-background border border-border p-6 rounded-2xl shadow-sm text-center relative overflow-hidden"
                >
                  <button onClick={() => setFile(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors">
                    <X size={20} />
                  </button>

                  <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4 text-foreground shadow-inner">
                    {mode === 'ENCRYPT' ? <File size={32} /> : <FileArchive size={32} className="text-primary" />}
                  </div>
                  
                  <h3 className="font-bold text-lg text-foreground truncate px-8">{file.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {mode === 'ENCRYPT' ? 'Ready to Lock' : 'Encrypted Vault File'}
                  </p>

                  <div className="mt-8 space-y-4 max-w-xs mx-auto">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Key size={16} />
                      </div>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Secret Password"
                        className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-10 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:font-normal"
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>

                    <button 
                      onClick={handleProcess} disabled={isProcessing}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                        mode === 'ENCRYPT' 
                          ? 'bg-primary hover:bg-primary text-white shadow-primary/20' 
                          : 'bg-primary hover:bg-primary text-white shadow-primary/20'
                      } ${isProcessing ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
                    >
                      {isProcessing ? (
                        <>Processing... <span className="animate-spin text-lg">⏳</span></>
                      ) : mode === 'ENCRYPT' ? (
                        <><Lock size={18}/> Encrypt & Download</>
                      ) : (
                        <><Unlock size={18}/> Decrypt File</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6 lg:sticky lg:top-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
            <h3 className="font-bold uppercase tracking-wider text-foreground flex items-center gap-2 text-sm"><Shield size={18} className="text-primary"/> How it Works</h3>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent hidden">
              {/* Keeping structural space if needed later */}
            </div>

            <div className="space-y-6 relative border-l-2 border-border ml-3 pl-6">
              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 bg-background border-2 border-border w-5 h-5 rounded-full"></div>
                <h4 className="text-sm font-bold text-foreground">1. Client-Side Only</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Your files never leave your device. The AES-256 encryption happens directly in your browser's memory using JavaScript.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 bg-background border-2 border-border w-5 h-5 rounded-full"></div>
                <h4 className="text-sm font-bold text-foreground">2. AES-256 Encryption</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">We use the Advanced Encryption Standard (AES) with a 256-bit key size. It is the same standard used by governments and banks globally.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 bg-background border-2 border-primary w-5 h-5 rounded-full"></div>
                <h4 className="text-sm font-bold text-primary">3. Zero Knowledge</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">If you lose your password, your file is gone forever. There is no password recovery or backdoor.</p>
              </div>
            </div>

          </div>

          <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary dark:text-primary font-medium leading-relaxed">
              Always securely share the password with the recipient through a separate channel (like Signal or Telegram) before sending them the `.vault` file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileVault;
