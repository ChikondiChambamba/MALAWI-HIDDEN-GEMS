function adminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
    return;
  }

  res.status(403).render('admin-login', {
    title: 'Admin Login - Malawi Hidden Gems',
    pageDescription: 'Administrator login for Malawi Hidden Gems.',
    error: 'Admin login is required to access the dashboard.',
  });
}

module.exports = {
  requireAdmin: adminAuth,
  adminAuth,
};
