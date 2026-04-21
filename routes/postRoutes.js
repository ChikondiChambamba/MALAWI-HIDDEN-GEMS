const express = require('express');

const postController = require('../controllers/postController');
const { upload } = require('../config/upload');
const { asyncHandler } = require('../middleware/asyncHandler');
const { rateLimit } = require('../middleware/rateLimit');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

router.get('/posts', asyncHandler(postController.listPosts));
router.get('/create', postController.renderPostForm);
router.get('/posts/new', postController.renderPostForm);
router.get('/posts/:id', asyncHandler(postController.showPost));
router.get('/posts/:id/edit', asyncHandler(postController.renderEditForm));
router.post('/posts', writeLimiter, upload.single('image'), asyncHandler(postController.createPost));
router.put('/posts/:id', writeLimiter, upload.single('image'), asyncHandler(postController.updatePost));
router.delete('/posts/:id', writeLimiter, requireAdmin, asyncHandler(postController.deletePost));

module.exports = router;
