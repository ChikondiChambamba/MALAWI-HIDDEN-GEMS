const express = require('express');

const adminController = require('../controllers/adminController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAdmin } = require('../middleware/requireAdmin');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

router.get('/admin/login', adminController.renderLogin);
router.post('/admin/login', loginLimiter, adminController.login);
router.get('/admin', requireAdmin, asyncHandler(adminController.dashboard));
router.post('/admin/logout', requireAdmin, adminController.logout);

module.exports = router;
