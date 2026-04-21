function notFoundHandler(req, res) {
  res.status(404).render('error', {
    title: 'Page not found',
    pageDescription: 'The page you requested could not be found.',
    message: 'The page you requested could not be found.',
  });
}

module.exports = {
  notFoundHandler,
};
