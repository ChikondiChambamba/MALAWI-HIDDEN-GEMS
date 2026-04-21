const env = require('../config/env');

function absoluteUrl(pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${env.siteUrl}${normalizedPath}`;
}

function buildSeoMeta({
  title,
  description,
  pathname = '/',
  image = '/images/logo.png',
  imageAlt = 'Malawi Hidden Gems',
  type = 'website',
  noIndex = false,
} = {}) {
  return {
    title,
    description,
    canonicalUrl: absoluteUrl(pathname),
    imageUrl: /^https?:\/\//i.test(image) ? image : absoluteUrl(image),
    imageAlt,
    type,
    noIndex,
    siteName: 'Malawi Hidden Gems',
  };
}

function buildWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Malawi Hidden Gems',
    url: env.siteUrl,
    description: 'A premium Malawi tourism discovery platform with stories, hidden gems, and offline-friendly destination browsing.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${env.siteUrl}/posts/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function buildPostStructuredData(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.description || post.title,
    image: [post.imageUrl],
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Malawi Hidden Gems',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/logo.png'),
      },
    },
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    mainEntityOfPage: absoluteUrl(`/posts/${post.id}`),
    keywords: post.tags.map((tag) => tag.name).join(', '),
    articleSection: post.location || 'Malawi tourism',
  };
}

module.exports = {
  absoluteUrl,
  buildSeoMeta,
  buildWebsiteStructuredData,
  buildPostStructuredData,
};
