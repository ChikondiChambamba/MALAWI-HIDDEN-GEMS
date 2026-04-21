# Malawi Hidden Gems

Malawi Hidden Gems is a production-oriented tourism discovery platform built with Express.js, EJS, Prisma ORM, MySQL, Tailwind CSS, and Cloudinary. The app is optimized for low-bandwidth environments with offline-ready caching, lightweight mapping, responsive media delivery, dynamic SEO metadata, and an Apple-inspired premium interface.

## Features

- Anonymous post publishing with private editor-token cookies stored as `HttpOnly`
- Prisma ORM data layer with schema-based relationships, seeding, and cleaner model access
- Token-protected edit and delete routes for post owners
- Sanitized user input with a safe HTML whitelist to reduce XSS risk
- Cloudinary-based image hosting with Sharp optimization before upload
- Responsive image delivery and lazy loading for better bandwidth efficiency
- Search by title and content with a friendly empty state
- Region and experience tags with tag-based filtering
- Pagination that works with search queries and tag filters
- Post excerpts and estimated read time on listing pages
- Progressive Web App manifest and service worker using a stale-while-revalidate strategy
- Leaflet.js destination map with CartoDB Positron tiles and database-driven markers
- Dynamic SEO tags, Open Graph previews, canonical URLs, and JSON-LD structured data
- Tailwind-powered mobile-first interface with premium minimal design
- Helmet-powered security headers with a tailored Content Security Policy
- Password-protected admin dashboard with session-based authentication
- Hidden Gem of the Week featuring with automatic expiry after 7 days
- Jest and Supertest coverage for core post and admin flows

## Tech Stack

### Backend

- Node.js 18+
- Express.js
- MySQL 8+
- Prisma ORM
- EJS
- compression
- express-session
- method-override
- multer
- sanitize-html
- helmet
- cloudinary
- multer-storage-cloudinary
- sharp

### Frontend

- Tailwind CSS
- Vanilla JavaScript
- Leaflet.js
- Google Fonts

### Tooling and Testing

- Jest
- Supertest
- Nodemon
- Prisma CLI
- Tailwind CLI

## Project Structure

- `assets/`: Tailwind CSS source
- `config/`: app, Prisma, uploads, Cloudinary, and environment configuration
- `controllers/`: route handlers for pages, posts, contact, and admin flows
- `middleware/`: reusable request middleware
- `models/`: Prisma-backed domain data access
- `prisma/`: schema, migrations, and seed script
- `routes/`: route definitions
- `tests/`: Jest and Supertest route coverage
- `utils/`: formatting and helper utilities
- `views/`: EJS templates
- `public/`: static CSS, JavaScript, images, manifest, service worker, and offline page

## Environment Variables

Copy `.env.example` into `.env` and fill in your values.

```env
NODE_ENV=development
PORT=3000
SITE_URL=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=malawi_hidden_gems
DATABASE_URL=mysql://your_mysql_user:your_mysql_password@127.0.0.1:3306/malawi_hidden_gems
MAX_UPLOAD_SIZE_BYTES=5242880
SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=malawi-hidden-gems
```

## Local Setup

1. Install dependencies with `npm install`.
2. Create the MySQL database named in `DB_NAME`.
3. Copy `.env.example` to `.env` and add your credentials.
4. Run `npm run init-db` to generate Prisma Client, push the schema, and seed default tags.
5. Run `npm run build:css` to compile the Tailwind stylesheet.
6. Start the app with `npm run dev` or `npm start`.
7. Run `npm test` to execute the Jest suite.

## Contributor Guide

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup expectations, code style, testing guidance, and pull request steps.
