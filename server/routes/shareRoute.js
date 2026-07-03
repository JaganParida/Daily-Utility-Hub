const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const shareController = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');
const { validateFileType } = require('../middleware/uploadMiddleware');

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
    cb(null, `share_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

router.post('/upload', protect, upload.single('file'), validateFileType, shareController.uploadFile);
router.get('/download/:id', shareController.downloadFile);

module.exports = router;
