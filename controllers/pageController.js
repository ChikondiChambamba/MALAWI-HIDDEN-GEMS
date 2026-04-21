const { renderListingPage } = require('./postController');

async function renderHome(req, res) {
  await renderListingPage(req, res, { isHomePage: true });
}

function renderAbout(req, res) {
  res.render('about', {
    title: 'About Malawi Hidden Gems',
    pageDescription: 'Learn about the Malawi Hidden Gems community and what readers can share here.',
  });
}

module.exports = {
  renderHome,
  renderAbout,
};
