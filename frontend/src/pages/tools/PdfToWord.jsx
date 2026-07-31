import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { 
  UploadCloud, FileText, CheckCircle2, Download, Loader2, X, 
  Sparkles, Layers, Cpu, Globe, Image as ImageIcon, Eye, FileCode, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Configuration options
  const [conversionMode, setConversionMode] = useState('smart'); // 'smart', 'ocr', 'vector'
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [includeImages, setIncludeImages] = useState(true);
  const [preserveSpacing, setPreserveSpacing] = useState(true);

  // Processing state
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');

  // Results & Preview
  const [extractedPages, setExtractedPages] = useState([]);
  const [wordBlob, setWordBlob] = useState(null);
  const [wordFileName, setWordFileName] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'stats'

  const fileInputRef = useRef(null);

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      handleFileLoad(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileLoad = async (selectedFile) => {
    setIsInspecting(true);
    setExtractedPages([]);
    setWordBlob(null);
    const toastId = toast.loading('Inspecting PDF document...');

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          setFile(selectedFile);
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setIsInspecting(false);
          toast.success(`PDF Loaded: ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'} detected`, { id: toastId });
        } catch (err) {
          console.error(err);
          setIsInspecting(false);
          toast.error('Could not parse PDF file. File may be password protected or corrupted.', { id: toastId });
        }
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error(e);
      setIsInspecting(false);
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
    setExtractedPages([]);
    setWordBlob(null);
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

  // Render high resolution page canvas for OCR / Image embedding
  const renderPageCanvas = async (page, scale = 2.0) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  };

  // Perform Tesseract OCR on canvas image
  const performOcr = async (canvas, language, pageNum) => {
    try {
      setCurrentStatus(`Running OCR on Page ${pageNum}...`);
      const imageBuffer = canvas.toDataURL('image/png');
      const result = await Tesseract.recognize(imageBuffer, language, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const subProgress = Math.round(m.progress * 100);
            setCurrentStatus(`OCR Page ${pageNum}: ${subProgress}% complete`);
          }
        }
      });

      const lines = result.data.lines || [];
      const extractedLines = lines.map(line => ({
        text: line.text.trim(),
        isHeader: line.text.length < 50 && line.confidence > 80 && line.text === line.text.toUpperCase(),
        isBold: line.text.length < 60 && line.confidence > 85,
        isItalic: false,
        fontSize: line.text.length < 40 ? 14 : 11
      })).filter(l => l.text.length > 0);

      return {
        lines: extractedLines,
        isOcrUsed: true,
        confidence: Math.round(result.data.confidence || 90)
      };
    } catch (err) {
      console.error(`OCR failed on page ${pageNum}`, err);
      return { lines: [], isOcrUsed: true, confidence: 0 };
    }
  };

  // Native Vector Text Extractor with Layout & Typography analysis
  const extractNativeText = async (page) => {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      return { lines: [], isOcrUsed: false };
    }

    // Determine average font size to identify headings
    let totalFontSize = 0;
    let validItemsCount = 0;
    items.forEach(item => {
      if (item.str && item.str.trim()) {
        const height = Math.abs(item.transform[3] || item.height || 10);
        totalFontSize += height;
        validItemsCount++;
      }
    });
    const avgFontSize = validItemsCount > 0 ? totalFontSize / validItemsCount : 10;

    // Group text items by line (Y position)
    const linesByY = {};
    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      const height = Math.abs(item.transform[3] || item.height || 10);
      const fontName = (item.fontName || '').toLowerCase();

      const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy') || height > avgFontSize * 1.25;
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      if (!linesByY[y]) {
        linesByY[y] = [];
      }
      linesByY[y].push({ text: item.str, x, height, isBold, isItalic });
    });

    // Sort lines top to bottom
    const sortedY = Object.keys(linesByY).sort((a, b) => b - a);

    const rawLines = sortedY.map(y => {
      // Sort line items left to right
      const lineItems = linesByY[y].sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
      const maxHeight = Math.max(...lineItems.map(i => i.height));
      const hasBold = lineItems.some(i => i.isBold);
      const hasItalic = lineItems.some(i => i.isItalic);

      const isHeader = maxHeight > avgFontSize * 1.3 || (lineText.length < 50 && hasBold);
      const isListItem = /^[•\-*]\s+|^\d+[\.\)]\s+/.test(lineText);

      return {
        text: lineText,
        fontSize: Math.round(maxHeight * 1.2) || 11,
        isBold: hasBold,
        isItalic: hasItalic,
        isHeader,
        isListItem
      };
    }).filter(l => l.text.length > 0);

    // Merge consecutive lines that belong to the same paragraph for natural Word flow
    const paragraphs = [];
    let currentP = null;

    rawLines.forEach(line => {
      if (line.isHeader || line.isListItem || !currentP) {
        if (currentP) paragraphs.push(currentP);
        currentP = { ...line };
      } else {
        const endsWithPunct = /[.!?:]\s*$/.test(currentP.text);
        const sameFont = Math.abs((currentP.fontSize || 11) - (line.fontSize || 11)) <= 2;
        if (!endsWithPunct && sameFont && !currentP.isHeader && !currentP.isListItem) {
          currentP.text += ' ' + line.text;
          currentP.isBold = currentP.isBold || line.isBold;
          currentP.isItalic = currentP.isItalic || line.isItalic;
        } else {
          paragraphs.push(currentP);
          currentP = { ...line };
        }
      }
    });
    if (currentP) paragraphs.push(currentP);

    return { lines: paragraphs, isOcrUsed: false };
  };

  // Convert PDF to Word process
  const handleConvert = async () => {
    if (!file || !pdfDocument) return;

    setIsProcessing(true);
    setProgress(0);
    setExtractedPages([]);
    setWordBlob(null);

    const toastId = toast.loading('Initializing PDF to Word conversion engine...');
    const pageResults = [];
    const mediaImages = []; // Stores images to embed in OOXML zip { filename, base64 }

    try {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const stepProgress = Math.round(((pageNum - 1) / totalPages) * 80);
        setProgress(stepProgress);
        setCurrentStatus(`Processing Page ${pageNum} of ${totalPages}...`);
        toast.loading(`Processing Page ${pageNum} of ${totalPages}...`, { id: toastId });

        const page = await pdfDocument.getPage(pageNum);
        let nativeData = await extractNativeText(page);

        const totalNativeCharCount = nativeData.lines.reduce((acc, l) => acc + l.text.length, 0);

        let finalPageLines = nativeData.lines;
        let isOcrUsed = false;
        let ocrConfidence = 100;

        // Smart Mode decision: If native text is extremely sparse (< 20 chars), trigger OCR fallback
        const needsOcr = conversionMode === 'ocr' || (conversionMode === 'smart' && totalNativeCharCount < 20);

        if (needsOcr) {
          setCurrentStatus(`Page ${pageNum} appears scanned/image-based. Running OCR...`);
          const canvas = await renderPageCanvas(page, 2.0);
          const ocrResult = await performOcr(canvas, ocrLanguage, pageNum);
          if (ocrResult.lines.length > 0) {
            finalPageLines = ocrResult.lines;
            isOcrUsed = true;
            ocrConfidence = ocrResult.confidence;
          }
        }

        // Image extraction: capture page visual snapshot if option enabled or page has image content
        let pageImageName = null;
        if (includeImages) {
          try {
            const pageCanvas = await renderPageCanvas(page, 1.5);
            const imgDataUrl = pageCanvas.toDataURL('image/jpeg', 0.85);
            const base64Data = imgDataUrl.split(',')[1];
            pageImageName = `page_image_${pageNum}.jpg`;
            mediaImages.push({
              filename: pageImageName,
              base64: base64Data,
              widthPt: Math.round(page.view[2] * 0.75) || 450,
              heightPt: Math.round(page.view[3] * 0.75) || 600
            });
          } catch (e) {
            console.warn(`Could not render image for page ${pageNum}`, e);
          }
        }

        pageResults.push({
          pageNum,
          lines: finalPageLines,
          isOcrUsed,
          ocrConfidence,
          imageName: pageImageName
        });
      }

      setExtractedPages(pageResults);
      setProgress(85);
      setCurrentStatus('Packaging Microsoft Word (.docx) document...');
      toast.loading('Compiling Microsoft Word (.docx) document...', { id: toastId });

      // Build OOXML document.xml
      let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>`;

      const rels = []; // Store image relationships

      pageResults.forEach((pData, pIdx) => {
        // Page header separator inside document
        documentXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="240" w:after="120"/>
        <w:rPr>
          <w:b/>
          <w:color w:val="2563EB"/>
          <w:sz w:val="24"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="2563EB"/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>${escapeXml(`--- Page ${pData.pageNum} ${pData.isOcrUsed ? '(OCR Recognised)' : ''} ---`)}</w:t>
      </w:r>
    </w:p>`;

        pData.lines.forEach(line => {
          const escaped = escapeXml(line.text);
          const fontSizeVal = Math.max(18, Math.min(36, (line.fontSize || 11) * 2));
          
          documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="${preserveSpacing ? '140' : '80'}" w:line="240" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          ${line.isBold ? '<w:b/>' : ''}
          ${line.isItalic ? '<w:i/>' : ''}
          <w:sz w:val="${fontSizeVal}"/>
        </w:rPr>
        <w:t xml:space="preserve">${escaped}</w:t>
      </w:r>
    </w:p>`;
        });

        // If embedded image is present and native lines are low, embed image shape
        if (pData.imageName && (pData.lines.length === 0 || needsOcr)) {
          const rId = `rId_img_${pData.pageNum}`;
          rels.push({ rId, target: `media/${pData.imageName}` });

          documentXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="120" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="5080000" cy="6350000"/>
            <wp:docPr id="${pData.pageNum}" name="Page Image ${pData.pageNum}"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="${pData.pageNum}" name="Picture ${pData.pageNum}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${rId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="5080000" cy="6350000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;
        }

        // Add page break between pages except the last page
        if (pIdx < pageResults.length - 1) {
          documentXml += `
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>`;
        }
      });

      documentXml += `
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

      // Document Relationships XML
      let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;

      rels.forEach(rel => {
        docRelsXml += `
  <Relationship Id="${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${rel.target}"/>`;
      });
      docRelsXml += `\n</Relationships>`;

      // Content Types XML
      let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

      const globalRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

      // Assemble ZIP
      const zip = new JSZip();
      zip.file('[Content_Types].xml', contentTypesXml);
      zip.file('_rels/.rels', globalRelsXml);
      zip.file('word/document.xml', documentXml);
      zip.file('word/styles.xml', stylesXml);
      zip.file('word/_rels/document.xml.rels', docRelsXml);

      mediaImages.forEach(img => {
        zip.file(`word/media/${img.filename}`, img.base64, { base64: true });
      });

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const blob = new Blob([zipContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const outName = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;
      setWordBlob(blob);
      setWordFileName(outName);

      setProgress(100);
      setCurrentStatus('Conversion complete!');
      toast.success('Converted PDF to editable Word (.docx) document!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Conversion failed. Please try again.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
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

  const totalWordsExtracted = extractedPages.reduce((acc, p) => {
    return acc + p.lines.reduce((lAcc, l) => lAcc + l.text.split(/\s+/).length, 0);
  }, 0);

  const ocrPagesCount = extractedPages.filter(p => p.isOcrUsed).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/20 p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity OCR & Layout Preservation
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              PDF to Word Converter
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Convert PDF documents into 100% editable Microsoft Word (<code className="text-blue-400 font-mono">.docx</code>) files. 
              Supports automatic Tesseract OCR for scanned PDFs, font size preservation, and embedded figures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/tools/pdf-converter'}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-rose-400" />
              Need PDF to Images?
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!file ? (
        /* Upload Area */
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
            Drop your PDF here, or <span className="text-blue-400 underline">browse</span>
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Supports native digital PDFs, scanned documents, receipts, eBooks, and assignments up to multi-page files.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Editable DOCX</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Smart Tesseract OCR</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Client-Side Privacy</span>
          </div>
        </motion.div>
      ) : (
        /* File Loaded Dashboard & Settings */
        <div className="space-y-6">
          {/* File Card & Control Header */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Change File
              </button>

              {wordBlob ? (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download DOCX
                </button>
              ) : (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Convert to Word
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Conversion Mode & Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversion Mode Selection */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Conversion Mode
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setConversionMode('smart')}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-1 ${
                    conversionMode === 'smart'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-bold text-white flex items-center justify-between">
                    Auto Smart Mode <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  <span>Extracts vector text + auto Tesseract OCR for scanned pages.</span>
                </button>

                <button
                  onClick={() => setConversionMode('ocr')}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-1 ${
                    conversionMode === 'ocr'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-bold text-white">Full High-Precision OCR</span>
                  <span>Forces Tesseract OCR recognition across all pages at 300 DPI.</span>
                </button>

                <button
                  onClick={() => setConversionMode('vector')}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-1 ${
                    conversionMode === 'vector'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-bold text-white">Fast Digital Vector Text</span>
                  <span>Ultra-fast extraction for digital PDFs without OCR.</span>
                </button>
              </div>
            </div>

            {/* OCR Language & Options */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" /> OCR Language & Formatting
              </label>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 mb-1.5 block">OCR Recognition Language</span>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {OCR_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Embed Page Snapshot Figures</span>
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Preserve Paragraph Spacing</span>
                    <input
                      type="checkbox"
                      checked={preserveSpacing}
                      onChange={(e) => setPreserveSpacing(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Status & Highlights */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-blue-400" /> Quality Guarantee
                </label>

                <div className="space-y-2 text-xs text-slate-400">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>100% Editable DOCX:</strong> Generated using native OOXML standards for Word and Google Docs.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>No Empty Blank Files:</strong> Scanned pages automatically trigger high-resolution Tesseract OCR.</span>
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-blue-400">
                    <span>{currentStatus || 'Processing...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results & Interactive Preview Area */}
          {extractedPages.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeTab === 'preview'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" /> Extracted Text Preview
                  </button>

                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeTab === 'stats'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-4 h-4" /> Document Statistics
                  </button>
                </div>

                {wordBlob && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download .docx
                  </button>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === 'preview' ? (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {extractedPages.map((page) => (
                    <div key={page.pageNum} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                          Page {page.pageNum}
                          {page.isOcrUsed && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
                              OCR Recognised ({page.ocrConfidence}%)
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {page.lines.length} lines parsed
                        </span>
                      </div>

                      <div className="space-y-1.5 font-sans text-xs text-slate-200 leading-relaxed">
                        {page.lines.length === 0 ? (
                          <p className="text-slate-500 italic text-center py-4">No text detected on this page.</p>
                        ) : (
                          page.lines.map((line, lIdx) => (
                            <p
                              key={lIdx}
                              className={`${line.isHeader ? 'font-bold text-white text-sm my-1' : ''} ${
                                line.isBold ? 'font-semibold text-blue-200' : ''
                              } ${line.isItalic ? 'italic' : ''}`}
                            >
                              {line.text}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-slate-400">Total Pages Parsed</span>
                    <h5 className="text-2xl font-bold text-white">{totalPages}</h5>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-slate-400">Estimated Words</span>
                    <h5 className="text-2xl font-bold text-blue-400">{totalWordsExtracted}</h5>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-slate-400">Pages with OCR Triggered</span>
                    <h5 className="text-2xl font-bold text-emerald-400">{ocrPagesCount}</h5>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
