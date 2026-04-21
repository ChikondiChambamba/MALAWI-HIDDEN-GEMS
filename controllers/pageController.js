const { renderListingPage } = require('./postController');
const { buildSeoMeta, buildWebsiteStructuredData } = require('../utils/seo');

async function renderHome(req, res) {
  await renderListingPage(req, res, { isHomePage: true });
}

function renderAbout(req, res) {
  res.render('about', {
    title: 'About Malawi Hidden Gems',
    pageDescription: 'Learn about the Malawi Hidden Gems community and what readers can share here.',
    seo: buildSeoMeta({
      title: 'About Malawi Hidden Gems',
      description: 'Learn about the premium, offline-friendly tourism discovery platform built for exploring Malawi beautifully.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
    }),
    structuredData: [buildWebsiteStructuredData()],
  });
}

module.exports = {
  renderHome,
  renderAbout,
};
