function requestLogger(req, res, next) {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.log(`${req.method} ${req.originalUrl}`);
  }

  next();
}

module.exports = {
  requestLogger,
};
