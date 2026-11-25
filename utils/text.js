const sanitizeHtml = require('sanitize-html');

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

// sanitize-html HTML-encodes text output. Plain-text fields are escaped again by
// EJS on render, so decode here to avoid users seeing "&amp;" in titles.
function decodeEntities(value = '') {
  if (typeof value !== 'string' || !value.includes('&')) {
    return value;
  }

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const codePoint = entity[1].toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);

      return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    }

    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function sanitizePlainText(value, maxLength = 255) {
  if (typeof value !== 'string') {
    return '';
  }

  return decodeEntities(sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })).replace(/\s+/g, ' ').trim().slice(0, maxLength);
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
  return decodeEntities(sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }));
}

function slugify(value = '') {
  return sanitizePlainText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  decodeEntities,
  escapeHtml,
  sanitizePlainText,
  sanitizeRichText,
  stripMarkup,
  slugify,
};
