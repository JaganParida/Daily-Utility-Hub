const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure tmp directory exists
const uploadDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per file
});

// Malware Validation Middleware (Magic Numbers)
const validateFileType = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
    'application/pdf', 'application/json', 'text/plain', 'text/csv'
  ];

  try {
    // Dynamic import for pure ESM file-type package
    const { fileTypeFromFile } = await import('file-type');
    
    for (const file of files) {
      // For text files, file-type might return undefined as it only checks binary magic numbers.
      // So we must handle text files differently if needed, but for now we'll allow standard text mimes.
      const meta = await fileTypeFromFile(file.path);
      
      let isValid = false;
      
      if (meta && allowedMimeTypes.includes(meta.mime)) {
        isValid = true;
      } else if (!meta) {
        // Fallback for text files (no magic number)
        // We'll read the first few bytes to ensure it's not a disguised binary
        const buffer = Buffer.alloc(100);
        const fd = fs.openSync(file.path, 'r');
        fs.readSync(fd, buffer, 0, 100, 0);
        fs.closeSync(fd);
        
        // If it contains null bytes, it's binary, reject it.
        if (buffer.indexOf(0) === -1) {
           const ext = path.extname(file.originalname).toLowerCase();
           if (['.txt', '.csv', '.json'].includes(ext)) {
             isValid = true;
           }
        }
      }

      if (!isValid) {
        // Delete all uploaded files since one is invalid
        files.forEach(f => fs.unlinkSync(f.path));
        console.error(`🔥🔥🔥 File validation failed for ${file.originalname}`);
        return res.status(400).json({ message: 'Invalid file type detected. Malware validation failed.' });
      }
    }
    next();
  } catch (error) {
    console.error('🔥🔥🔥 Upload Middleware Error:', error);
    // Clean up on error
    files.forEach(f => {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    return res.status(500).json({ message: 'Error validating file format.', details: error.message });
  }
};

module.exports = { upload, validateFileType };
