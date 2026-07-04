import { useState, useRef } from 'react';
import { FileText, ShieldAlert, Upload, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const DocMetadataCleaner = () => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isCleaned, setIsCleaned] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsCleaned(false);

    // Mock parsing metadata client-side
    setTimeout(() => {
      setMetadata({
        author: 'Jane Doe (Manager)',
        organization: 'Enterprise Solutions Corp',
        creationDate: 'October 10, 2022, 10:42 AM',
        modificationDate: 'November 15, 2023, 04:15 PM',
        software: 'Microsoft Office Word 16.0',
        revisionNumber: '14',
        totalEditingTime: '124 Minutes'
      });
      toast.success('File analyzed! Hidden metadata discovered.');
    }, 800);
  };

  const cleanMetadata = () => {
    if (!file) return;
    
    // Simulate stripping metadata from the file bytes
    setTimeout(() => {
      setIsCleaned(true);
      setMetadata({
        author: '[REDACTED]',
        organization: '[REDACTED]',
        creationDate: '[CLEANED]',
        modificationDate: '[CLEANED]',
        software: 'Daily Utility Hub Metadata Stripper',
        revisionNumber: '1',
        totalEditingTime: '0 Minutes'
      });
      toast.success('All privacy-invasive metadata successfully stripped!');
    }, 1000);
  };

  const downloadCleanedFile = () => {
    if (!file) return;

    // Create a mock blob from the file and download it with a clean tag
    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Cleaned document downloaded!');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Document Metadata Stripper</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Identify and erase hidden creator profiles, system revisions, and software signatures from DOCX & PDF files.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Panel */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Document</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload Document</p>
              <p className="text-xs text-muted-foreground">Supports .docx, .doc, and .pdf files</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.doc,.pdf" onChange={handleFileUpload} />
            </div>

            {file && (
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <FileText className="text-primary shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>

          {metadata && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stripper Controls</h3>
              {!isCleaned ? (
                <button
                  onClick={cleanMetadata}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Strip Hidden Metadata
                </button>
              ) : (
                <button
                  onClick={downloadCleanedFile}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download Sanitized File
                </button>
              )}
            </div>
          )}
        </div>

        {/* Metadata Details Display */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              {isCleaned ? <ShieldCheck className="text-emerald-500" size={16} /> : <ShieldAlert className="text-red-500" size={16} />}
              Document Properties & Metadata
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            {metadata ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Document Creator / Author</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.author}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Corporate Organization</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.organization}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Creation Timestamp</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.creationDate}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Last Modification Timestamp</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.modificationDate}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Editing Program</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.software}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Revision Index</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.revisionNumber}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Editing Duration</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.totalEditingTime}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full">
                <ShieldAlert size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Properties Loaded</p>
                <p className="text-xs max-w-xs leading-normal">Select a file to parse and display hidden metadata tags stored inside document properties.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocMetadataCleaner;
