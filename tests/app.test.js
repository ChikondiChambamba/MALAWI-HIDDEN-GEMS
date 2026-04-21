process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test-user';
process.env.DB_PASSWORD = 'test-password';
process.env.DB_NAME = 'test-db';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ADMIN_PASSWORD = 'secret-admin-password';

const request = require('supertest');

jest.mock('../models/postModel', () => ({
  getAllTags: jest.fn(),
  getPosts: jest.fn(),
  getAllPosts: jest.fn(),
  getPostById: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  validateEditorToken: jest.fn(),
  searchPosts: jest.fn(),
  getFeaturedPost: jest.fn(),
  featurePost: jest.fn(),
}));

jest.mock('../models/contactModel', () => ({
  createContact: jest.fn(),
}));

jest.mock('../utils/fileManager', () => ({
  uploadImageIfProvided: jest.fn().mockResolvedValue(null),
  removeImageIfManagedUpload: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../config/app');
const Post = require('../models/postModel');

function buildPost(overrides = {}) {
  return {
    id: 1,
    title: 'Lake Malawi Escape',
    authorName: 'Traveler',
    location: 'Lake Malawi',
    imagePath: 'default.jpg',
    imagePublicId: null,
    content: 'Lake Malawi is beautiful and calm.',
    featured: false,
    featuredUntil: null,
    createdAt: new Date('2026-04-20T10:00:00Z'),
    updatedAt: new Date('2026-04-20T10:00:00Z'),
    tags: [{ id: 1, name: 'Beach', slug: 'beach' }],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Post.getAllTags.mockResolvedValue([
    { id: 1, name: 'Beach', slug: 'beach' },
    { id: 2, name: 'Adventure', slug: 'adventure' },
  ]);
  Post.getFeaturedPost.mockResolvedValue(null);
});

describe('Malawi Hidden Gems routes', () => {
  test('POST /posts creates a post and returns a token', async () => {
    Post.createPost.mockResolvedValue({
      id: 42,
      editorToken: 'editor-token-42',
    });

    const response = await request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .type('form')
      .send({
        title: 'Cape Maclear',
        authorName: 'Alice',
        location: 'Cape Maclear',
        content: 'A calm beach town with crystal-clear water.',
        tagSlugs: ['beach'],
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 42,
      editorToken: 'editor-token-42',
      redirectTo: '/posts/42',
    });
    expect(Post.createPost).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Cape Maclear',
      authorName: 'Alice',
      location: 'Cape Maclear',
      tagSlugs: ['beach'],
    }));
  });

  test('GET /posts returns paginated posts', async () => {
    Post.getPosts.mockResolvedValue({
      posts: [buildPost()],
      totalPosts: 25,
      currentPage: 2,
      pageSize: 10,
      totalPages: 3,
    });

    const response = await request(app).get('/posts?page=2');

    expect(response.status).toBe(200);
    expect(Post.getPosts).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 10,
      searchQuery: '',
      tagSlug: '',
    }));
    expect(response.text).toContain('Page 2 of 3');
    expect(response.text).toContain('Lake Malawi Escape');
  });

  test('GET /posts/search?q=lake returns matching posts', async () => {
    Post.searchPosts.mockResolvedValue({
      posts: [buildPost()],
      totalPosts: 1,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const response = await request(app).get('/posts/search?q=lake');

    expect(response.status).toBe(200);
    expect(Post.searchPosts).toHaveBeenCalledWith('lake', expect.objectContaining({
      page: 1,
      pageSize: 10,
      searchQuery: 'lake',
      tagSlug: '',
    }));
    expect(response.text).toContain('1 result found for &#34;lake&#34;');
  });

  test('PUT /posts/:id fails without token and succeeds with the correct token', async () => {
    Post.validateEditorToken.mockResolvedValue(false);

    const failureResponse = await request(app)
      .put('/posts/1')
      .set('Accept', 'application/json')
      .send({
        title: 'Updated title',
        content: 'Updated content',
      });

    expect(failureResponse.status).toBe(403);
    expect(Post.updatePost).not.toHaveBeenCalled();

    Post.validateEditorToken.mockResolvedValue(true);
    Post.getPostById.mockResolvedValue(buildPost());
    Post.updatePost.mockResolvedValue(undefined);

    const successResponse = await request(app)
      .put('/posts/1')
      .set('Accept', 'application/json')
      .send({
        editorToken: 'correct-token',
        title: 'Updated title',
        authorName: 'Traveler',
        location: 'Lake Malawi',
        content: 'Updated content',
        tagSlugs: ['beach'],
      });

    expect(successResponse.status).toBe(200);
    expect(Post.validateEditorToken).toHaveBeenCalledWith('1', 'correct-token');
    expect(Post.updatePost).toHaveBeenCalledWith('1', expect.objectContaining({
      title: 'Updated title',
      tagSlugs: ['beach'],
    }));
  });

  test('DELETE /posts/:id fails without token and succeeds with the correct token', async () => {
    Post.validateEditorToken.mockResolvedValue(false);

    const failureResponse = await request(app)
      .delete('/posts/1')
      .set('Accept', 'application/json');

    expect(failureResponse.status).toBe(403);
    expect(Post.deletePost).not.toHaveBeenCalled();

    Post.validateEditorToken.mockResolvedValue(true);
    Post.getPostById.mockResolvedValue(buildPost());
    Post.deletePost.mockResolvedValue(undefined);

    const successResponse = await request(app)
      .delete('/posts/1')
      .set('Accept', 'application/json')
      .send({
        editorToken: 'correct-token',
      });

    expect(successResponse.status).toBe(200);
    expect(Post.deletePost).toHaveBeenCalledWith('1');
    expect(successResponse.body).toEqual({
      id: 1,
      success: true,
    });
  });

  test('POST /admin/login fails with wrong password and succeeds with the correct password', async () => {
    const failureResponse = await request(app)
      .post('/admin/login')
      .type('form')
      .send({ password: 'wrong-password' });

    expect(failureResponse.status).toBe(401);
    expect(failureResponse.text).toContain('Invalid admin password.');

    const successResponse = await request(app)
      .post('/admin/login')
      .type('form')
      .send({ password: 'secret-admin-password' });

    expect(successResponse.status).toBe(302);
    expect(successResponse.headers.location).toBe('/admin/dashboard');
    expect(successResponse.headers['set-cookie']).toBeDefined();
  });
});
