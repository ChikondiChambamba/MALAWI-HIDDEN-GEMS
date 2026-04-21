const fs = require('fs/promises');
const path = require('path');

const { uploadDirectory } = require('../config/upload');

async function removeImageIfManagedUpload(fileName) {
  if (!fileName || fileName === 'default.jpg') {
    return;
  }

  const safeName = path.basename(fileName);
  const absolutePath = path.join(uploadDirectory, safeName);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  removeImageIfManagedUpload,
};
