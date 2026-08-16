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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/20 p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Exact PDF Layout Preserved
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              PDF to Word Converter
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Convert any PDF into an editable Word (<code className="text-blue-400 font-mono">.docx</code>) file with exact visual layout, tables, images, and OCR support.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/tools/pdf-converter'}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-rose-400" />
              PDF to Images
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!file ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-3xl p-12 text-center bg-slate-900/40 hover:bg-slate-900/60 transition cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0])}
            accept="application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition duration-300">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Select PDF file, or <span className="text-blue-400 underline">drag & drop</span>
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Works with all PDFs — digital, scanned, receipts, assignments, forms, and reports.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exact Visual Layout</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tables & Images</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto OCR</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Free & Private</span>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-md">
            {/* File info & actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Change PDF
                </button>

                {wordBlob ? (
                  <button
                    onClick={handleDownload}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download Word (.docx)
                  </button>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Converting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Convert to Word
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold text-blue-400">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    {currentStatus || 'Converting document...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Optional OCR Language */}
            <div className="pt-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 font-medium"
              >
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showAdvanced ? 'Hide Language Options' : 'OCR Language (for scanned PDFs)'}
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-slate-800 max-w-sm text-xs"
                >
                  <span className="text-slate-400 mb-1 block">OCR Recognition Language</span>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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

            {/* Success Result */}
            {wordBlob && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h5 className="text-white font-bold text-sm">Conversion Complete!</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {conversionMethod === 'server' 
                        ? 'Converted using high-fidelity server engine (pdf2docx)' 
                        : 'Converted with full layout preservation + editable text'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download {wordFileName}
                  </button>
                  <button
                    onClick={() => { setWordBlob(null); setConversionMethod(''); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  >
                    Convert Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
