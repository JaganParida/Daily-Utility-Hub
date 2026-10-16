const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const shareController = require('../controllers/shareController');
const { softProtect } = require('../middleware/authMiddleware');
const { validateFileType, fileFilter } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { shareUploadValidation, shareIdValidation } = require('../middleware/validationRules');
const { publicRateLimiter, userRateLimiter } = require('../middleware/rateLimitMiddleware');

const tempUploadDir = (process.env.VERCEL || process.env.NODE_ENV === 'production')
  ? path.join(os.tmpdir(), 'share_temp')
  : path.join(__dirname, '..', 'uploads', 'temp');

if (!fs.existsSync(tempUploadDir)) {
  try {
    fs.mkdirSync(tempUploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create temp share upload dir:', err.message);
  }
}

// Multer storage config with randomized names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `share_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file size
});

router.post(
  '/upload', 
  softProtect, 
  userRateLimiter, 
  upload.single('file'), 
  validateFileType, 
  shareUploadValidation, 
  validate, 
  shareController.uploadFile
);

router.get('/metadata/:id', publicRateLimiter, shareIdValidation, validate, shareController.getFileMetadata);
router.get('/download/:id', publicRateLimiter, shareIdValidation, validate, shareController.downloadFile);

module.exports = router;
