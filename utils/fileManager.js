const sharp = require('sharp');

const env = require('../config/env');
const { cloudinary } = require('../config/cloudinary');

async function uploadImageIfProvided(file) {
  if (!file) {
    return null;
  }

  if (!env.hasCloudinaryConfig) {
    const error = new Error('Cloudinary environment variables are missing. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to continue.');
    error.statusCode = 500;
    throw error;
  }

  const transformedBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1200,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: env.cloudinaryFolder,
      resource_type: 'image',
      format: 'jpg',
    }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
      });
    });

    stream.end(transformedBuffer);
  });
}

async function removeImageIfManagedUpload(publicId) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  uploadImageIfProvided,
  removeImageIfManagedUpload,
};
