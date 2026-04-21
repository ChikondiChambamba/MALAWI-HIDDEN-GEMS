const Post = require('../models/postModel');
const {
  buildPostFormData,
  validatePostPayload,
  buildExcerpt,
  formatPostContent,
  calculateReadTime,
  resolveImageUrl,
} = require('../utils/postFormatter');
const { sanitizePlainText } = require('../utils/text');
const { uploadImageIfProvided, removeImageIfManagedUpload } = require('../utils/fileManager');
const {
  buildSeoMeta,
  buildWebsiteStructuredData,
  buildPostStructuredData,
} = require('../utils/seo');

const POSTS_PER_PAGE = 10;

function requestExpectsJson(req) {
  const acceptHeader = req.get('accept') || '';
  return req.is('application/json') || acceptHeader.includes('application/json');
}

function buildPostCard(post) {
  return {
    ...post,
    imageUrl: resolveImageUrl(post.imagePath),
    excerpt: buildExcerpt(post.content),
    readTime: calculateReadTime(post.content),
  };
}

function buildPostDetail(post) {
  return {
    ...post,
    imageUrl: resolveImageUrl(post.imagePath),
    formattedContent: formatPostContent(post.content),
    readTime: calculateReadTime(post.content),
  };
}

function getListingFilters(req) {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const searchQuery = sanitizePlainText(req.query.q, 120);
  const tagSlug = sanitizePlainText(req.query.tag, 140).toLowerCase();

  return {
    page: page < 1 ? 1 : page,
    pageSize: POSTS_PER_PAGE,
    searchQuery,
    tagSlug,
  };
}

function buildListQueryString({ page, searchQuery, tagSlug }) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set('page', String(page));
  }

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (tagSlug) {
    params.set('tag', tagSlug);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

async function renderListingPage(req, res, options = {}) {
  const { isHomePage = false } = options;
  const filters = getListingFilters(req);
  const tags = await Post.getAllTags();
  const activeTag = tags.find((tag) => tag.slug === filters.tagSlug) || null;
  const listing = filters.searchQuery
    ? await Post.searchPosts(filters.searchQuery, filters)
    : await Post.getPosts(filters);
  const featuredPost = isHomePage ? await Post.getFeaturedPost() : null;
  const basePath = req.path === '/posts/search' ? '/posts/search' : req.path;
  const totalMatchesLabel = filters.searchQuery
    ? `${listing.totalPosts} result${listing.totalPosts === 1 ? '' : 's'} found for "${filters.searchQuery}"`
    : activeTag
      ? `${listing.totalPosts} post${listing.totalPosts === 1 ? '' : 's'} tagged "${activeTag.name}"`
      : `${listing.totalPosts} hidden gem${listing.totalPosts === 1 ? '' : 's'} shared so far`;

  res.render('index', {
    title: isHomePage ? 'Malawi Hidden Gems' : 'Explore Hidden Gems | Malawi Hidden Gems',
    pageDescription: 'Discover Malawi travel stories, destination tips, and local hidden gems from fellow explorers.',
    seo: buildSeoMeta({
      title: isHomePage ? 'Malawi Hidden Gems | Discover Malawi Beautifully' : 'Explore Malawi Hidden Gems',
      description: 'Browse Malawi destinations, travel stories, curated local gems, and offline-friendly inspiration built for mobile-first discovery.',
      pathname: req.originalUrl,
      image: featuredPost ? resolveImageUrl(featuredPost.imagePath) : '/images/hero-bg.jpg',
      imageAlt: featuredPost ? featuredPost.title : 'Malawi Hidden Gems homepage',
    }),
    structuredData: [buildWebsiteStructuredData()],
    isHomePage,
    featuredPost: featuredPost ? buildPostCard(featuredPost) : null,
    posts: listing.posts.map(buildPostCard),
    tags,
    activeTag,
    searchQuery: filters.searchQuery,
    pagination: {
      currentPage: listing.currentPage,
      pageSize: listing.pageSize,
      totalPosts: listing.totalPosts,
      totalPages: listing.totalPages,
      hasPreviousPage: listing.currentPage > 1,
      hasNextPage: listing.currentPage < listing.totalPages,
      previousPageUrl: `${basePath}${buildListQueryString({ ...filters, page: listing.currentPage - 1 })}`,
      nextPageUrl: `${basePath}${buildListQueryString({ ...filters, page: listing.currentPage + 1 })}`,
    },
    totalMatchesLabel,
    noResultsMessage: filters.searchQuery || activeTag
      ? 'No gems found. Try a different keyword or explore another tag.'
      : 'No posts yet. Be the first to share your Malawi experience.',
    mapEndpoint: '/api/destinations',
    buildTagUrl(tagSlug) {
      return `/posts${buildListQueryString({ page: 1, searchQuery: filters.searchQuery, tagSlug })}`;
    },
    clearFiltersUrl: isHomePage ? '/' : '/posts',
  });
}

async function renderPostForm(req, res) {
  const tags = await Post.getAllTags();

  res.render('create', {
    title: 'Share a Hidden Gem | Malawi Hidden Gems',
    pageDescription: 'Create a new Malawi Hidden Gems travel story.',
    seo: buildSeoMeta({
      title: 'Share a Hidden Gem | Malawi Hidden Gems',
      description: 'Publish a new destination story for Malawi Hidden Gems.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
      noIndex: true,
    }),
    form: buildPostFormData(),
    tags,
  });
}

async function listPosts(req, res) {
  await renderListingPage(req, res);
}

async function searchPosts(req, res) {
  await renderListingPage(req, res);
}

async function showPost(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const pendingEditorToken = req.session?.pendingEditorToken;
  const issuedEditorToken = pendingEditorToken
    && Number(pendingEditorToken.postId) === Number(post.id)
    ? pendingEditorToken.token
    : '';

  if (issuedEditorToken && req.session) {
    delete req.session.pendingEditorToken;
  }

  const detailedPost = buildPostDetail(post);
  const excerpt = buildExcerpt(post.content, 155);

  res.render('post', {
    title: `${post.title} | Malawi Hidden Gems`,
    pageDescription: excerpt,
    seo: buildSeoMeta({
      title: `${post.title} | Malawi Hidden Gems`,
      description: excerpt,
      pathname: req.originalUrl,
      image: resolveImageUrl(post.imagePath),
      imageAlt: post.title,
      type: 'article',
    }),
    structuredData: [buildPostStructuredData({
      ...detailedPost,
      excerpt,
    })],
    post: detailedPost,
    issuedEditorToken,
  });
}

async function createPost(req, res) {
  const form = buildPostFormData(req.body, req.file);
  const validation = validatePostPayload(form);
  const tags = await Post.getAllTags();

  if (!validation.isValid) {
    return res.status(400).render('create', {
      title: 'Share a Hidden Gem | Malawi Hidden Gems',
      pageDescription: 'Create a new Malawi Hidden Gems travel story.',
      seo: buildSeoMeta({
        title: 'Share a Hidden Gem | Malawi Hidden Gems',
        description: 'Publish a new destination story for Malawi Hidden Gems.',
        pathname: req.originalUrl,
        image: '/images/logo.png',
        noIndex: true,
      }),
      error: validation.message,
      form,
      tags,
    });
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadImageIfProvided(req.file);

    const newPost = await Post.createPost({
      title: form.title,
      authorName: form.authorName,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      content: form.content,
      imagePath: uploadedImage ? uploadedImage.url : 'default.jpg',
      imagePublicId: uploadedImage ? uploadedImage.publicId : null,
      tagSlugs: form.tagSlugs,
    });

    if (requestExpectsJson(req)) {
      return res.status(201).json({
        id: newPost.id,
        editorToken: newPost.editorToken,
        redirectTo: `/posts/${newPost.id}`,
      });
    }

    if (req.session) {
      req.session.pendingEditorToken = {
        postId: newPost.id,
        token: newPost.editorToken,
      };
    }

    return res.redirect(`/posts/${newPost.id}`);
  } catch (error) {
    if (uploadedImage && uploadedImage.publicId) {
      await removeImageIfManagedUpload(uploadedImage.publicId);
    }

    throw error;
  }
}

async function renderEditForm(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const tags = await Post.getAllTags();

  res.render('edit', {
    title: `Edit ${post.title} | Malawi Hidden Gems`,
    pageDescription: `Update the travel story "${post.title}" on Malawi Hidden Gems.`,
    seo: buildSeoMeta({
      title: `Edit ${post.title} | Malawi Hidden Gems`,
      description: `Update the story "${post.title}" on Malawi Hidden Gems.`,
      pathname: req.originalUrl,
      image: resolveImageUrl(post.imagePath),
      noIndex: true,
    }),
    form: buildPostFormData(post, null, post),
    post: buildPostDetail(post),
    tags,
    editorToken: req.editorToken || req.query.editorToken || '',
  });
}

async function updatePost(req, res) {
  const existingPost = await Post.getPostById(req.params.id);

  if (!existingPost) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const form = buildPostFormData(req.body, req.file, existingPost);
  const validation = validatePostPayload(form);
  const tags = await Post.getAllTags();

  if (!validation.isValid) {
    return res.status(400).render('edit', {
      title: `Edit ${existingPost.title} | Malawi Hidden Gems`,
      pageDescription: `Update the travel story "${existingPost.title}" on Malawi Hidden Gems.`,
      seo: buildSeoMeta({
        title: `Edit ${existingPost.title} | Malawi Hidden Gems`,
        description: `Update the story "${existingPost.title}" on Malawi Hidden Gems.`,
        pathname: req.originalUrl,
        image: resolveImageUrl(existingPost.imagePath),
        noIndex: true,
      }),
      error: validation.message,
      form,
      post: buildPostDetail({
        ...existingPost,
        ...form,
      }),
      tags,
      editorToken: req.editorToken || req.body.editorToken || '',
    });
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadImageIfProvided(req.file);

    await Post.updatePost(req.params.id, {
      title: form.title,
      authorName: form.authorName,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      content: form.content,
      imagePath: uploadedImage ? uploadedImage.url : existingPost.imagePath,
      imagePublicId: uploadedImage ? uploadedImage.publicId : existingPost.imagePublicId,
      tagSlugs: form.tagSlugs,
    });

    if (uploadedImage && existingPost.imagePublicId) {
      await removeImageIfManagedUpload(existingPost.imagePublicId);
    }

    if (requestExpectsJson(req)) {
      return res.status(200).json({
        id: Number(req.params.id),
        success: true,
      });
    }

    return res.redirect(`/posts/${req.params.id}`);
  } catch (error) {
    if (uploadedImage && uploadedImage.publicId) {
      await removeImageIfManagedUpload(uploadedImage.publicId);
    }

    throw error;
  }
}

async function deletePost(req, res) {
  const existingPost = await Post.getPostById(req.params.id);

  if (!existingPost) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  await Post.deletePost(req.params.id);

  if (existingPost.imagePublicId) {
    await removeImageIfManagedUpload(existingPost.imagePublicId);
  }

  if (requestExpectsJson(req)) {
    return res.status(200).json({
      id: Number(req.params.id),
      success: true,
    });
  }

  return res.redirect('/posts');
}

async function listDestinationsApi(req, res) {
  const destinations = await Post.getMapDestinations();

  res.json({
    destinations: destinations.map((destination) => ({
      ...destination,
      imageUrl: resolveImageUrl(destination.imagePath),
      url: `/posts/${destination.id}`,
    })),
  });
}

module.exports = {
  renderListingPage,
  renderPostForm,
  listPosts,
  searchPosts,
  showPost,
  createPost,
  renderEditForm,
  updatePost,
  deletePost,
  listDestinationsApi,
};
