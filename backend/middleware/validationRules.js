const { body, param } = require('express-validator');

// Validation rules for Authentication routes
const sessionValidation = [
  body('idToken')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 2500 })
    .withMessage('Authentication token must be a non-empty string between 10 and 2500 characters.'),
  body('mode')
    .isString()
    .trim()
    .isIn(['login', 'register', 'refresh'])
    .withMessage('Authentication mode must be one of: login, register, refresh.'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9\s.\-_]+$/)
    .withMessage('Name must be alphanumeric/spaces and between 2 and 50 characters.')
];

const updateProfileValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9\s.\-_]+$/)
    .withMessage('Name must be alphanumeric/spaces and between 2 and 50 characters.')
];

const deleteSessionValidation = [
  param('sessionId')
    .isString()
    .trim()
    .isLength({ min: 64, max: 64 })
    .isHexadecimal()
    .withMessage('Invalid session ID format. Must be a 64-character hexadecimal string.')
];

const analyticsValidation = [
  body('toolPath')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .custom((val) => val === '/' || val === '/dashboard' || val.startsWith('/tools/'))
    .withMessage('Invalid tool path format.')
];

// Validation rules for Temp Share routes
const shareUploadValidation = [
  body('expiryHours')
    .isString()
    .trim()
    .notEmpty()
    .customSanitizer(val => parseInt(val, 10))
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiry must be an integer between 1 and 168 hours.'),
  body('shareType')
    .isString()
    .trim()
    .isIn(['file', 'text', 'url', 'code'])
    .withMessage('Invalid share type. Must be one of: file, text, url, code.')
];

const shareIdValidation = [
  param('id')
    .isString()
    .trim()
    .isLength({ min: 32, max: 32 })
    .isHexadecimal()
    .withMessage('Invalid shared file ID format. Must be a 32-character hexadecimal string.')
];

// Validation rules for PDF routes
const pdfSplitValidation = [
  body('pages')
    .isString()
    .trim()
    .notEmpty()
    .matches(/^[0-9\s,-]+$/)
    .withMessage('Pages must be a list of numbers, ranges, or commas (e.g. 1, 3, 5-7).'),
  body('mode')
    .isString()
    .trim()
    .isIn(['extract', 'split'])
    .withMessage('Invalid split mode. Must be one of: extract, split.')
];

const pdfWatermarkValidation = [
  body('watermarkText')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Watermark text must be between 1 and 100 characters.')
];

const pdfLockValidation = [
  body('password')
    .isString()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters.'),
  body('restrictPrinting')
    .optional()
    .customSanitizer(val => val === 'true' || val === true)
    .isBoolean()
    .withMessage('restrictPrinting must be a boolean.'),
  body('restrictModifying')
    .optional()
    .customSanitizer(val => val === 'true' || val === true)
    .isBoolean()
    .withMessage('restrictModifying must be a boolean.'),
  body('restrictCopying')
    .optional()
    .customSanitizer(val => val === 'true' || val === true)
    .isBoolean()
    .withMessage('restrictCopying must be a boolean.')
];

const pdfUnlockValidation = [
  body('password')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Password is required.')
];

const pdfMetadataValidation = [
  body('title').optional().isString().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters.'),
  body('author').optional().isString().trim().isLength({ max: 100 }).withMessage('Author cannot exceed 100 characters.'),
  body('subject').optional().isString().trim().isLength({ max: 100 }).withMessage('Subject cannot exceed 100 characters.'),
  body('keywords').optional().isString().trim().isLength({ max: 100 }).withMessage('Keywords cannot exceed 100 characters.')
];

module.exports = {
  sessionValidation,
  updateProfileValidation,
  deleteSessionValidation,
  analyticsValidation,
  shareUploadValidation,
  shareIdValidation,
  pdfSplitValidation,
  pdfWatermarkValidation,
  pdfLockValidation,
  pdfUnlockValidation,
  pdfMetadataValidation
};
