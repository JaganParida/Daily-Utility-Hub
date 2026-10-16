const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Ensure tmp directory exists (Vercel requires writing to os.tmpdir())
const uploadDir = (process.env.VERCEL || process.env.NODE_ENV === 'production')
  ? path.join(os.tmpdir(), 'daily_utility_uploads')
  : path.join(__dirname, '../tmp/uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create upload directory:', err.message);
  }
}

// 1. Comprehensive list of dangerous executable and script extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh', '.bash', '.bin',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps', '.phar',
  '.cgi', '.pl', '.py', '.jsp', '.jspx', '.asp', '.aspx', '.cer', '.asa',
  '.shtml', '.svg', '.htm', '.html', '.xhtml', '.js', '.mjs', '.cjs',
  '.vbs', '.vbe', '.wsf', '.wsh', '.scr', '.jar', '.war', '.ear',
  '.msi', '.msp', '.reg', '.ps1', '.ps2', '.hta', '.cpl', '.com'
]);

// 2. Strict Whitelist of allowed extensions for utility hub
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp',
  '.txt', '.csv', '.json', '.docx', '.xlsx', '.pptx'
]);

// 3. Pre-upload Stream Filter (Stops malicious uploads before body is buffered)
const fileFilter = (req, file, cb) => {
  if (!file || !file.originalname) {
    return cb(new Error('Invalid upload payload.'), false);
  }

  const originalName = file.originalname;

  // Anti-Null-Byte injection
  if (originalName.includes('\0') || originalName.includes('%00')) {
    return cb(new Error('Security violation: Null byte detected in filename.'), false);
  }

  // Anti-Path-Traversal injection
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return cb(new Error('Security violation: Path traversal sequence detected in filename.'), false);
  }

  const rawExt = path.extname(originalName).toLowerCase();

  // Reject missing extension or dangerous blacklisted extension
  if (!rawExt || DANGEROUS_EXTENSIONS.has(rawExt)) {
    return cb(new Error('Security violation: Executable or script file type blocked.'), false);
  }

  // Reject non-whitelisted extension
  if (!ALLOWED_EXTENSIONS.has(rawExt)) {
    return cb(new Error('File format not supported. Only PDF, Images, Text, and Documents are allowed.'), false);
  }

  // Double extension prevention (e.g. evil.php.pdf, backdoor.exe.png)
  const parts = originalName.toLowerCase().split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      if (DANGEROUS_EXTENSIONS.has(`.${parts[i]}`)) {
        return cb(new Error('Security violation: Double extension exploit blocked.'), false);
      }
    }
  }

  cb(null, true);
};

// 4. Secure Disk Storage with randomized names
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${file.fieldname}-${Date.now()}-${randomHex}${safeExt}`);
  }
});

// 5. Configured multer instance with 25MB safe limit for serverless execution
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit prevents serverless memory/disk exhaustion
    files: 10
  }
});

// 6. Deep Content Magic-Byte Inspection Middleware
const validateFileType = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files 
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) 
    : [req.file];

  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
    'application/pdf', 'application/json', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip'
  ];

  try {
    const { fileTypeFromFile } = await import('file-type');
    
    for (const file of files) {
      if (!file.path || !fs.existsSync(file.path)) continue;

      const meta = await fileTypeFromFile(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      let isValid = false;
      
      if (meta && allowedMimeTypes.includes(meta.mime)) {
        // Enforce strict correspondence between extension and true magic-byte MIME type
        if (ext === '.pdf' && meta.mime === 'application/pdf') isValid = true;
        else if (['.jpg', '.jpeg'].includes(ext) && meta.mime === 'image/jpeg') isValid = true;
        else if (ext === '.png' && meta.mime === 'image/png') isValid = true;
        else if (ext === '.webp' && meta.mime === 'image/webp') isValid = true;
        else if (ext === '.gif' && meta.mime === 'image/gif') isValid = true;
        else if (ext === '.bmp' && meta.mime === 'image/bmp') isValid = true;
        else if (['.docx', '.xlsx', '.pptx'].includes(ext) && (meta.mime.includes('openxmlformats') || meta.mime === 'application/zip')) isValid = true;
        else if (ext === '.json' && (meta.mime === 'application/json' || meta.mime === 'text/plain')) isValid = true;
      } else if (!meta) {
        // Plain text formats without magic numbers (.txt, .csv, .json)
        if (['.txt', '.csv', '.json'].includes(ext)) {
          let fd = null;
          try {
            const buffer = Buffer.alloc(512);
            fd = fs.openSync(file.path, 'r');
            const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
            const slice = buffer.subarray(0, bytesRead);
            
            // Reject if it contains binary null bytes (disguised binary)
            if (slice.indexOf(0) === -1) {
              const textContent = slice.toString('utf8');
              // Reject embedded HTML/PHP/Script executable tags in text files
              if (!/<script|<\?php|<%|<!ENTITY|eval\s*\(/i.test(textContent)) {
                isValid = true;
              }
            }
          } finally {
            if (fd !== null) {
              try { fs.closeSync(fd); } catch (_) {}
            }
          }
        }
      }

      if (!isValid) {
        // Delete all uploaded files immediately
        files.forEach(f => {
          try {
            if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
          } catch (_) {}
        });
        console.warn(`[Security Alert] Rejected unverified file payload: ${file.originalname}`);
        return res.status(400).json({ 
          message: 'Security verification failed: File content does not match its claimed extension or contains prohibited code.' 
        });
      }
    }
    next();
  } catch (error) {
    console.error('[Upload Middleware Security Exception]:', error);
    files.forEach(f => {
      try {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      } catch (_) {}
    });
    return res.status(500).json({ message: 'Security verification error processing uploaded file.' });
  }
};

module.exports = { 
  upload, 
  validateFileType, 
  fileFilter, 
  uploadDir,
  DANGEROUS_EXTENSIONS,
  ALLOWED_EXTENSIONS
};
