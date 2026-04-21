const { sanitizePlainText, sanitizeRichText, stripMarkup } = require('./text');

function normalizeTagSlugs(value) {
  const rawValues = Array.isArray(value)
    ? value
    : (typeof value === 'undefined' || value === null ? [] : [value]);

  return [...new Set(
    rawValues
      .map((entry) => sanitizePlainText(entry, 120).toLowerCase())
      .filter(Boolean)
  )];
}

function chooseValue(primaryValue, fallbackValue = '') {
  return typeof primaryValue === 'string' ? primaryValue : fallbackValue;
}

function buildPostFormData(source = {}, file = null, fallback = {}) {
  const title = chooseValue(source.title, fallback.title);
  const authorName = chooseValue(source.authorName, fallback.authorName);
  const location = chooseValue(source.location, fallback.location);
  const content = chooseValue(source.content, fallback.content);

  return {
    title: sanitizePlainText(title, 255),
    authorName: sanitizePlainText(authorName, 120) || 'Anonymous traveler',
    location: sanitizePlainText(location, 120),
    content: sanitizeRichText(content, 25000),
    imagePath: source.imagePath || fallback.imagePath || 'default.jpg',
    tagSlugs: normalizeTagSlugs(source.tagSlugs || source.tags || fallback.tagSlugs || []),
    imageFile: file || null,
  };
}

function validatePostPayload(post) {
  if (!post.title || !post.content) {
    return {
      isValid: false,
      message: 'Title and story content are required.',
    };
  }

  return {
    isValid: true,
    message: '',
  };
}

function buildExcerpt(content = '', maxLength = 150) {
  const normalized = stripMarkup(content).replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function formatPostContent(content = '') {
  const sanitizedContent = sanitizeRichText(content, 25000);

  if (!sanitizedContent) {
    return '';
  }

  if (/<\/?(p|ul|li|br|a|b|i|em|strong)\b/i.test(sanitizedContent)) {
    return sanitizedContent;
  }

  return sanitizedContent
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function calculateReadTime(content = '') {
  const plainText = stripMarkup(content).replace(/\s+/g, ' ').trim();
  const words = plainText ? plainText.split(' ').length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function resolveImageUrl(imagePath = '') {
  if (!imagePath || imagePath === 'default.jpg') {
    return '/images/default.jpg';
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return imagePath.startsWith('/images/')
    ? imagePath
    : `/images/${imagePath.replace(/^\/+/, '')}`;
}

module.exports = {
  buildPostFormData,
  validatePostPayload,
  buildExcerpt,
  formatPostContent,
  calculateReadTime,
  resolveImageUrl,
};
