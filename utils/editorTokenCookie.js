const env = require('../config/env');

const EDITOR_TOKEN_COOKIE_PREFIX = 'mhg_editor_';
const EDITOR_TOKEN_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30;

function getEditorTokenCookieName(postId) {
  return `${EDITOR_TOKEN_COOKIE_PREFIX}${postId}`;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function getEditorTokenFromRequest(req, postId) {
  const cookies = parseCookies(req);
  return cookies[getEditorTokenCookieName(postId)] || '';
}

function hasEditorTokenCookie(req, postId) {
  return Boolean(getEditorTokenFromRequest(req, postId));
}

function buildEditorTokenCookieOptions(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  const isSecureRequest = req.secure || forwardedProto === 'https' || req.hostname === 'localhost';

  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.nodeEnv === 'production' || isSecureRequest,
    maxAge: EDITOR_TOKEN_COOKIE_MAX_AGE,
    path: '/',
  };
}

function setEditorTokenCookie(req, res, postId, token) {
  res.cookie(getEditorTokenCookieName(postId), token, buildEditorTokenCookieOptions(req));
}

function clearEditorTokenCookie(req, res, postId) {
  res.clearCookie(getEditorTokenCookieName(postId), {
    ...buildEditorTokenCookieOptions(req),
    maxAge: undefined,
  });
}

module.exports = {
  EDITOR_TOKEN_COOKIE_MAX_AGE,
  getEditorTokenCookieName,
  getEditorTokenFromRequest,
  hasEditorTokenCookie,
  setEditorTokenCookie,
  clearEditorTokenCookie,
};
