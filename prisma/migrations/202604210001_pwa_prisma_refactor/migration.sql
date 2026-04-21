CREATE TABLE IF NOT EXISTS posts (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  author_name VARCHAR(120) NOT NULL DEFAULT 'Anonymous traveler',
  location VARCHAR(120) NULL,
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  image_path VARCHAR(500) NOT NULL DEFAULT 'default.jpg',
  image_public_id VARCHAR(255) NULL,
  editor_token VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until DATETIME NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tags (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE INDEX tags_name_key(name),
  UNIQUE INDEX tags_slug_key(slug)
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  INDEX post_tags_tag_id_idx(tag_id),
  CONSTRAINT post_tags_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT post_tags_tag_id_fkey
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO tags (name, slug)
VALUES
  ('Northern Region', 'northern-region'),
  ('Central Region', 'central-region'),
  ('Southern Region', 'southern-region'),
  ('Beach', 'beach'),
  ('Wildlife', 'wildlife'),
  ('Culture', 'culture'),
  ('Food', 'food'),
  ('Adventure', 'adventure');
