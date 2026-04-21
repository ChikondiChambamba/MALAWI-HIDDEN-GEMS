const multer = require('multer');
const env = require('../config/env');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || (error instanceof multer.MulterError ? 400 : 500);
  const uploadLimitMb = Math.round(env.maxUploadSizeBytes / (1024 * 1024));

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', {
      title: 'Upload error',
      pageDescription: 'There was a problem with the uploaded image.',
      message: `Image uploads must be ${uploadLimitMb} MB or smaller.`,
    });
  }

  const safeMessage = statusCode >= 500
    ? 'Something went wrong while processing your request.'
    : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).render('error', {
    title: statusCode === 404 ? 'Page not found' : 'Application error',
    pageDescription: safeMessage,
    message: safeMessage,
  });
}

module.exports = {
  errorHandler,
};
