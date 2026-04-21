const { query } = require('../config/database');

function mapPost(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    location: row.location,
    imagePath: row.image_path,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAllPosts() {
  const rows = await query(`
    SELECT id, title, author_name, location, image_path, content, created_at, updated_at
    FROM posts
    ORDER BY created_at DESC
  `);

  return rows.map(mapPost);
}

async function getPostById(id) {
  const rows = await query(`
    SELECT id, title, author_name, location, image_path, content, created_at, updated_at
    FROM posts
    WHERE id = ?
    LIMIT 1
  `, [id]);

  return mapPost(rows[0]);
}

async function createPost(post) {
  const result = await query(`
    INSERT INTO posts (title, author_name, location, image_path, content)
    VALUES (?, ?, ?, ?, ?)
  `, [post.title, post.authorName, post.location, post.imagePath, post.content]);

  return { id: result.insertId };
}

async function updatePost(id, post) {
  await query(`
    UPDATE posts
    SET title = ?, author_name = ?, location = ?, image_path = ?, content = ?
    WHERE id = ?
  `, [post.title, post.authorName, post.location, post.imagePath, post.content, id]);
}

async function deletePost(id) {
  await query('DELETE FROM posts WHERE id = ?', [id]);
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
