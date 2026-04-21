const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getExistingColumns(tableName) {
  const rows = await query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
  `, [env.dbName, tableName]);

  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function ensurePostsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author_name VARCHAR(120) NOT NULL DEFAULT 'Anonymous traveler',
      location VARCHAR(120) DEFAULT NULL,
      image_path VARCHAR(500) NOT NULL DEFAULT 'default.jpg',
      image_public_id VARCHAR(255) DEFAULT NULL,
      editor_token VARCHAR(128) NOT NULL,
      content TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      featured_until DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const columns = await getExistingColumns('posts');

  if (!columns.has('author_name')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN author_name VARCHAR(120) NOT NULL DEFAULT 'Anonymous traveler'
      AFTER title
    `);
  }

  if (!columns.has('location')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN location VARCHAR(120) DEFAULT NULL
      AFTER author_name
    `);
  }

  if (!columns.has('image_path')) {
    if (columns.has('image')) {
      await query(`
        ALTER TABLE posts
        CHANGE COLUMN image image_path VARCHAR(500) NOT NULL DEFAULT 'default.jpg'
      `);
    } else {
      await query(`
        ALTER TABLE posts
        ADD COLUMN image_path VARCHAR(500) NOT NULL DEFAULT 'default.jpg'
        AFTER location
      `);
    }
  }

  await query(`
    ALTER TABLE posts
    MODIFY COLUMN image_path VARCHAR(500) NOT NULL DEFAULT 'default.jpg'
  `);

  if (!columns.has('image_public_id')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN image_public_id VARCHAR(255) DEFAULT NULL
      AFTER image_path
    `);
  }

  if (!columns.has('editor_token')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN editor_token VARCHAR(128) NOT NULL DEFAULT ''
      AFTER image_public_id
    `);
  }

  if (!columns.has('created_at')) {
    if (columns.has('createdAt')) {
      await query(`
        ALTER TABLE posts
        CHANGE COLUMN createdAt created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
    } else {
      await query(`
        ALTER TABLE posts
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        AFTER content
      `);
    }
  }

  if (!columns.has('updated_at')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      AFTER created_at
    `);
  }

  if (!columns.has('featured')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE
      AFTER content
    `);
  }

  if (!columns.has('featured_until')) {
    await query(`
      ALTER TABLE posts
      ADD COLUMN featured_until DATETIME DEFAULT NULL
      AFTER featured
    `);
  }

  await query(`
    UPDATE posts
    SET editor_token = SHA2(CONCAT('post-token-', id, '-', COALESCE(created_at, NOW())), 256)
    WHERE editor_token = ''
  `);
}

async function ensureContactsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await getExistingColumns('contacts');

  if (!columns.has('created_at') && columns.has('createdAt')) {
    await query(`
      ALTER TABLE contacts
      CHANGE COLUMN createdAt created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
  }
}

async function ensureTagsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      slug VARCHAR(140) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      CONSTRAINT fk_post_tags_post
        FOREIGN KEY (post_id) REFERENCES posts(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_post_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
    )
  `);

  await query(`
    INSERT IGNORE INTO tags (name, slug)
    VALUES
      ('Northern Region', 'northern-region'),
      ('Central Region', 'central-region'),
      ('Southern Region', 'southern-region'),
      ('Beach', 'beach'),
      ('Wildlife', 'wildlife'),
      ('Culture', 'culture'),
      ('Food', 'food'),
      ('Adventure', 'adventure')
  `);
}

async function ensureSchema() {
  await ensurePostsSchema();
  await ensureContactsSchema();
  await ensureTagsSchema();
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  ensureSchema,
  closePool,
};
