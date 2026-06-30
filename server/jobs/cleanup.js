const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const setupCleanupJobs = () => {
  const uploadDir = path.join(__dirname, '../tmp/uploads');

  // Ensure dir exists so cron doesn't fail
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('[Cron] Running temporary file cleanup...');
    
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('[Cron] Error reading tmp directory:', err);
        return;
      }

      const now = Date.now();
      const TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error('[Cron] Error stat file:', filePath, err);
            return;
          }

          // If file is older than 15 minutes, delete it
          if (now - stats.mtimeMs > TTL) {
            fs.unlink(filePath, err => {
              if (err) console.error('[Cron] Error deleting file:', filePath, err);
              else console.log('[Cron] Auto-deleted expired file:', file);
            });
          }
        });
      });
    });
  });
};

module.exports = setupCleanupJobs;
