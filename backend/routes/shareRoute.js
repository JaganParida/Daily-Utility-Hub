const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const shareController = require('../controllers/shareController');
const { protect, softProtect } = require('../middleware/authMiddleware');
const { validateFileType } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { shareUploadValidation, shareIdValidation } = require('../middleware/validationRules');
const { publicRateLimiter, userRateLimiter } = require('../middleware/rateLimitMiddleware');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp');

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    // Sanitize extension to alphanumeric only to prevent injection/traversal
    const ext = path.extname(file.originalname).replace(/[^.a-zA-Z0-9]/g, '');
    cb(null, `share_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

router.post('/upload', softProtect, userRateLimiter, upload.single('file'), validateFileType, shareUploadValidation, validate, shareController.uploadFile);
router.get('/metadata/:id', publicRateLimiter, shareIdValidation, validate, shareController.getFileMetadata);
router.get('/download/:id', publicRateLimiter, shareIdValidation, validate, shareController.downloadFile);

module.exports = router;
