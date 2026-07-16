const express = require('express');
const router = express.Router();
const { upload, validateFileType } = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { mergePdfs, splitPdf, watermarkPdf, lockPdf, unlockPdf, editMetadata, extractText, inspectPdf } = require('../controllers/pdfController');
const { validate } = require('../middleware/validationMiddleware');
const { userRateLimiter } = require('../middleware/rateLimitMiddleware');
const {
  pdfSplitValidation,
  pdfWatermarkValidation,
  pdfLockValidation,
  pdfUnlockValidation,
  pdfMetadataValidation
} = require('../middleware/validationRules');

// Apply auth protection to all PDF operations
router.use(protect);
router.use(userRateLimiter);

// Ensure that we only allow PDF files for these routes
const ensurePdf = (req, res, next) => {
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : (req.file ? [req.file] : []);
  
  const allPdfs = files.every(f => f.mimetype === 'application/pdf');
  
  if (files.length > 0 && !allPdfs) {
    // Delete invalid uploads immediately
    files.forEach(f => require('fs').unlinkSync(f.path));
    return res.status(400).json({ message: 'Only PDF files are allowed.' });
  }
  next();
};

// Route: Merge PDFs
// Expects an array of files under the field name 'pdfs'
router.post('/merge', upload.array('pdfs', 10), validateFileType, ensurePdf, mergePdfs);

// Route: Split PDF
// Expects a single file under 'pdf' and a 'pages' text field
router.post('/split', upload.single('pdf'), validateFileType, ensurePdf, pdfSplitValidation, validate, splitPdf);

// Route: Watermark PDF
// Expects a single file under 'pdf' and a 'watermarkText' text field
router.post('/watermark', upload.single('pdf'), validateFileType, ensurePdf, pdfWatermarkValidation, validate, watermarkPdf);

// Route: Lock PDF
router.post('/lock', upload.single('pdf'), validateFileType, ensurePdf, pdfLockValidation, validate, lockPdf);

// Route: Unlock PDF
router.post('/unlock', upload.single('pdf'), validateFileType, ensurePdf, pdfUnlockValidation, validate, unlockPdf);

// Route: Edit Metadata
router.post('/metadata', upload.single('pdf'), validateFileType, ensurePdf, pdfMetadataValidation, validate, editMetadata);

// Route: Extract Text
router.post('/extract-text', upload.single('pdf'), validateFileType, ensurePdf, extractText);

// Route: Inspect PDF
router.post('/inspect', upload.single('pdf'), validateFileType, ensurePdf, inspectPdf);

module.exports = router;
