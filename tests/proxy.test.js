const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'production';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test-user';
process.env.DB_PASSWORD = 'test-password';
process.env.DB_NAME = 'test-db';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('secret-admin-password', 4);
delete process.env.TRUST_PROXY;

jest.mock('../models/postModel', () => ({}));
jest.mock('../models/contactModel', () => ({}));

const request = require('supertest');
const app = require('../config/app');

describe('running behind a hosting proxy in production', () => {
  test('trusts one proxy hop by default', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  test('admin login sets a secure session cookie when the proxy reports HTTPS', async () => {
    const response = await request(app)
      .post('/admin/login')
      .set('X-Forwarded-Proto', 'https')
      .type('form')
      .send({ password: 'secret-admin-password' });

    expect(response.status).toBe(302);
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringMatching(/connect\.sid=.*Secure/),
    ]));
  });
});
