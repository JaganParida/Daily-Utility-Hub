import { useState, useRef, useEffect } from 'react';
import { Type, UploadCloud, FileText, CheckCircle2, Copy, Check, Download, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PdfToText = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pagesCount, setPagesCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClear = () => {
    setFile(null);
    setExtractedText('');
    setPagesCount(0);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const getStats = () => {
    if (!extractedText) return { words: 0, chars: 0 };
    const cleanText = extractedText.trim();
    const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
    const chars = extractedText.length;
    return { words, chars };
  };

  const { words, chars } = getStats();

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setFile(droppedFile);
    setPreviewUrl(URL.createObjectURL(droppedFile));
    setExtractedText('');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type !== 'application/pdf') return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    let toastId;
    try {
      setIsProcessing(true);
      toastId = toast.loading('Extracting text from PDF...');
      
      const response = await axios.post('http://localhost:5000/api/pdf/extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setExtractedText(response.data.text || 'No text found in this document (it might be a scanned image).');
      setPagesCount(response.data.pages || 0);
      
      toast.success('Text extracted successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to extract text. The file might be encrypted.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${file.name.replace('.pdf', '')}_extracted_text.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Downloaded text file!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 flex flex-col min-h-0">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Extract Text from PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert your PDF documents into editable raw text plain files.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        
        {/* Upload & Form Area */}
        <div className="flex flex-col gap-6 w-full min-h-0">
          
          {/* Dropzone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${
                isDragging ? 'border-pink-500 bg-pink-500/5' : 'border-border bg-card hover:border-pink-500/50 hover:bg-muted/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" />
              <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 mb-4 pointer-events-none">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pointer-events-none">Upload a PDF</h3>
              <p className="text-sm text-muted-foreground text-center pointer-events-none">
                Drag & drop a PDF file here or click to browse.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-4 shrink-0 min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-lg truncate w-full" title={file.name}>{file.name}</h3>
                    <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button 
                    onClick={handleClear} 
                    className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {showPreview && previewUrl && (
                <div className="border-t border-border pt-4 w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Document Preview</h4>
                    <a 
                      href={previewUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="w-full h-[400px] md:h-[500px] border border-border rounded-xl overflow-hidden bg-muted/10 relative">
                    <object 
                      data={previewUrl} 
                      type="application/pdf" 
                      className="w-full h-full"
                    >
                      <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview">
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Your browser doesn't support inline PDF previews. Please click "Open in New Tab" to view it.
                        </div>
                      </iframe>
                    </object>
                  </div>
                </div>
              )}
            </div>
          )}

          {extractedText && (
             <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-0 flex-1 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Extracted Text ({pagesCount} Pages)</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Words: {words.toLocaleString()} &bull; Characters: {chars.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold"
                    >
                      {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      onClick={downloadTextFile}
                      className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold"
                    >
                      <Download size={14} /> Download TXT
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full flex-1 min-h-[250px] lg:min-h-0 bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none custom-scrollbar resize-none font-mono"
                  placeholder="Extracted text will appear here..."
                />
             </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-6 w-full lg:w-[350px] shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Extraction Details</h3>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Scrapes selectable text layer instantly from the PDF.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Computes readability stats: word count and character count.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <p>Note: Scanned images with no text layer cannot be parsed (requires OCR).</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleExtract}
            disabled={!file || isProcessing || extractedText.length > 0}
            className="w-full py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Type size={18} />
            {isProcessing ? 'Extracting...' : 'Extract Text Now'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfToText;
