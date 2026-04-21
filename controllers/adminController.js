const env = require('../config/env');
const Post = require('../models/postModel');
const { buildExcerpt } = require('../utils/postFormatter');
const { sanitizePlainText } = require('../utils/text');

function renderLogin(req, res) {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }

  return res.render('admin-login', {
    title: 'Admin Login - Malawi Tourism Blog',
    pageDescription: 'Administrator login for Malawi Tourism Blog.',
  });
}

function login(req, res) {
  const username = sanitizePlainText(req.body.username, 120);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return res.status(401).render('admin-login', {
      title: 'Admin Login - Malawi Tourism Blog',
      pageDescription: 'Administrator login for Malawi Tourism Blog.',
      error: 'Invalid admin username or password.',
    });
  }

  req.session.isAdmin = true;
  req.session.adminUsername = username;
  return res.redirect('/admin');
}

async function dashboard(req, res) {
  const posts = await Post.getAllPosts();

  res.render('admin-dashboard', {
    title: 'Admin Dashboard - Malawi Tourism Blog',
    pageDescription: 'Administrator dashboard for managing published Malawi Tourism Blog posts.',
    posts: posts.map((post) => ({
      ...post,
      excerpt: buildExcerpt(post.content, 110),
    })),
  });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.redirect('/admin/login');
  });
}

module.exports = {
  renderLogin,
  login,
  dashboard,
  logout,
};
