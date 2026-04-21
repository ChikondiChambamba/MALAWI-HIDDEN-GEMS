const Post = require('../models/postModel');
const { getEditorTokenFromRequest } = require('../utils/editorTokenCookie');

async function requireEditorToken(req, res, next) {
  const editorToken = getEditorTokenFromRequest(req, req.params.id);

  if (!editorToken) {
    const error = new Error('A valid editor token is required to modify this post.');
    error.statusCode = 403;
    throw error;
  }

  const tokenIsValid = await Post.validateEditorToken(req.params.id, editorToken);

  if (!tokenIsValid) {
    const error = new Error('That editor token does not match this post.');
    error.statusCode = 403;
    throw error;
  }

  req.editorToken = editorToken;
  next();
}

module.exports = {
  requireEditorToken,
};
