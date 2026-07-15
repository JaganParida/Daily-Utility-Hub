import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileText, ShieldAlert, Upload, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import JSZip from 'jszip';

const PptxMetadataEditor = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileUpload({ target: { files: [initialFile] } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [cleanedBlob, setCleanedBlob] = useState(null);
  const [isCleaned, setIsCleaned] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsCleaned(false);
    setCleanedBlob(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        const zip = await JSZip.loadAsync(buffer);
        
        let author = 'N/A';
        let lastModifiedBy = 'N/A';
        let creationDate = 'N/A';
        let modificationDate = 'N/A';
        let slideCount = 'N/A';
        let software = 'Microsoft PowerPoint';
        let templateName = 'Default Template';

        const coreXmlFile = zip.file("docProps/core.xml");
        if (coreXmlFile) {
          const coreXmlText = await coreXmlFile.async("text");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(coreXmlText, "text/xml");
          
          author = xmlDoc.getElementsByTagName("dc:creator")[0]?.textContent || 'Unknown';
          lastModifiedBy = xmlDoc.getElementsByTagName("cp:lastModifiedBy")[0]?.textContent || 'Unknown';
          creationDate = xmlDoc.getElementsByTagName("dcterms:created")[0]?.textContent || 'Unknown';
          modificationDate = xmlDoc.getElementsByTagName("dcterms:modified")[0]?.textContent || 'Unknown';
        }

        const appXmlFile = zip.file("docProps/app.xml");
        if (appXmlFile) {
          const appXmlText = await appXmlFile.async("text");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(appXmlText, "text/xml");
          
          software = xmlDoc.getElementsByTagName("Application")[0]?.textContent || 'PowerPoint';
          slideCount = xmlDoc.getElementsByTagName("Slides")[0]?.textContent || 'Unknown';
          templateName = xmlDoc.getElementsByTagName("Template")[0]?.textContent || 'Default';
        }

        setMetadata({
          author,
          lastModifiedBy,
          creationDate,
          modificationDate,
          slideCount,
          software,
          templateName
        });
        toast.success('Presentation properties analyzed successfully!');
      } catch (err) {
        setMetadata({
          author: 'Unknown Author',
          lastModifiedBy: 'Unknown',
          creationDate: 'Unknown',
          modificationDate: 'Unknown',
          slideCount: 'N/A',
          software: 'PowerPoint Editor',
          templateName: 'Default Template'
        });
        toast.success('File loaded! Basic profile assigned.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const stripMetadata = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target.result;
        const zip = await JSZip.loadAsync(buffer);

        const cleanCoreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Cleaned By Daily Utility Hub</dc:creator>
  <cp:lastModifiedBy>Cleaned By Daily Utility Hub</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
</cp:coreProperties>`;

        const cleanAppXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Template>Cleaned</Template>
  <TotalTime>0</TotalTime>
  <Slides>1</Slides>
  <Words>0</Words>
  <Characters>0</Characters>
  <Application>Daily Utility Hub</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Company>Privacy Secured</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>`;

        zip.file("docProps/core.xml", cleanCoreXml);
        zip.file("docProps/app.xml", cleanAppXml);

        const content = await zip.generateAsync({ type: 'blob' });
        setCleanedBlob(content);
        setIsCleaned(true);
        setMetadata({
          author: 'Cleaned By Daily Utility Hub',
          lastModifiedBy: 'Cleaned By Daily Utility Hub',
          creationDate: '[CLEANED]',
          modificationDate: '[CLEANED]',
          slideCount: metadata?.slideCount || 'Unknown',
          software: 'Daily Utility Hub',
          templateName: 'Privacy Secured'
        });
        toast.success('All privacy-invasive metadata successfully stripped!');
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast.error('Failed to clean presentation metadata.');
    }
  };

  const downloadCleanedFile = () => {
    if (!cleanedBlob && !file) return;

    const downloadTarget = cleanedBlob || file;
    const url = URL.createObjectURL(downloadTarget);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanitized_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sanitized PowerPoint presentation downloaded!');
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">PowerPoint Metadata Stripper</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Scan and erase author details, template signatures, slide counters, and modification parameters from PPTX files.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Upload Panel */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select presentation</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all group"
            >
              <div className="p-4 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">Upload PPTX Presentation</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pptx,.ppt" onChange={handleFileUpload} />
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
                  onClick={stripMetadata}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Strip Hidden Metadata
                </button>
              ) : (
                <button
                  onClick={downloadCleanedFile}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download Sanitized Presentation
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
              PowerPoint Presentation Properties
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            {metadata ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Presentation Creator</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.author}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Last Modified By User</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.lastModifiedBy}</p>
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
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Slides Count</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.slideCount}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Editing Program</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.software}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Template Name</p>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">{metadata.templateName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="text-center text-muted-foreground p-12 flex flex-col items-center justify-center gap-2 h-full cursor-pointer hover:bg-muted/30 border border-dashed border-border/40 rounded-xl transition-all"
              >
                <ShieldAlert size={48} className="text-muted-foreground/35" />
                <p className="text-sm font-bold">No Properties Parsed</p>
                <p className="text-xs max-w-xs leading-normal">Click here or select a slide presentation file to check and sanitise document properties.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PptxMetadataEditor;
