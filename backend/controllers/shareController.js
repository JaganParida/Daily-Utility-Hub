const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const dataFilePath = path.join(dataDir, 'shared_files.json');
const uploadDir = path.join(__dirname, '..', 'uploads', 'temp');

// Ensure directories exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

// Queue for serializing write operations to prevent race conditions
let writeQueue = Promise.resolve();

// Load metadata helper (async)
const loadMetadata = async () => {
  try {
    const data = await fs.promises.readFile(dataFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading shared files index:', err);
    // Handle JSON parsing errors to prevent wiping DB index or server crashes
    if (err instanceof SyntaxError) {
      const backupPath = `${dataFilePath}.corrupt-${Date.now()}`;
      try {
        await fs.promises.rename(dataFilePath, backupPath);
        console.warn(`Corrupt database backed up to ${backupPath}`);
      } catch (backupErr) {
        console.error('Failed to backup corrupt database:', backupErr);
      }
    }
    return [];
  }
};

// Save metadata helper (async & queued)
const saveMetadata = async (data) => {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        resolve();
      } catch (err) {
        console.error('Error writing shared files index:', err);
        reject(err);
      }
    });
  });
};

// POST: Upload a temporary file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { expiryHours } = req.body;
    const hours = parseInt(expiryHours) || 24; // default to 24 hours
    
    const fileId = crypto.randomBytes(16).toString('hex');
    const uploadedAt = Date.now();
    const expiresAt = uploadedAt + (hours * 60 * 60 * 1000);

    const metadata = await loadMetadata();
    const newEntry = {
      id: fileId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: uploadedAt,
      expiresAt: expiresAt
    };

    metadata.push(newEntry);
    await saveMetadata(metadata);

    return res.status(200).json({
      success: true,
      fileId: fileId,
      originalName: req.file.originalname,
      expiresAt: expiresAt
    });
  } catch (err) {
    console.error('Upload temporary file error:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }
};

// GET: Download a shared file
exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();
    const fileEntry = metadata.find(entry => entry.id === id);

    if (!fileEntry) {
      return res.status(404).send('File not found or expired.');
    }

    // Check expiry
    if (Date.now() > fileEntry.expiresAt) {
      return res.status(410).send('This file has expired and is no longer available.');
    }

    const filePath = path.join(uploadDir, fileEntry.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File physical bytes not found.');
    }

    res.download(filePath, fileEntry.originalName);
  } catch (err) {
    console.error('Download shared file error:', err);
    return res.status(500).send('Internal server error.');
  }
};

// Cron/Cleanup scheduled routine to sweep expired files
exports.runCleanup = async () => {
  try {
    const metadata = await loadMetadata();
    const now = Date.now();
    
    const validEntries = [];
    let deletedCount = 0;

    for (const entry of metadata) {
      if (now > entry.expiresAt) {
        const filePath = path.join(uploadDir, entry.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        deletedCount++;
      } else {
        validEntries.push(entry);
      }
    }

    if (deletedCount > 0) {
      await saveMetadata(validEntries);
      console.log(`[Temp Cleanup Cron] Swept and deleted ${deletedCount} expired temporary files.`);
    }
  } catch (err) {
    console.error('Failed to run temporary files cleanup cron:', err);
  }
};
