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
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const { cloudinary } = require('./cloudinary');

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: env.cloudinaryFolder,
    resource_type: 'image',
    format: 'jpg',
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
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
  cloudinaryStorage,
};
