const Post = require('../models/postModel');

function extractEditorToken(req) {
  if (typeof req.body?.editorToken === 'string' && req.body.editorToken.trim()) {
    return req.body.editorToken.trim();
  }

  if (typeof req.query?.editorToken === 'string' && req.query.editorToken.trim()) {
    return req.query.editorToken.trim();
  }

  if (typeof req.headers['x-editor-token'] === 'string' && req.headers['x-editor-token'].trim()) {
    return req.headers['x-editor-token'].trim();
  }

  return '';
}

async function requireEditorToken(req, res, next) {
  const editorToken = extractEditorToken(req);

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
