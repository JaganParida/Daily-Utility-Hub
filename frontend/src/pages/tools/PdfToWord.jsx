import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { 
  UploadCloud, FileText, CheckCircle2, Download, Loader2, X, 
  Sparkles, Layers, Globe, Image as ImageIcon, Eye, FileCode, ChevronDown, ChevronUp
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

  // Default optimal settings (automated behind the scenes)
  const [conversionMode, setConversionMode] = useState('smart'); // 'smart', 'ocr', 'vector'
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [includeImages, setIncludeImages] = useState(true);
  const [preserveSpacing, setPreserveSpacing] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    const toastId = toast.loading('Reading PDF document...');

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
          toast.error('Could not parse PDF file.', { id: toastId });
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
      const elements = lines.map(line => ({
        type: 'paragraph',
        text: line.text.trim(),
        isHeader: line.text.length < 50 && line.confidence > 80 && line.text === line.text.toUpperCase(),
        isBold: line.text.length < 60 && line.confidence > 85,
        isItalic: false,
        fontSize: line.text.length < 40 ? 14 : 11
      })).filter(l => l.text.length > 0);

      return {
        elements,
        isOcrUsed: true,
        confidence: Math.round(result.data.confidence || 90)
      };
    } catch (err) {
      console.error(`OCR failed on page ${pageNum}`, err);
      return { elements: [], isOcrUsed: true, confidence: 0 };
    }
  };

  // Advanced Layout Engine: Extracts paragraphs, multi-column tables, and headings
  const parsePageElements = async (page) => {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      return [];
    }

    // Determine average font height
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

    // Group items by vertical Y line (rounded with 3px threshold)
    const rowsByY = {};
    items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5] / 4) * 4;
      const x = Math.round(item.transform[4]);
      const height = Math.abs(item.transform[3] || item.height || 10);
      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('black') || height > avgFontSize * 1.25;
      const isItalic = fontName.includes('italic') || fontName.includes('oblique');

      if (!rowsByY[y]) rowsByY[y] = [];
      rowsByY[y].push({ text: item.str.trim(), x, height, isBold, isItalic });
    });

    const sortedY = Object.keys(rowsByY).sort((a, b) => b - a);

    // Analyze horizontal column layout for table detection
    const parsedRows = sortedY.map(y => {
      const lineItems = rowsByY[y].sort((a, b) => a.x - b.x);
      
      const cells = [];
      let currentCell = null;

      lineItems.forEach(item => {
        if (!currentCell) {
          currentCell = { text: item.text, x: item.x, isBold: item.isBold, isItalic: item.isItalic, height: item.height };
        } else {
          const approxCharWidth = (currentCell.height || 10) * 0.55;
          const prevEnd = currentCell.x + (currentCell.text.length * approxCharWidth);
          const gap = item.x - prevEnd;

          // If gap is greater than 2.5 times the character width, it's a new column
          if (gap > approxCharWidth * 2.5 || gap > 25) {
            cells.push(currentCell);
            currentCell = { text: item.text, x: item.x, isBold: item.isBold, isItalic: item.isItalic, height: item.height };
          } else {
            currentCell.text += ' ' + item.text;
            currentCell.isBold = currentCell.isBold || item.isBold;
            currentCell.isItalic = currentCell.isItalic || item.isItalic;
          }
        }
      });
      if (currentCell) cells.push(currentCell);

      return {
        y: Number(y),
        cells,
        isTableCandidate: cells.length >= 2
      };
    });

    // Group elements into Paragraphs or Tables
    const elements = [];
    let currentTableRows = [];

    parsedRows.forEach(row => {
      if (row.isTableCandidate) {
        currentTableRows.push(row.cells);
      } else {
        if (currentTableRows.length > 0) {
          elements.push({ type: 'table', rows: currentTableRows });
          currentTableRows = [];
        }

        const fullText = row.cells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
        if (fullText) {
          const maxH = Math.max(...row.cells.map(c => c.height));
          const hasBold = row.cells.some(c => c.isBold);
          const hasItalic = row.cells.some(c => c.isItalic);
          const isHeader = maxH > avgFontSize * 1.3 || (fullText.length < 50 && hasBold);

          elements.push({
            type: 'paragraph',
            text: fullText,
            fontSize: Math.round(maxH * 1.2) || 11,
            isBold: hasBold,
            isItalic: hasItalic,
            isHeader
          });
        }
      }
    });

    if (currentTableRows.length > 0) {
      elements.push({ type: 'table', rows: currentTableRows });
    }

    return elements;
  };

  // Convert PDF to Word process
  const handleConvert = async () => {
    if (!file || !pdfDocument) return;

    setIsProcessing(true);
    setProgress(0);
    setExtractedPages([]);
    setWordBlob(null);

    const toastId = toast.loading('Converting PDF to Word...');

    // Attempt 1: Try High-Fidelity Backend Python pdf2docx Conversion Engine
    try {
      setCurrentStatus('Running High-Fidelity Converter Engine...');
      setProgress(25);

      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/pdf/convert-to-word', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const outName = `${file.name.replace(/\.pdf$/i, '')}_converted.docx`;
        setWordBlob(blob);
        setWordFileName(outName);

        setProgress(100);
        setCurrentStatus('Conversion complete!');
        toast.success('High-Fidelity Word (.docx) document created!', { id: toastId });
        setIsProcessing(false);
        return;
      }
    } catch (serverErr) {
      console.warn('Backend Python converter unavailable or unauthenticated. Falling back to client-side engine...', serverErr);
    }

    const pageResults = [];
    const mediaImages = []; // Stores images to embed in OOXML zip { filename, base64 }

    try {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const stepProgress = Math.round(((pageNum - 1) / totalPages) * 80);
        setProgress(stepProgress);
        setCurrentStatus(`Processing Page ${pageNum} of ${totalPages}...`);
        toast.loading(`Processing Page ${pageNum} of ${totalPages}...`, { id: toastId });

        const page = await pdfDocument.getPage(pageNum);
        let parsedElements = await parsePageElements(page);

        // Count native characters
        let totalNativeCharCount = 0;
        parsedElements.forEach(el => {
          if (el.type === 'paragraph') totalNativeCharCount += el.text.length;
          if (el.type === 'table') {
            el.rows.forEach(r => r.forEach(c => totalNativeCharCount += c.text.length));
          }
        });

        let isOcrUsed = false;
        let ocrConfidence = 100;

        // Auto OCR fallback for scanned pages (< 20 native text chars)
        const needsOcr = conversionMode === 'ocr' || (conversionMode === 'smart' && totalNativeCharCount < 20);

        if (needsOcr) {
          setCurrentStatus(`Page ${pageNum}: Extracting scanned document with OCR...`);
          const canvas = await renderPageCanvas(page, 2.0);
          const ocrResult = await performOcr(canvas, ocrLanguage, pageNum);
          if (ocrResult.elements.length > 0) {
            parsedElements = ocrResult.elements;
            isOcrUsed = true;
            ocrConfidence = ocrResult.confidence;
          }
        }

        // Extract ACTUAL native images embedded in the PDF page (not the whole page render)
        if (includeImages) {
          try {
            const operatorList = await page.getOperatorList();
            for (let i = 0; i < operatorList.fnArray.length; i++) {
              const fn = operatorList.fnArray[i];
              if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
                const imgName = operatorList.argsArray[i][0];
                try {
                  const img = await page.objs.get(imgName);
                  if (img && img.data && img.width && img.height) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    const imgData = ctx.createImageData(img.width, img.height);
                    
                    if (img.data.length === img.width * img.height * 4) {
                      imgData.data.set(img.data);
                      ctx.putImageData(imgData, 0, 0);
                    } else if (img.data.length === img.width * img.height * 3) {
                      const rgba = new Uint8ClampedArray(img.width * img.height * 4);
                      for(let j=0, k=0; j < img.data.length; j+=3, k+=4) {
                        rgba[k] = img.data[j]; rgba[k+1] = img.data[j+1]; rgba[k+2] = img.data[j+2]; rgba[k+3] = 255;
                      }
                      imgData.data.set(rgba);
                      ctx.putImageData(imgData, 0, 0);
                    } else {
                      continue; // Unsupported image format
                    }
                    
                    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const base64Data = imgDataUrl.split(',')[1];
                    const filename = `image_p${pageNum}_${i}.jpg`;
                    
                    mediaImages.push({ filename, base64: base64Data });
                    parsedElements.push({ type: 'image', imageName: filename });
                  } else if (img && img.src) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width || 800;
                    canvas.height = img.height || 600;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const base64Data = imgDataUrl.split(',')[1];
                    const filename = `image_p${pageNum}_${i}.jpg`;
                    
                    mediaImages.push({ filename, base64: base64Data });
                    parsedElements.push({ type: 'image', imageName: filename });
                  }
                } catch (imgErr) {
                  console.warn('Failed to extract embedded image', imgErr);
                }
              }
            }
          } catch (e) {
            console.warn(`Could not process images for page ${pageNum}`, e);
          }
        }

        pageResults.push({
          pageNum,
          elements: parsedElements,
          isOcrUsed,
          ocrConfidence,
          needsOcr
        });
      }

      setExtractedPages(pageResults);
      setProgress(85);
      setCurrentStatus('Creating Word document (.docx)...');
      toast.loading('Compiling Word document (.docx)...', { id: toastId });

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
        pData.elements.forEach(el => {
          if (el.type === 'paragraph') {
            const escaped = escapeXml(el.text);
            const fontSizeVal = Math.max(18, Math.min(36, (el.fontSize || 11) * 2));

            documentXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="${preserveSpacing ? '140' : '80'}" w:line="240" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          ${el.isBold ? '<w:b/>' : ''}
          ${el.isItalic ? '<w:i/>' : ''}
          <w:sz w:val="${fontSizeVal}"/>
        </w:rPr>
        <w:t xml:space="preserve">${escaped}</w:t>
      </w:r>
    </w:p>`;
          } else if (el.type === 'table') {
            // Build Microsoft Word Table
            documentXml += `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        </w:tblBorders>
      </w:tblPr>`;

            el.rows.forEach(row => {
              documentXml += `
      <w:tr>`;
              row.forEach(cell => {
                const cellEscaped = escapeXml(cell.text);
                documentXml += `
        <w:tc>
          <w:tcPr>
            <w:tcMar>
              <w:top w:w="120" w:type="dxa"/>
              <w:left w:w="160" w:type="dxa"/>
              <w:bottom w:w="120" w:type="dxa"/>
              <w:right w:w="160" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                ${cell.isBold ? '<w:b/>' : ''}
                <w:sz w:val="20"/>
              </w:rPr>
              <w:t xml:space="preserve">${cellEscaped}</w:t>
            </w:r>
          </w:p>
        </w:tc>`;
              });
              documentXml += `
      </w:tr>`;
            });

            documentXml += `
    </w:tbl>`;
          } else if (el.type === 'image') {
            const rId = `rId_img_${pIdx}_${Math.random().toString(36).substr(2, 9)}`;
            rels.push({ rId, target: `media/${el.imageName}` });

            documentXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="180" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="5080000" cy="5080000"/>
            <wp:docPr id="${Math.floor(Math.random() * 10000)}" name="Extracted Image"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="${Math.floor(Math.random() * 10000)}" name="Picture"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${rId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="5080000" cy="5080000"/></a:xfrm>
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
        });

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
    return acc + p.elements.reduce((lAcc, el) => {
      if (el.type === 'paragraph') return lAcc + el.text.split(/\s+/).length;
      if (el.type === 'table') {
        let count = 0;
        el.rows.forEach(r => r.forEach(c => count += c.text.split(/\s+/).length));
        return lAcc + count;
      }
      return lAcc;
    }, 0);
  }, 0);

  const ocrPagesCount = extractedPages.filter(p => p.isOcrUsed).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Sleek Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/20 p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Tables, Layout & OCR
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              PDF to Word Converter
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Convert any PDF document into a 100% editable Microsoft Word (<code className="text-blue-400 font-mono">.docx</code>) file. 
              Supports tables with borders, embedded photos, headers, and automatic OCR.
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

      {/* Main Content Area */}
      {!file ? (
        /* Clean Upload Dropzone */
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
            Supports native digital PDFs, scanned documents, receipts, eBooks, and assignments.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real Word Tables</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Photos & Figures Included</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Secure & Private</span>
          </div>
        </motion.div>
      ) : (
        /* File Loaded Card & Action Panel */
        <div className="space-y-6">
          {/* Main Action Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-md">
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

            {/* Progress Status Bar when converting */}
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

            {/* Optional Collapsible Settings for Power Users */}
            <div className="pt-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 font-medium"
              >
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showAdvanced ? 'Hide Language Options' : 'OCR Language Options (Optional)'}
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                >
                  <div>
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
                  </div>

                  <div className="flex items-center gap-6 pt-5">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span>Include Figures & Images</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Results & Interactive Preview Area */}
          {extractedPages.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
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
                    <Eye className="w-4 h-4" /> Extracted Document Preview
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
                    <div key={page.pageNum} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                          Page {page.pageNum}
                          {page.isOcrUsed && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                              OCR Auto-Recognised
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {page.elements.length} layout elements parsed
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs text-slate-200 leading-relaxed">
                        {page.elements.map((el, elIdx) => {
                          if (el.type === 'paragraph') {
                            return (
                              <p
                                key={elIdx}
                                className={`${el.isHeader ? 'font-bold text-white text-sm my-1' : ''} ${
                                  el.isBold ? 'font-semibold text-blue-200' : ''
                                } ${el.isItalic ? 'italic' : ''}`}
                              >
                                {el.text}
                              </p>
                            );
                          } else if (el.type === 'table') {
                            return (
                              <div key={elIdx} className="overflow-x-auto my-2">
                                <table className="w-full border-collapse border border-slate-700 text-xs text-slate-200">
                                  <tbody>
                                    {el.rows.map((row, rIdx) => (
                                      <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-800/80 font-bold' : 'hover:bg-slate-900/50'}>
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="border border-slate-700 px-3 py-1.5">
                                            {cell.text}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-xs text-slate-400">Total Pages</span>
                    <h5 className="text-2xl font-bold text-white">{totalPages}</h5>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-xs text-slate-400">Word Count</span>
                    <h5 className="text-2xl font-bold text-blue-400">{totalWordsExtracted}</h5>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-xs text-slate-400">OCR Pages</span>
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
