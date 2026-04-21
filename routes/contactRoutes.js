const express = require('express');

const contactController = require('../controllers/contactController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

router.get('/contact', contactController.renderContactForm);
router.post('/contact', contactLimiter, asyncHandler(contactController.submitContactForm));

module.exports = router;
