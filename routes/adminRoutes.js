const express = require('express');

const adminController = require('../controllers/adminController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { adminAuth } = require('../middleware/requireAdmin');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

router.get('/admin/login', adminController.renderLogin);
router.post('/admin/login', loginLimiter, asyncHandler(adminController.login));
router.get('/admin', adminAuth, adminController.redirectDashboard);
router.get('/admin/dashboard', adminAuth, asyncHandler(adminController.dashboard));
router.post('/admin/posts/:id/delete', adminAuth, asyncHandler(adminController.deletePost));
router.post('/admin/posts/:id/feature', adminAuth, asyncHandler(adminController.featurePost));
router.post('/admin/logout', adminAuth, adminController.logout);

module.exports = router;
