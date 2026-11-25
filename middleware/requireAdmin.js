function adminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
    return;
  }

  res.redirect('/admin/login');
}

module.exports = {
  requireAdmin: adminAuth,
  adminAuth,
};
