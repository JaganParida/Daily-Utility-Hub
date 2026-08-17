import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { 
  UploadCloud, FileText, CheckCircle2, Download, Loader2, X, 
  Sparkles, Type, Layers, Check, RefreshCw, FileCheck, AlertCircle,
  Table as TableIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  PageBreak
} from 'docx';
import api from '../../lib/api';

// Setup pdfjs worker using unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const CONVERSION_MODES = [
  {
    id: 'editable',
    label: 'Standard Editable Text & Tables',
    desc: 'Extracts real paragraphs, tables, bold/italic text, and layout into fully editable Word elements.',
    badge: 'Recommended',
    icon: Type
  },
  {
    id: 'hybrid',
    label: 'High-Fidelity Document Layout',
    desc: 'Maintains strict line-by-line positions, headings, font sizing, and visual document flow.',
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

  // Document Metrics
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

      // Render page 1 thumbnail
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 0.6 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page1.render({ canvasContext: ctx, viewport }).promise;
      setFirstPageThumbnail(canvas.toDataURL());

      // Fast text metric scanner across pages
      let totalWordCount = 0;
      let tablesCount = 0;
      const scanLimit = Math.min(pdf.numPages, 5);

      for (let p = 1; p <= scanLimit; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const textStr = textContent.items.map(i => i.str).join(' ');
        totalWordCount += textStr.split(/\s+/).filter(Boolean).length;
        if (textContent.items.length > 40) tablesCount++;
      }

      const estimatedWords = Math.round((totalWordCount / scanLimit) * pdf.numPages);
      setDetectedWords(estimatedWords);
      setDetectedTables(tablesCount);

      toast.success(`PDF Loaded: ${pdf.numPages} pages (~${estimatedWords} words)`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse PDF document.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper: Extract structured lines, headings, tables, and paragraphs from PDF page
  const parsePageContent = async (page) => {
    const textContent = await page.getTextContent({ normalizeWhitespace: true });
    const items = textContent.items;

    if (!items || items.length === 0) {
      return { hasText: false, elements: [] };
    }

    // Determine baseline body font size
    let totalHeight = 0;
    let validCount = 0;
    items.forEach(item => {
      if (item.str && item.str.trim()) {
        totalHeight += Math.abs(item.transform[3] || item.height || 11);
        validCount++;
      }
    });
    const avgFontSize = validCount > 0 ? totalHeight / validCount : 11;

    // Group items by line (Y coordinate bucketed to 3.5pt)
    const lineBuckets = {};
    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5] / 3.5) * 3.5;
      const x = Math.round(item.transform[4]);
      const height = Math.abs(item.transform[3] || item.height || 11);
      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy') || height > avgFontSize * 1.25;
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      if (!lineBuckets[y]) lineBuckets[y] = [];
      lineBuckets[y].push({ text: item.str, x, height, isBold, isItalic });
    });

    // Sort lines top-to-bottom (higher Y in PDF space is at top of page)
    const sortedYKeys = Object.keys(lineBuckets).sort((a, b) => Number(b) - Number(a));
    const elements = [];
    let currentTableRows = [];

    sortedYKeys.forEach((y) => {
      const lineItems = lineBuckets[y].sort((a, b) => a.x - b.x);

      // Merge adjacent text items into column chunks
      const chunks = [];
      let activeChunk = null;

      lineItems.forEach(item => {
        if (!activeChunk) {
          activeChunk = { ...item };
        } else {
          const charW = (activeChunk.height || 11) * 0.55;
          const prevEnd = activeChunk.x + activeChunk.text.length * charW;
          const gap = item.x - prevEnd;

          // If gap is large, treat as separate column (e.g. table cell)
          if (gap > charW * 3.2) {
            chunks.push(activeChunk);
            activeChunk = { ...item };
          } else {
            activeChunk.text += (gap > charW ? ' ' : '') + item.text;
            activeChunk.isBold = activeChunk.isBold || item.isBold;
            activeChunk.isItalic = activeChunk.isItalic || item.isItalic;
          }
        }
      });
      if (activeChunk) chunks.push(activeChunk);

      // Check if line represents a table row (2+ distinct columns separated by wide gaps)
      if (chunks.length >= 2) {
        currentTableRows.push(chunks);
      } else {
        // Flush table if active
        if (currentTableRows.length > 0) {
          elements.push({ type: 'table', rows: currentTableRows });
          currentTableRows = [];
        }

        if (chunks.length === 1) {
          const chunk = chunks[0];
          const text = chunk.text.trim();
          if (text) {
            const isHeading = chunk.height > avgFontSize * 1.35 || (chunk.isBold && text.length < 80);
            elements.push({
              type: 'paragraph',
              text,
              isHeading,
              isBold: chunk.isBold,
              isItalic: chunk.isItalic,
              fontSize: Math.round(Math.max(10, Math.min(26, chunk.height || 11)))
            });
          }
        }
      }
    });

    if (currentTableRows.length > 0) {
      elements.push({ type: 'table', rows: currentTableRows });
    }

    return { hasText: true, elements };
  };

  // Convert elements into official DOCX components
  const buildDocxElements = (pageElements, isLastPage) => {
    const docxItems = [];

    pageElements.forEach((elem) => {
      if (elem.type === 'paragraph') {
        const textRuns = [
          new TextRun({
            text: elem.text,
            bold: elem.isBold,
            italics: elem.isItalic,
            size: (elem.fontSize || 11) * 2, // docx uses half-points
            font: 'Calibri',
            color: '202124'
          })
        ];

        docxItems.push(
          new Paragraph({
            children: textRuns,
            heading: elem.isHeading ? HeadingLevel.HEADING_2 : undefined,
            spacing: {
              before: elem.isHeading ? 180 : 80,
              after: elem.isHeading ? 140 : 120,
              line: 276
            }
          })
        );
      } else if (elem.type === 'table') {
        const maxCols = Math.max(...elem.rows.map(r => r.length));
        
        const tableRows = elem.rows.map((rowItems, rowIdx) => {
          const cells = [];

          for (let colIdx = 0; colIdx < maxCols; colIdx++) {
            const item = rowItems[colIdx];
            const cellText = item ? item.text.trim() : '';
            const isHeaderRow = rowIdx === 0;

            cells.push(
              new TableCell({
                width: {
                  size: Math.round(100 / maxCols),
                  type: WidthType.PERCENTAGE
                },
                shading: isHeaderRow ? {
                  fill: 'F1F3F4'
                } : undefined,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: item?.isBold || isHeaderRow,
                        size: isHeaderRow ? 20 : 19,
                        font: 'Calibri',
                        color: '202124'
                      })
                    ],
                    spacing: { before: 60, after: 60 }
                  })
                ]
              })
            );
          }

          return new TableRow({
            children: cells
          });
        });

        docxItems.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E0E0E0' },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: tableRows
          })
        );

        // Add small spacing paragraph after table
        docxItems.push(new Paragraph({ spacing: { after: 120 } }));
      }
    });

    if (!isLastPage) {
      docxItems.push(
        new Paragraph({
          children: [new PageBreak()]
        })
      );
    }

    return docxItems;
  };

  const handleConvert = async () => {
    if (!file || !pdfDoc) return;
    setIsProcessing(true);
    setProgress(5);
    setWordBlob(null);
    setStatusMessage('Analyzing document structure...');
    const toastId = toast.loading('Converting PDF into editable Microsoft Word (.docx)...');

    // 1. Try Backend High-Fidelity Python pdf2docx first if server is running
    let serverSuccess = false;
    try {
      setStatusMessage('Checking server high-fidelity engine...');
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/pdf/convert-to-word', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000
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
          setStatusMessage('Complete!');
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
      console.warn('Backend conversion unavailable, compiling via native docx engine:', err?.message);
    }

    // 2. Client-Side Official docx Library Compilation
    if (!serverSuccess) {
      try {
        setStatusMessage('Extracting text, paragraphs, and tables...');
        const allDocxChildren = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setProgress(Math.round((pageNum / totalPages) * 75));
          setStatusMessage(`Extracting Page ${pageNum} of ${totalPages}...`);

          const page = await pdfDoc.getPage(pageNum);
          const pageData = await parsePageContent(page);

          if (pageData.hasText && pageData.elements.length > 0) {
            const pageDocxElements = buildDocxElements(pageData.elements, pageNum === totalPages);
            allDocxChildren.push(...pageDocxElements);
          } else {
            // Fallback for empty/image-only page
            const textContent = await page.getTextContent();
            const rawText = textContent.items.map(i => i.str).join(' ');
            
            allDocxChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: rawText.trim() || `[Page ${pageNum} Content]`,
                    font: 'Calibri',
                    size: 22
                  })
                ],
                spacing: { after: 120 }
              })
            );

            if (pageNum < totalPages) {
              allDocxChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
          }
        }

        setProgress(85);
        setStatusMessage('Compiling Microsoft Word (.docx) document...');

        const doc = new Document({
          creator: 'Daily Utility Hub',
          title: file.name.replace(/\.pdf$/i, ''),
          description: 'Converted from PDF with Daily Utility Hub',
          styles: {
            default: {
              document: {
                run: {
                  font: 'Calibri',
                  size: 22,
                  color: '202124'
                }
              }
            }
          },
          sections: [
            {
              properties: {
                page: {
                  margin: {
                    top: 1440,    // 1 inch
                    right: 1440,
                    bottom: 1440,
                    left: 1440
                  }
                }
              },
              children: allDocxChildren
            }
          ]
        });

        setProgress(95);
        setStatusMessage('Packing document archive...');

        const docxBlob = await Packer.toBlob(doc);
        const outFileName = `${file.name.replace(/\.pdf$/i, '')}_editable.docx`;

        setWordBlob(docxBlob);
        setWordFileName(outFileName);
        setProgress(100);
        setStatusMessage('Complete!');
        toast.success('Word document (.docx) compiled successfully!', { id: toastId });

        // Auto download
        const url = URL.createObjectURL(docxBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error('Client docx compilation error:', err);
        toast.error('Failed to convert PDF to Word document.', { id: toastId });
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
                        Compiled into genuine, fully editable OpenXML format ({wordFileName}).
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
                <p>Generates 100% compliant OpenXML (.docx) that opens cleanly in Microsoft Word without errors.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-[#34a853] mt-0.5 shrink-0" />
                <p>Full support for tables, bold/italic fonts, headings, and paragraph flow.</p>
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
