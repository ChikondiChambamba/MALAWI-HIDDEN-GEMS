const path = require('path');
const multer = require('multer');

const env = require('./env');

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

// Files are kept in memory so Sharp can optimise them before utils/fileManager
// streams the result to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadSizeBytes,
  },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, GIF, WEBP, and AVIF image uploads are allowed.');
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

module.exports = {
  upload,
};
