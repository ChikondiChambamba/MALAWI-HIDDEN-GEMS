function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
    return;
  }

  res.status(403).render('admin-login', {
    title: 'Admin Login - Malawi Tourism Blog',
    pageDescription: 'Administrator login for Malawi Tourism Blog.',
    error: 'Admin login is required to delete posts.',
  });
}

module.exports = {
  requireAdmin,
};
