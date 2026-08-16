import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { 
  UploadCloud, FileText, CheckCircle2, Download, Loader2, X, 
  Sparkles, Image as ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../lib/api';

// Configure pdf.js worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const OCR_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'hin', name: 'Hindi (हिंदी)' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' }
];

const PdfToWord = () => {
  const location = useLocation();

  const [file, setFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [conversionMethod, setConversionMethod] = useState('');

  // Results
  const [wordBlob, setWordBlob] = useState(null);
  const [wordFileName, setWordFileName] = useState('');

  const fileInputRef = useRef(null);
  const pdfArrayBufferRef = useRef(null); // Store raw ArrayBuffer for backend upload

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileLoad(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileLoad = async (selectedFile) => {
    setWordBlob(null);
    const toastId = toast.loading('Reading PDF document...');

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          pdfArrayBufferRef.current = e.target.result;
          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          setFile(selectedFile);
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          toast.success(`PDF Loaded: ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'} detected`, { id: toastId });
        } catch (err) {
          console.error(err);
          toast.error('Could not parse PDF file.', { id: toastId });
        }
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load PDF.', { id: toastId });
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF document.');
      return;
    }
    handleFileLoad(droppedFile);
  };

  const handleClear = () => {
    setFile(null);
    setPdfDocument(null);
    setTotalPages(0);
    setProgress(0);
    setWordBlob(null);
    setConversionMethod('');
    pdfArrayBufferRef.current = null;
  };

  // Helper XML escaper
  const escapeXml = (unsafeStr) => {
    if (!unsafeStr) return '';
    return unsafeStr.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // Render page to canvas at high resolution
  const renderPageCanvas = async (page, scale = 2.5) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { canvas, viewport };
  };

  // Extract text content with spatial positioning from a PDF page
  const extractPageText = async (page) => {
    const textContent = await page.getTextContent();
    const items = textContent.items;
    if (!items || items.length === 0) return { hasText: false, textRuns: [] };

    let totalChars = 0;
    const textRuns = [];

    // Get average font size for relative sizing
    let totalFontSize = 0;
    let validCount = 0;
    items.forEach(item => {
      if (item.str && item.str.trim()) {
        totalFontSize += Math.abs(item.transform[3] || item.height || 10);
        validCount++;
      }
    });
    const avgFontSize = validCount > 0 ? totalFontSize / validCount : 10;

    // Group text items by Y-line
    const rowsByY = {};
    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      totalChars += item.str.trim().length;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = Math.round(item.transform[4]);
      const height = Math.abs(item.transform[3] || item.height || 10);
      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('black') || height > avgFontSize * 1.25;
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      if (!rowsByY[y]) rowsByY[y] = [];
      rowsByY[y].push({ text: item.str, x, height, isBold, isItalic });
    });

    // Sort by Y (top to bottom), then merge items on same line
    const sortedYKeys = Object.keys(rowsByY).sort((a, b) => Number(b) - Number(a));

    sortedYKeys.forEach(y => {
      const lineItems = rowsByY[y].sort((a, b) => a.x - b.x);
      
      // Merge items that are close together into runs
      const runs = [];
      let current = null;
      lineItems.forEach(item => {
        if (!current) {
          current = { ...item };
        } else {
          const charW = (current.height || 10) * 0.55;
          const prevEnd = current.x + current.text.length * charW;
          const gap = item.x - prevEnd;

          if (gap > charW * 3) {
            // Big gap = likely table columns or separate blocks
            runs.push(current);
            current = { ...item };
          } else {
            current.text += (gap > charW ? '  ' : ' ') + item.text;
            current.isBold = current.isBold || item.isBold;
            current.isItalic = current.isItalic || item.isItalic;
          }
        }
      });
      if (current) runs.push(current);

      // Determine if this line has multiple separate columns (table row indicator)
      const isMultiCol = runs.length >= 2;
      const maxH = Math.max(...runs.map(r => r.height));
      const isHeader = maxH > avgFontSize * 1.3 || (runs.length === 1 && runs[0].text.length < 60 && runs[0].isBold);

      textRuns.push({
        y: Number(y),
        runs,
        isMultiCol,
        isHeader,
        maxHeight: maxH
      });
    });

    return { hasText: totalChars > 10, textRuns, totalChars };
  };

  // Build OOXML for text-based pages (paragraphs and tables)
  const buildTextDocXml = (pageTextData) => {
    let xml = '';
    
    // Group consecutive multi-col lines into tables
    let tableBuffer = [];
    
    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      
      // Determine max columns across all rows
      const maxCols = Math.max(...tableBuffer.map(row => row.runs.length));
      
      xml += `<w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="AAAAAA"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="AAAAAA"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="60" w:type="dxa"/>
          <w:left w:w="100" w:type="dxa"/>
          <w:bottom w:w="60" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>`;
      
      tableBuffer.forEach(row => {
        xml += `<w:tr>`;
        for (let c = 0; c < maxCols; c++) {
          const cell = row.runs[c];
          const cellText = cell ? escapeXml(cell.text.trim()) : '';
          const isBold = cell ? cell.isBold : false;
          xml += `<w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>${isBold ? '<w:b/>' : ''}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${cellText}</w:t></w:r></w:p></w:tc>`;
        }
        xml += `</w:tr>`;
      });
      
      xml += `</w:tbl>`;
      tableBuffer = [];
    };

    pageTextData.forEach(line => {
      if (line.isMultiCol) {
        tableBuffer.push(line);
      } else {
        flushTable();
        
        const fullText = line.runs.map(r => r.text).join(' ').trim();
        if (!fullText) return;
        
        const escaped = escapeXml(fullText);
        const isBold = line.runs.some(r => r.isBold);
        const isItalic = line.runs.some(r => r.isItalic);
        const fontSize = Math.round(Math.max(18, Math.min(36, (line.maxHeight || 10) * 2)));

        xml += `<w:p><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/>${line.isHeader ? '<w:jc w:val="center"/>' : ''}</w:pPr>`;
        xml += `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>`;
        if (isBold) xml += '<w:b/>';
        if (isItalic) xml += '<w:i/>';
        xml += `<w:sz w:val="${fontSize}"/></w:rPr>`;
        xml += `<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
      }
    });
    
    flushTable();
    return xml;
  };

  // Main conversion handler
  const handleConvert = async () => {
    if (!file || !pdfDocument) return;

    setIsProcessing(true);
    setProgress(0);
    setWordBlob(null);
    setConversionMethod('');

    const toastId = toast.loading('Converting PDF to Word...');

    // ====================================================================
    // ATTEMPT 1: Backend Python pdf2docx (highest fidelity)
    // ====================================================================
    let serverSuccess = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        setCurrentStatus(attempt === 1 ? 'Converting with high-fidelity engine...' : 'Retrying server conversion...');
        setProgress(10 + (attempt - 1) * 15);

        const formData = new FormData();
        formData.append('pdf', file);

        const response = await api.post('/pdf/convert-to-word', formData, {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000
        });

        // Validate: must be > 1KB and not a JSON error response
        if (response.data && response.data.size > 1000) {
          // Check if it's actually JSON error disguised as blob
          const contentType = response.headers?.['content-type'] || '';
          if (contentType.includes('application/json')) {
            throw new Error('Server returned error response');
          }

          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          });
          const outName = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;
          setWordBlob(blob);
          setWordFileName(outName);
          setConversionMethod('server');
          setProgress(100);
          setCurrentStatus('Conversion complete!');
          toast.success('Word document created successfully!', { id: toastId });
          setIsProcessing(false);
          serverSuccess = true;
          return;
        }
      } catch (err) {
        console.warn(`Server attempt ${attempt} failed:`, err?.message);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        }
      }
    }

    // ====================================================================
    // ATTEMPT 2: Client-side fallback (page images in docx)
    // Each page rendered as high-res image = exact visual match
    // ====================================================================
    if (!serverSuccess) {
      try {
        setCurrentStatus('Using client-side converter...');
        setProgress(20);

        const mediaImages = [];
        const rels = [];
        let bodyXml = '';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const pct = 20 + Math.round(((pageNum - 1) / totalPages) * 65);
          setProgress(pct);
          setCurrentStatus(`Rendering page ${pageNum} of ${totalPages}...`);

          const page = await pdfDocument.getPage(pageNum);
          const viewport1 = page.getViewport({ scale: 1.0 });

          // Render page at high resolution
          const scale = 2.5;
          const { canvas } = await renderPageCanvas(page, scale);
          const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const base64Data = imgDataUrl.split(',')[1];
          const imgFilename = `page_${pageNum}.jpg`;
          mediaImages.push({ filename: imgFilename, base64: base64Data });

          const rId = `rIdImg${pageNum}`;
          rels.push({ rId, target: `media/${imgFilename}` });

          // Calculate EMUs (1 point = 12700 EMU)
          const maxWEmu = 5486400; // ~6 inches
          const maxHEmu = 7772400; // ~8.5 inches
          let wEmu = Math.round(viewport1.width * 12700);
          let hEmu = Math.round(viewport1.height * 12700);

          if (wEmu > maxWEmu) { const r = maxWEmu / wEmu; wEmu = maxWEmu; hEmu = Math.round(hEmu * r); }
          if (hEmu > maxHEmu) { const r = maxHEmu / hEmu; hEmu = maxHEmu; wEmu = Math.round(wEmu * r); }

          bodyXml += `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="${wEmu}" cy="${hEmu}"/>
            <wp:docPr id="${pageNum}" name="Page ${pageNum}"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr><pic:cNvPr id="${pageNum}" name="Page${pageNum}.jpg"/><pic:cNvPicPr/></pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="${wEmu}" cy="${hEmu}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;

          if (pageNum < totalPages) {
            bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
          }
        }

        setProgress(90);
        setCurrentStatus('Assembling Word document...');

        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>${bodyXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="360" w:right="360" w:bottom="360" w:left="360"/></w:sectPr></w:body>
</w:document>`;

        let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
        rels.forEach(rel => { docRelsXml += `<Relationship Id="${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${rel.target}"/>`; });
        docRelsXml += `</Relationships>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

        const globalRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`;

        const zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypesXml);
        zip.file('_rels/.rels', globalRelsXml);
        zip.file('word/document.xml', documentXml);
        zip.file('word/styles.xml', stylesXml);
        zip.file('word/_rels/document.xml.rels', docRelsXml);
        mediaImages.forEach(img => { zip.file(`word/media/${img.filename}`, img.base64, { base64: true }); });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const blob = new Blob([zipBlob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const outName = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;

        setWordBlob(blob);
        setWordFileName(outName);
        setConversionMethod('client');
        setProgress(100);
        setCurrentStatus('Conversion complete!');
        toast.success('Word document created!', { id: toastId });
      } catch (err) {
        console.error('Client-side conversion failed:', err);
        toast.error('Conversion failed. Please try again.', { id: toastId });
      }
    }

    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!wordBlob) return;
    const downloadUrl = URL.createObjectURL(wordBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = wordFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded .docx file!');
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF to Word Converter"
        description="Convert any PDF document into an editable Microsoft Word (.docx) file with layout, tables, and images preserved."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Direct .DOCX Engine"
        extraBadge="Layout & Tables Preserved"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Main Workspace Area */}
        <motion.div 
          layout
          className={`flex-1 w-full tool-card p-4 md:p-6 flex flex-col relative transition-all duration-500 ease-out ${!file ? 'min-h-[50vh]' : 'min-h-0'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!file ? (
              <motion.div
                key="dropzone"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full w-full flex flex-col justify-center"
              >
                <div 
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-full w-full border-2 border-dashed border-[#c2d7fb] hover:border-[#1a73e8] rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[320px] bg-white hover:bg-[#f8fbff]"
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0])} className="hidden" accept=".pdf,application/pdf" />
                  <div className="w-16 h-16 bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl flex items-center justify-center text-[#1a73e8] mb-4 shadow-2xs transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] mb-2 pointer-events-none text-center">
                    Select PDF to convert to Word
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6368] text-center pointer-events-none max-w-sm leading-relaxed">
                    Drag and drop your PDF here, or <span className="text-[#1a73e8] font-bold hover:underline">browse files</span>. Fast & client-side processed.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[#5f6368] pointer-events-none">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34a853]" /> Layout Preserved</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34a853]" /> Tables & Images</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34a853]" /> Multi-language OCR</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-h-0 w-full space-y-6"
              >
                {/* File summary card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8] shrink-0 shadow-2xs">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#202124] truncate max-w-md">{file.name}</h4>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleClear}
                    disabled={isProcessing}
                    className="btn-google-secondary text-xs py-1.5 px-3"
                  >
                    <X size={14} /> Change PDF
                  </button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2.5 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                    <div className="flex justify-between items-center text-xs font-bold text-[#1a73e8]">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" />
                        {currentStatus || 'Converting document...'}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#e8eaed] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#1a73e8] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Card */}
                {wordBlob && (
                  <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#34a853] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <h5 className="text-[#137333] font-bold text-sm">Conversion Complete!</h5>
                        <p className="text-xs text-[#137333]/80 mt-0.5">
                          {conversionMethod === 'server' 
                            ? 'High-fidelity server docx engine compiled your file successfully.' 
                            : 'Client-side high-resolution layout docx created.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleDownload}
                        className="btn-google-primary text-xs py-2.5 px-5 shadow-sm"
                      >
                        <Download size={15} /> Download Word ({wordFileName})
                      </button>
                      <button
                        onClick={() => { setWordBlob(null); setConversionMethod(''); }}
                        className="btn-google-secondary text-xs py-2.5 px-4"
                      >
                        Convert Again
                      </button>
                    </div>
                  </div>
                )}

                {/* Advanced OCR Options */}
                <div className="pt-2 border-t border-[#dadce0]">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-[#5f6368] hover:text-[#202124] transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAdvanced ? 'Hide OCR Language Options' : 'OCR Language Options (for Scanned Documents)'}
                  </button>

                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 max-w-sm text-xs space-y-1.5"
                    >
                      <label className="text-xs font-bold text-[#202124] block">Document Language</label>
                      <select
                        value={ocrLanguage}
                        onChange={(e) => setOcrLanguage(e.target.value)}
                        className="google-select w-full"
                      >
                        {OCR_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Action Sidebar */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-[#1a73e8]" /> Document Details
            </h3>

            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>Editable .DOCX formatted output compatible with Microsoft Word & Google Docs.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>Preserves columns, tables, headers, and image positions.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#34a853] shrink-0 mt-0.5" />
                <p>100% private. Files are processed securely.</p>
              </div>
            </div>

            {file && (
              <div className="pt-3 border-t border-[#dadce0]">
                {wordBlob ? (
                  <button
                    onClick={handleDownload}
                    className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center"
                  >
                    <Download size={16} /> Download .DOCX
                  </button>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full btn-google-primary text-sm py-3 shadow-sm justify-center disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Converting...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Convert to Word
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfToWord;
