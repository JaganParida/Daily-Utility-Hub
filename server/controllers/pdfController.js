const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Helper to clean up uploaded files
const cleanupFiles = (files) => {
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Merge Multiple PDFs
exports.mergePdfs = async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      cleanupFiles(req.files || []);
      return res.status(400).json({ message: 'Please upload at least two PDF files to merge.' });
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    
    // Clean up temp uploads
    cleanupFiles(req.files);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged_document.pdf');
    res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    cleanupFiles(req.files || []);
    console.error('🔥🔥🔥 Merge Error (pdfController.js):', error);
    console.error(error.stack);
    res.status(500).json({ message: 'Failed to merge PDFs. The files may be corrupted or encrypted.', details: error.message });
  }
};

// Split PDF
exports.splitPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }

    const { pages } = req.body; // Array of page numbers to extract (1-indexed) or a range string "1-3"
    
    if (!pages) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Please specify which pages to extract.' });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdf = await PDFDocument.load(pdfBytes);
    const totalPages = pdf.getPageCount();

    // Parse page numbers (e.g. "1,3,4-6")
    let pageIndices = new Set();
    const parts = pages.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= totalPages) pageIndices.add(i - 1);
        }
      } else {
        const num = parseInt(part.trim());
        if (num > 0 && num <= totalPages) pageIndices.add(num - 1);
      }
    }

    if (pageIndices.size === 0) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Invalid page range specified.' });
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, Array.from(pageIndices).sort((a,b) => a-b));
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    
    cleanupFiles([req.file]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=split_document.pdf');
    res.send(Buffer.from(newPdfBytes));
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Split Error:', error);
    res.status(500).json({ message: 'Failed to split PDF.' });
  }
};

// Watermark PDF
exports.watermarkPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }

    const { watermarkText, color, opacity, rotation, fontSize, position } = req.body;
    
    if (!watermarkText) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Please provide watermark text.' });
    }

    // Helper to convert HEX to RGB
    const hexToRgb = (hexStr) => {
      const hex = hexStr || '#e61a1a'; // Default red
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0.9, g: 0.1, b: 0.1 };
    };

    const rgbColor = hexToRgb(color);
    const parsedOpacity = parseFloat(opacity) !== undefined ? parseFloat(opacity) : 0.3;
    const parsedFontSize = parseInt(fontSize) || 50;
    const parsedRotation = parseInt(rotation) !== undefined ? parseInt(rotation) : -45;
    const pos = position || 'center';

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Calculate layout coordinates
      const textWidth = parsedFontSize * watermarkText.length * 0.55;
      const textHeight = parsedFontSize;
      
      let x = width / 2 - textWidth / 2;
      let y = height / 2 - textHeight / 2;

      if (pos === 'top-left') {
        x = 50;
        y = height - parsedFontSize - 50;
      } else if (pos === 'top-right') {
        x = width - textWidth - 50;
        y = height - parsedFontSize - 50;
      } else if (pos === 'bottom-left') {
        x = 50;
        y = 50;
      } else if (pos === 'bottom-right') {
        x = width - textWidth - 50;
        y = 50;
      }

      // Safeguard coords
      if (x < 0) x = 10;
      if (y < 0) y = 10;

      page.drawText(watermarkText, {
        x,
        y,
        size: parsedFontSize,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity: parsedOpacity,
        rotate: degrees(parsedRotation),
      });
    }

    const watermarkedPdfBytes = await pdfDoc.save();
    
    cleanupFiles([req.file]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=watermarked_document.pdf');
    res.send(Buffer.from(watermarkedPdfBytes));
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Watermark Error:', error);
    res.status(500).json({ message: 'Failed to add watermark to PDF.' });
  }
};

// --- NEW ADVANCED FEATURES ---

const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');
const { decryptPDF } = require('@pdfsmaller/pdf-decrypt');
const pdfParse = require('pdf-parse');

// Lock PDF (Encrypt)
exports.lockPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file.' });
    
    const { password, restrictPrinting, restrictModifying, restrictCopying } = req.body;
    if (!password) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Please provide a password to lock the PDF.' });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    
    // Encrypt using AES-256
    const encryptedBytes = await encryptPDF(new Uint8Array(pdfBytes), password, {
      ownerPassword: password, // use same password for owner
      allowPrinting: restrictPrinting !== 'true',
      allowModifying: restrictModifying !== 'true',
      allowCopying: restrictCopying !== 'true',
    });
    
    cleanupFiles([req.file]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=locked_document.pdf');
    res.send(Buffer.from(encryptedBytes));
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Lock Error:', error);
    res.status(500).json({ message: 'Failed to lock PDF.' });
  }
};

// Unlock PDF (Decrypt)
exports.unlockPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file.' });
    
    const { password } = req.body;
    if (!password) {
      cleanupFiles([req.file]);
      return res.status(400).json({ message: 'Please provide the password to unlock the PDF.' });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    
    try {
      const decryptedBytes = await decryptPDF(new Uint8Array(pdfBytes), password);
      cleanupFiles([req.file]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=unlocked_document.pdf');
      res.send(Buffer.from(decryptedBytes));
    } catch (decryptError) {
      cleanupFiles([req.file]);
      return res.status(401).json({ message: 'Incorrect password or unsupported encryption type.' });
    }
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Unlock Error:', error);
    res.status(500).json({ message: 'Failed to unlock PDF.' });
  }
};

// Edit Metadata
exports.editMetadata = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file.' });
    
    const { title, author, subject, creator, producer, keywords } = req.body;
    
    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    if (title) pdfDoc.setTitle(title);
    if (author) pdfDoc.setAuthor(author);
    if (subject) pdfDoc.setSubject(subject);
    if (creator) pdfDoc.setCreator(creator);
    if (producer) pdfDoc.setProducer(producer);
    if (keywords) pdfDoc.setKeywords(keywords.split(',').map(k => k.trim()));
    
    const modifiedBytes = await pdfDoc.save();
    
    cleanupFiles([req.file]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=updated_document.pdf');
    res.send(Buffer.from(modifiedBytes));
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Metadata Error:', error);
    res.status(500).json({ message: 'Failed to update PDF metadata.' });
  }
};

// Extract Text
exports.extractText = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file.' });
    
    const pdfBytes = fs.readFileSync(req.file.path);
    
    try {
      const data = await pdfParse(pdfBytes);
      cleanupFiles([req.file]);
      
      res.json({ 
        text: data.text,
        pages: data.numpages,
        info: data.info
      });
    } catch (parseError) {
      cleanupFiles([req.file]);
      res.status(500).json({ message: 'Failed to extract text. The PDF might be an image-only scan or encrypted.' });
    }
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Extract Text Error:', error);
    res.status(500).json({ message: 'Server error while parsing PDF.' });
  }
};

// Inspect PDF (Get page count, encryption status, metadata)
exports.inspectPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    let isEncrypted = false;
    let pageCount = 0;
    let metadata = {
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
      producer: ''
    };

    // First check for "/Encrypt" keyword in buffer to see if it's likely encrypted
    const isEncryptedBuffer = pdfBytes.toString('utf8').includes('/Encrypt');

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
      
      // Try to load it fully to verify encryption status
      try {
        const fullPdfDoc = await PDFDocument.load(pdfBytes);
        metadata = {
          title: fullPdfDoc.getTitle() || '',
          author: fullPdfDoc.getAuthor() || '',
          subject: fullPdfDoc.getSubject() || '',
          keywords: fullPdfDoc.getKeywords() || '',
          creator: fullPdfDoc.getCreator() || '',
          producer: fullPdfDoc.getProducer() || ''
        };
      } catch (err) {
        // If loading without ignoreEncryption fails, it's encrypted
        isEncrypted = true;
      }
    } catch (error) {
      // If even loading with ignoreEncryption fails, the PDF might be corrupted or deeply encrypted
      isEncrypted = true;
    }

    // In case pdf-lib couldn't read pages because of encryption, try pdf-parse
    if (isEncrypted && pageCount === 0) {
      try {
        const data = await pdfParse(pdfBytes);
        pageCount = data.numpages || 0;
      } catch (e) {
        // fallback
      }
    }

    cleanupFiles([req.file]);

    res.json({
      pageCount,
      isEncrypted: isEncrypted || isEncryptedBuffer,
      metadata
    });
  } catch (error) {
    cleanupFiles(req.file ? [req.file] : []);
    console.error('Inspect Error:', error);
    res.status(500).json({ message: 'Failed to inspect PDF file.', details: error.message });
  }
};
