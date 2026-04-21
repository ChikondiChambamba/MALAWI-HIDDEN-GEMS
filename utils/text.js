const sanitizeHtml = require('sanitize-html');

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizePlainText(value, maxLength = 255) {
  if (typeof value !== 'string') {
    return '';
  }

  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeRichText(value, maxLength = 20000) {
  if (typeof value !== 'string') {
    return '';
  }

  return sanitizeHtml(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li', 'a'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  }).trim().slice(0, maxLength);
}

function stripMarkup(value = '') {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

function slugify(value = '') {
  return sanitizePlainText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  escapeHtml,
  sanitizePlainText,
  sanitizeRichText,
  stripMarkup,
  slugify,
};
