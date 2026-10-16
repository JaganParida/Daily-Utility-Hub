let app;
let initError = null;

try {
  app = require('../backend/server');
} catch (err) {
  initError = err;
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Backend Initialization Error',
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
};
