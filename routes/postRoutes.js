const express = require('express');

const postController = require('../controllers/postController');
const { upload } = require('../config/upload');
const { asyncHandler } = require('../middleware/asyncHandler');
const { rateLimit } = require('../middleware/rateLimit');
const { requireEditorToken } = require('../middleware/requireEditorToken');

const router = express.Router();
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

router.get('/posts', asyncHandler(postController.listPosts));
router.get('/posts/search', asyncHandler(postController.searchPosts));
router.get('/create', asyncHandler(postController.renderPostForm));
router.get('/posts/new', asyncHandler(postController.renderPostForm));
router.get('/posts/:id', asyncHandler(postController.showPost));
router.get('/posts/:id/edit', asyncHandler(requireEditorToken), asyncHandler(postController.renderEditForm));
router.post('/posts', writeLimiter, upload.single('image'), asyncHandler(postController.createPost));
router.put('/posts/:id', writeLimiter, upload.single('image'), asyncHandler(requireEditorToken), asyncHandler(postController.updatePost));
router.delete('/posts/:id', writeLimiter, asyncHandler(requireEditorToken), asyncHandler(postController.deletePost));

module.exports = router;
