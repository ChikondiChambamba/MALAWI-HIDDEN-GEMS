const Contact = require('../models/contactModel');
const { sanitizePlainText, sanitizeRichText } = require('../utils/text');
const { buildSeoMeta } = require('../utils/seo');

function renderContactForm(req, res) {
  res.render('contact', {
    title: 'Contact Malawi Hidden Gems',
    pageDescription: 'Contact the Malawi Hidden Gems team with questions, feedback, or partnership ideas.',
    seo: buildSeoMeta({
      title: 'Contact Malawi Hidden Gems',
      description: 'Reach the Malawi Hidden Gems team for questions, partnerships, and editorial feedback.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
    }),
    form: {
      name: '',
      email: '',
      message: '',
    },
  });
}

async function submitContactForm(req, res) {
  const form = {
    name: sanitizePlainText(req.body.name, 120),
    email: sanitizePlainText(req.body.email, 255),
    message: sanitizeRichText(req.body.message, 4000),
  };

  if (!form.name || !form.email || !form.message) {
    return res.status(400).render('contact', {
      title: 'Contact Malawi Hidden Gems',
      pageDescription: 'Contact the Malawi Hidden Gems team with questions, feedback, or partnership ideas.',
      seo: buildSeoMeta({
        title: 'Contact Malawi Hidden Gems',
        description: 'Reach the Malawi Hidden Gems team for questions, partnerships, and editorial feedback.',
        pathname: req.originalUrl,
        image: '/images/logo.png',
      }),
      error: 'Name, email, and message are all required.',
      form,
    });
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  if (!emailIsValid) {
    return res.status(400).render('contact', {
      title: 'Contact Malawi Hidden Gems',
      pageDescription: 'Contact the Malawi Hidden Gems team with questions, feedback, or partnership ideas.',
      seo: buildSeoMeta({
        title: 'Contact Malawi Hidden Gems',
        description: 'Reach the Malawi Hidden Gems team for questions, partnerships, and editorial feedback.',
        pathname: req.originalUrl,
        image: '/images/logo.png',
      }),
      error: 'Please enter a valid email address.',
      form,
    });
  }

  await Contact.createContact(form);

  res.render('contact', {
    title: 'Contact Malawi Hidden Gems',
    pageDescription: 'Contact the Malawi Hidden Gems team with questions, feedback, or partnership ideas.',
    seo: buildSeoMeta({
      title: 'Contact Malawi Hidden Gems',
      description: 'Reach the Malawi Hidden Gems team for questions, partnerships, and editorial feedback.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
    }),
    success: 'Thanks for reaching out. Your message has been received.',
    form: {
      name: '',
      email: '',
      message: '',
    },
  });
}

module.exports = {
  renderContactForm,
  submitContactForm,
};
