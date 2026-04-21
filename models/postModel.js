const crypto = require('crypto');

const { pool, query } = require('../config/database');

function mapTag(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

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
    imagePublicId: row.image_public_id,
    content: row.content,
    featured: Boolean(row.featured),
    featuredUntil: row.featured_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
  };
}

function normalizePagination(page = 1, pageSize = 10) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePageSize = Math.max(1, Number.parseInt(pageSize, 10) || 10);

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize,
  };
}

function buildPaginationClause(page, pageSize) {
  const { offset, pageSize: normalizedPageSize } = normalizePagination(page, pageSize);

  return {
    limitSql: `LIMIT ${normalizedPageSize} OFFSET ${offset}`,
    pageSize: normalizedPageSize,
    offset,
  };
}

function buildPostFilterWhereClause(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.searchQuery) {
    conditions.push('(posts.title LIKE ? OR posts.content LIKE ?)');
    params.push(`%${filters.searchQuery}%`, `%${filters.searchQuery}%`);
  }

  if (filters.tagSlug) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM post_tags AS postTagFilter
        INNER JOIN tags AS tagFilter
          ON tagFilter.id = postTagFilter.tag_id
        WHERE postTagFilter.post_id = posts.id
          AND tagFilter.slug = ?
      )
    `);
    params.push(filters.tagSlug);
  }

  if (filters.onlyFeatured) {
    conditions.push('posts.featured = TRUE');
    conditions.push('(posts.featured_until IS NULL OR posts.featured_until >= NOW())');
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

async function attachTags(posts) {
  if (!posts.length) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const placeholders = postIds.map(() => '?').join(', ');
  const tagRows = await query(`
    SELECT post_tags.post_id, tags.id, tags.name, tags.slug
    FROM post_tags
    INNER JOIN tags
      ON tags.id = post_tags.tag_id
    WHERE post_tags.post_id IN (${placeholders})
    ORDER BY tags.name ASC
  `, postIds);

  const tagsByPostId = new Map();

  tagRows.forEach((row) => {
    const existingTags = tagsByPostId.get(row.post_id) || [];
    existingTags.push(mapTag(row));
    tagsByPostId.set(row.post_id, existingTags);
  });

  return posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
}

async function getTagIdsBySlugs(connection, tagSlugs = []) {
  if (!tagSlugs.length) {
    return [];
  }

  const placeholders = tagSlugs.map(() => '?').join(', ');
  const [rows] = await connection.execute(`
    SELECT id
    FROM tags
    WHERE slug IN (${placeholders})
  `, tagSlugs);

  return rows.map((row) => row.id);
}

async function replacePostTags(connection, postId, tagSlugs = []) {
  await connection.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);

  if (!tagSlugs.length) {
    return;
  }

  const tagIds = await getTagIdsBySlugs(connection, tagSlugs);

  if (!tagIds.length) {
    return;
  }

  const valuePlaceholders = tagIds.map(() => '(?, ?)').join(', ');
  const params = tagIds.flatMap((tagId) => [postId, tagId]);

  await connection.execute(`
    INSERT INTO post_tags (post_id, tag_id)
    VALUES ${valuePlaceholders}
  `, params);
}

async function getPostById(id) {
  const rows = await query(`
    SELECT
      posts.id,
      posts.title,
      posts.author_name,
      posts.location,
      posts.image_path,
      posts.image_public_id,
      posts.content,
      posts.featured,
      posts.featured_until,
      posts.created_at,
      posts.updated_at
    FROM posts
    WHERE posts.id = ?
    LIMIT 1
  `, [id]);

  const [post] = await attachTags(rows.map(mapPost));
  return post || null;
}

async function getPosts(options = {}) {
  const { page, pageSize } = normalizePagination(options.page, options.pageSize);
  const { limitSql } = buildPaginationClause(page, pageSize);
  const { whereSql, params } = buildPostFilterWhereClause(options);
  const countRows = await query(`
    SELECT COUNT(*) AS total
    FROM posts
    ${whereSql}
  `, params);
  const totalPosts = countRows[0] ? countRows[0].total : 0;

  const rows = await query(`
    SELECT
      posts.id,
      posts.title,
      posts.author_name,
      posts.location,
      posts.image_path,
      posts.image_public_id,
      posts.content,
      posts.featured,
      posts.featured_until,
      posts.created_at,
      posts.updated_at
    FROM posts
    ${whereSql}
    ORDER BY posts.created_at DESC
    ${limitSql}
  `, params);

  const posts = await attachTags(rows.map(mapPost));

  return {
    posts,
    totalPosts,
    currentPage: page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalPosts / pageSize)),
  };
}

async function getAllPosts() {
  const listing = await getPosts({ page: 1, pageSize: 1000 });
  return listing.posts;
}

async function getAllTags() {
  const rows = await query(`
    SELECT id, name, slug
    FROM tags
    ORDER BY name ASC
  `);

  return rows.map(mapTag);
}

async function createPost(post) {
  const editorToken = crypto.randomBytes(32).toString('hex');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(`
      INSERT INTO posts (
        title,
        author_name,
        location,
        image_path,
        image_public_id,
        editor_token,
        content
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      post.title,
      post.authorName,
      post.location,
      post.imagePath,
      post.imagePublicId,
      editorToken,
      post.content,
    ]);

    await replacePostTags(connection, result.insertId, post.tagSlugs);
    await connection.commit();

    return {
      id: result.insertId,
      editorToken,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePost(id, post) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(`
      UPDATE posts
      SET
        title = ?,
        author_name = ?,
        location = ?,
        image_path = ?,
        image_public_id = ?,
        content = ?
      WHERE id = ?
    `, [
      post.title,
      post.authorName,
      post.location,
      post.imagePath,
      post.imagePublicId,
      post.content,
      id,
    ]);

    await replacePostTags(connection, id, post.tagSlugs);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePost(id) {
  await query('DELETE FROM posts WHERE id = ?', [id]);
}

async function validateEditorToken(id, editorToken) {
  const rows = await query(`
    SELECT id
    FROM posts
    WHERE id = ?
      AND editor_token = ?
    LIMIT 1
  `, [id, editorToken]);

  return Boolean(rows[0]);
}

async function searchPosts(searchQuery, options = {}) {
  return getPosts({
    ...options,
    searchQuery,
  });
}

async function getFeaturedPost() {
  await query(`
    UPDATE posts
    SET featured = FALSE, featured_until = NULL
    WHERE featured = TRUE
      AND featured_until IS NOT NULL
      AND featured_until < NOW()
  `);

  const rows = await query(`
    SELECT
      posts.id,
      posts.title,
      posts.author_name,
      posts.location,
      posts.image_path,
      posts.image_public_id,
      posts.content,
      posts.featured,
      posts.featured_until,
      posts.created_at,
      posts.updated_at
    FROM posts
    WHERE posts.featured = TRUE
      AND (posts.featured_until IS NULL OR posts.featured_until >= NOW())
    ORDER BY posts.featured_until DESC, posts.updated_at DESC
    LIMIT 1
  `);

  const [post] = await attachTags(rows.map(mapPost));
  return post || null;
}

async function featurePost(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(`
      UPDATE posts
      SET featured = FALSE, featured_until = NULL
      WHERE featured = TRUE
    `);

    await connection.execute(`
      UPDATE posts
      SET
        featured = TRUE,
        featured_until = DATE_ADD(NOW(), INTERVAL 7 DAY)
      WHERE id = ?
    `, [id]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllPosts,
  getAllTags,
  getPostById,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  validateEditorToken,
  searchPosts,
  getFeaturedPost,
  featurePost,
};
