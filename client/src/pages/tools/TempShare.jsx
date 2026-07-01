import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Clipboard, ClipboardCheck, Loader2, X, Download, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TempShare = () => {
  const [file, setFile] = useState(null);
  const [expiryHours, setExpiryHours] = useState(24); // default 24 hours
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

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
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size cannot exceed 50MB');
      return;
    }
    setFile(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setSharedLink('');
    setExpiresAt(null);
    setIsCopied(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading file and generating secure link...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiryHours', expiryHours);

      const response = await fetch('http://localhost:5000/api/share/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      const shareUrl = `http://localhost:5000/api/share/download/${data.fileId}`;
      setSharedLink(shareUrl);
      setExpiresAt(data.expiresAt);
      
      toast.success('Secure link generated successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Please try again.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedLink);
    setIsCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-[85vh]">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shadow-sm">
          <UploadCloud size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Temporary File Sharing</h1>
          <p className="text-muted-foreground mt-1 text-sm">Upload a file (up to 50MB) and generate a secure download link that expires automatically.</p>
        </div>
      </div>

      {!sharedLink ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
          
          {/* Main upload box */}
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => !file && !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all h-96 relative ${
              isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-card hover:border-indigo-500/50 hover:bg-muted/30'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            {file ? (
              <div className="flex flex-col items-center text-center space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground truncate max-w-md">{file.name}</h3>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={handleClear}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <X size={14} /> Remove File
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 pointer-events-none">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Drag & Drop file to share</h3>
                <p className="text-sm text-muted-foreground text-center pointer-events-none max-w-sm">
                  Supports any file type up to 50MB. File is automatically deleted after chosen expiry time.
                </p>
              </>
            )}
          </div>

          {/* Settings Side Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Sharing Options</h3>
              <div className="space-y-4">
                
                {/* Expiry Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Link Expiry Period</label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                    disabled={isUploading}
                    className="w-full bg-muted/50 border border-border text-sm rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="1">Expires in 1 Hour</option>
                    <option value="6">Expires in 6 Hours</option>
                    <option value="24">Expires in 24 Hours (1 Day)</option>
                  </select>
                </div>

                <div className="space-y-3.5 text-xs text-muted-foreground pt-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={14} />
                    <p>Encrypted transfer directly to secure local server cache.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={14} />
                    <p>Wiped from server hard drive immediately upon link expiration.</p>
                  </div>
                </div>

              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Upload & Share
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* Results / Success Display Card */
        <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Secure Link Generated!</h2>
            <p className="text-sm text-muted-foreground mt-1">Your temporary download link is ready to be shared.</p>
          </div>

          {/* Copy Link Container */}
          <div className="flex items-center gap-2 bg-muted/40 border border-border p-2 rounded-xl">
            <input 
              type="text" 
              readOnly 
              value={sharedLink} 
              className="bg-transparent border-none text-xs font-bold text-foreground flex-1 pl-2 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="p-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              title="Copy Link"
            >
              {isCopied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
            </button>
          </div>

          {/* QR Code image API representation */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scan QR Code to Download</p>
            <div className="w-36 h-36 border border-border bg-white rounded-xl flex items-center justify-center p-2 mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(sharedLink)}`} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p>Link expires at: <span className="font-extrabold text-foreground">{new Date(expiresAt).toLocaleString()}</span></p>
            <p className="mt-1 text-[10px] text-red-500/80">File will be permanently deleted from the server at this time.</p>
          </div>

          <button
            onClick={handleClear}
            className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-xl transition-all"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
};

export default TempShare;
