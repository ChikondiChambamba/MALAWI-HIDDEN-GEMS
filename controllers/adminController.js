const bcrypt = require('bcryptjs');
const env = require('../config/env');
const Post = require('../models/postModel');
const {
  buildExcerpt,
  calculateReadTime,
  resolveImageUrl,
} = require('../utils/postFormatter');
const { removeImageIfManagedUpload } = require('../utils/fileManager');
const { buildSeoMeta } = require('../utils/seo');
const { clearEditorTokenCookie } = require('../utils/editorTokenCookie');

function renderLogin(req, res) {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }

  return res.render('admin-login', {
    title: 'Admin Login | Malawi Hidden Gems',
    pageDescription: 'Administrator login for Malawi Hidden Gems.',
    seo: buildSeoMeta({
      title: 'Admin Login | Malawi Hidden Gems',
      description: 'Administrative access for Malawi Hidden Gems.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
      noIndex: true,
    }),
  });
}

async function login(req, res) {
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const passwordMatches = await bcrypt.compare(password, env.adminPasswordHash);

  if (!passwordMatches) {
    return res.status(401).render('admin-login', {
      title: 'Admin Login | Malawi Hidden Gems',
      pageDescription: 'Administrator login for Malawi Hidden Gems.',
      seo: buildSeoMeta({
        title: 'Admin Login | Malawi Hidden Gems',
        description: 'Administrative access for Malawi Hidden Gems.',
        pathname: req.originalUrl,
        image: '/images/logo.png',
        noIndex: true,
      }),
      error: 'Invalid admin password.',
    });
  }

  req.session.isAdmin = true;
  return res.redirect('/admin/dashboard');
}

function redirectDashboard(req, res) {
  res.redirect('/admin/dashboard');
}

async function dashboard(req, res) {
  const posts = await Post.getAllPosts();

  res.render('admin-dashboard', {
    title: 'Admin Dashboard | Malawi Hidden Gems',
    pageDescription: 'Administrator dashboard for managing published Malawi Hidden Gems posts.',
    seo: buildSeoMeta({
      title: 'Admin Dashboard | Malawi Hidden Gems',
      description: 'Administrative dashboard for managing featured gems and moderation.',
      pathname: req.originalUrl,
      image: '/images/logo.png',
      noIndex: true,
    }),
    posts: posts.map((post) => ({
      ...post,
      imageUrl: resolveImageUrl(post.imagePath),
      excerpt: buildExcerpt(post.content, 110),
      readTime: calculateReadTime(post.content),
    })),
  });
}

async function deletePost(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  await Post.deletePost(req.params.id);
  clearEditorTokenCookie(req, res, req.params.id);

  if (post.imagePublicId) {
    await removeImageIfManagedUpload(post.imagePublicId);
  }

  res.redirect('/admin/dashboard');
}

async function featurePost(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  await Post.featurePost(req.params.id);
  res.redirect('/admin/dashboard');
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
}

module.exports = {
  renderLogin,
  login,
  redirectDashboard,
  dashboard,
  deletePost,
  featurePost,
  logout,
};
