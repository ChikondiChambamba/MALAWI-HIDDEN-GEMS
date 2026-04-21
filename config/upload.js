const fs = require('fs');
const path = require('path');
const multer = require('multer');

const env = require('./env');

const uploadDirectory = path.join(__dirname, '..', 'public', 'images', 'uploads');
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

function ensureUploadDirectory() {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    ensureUploadDirectory();
    callback(null, uploadDirectory);
  },
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadSizeBytes,
  },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const isAllowedExtension = allowedExtensions.has(extension);
    const isAllowedMimeType = allowedMimeTypes.has(file.mimetype);

    if (!isAllowedExtension || !isAllowedMimeType) {
      callback(new Error('Only JPG, PNG, GIF, and WEBP image uploads are allowed.'));
      return;
    }

    callback(null, true);
  },
});

module.exports = {
  upload,
  uploadDirectory,
};
