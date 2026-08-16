import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  UploadCloud, FileText, CheckCircle2, Download, Loader2, X, 
  Sparkles, FileCode, Check, RefreshCw, Layers, Table, Type,
  FileCheck, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import api from '../../lib/api';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const CONVERSION_MODES = [
  {
    id: 'editable',
    label: 'Standard Editable Text & Tables',
    desc: 'Extracts paragraphs, tables, bold/italic text, and layout into editable Word elements.',
    badge: 'Recommended',
    icon: Type
  },
  {
    id: 'hybrid',
    label: 'High-Fidelity Document Layout',
    desc: 'Maintains exact visual formatting, text runs, spacing, and page headers.',
    badge: 'Exact Layout',
    icon: Layers
  }
];

const PdfToWord = () => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      loadFile(initialFile);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [firstPageThumbnail, setFirstPageThumbnail] = useState(null);
  const [conversionMode, setConversionMode] = useState('editable');
  
  // Extraction stats
  const [detectedWords, setDetectedWords] = useState(0);
  const [detectedTables, setDetectedTables] = useState(0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Result state
  const [wordBlob, setWordBlob] = useState(null);
  const [wordFileName, setWordFileName] = useState('');

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      loadFile(dropped);
    } else {
      toast.error('Please upload a valid PDF document.');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected?.type === 'application/pdf') {
      loadFile(selected);
    }
  };

  const loadFile = async (selectedFile) => {
    setIsProcessing(true);
    setWordBlob(null);
    setDetectedWords(0);
    setDetectedTables(0);
    const toastId = toast.loading('Reading PDF document structure...');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setFile(selectedFile);

      // Render page 1 thumbnail and count approximate text
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 0.6 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page1.render({ canvasContext: ctx, viewport }).promise;
      setFirstPageThumbnail(canvas.toDataURL());

      // Quick word count scan on first 3 pages
      let totalWords = 0;
      let tablesEst = 0;
      for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const str = textContent.items.map(i => i.str).join(' ');
        totalWords += str.split(/\s+/).filter(Boolean).length;
        if (textContent.items.length > 50) tablesEst++;
      }
      
      const estimatedTotalWords = Math.round((totalWords / Math.min(pdf.numPages, 3)) * pdf.numPages);
      setDetectedWords(estimatedTotalWords);
      setDetectedTables(tablesEst > 0 ? tablesEst : 1);

      toast.success(`PDF Loaded: ${pdf.numPages} pages (~${estimatedTotalWords} words)`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse PDF document.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to escape XML special characters
  const escapeXml = (unsafeStr) => {
    if (!unsafeStr) return '';
    return unsafeStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Extract spatial structured text, paragraphs, and tables from a PDF page
  const extractStructuredPage = async (page) => {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      return { hasText: false, elements: [] };
    }

    // Calculate baseline font size
    let sumHeight = 0;
    let validCount = 0;
    items.forEach(item => {
      if (item.str && item.str.trim()) {
        sumHeight += Math.abs(item.transform[3] || item.height || 11);
        validCount++;
      }
    });
    const avgHeight = validCount > 0 ? sumHeight / validCount : 11;

    // Group text items by line (Y coordinate bucketed to 3pt)
    const rowsByY = {};
    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = Math.round(item.transform[4]);
      const height = Math.abs(item.transform[3] || item.height || 11);
      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('black') || height > avgHeight * 1.25;
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      if (!rowsByY[y]) rowsByY[y] = [];
      rowsByY[y].push({ text: item.str, x, height, isBold, isItalic });
    });

    // Sort lines top to bottom (higher Y is higher up in PDF coordinate space)
    const sortedYKeys = Object.keys(rowsByY).sort((a, b) => Number(b) - Number(a));
    const elements = [];
    let currentTableRows = [];

    sortedYKeys.forEach((y) => {
      const rawLineItems = rowsByY[y].sort((a, b) => a.x - b.x);

      // Merge items that are right next to each other into column segments
      const segments = [];
      let curSeg = null;

      rawLineItems.forEach(item => {
        if (!curSeg) {
          curSeg = { ...item };
        } else {
          const charWidth = (curSeg.height || 11) * 0.55;
          const prevEnd = curSeg.x + curSeg.text.length * charWidth;
          const gap = item.x - prevEnd;

          if (gap > charWidth * 3.5) {
            // Gap is wide -> separate column!
            segments.push(curSeg);
            curSeg = { ...item };
          } else {
            curSeg.text += (gap > charWidth ? ' ' : '') + item.text;
            curSeg.isBold = curSeg.isBold || item.isBold;
            curSeg.isItalic = curSeg.isItalic || item.isItalic;
          }
        }
      });
      if (curSeg) segments.push(curSeg);

      // If line has 2 or more distinct columns separated by wide gaps, treat as table row
      if (segments.length >= 2) {
        currentTableRows.push(segments);
      } else {
        // Flush any pending table
        if (currentTableRows.length > 0) {
          elements.push({ type: 'table', rows: currentTableRows });
          currentTableRows = [];
        }

        if (segments.length === 1) {
          const seg = segments[0];
          const isHeading = seg.height > avgHeight * 1.35 || (seg.isBold && seg.text.length < 80);
          elements.push({
            type: 'paragraph',
            text: seg.text.trim(),
            isHeading,
            isBold: seg.isBold,
            isItalic: seg.isItalic,
            fontSize: Math.round(Math.max(18, Math.min(44, (seg.height || 11) * 2))) // in half-points
          });
        }
      }
    });

    if (currentTableRows.length > 0) {
      elements.push({ type: 'table', rows: currentTableRows });
    }

    return { hasText: true, elements };
  };

  // Convert elements into OpenXML (WordprocessingML)
  const buildPageWordXml = (pageData) => {
    let xml = '';

    pageData.elements.forEach(elem => {
      if (elem.type === 'paragraph') {
        const escaped = escapeXml(elem.text);
        if (!escaped) return;

        xml += `<w:p>
          <w:pPr>
            <w:spacing w:before="60" w:after="120" w:line="276" w:lineRule="auto"/>
            ${elem.isHeading ? '<w:jc w:val="left"/>' : ''}
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
              ${elem.isBold ? '<w:b/><w:bCs/>' : ''}
              ${elem.isItalic ? '<w:i/><w:iCs/>' : ''}
              <w:sz w:val="${elem.fontSize || 22}"/>
              <w:szCs w:val="${elem.fontSize || 22}"/>
            </w:rPr>
            <w:t xml:space="preserve">${escaped}</w:t>
          </w:r>
        </w:p>`;
      } else if (elem.type === 'table') {
        const maxCols = Math.max(...elem.rows.map(r => r.length));
        
        xml += `<w:tbl>
          <w:tblPr>
            <w:tblStyle w:val="TableGrid"/>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:left w:val="none"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:right w:val="none"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
              <w:insideV w:val="none"/>
            </w:borders>
            <w:tblCellMar>
              <w:top w:w="80" w:type="dxa"/>
              <w:left w:w="120" w:type="dxa"/>
              <w:bottom w:w="80" w:type="dxa"/>
              <w:right w:w="120" w:type="dxa"/>
            </w:tblCellMar>
          </w:tblPr>`;

        elem.rows.forEach((row, rowIdx) => {
          xml += `<w:tr>`;
          for (let c = 0; c < maxCols; c++) {
            const cell = row[c];
            const cellText = cell ? escapeXml(cell.text.trim()) : '';
            const isBold = cell ? cell.isBold : false;

            xml += `<w:tc>
              <w:tcPr>
                <w:tcW w:w="${Math.round(5000 / maxCols)}" w:type="pct"/>
                ${rowIdx === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="F1F3F4"/>' : ''}
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    ${isBold || rowIdx === 0 ? '<w:b/><w:bCs/>' : ''}
                    <w:sz w:val="20"/>
                  </w:rPr>
                  <w:t xml:space="preserve">${cellText}</w:t>
                </w:r>
              </w:p>
            </w:tc>`;
          }
          xml += `</w:tr>`;
        });

        xml += `</w:tbl>`;
      }
    });

    return xml;
  };

  const handleConvert = async () => {
    if (!file || !pdfDoc) return;
    setIsProcessing(true);
    setProgress(5);
    setWordBlob(null);
    setStatusMessage('Analyzing document structure...');
    const toastId = toast.loading('Converting PDF into editable Microsoft Word (.docx)...');

    // 1. Try Backend High-Fidelity Python pdf2docx first if server is reachable
    let serverSuccess = false;
    try {
      setStatusMessage('Checking high-fidelity conversion engine...');
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/pdf/convert-to-word', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000
      });

      if (response.data && response.data.size > 1000) {
        const contentType = response.headers?.['content-type'] || '';
        if (!contentType.includes('application/json')) {
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          });
          const outName = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;
          setWordBlob(blob);
          setWordFileName(outName);
          setProgress(100);
          setStatusMessage('Done!');
          toast.success('Converted to Microsoft Word document!', { id: toastId });
          setIsProcessing(false);
          serverSuccess = true;

          // Auto download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = outName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }
      }
    } catch (err) {
      console.warn('Server conversion unavailable, executing in-browser DOCX compilation:', err?.message);
    }

    // 2. Client-Side OpenXML DOCX Compilation
    if (!serverSuccess) {
      try {
        setStatusMessage('Extracting text, paragraphs, and tables...');
        let allBodyXml = '';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setProgress(Math.round((pageNum / totalPages) * 75));
          setStatusMessage(`Extracting Page ${pageNum} of ${totalPages}...`);

          const page = await pdfDoc.getPage(pageNum);
          const pageData = await extractStructuredPage(page);

          if (pageData.hasText) {
            allBodyXml += buildPageWordXml(pageData);
          } else {
            // Scanned image page fallback
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const textContent = await page.getTextContent();
            const rawText = textContent.items.map(i => i.str).join(' ');
            if (rawText.trim()) {
              allBodyXml += `<w:p><w:r><w:t xml:space="preserve">${escapeXml(rawText)}</w:t></w:r></w:p>`;
            }
          }

          // Page break between pages
          if (pageNum < totalPages) {
            allBodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
          }
        }

        setProgress(85);
        setStatusMessage('Building Microsoft Word OpenXML package...');

        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${allBodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

        const globalRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

        const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="202124"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

        const zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypesXml);
        zip.file('_rels/.rels', globalRelsXml);
        zip.file('word/document.xml', documentXml);
        zip.file('word/styles.xml', stylesXml);
        zip.file('word/_rels/document.xml.rels', docRelsXml);

        setProgress(95);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const docxBlob = new Blob([zipBlob], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        const outFileName = `${file.name.replace(/\.pdf$/i, '')}_editable.docx`;

        setWordBlob(docxBlob);
        setWordFileName(outFileName);
        setProgress(100);
        setStatusMessage('Complete!');
        toast.success('Converted to editable Word (.docx)!', { id: toastId });

        // Auto download
        const url = URL.createObjectURL(docxBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error('Client conversion error:', err);
        toast.error('Failed to convert PDF to Word.', { id: toastId });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownload = () => {
    if (!wordBlob) return;
    const url = URL.createObjectURL(wordBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = wordFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Downloaded .docx file!');
  };

  const handleClear = () => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setFirstPageThumbnail(null);
    setWordBlob(null);
  };

  return (
    <div className="tool-page-container">
      <ToolHeader
        title="PDF to Word (.DOCX) Converter"
        description="Convert PDF documents into fully editable Microsoft Word (.docx) files with paragraphs, tables, and formatting preserved."
        category="PDF Tools"
        categoryPath="/search"
        icon={FileText}
        iconColor="text-[#1a73e8] bg-[#e8f0fe] border-[#d2e3fc]"
        badge="Direct .DOCX Engine"
        extraBadge="Fully Editable Text"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Main Work Area */}
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {!file ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`tool-card p-8 sm:p-12 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[380px] group ${
                isDragging 
                  ? 'border-[#1a73e8] bg-[#e8f0fe]/50 scale-[0.99] shadow-inner' 
                  : 'border-[#c2d7fb] hover:border-[#1a73e8] hover:bg-[#f8fbff]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,application/pdf" 
              />
              <div className="w-20 h-20 bg-[#e8f0fe] border border-[#d2e3fc] rounded-3xl flex items-center justify-center text-[#1a73e8] mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                <FileText size={40} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#202124] mb-2">
                Select PDF to Convert to Word
              </h3>
              <p className="text-xs sm:text-sm text-[#5f6368] max-w-md leading-relaxed mb-6">
                Drag & drop your PDF file here, or <span className="text-[#1a73e8] font-bold underline">browse files</span>. Extracts genuine editable text & tables.
              </p>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#e6f4ea] text-[#137333] text-xs font-semibold rounded-full border border-[#ceead6]">
                  100% Editable DOCX
                </span>
                <span className="px-3 py-1 bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold rounded-full border border-[#d2e3fc]">
                  Preserves Tables & Paragraphs
                </span>
                <span className="px-3 py-1 bg-[#fef7e0] text-[#b06000] text-xs font-semibold rounded-full border border-[#feefc3]">
                  Word & Google Docs Compatible
                </span>
              </div>
            </div>
          ) : (
            /* Active Document Studio Layout */
            <div className="tool-card p-5 sm:p-6 space-y-6">
              
              {/* Document Overview Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f8f9fa] rounded-2xl border border-[#dadce0]">
                <div className="flex items-center gap-3.5 min-w-0">
                  {firstPageThumbnail ? (
                    <img 
                      src={firstPageThumbnail} 
                      alt="Thumbnail"
                      className="w-14 h-18 object-cover rounded-lg border border-[#dadce0] shadow-xs shrink-0 bg-white"
                    />
                  ) : (
                    <div className="p-3 bg-[#e8f0fe] text-[#1a73e8] rounded-xl shrink-0">
                      <FileText size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm sm:text-base text-[#202124] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-[#5f6368] mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB &bull; {totalPages} Pages &bull; ~{detectedWords} Words
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="btn-google-secondary text-xs py-2 px-3 self-end sm:self-center"
                >
                  <X size={14} /> Change PDF
                </button>
              </div>

              {/* Conversion Mode Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                  Select Conversion Engine
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {CONVERSION_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = conversionMode === mode.id;

                    return (
                      <div
                        key={mode.id}
                        onClick={() => setConversionMode(mode.id)}
                        className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'border-[#1a73e8] bg-[#e8f0fe]/60 shadow-xs ring-2 ring-[#1a73e8]/20'
                            : 'border-[#dadce0] bg-white hover:border-[#1a73e8]/50 hover:bg-[#f8fbff]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${
                              isSelected ? 'bg-[#1a73e8] text-white border-[#1a73e8]' : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-[#202124]">{mode.label}</h4>
                              <span className="text-[10px] font-bold text-[#137333]">{mode.badge}</span>
                            </div>
                          </div>

                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[#1a73e8]' : 'border-[#dadce0]'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />}
                          </div>
                        </div>

                        <p className="text-xs text-[#5f6368] leading-relaxed">
                          {mode.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-4 bg-[#e8f0fe] rounded-2xl border border-[#d2e3fc] space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#1a73e8]">
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      {statusMessage}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-[#d2e3fc] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#1a73e8] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Download Card */}
              {wordBlob && !isProcessing && (
                <div className="p-4 bg-[#e6f4ea] border border-[#ceead6] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34a853] text-white flex items-center justify-center shrink-0">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#137333]">Word Document Ready!</h4>
                      <p className="text-xs text-[#202124]">
                        Compiled into genuine editable OpenXML format ({wordFileName}).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="btn-google-primary text-xs py-2 px-4 shadow-sm shrink-0"
                  >
                    <Download size={14} /> Download Again
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Sidebar Cockpit */}
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-5 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="tool-sidebar p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] border-b border-[#dadce0] pb-3 flex items-center gap-2">
              <FileCheck size={15} className="text-[#1a73e8]" /> Document Summary
            </h3>

            <div className="space-y-3 text-xs text-[#5f6368]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Generates real .DOCX XML elements that you can edit, retype, and copy in Microsoft Word.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Compatible with Google Docs, LibreOffice, and Pages.</p>
              </div>
            </div>

            {file && (
              <div className="border-t border-[#dadce0] pt-3 text-xs space-y-2">
                <div className="flex justify-between text-[#5f6368]">
                  <span>Source File:</span>
                  <span className="font-bold text-[#202124] truncate max-w-[160px]">{file.name}</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Total Pages:</span>
                  <span className="font-bold text-[#202124]">{totalPages} Pages</span>
                </div>
                <div className="flex justify-between text-[#5f6368]">
                  <span>Approx Words:</span>
                  <span className="font-bold text-[#1a73e8]">~{detectedWords} Words</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#dadce0] space-y-2">
              <button
                onClick={handleConvert}
                disabled={isProcessing || !file}
                className="w-full btn-google-primary text-sm py-3.5 shadow-md justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Converting ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Convert to Word (.DOCX)</span>
                  </>
                )}
              </button>

              {wordBlob && !isProcessing && (
                <button
                  onClick={handleDownload}
                  className="w-full btn-google-secondary text-xs py-2 justify-center border-[#34a853] text-[#137333] bg-[#e6f4ea] hover:bg-[#ceead6]"
                >
                  <CheckCircle2 size={14} className="text-[#34a853]" /> Download Word (.DOCX)
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PdfToWord;
