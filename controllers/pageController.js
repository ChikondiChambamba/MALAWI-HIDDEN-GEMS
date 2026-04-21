function renderHome(req, res) {
  res.redirect('/posts');
}

function renderAbout(req, res) {
  res.render('about', {
    title: 'About Malawi Tourism Blog',
    pageDescription: 'Learn about the Malawi Tourism Blog community and what readers can share here.',
  });
}

module.exports = {
  renderHome,
  renderAbout,
};
