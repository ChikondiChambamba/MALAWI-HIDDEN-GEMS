const { escapeHtml, sanitizePlainText } = require('./text');

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
    content: typeof content === 'string' ? content.trim() : '',
    imagePath: file
      ? `uploads/${file.filename}`
      : (source.imagePath || fallback.imagePath || 'default.jpg'),
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

function buildExcerpt(content = '', maxLength = 170) {
  const normalized = content.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function formatPostContent(content = '') {
  return escapeHtml(content)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

module.exports = {
  buildPostFormData,
  validatePostPayload,
  buildExcerpt,
  formatPostContent,
};
