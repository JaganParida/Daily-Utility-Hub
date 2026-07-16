const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    console.warn(`[Validation] Input validation failed for ${req.originalUrl}:`, formattedErrors);
    
    return res.status(400).json({
      success: false,
      message: 'Input validation failed.',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = { validate };
