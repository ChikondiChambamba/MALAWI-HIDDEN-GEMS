# Malawi Hidden Gems

[Live Demo](https://your-app-url.com)

Malawi Hidden Gems is a full-stack Malawi tourism blog built with Express.js, MySQL, EJS, and vanilla CSS/JavaScript. Travelers can publish stories without creating accounts, keep private ownership through browser-stored editor tokens, search and filter posts by tags, and explore a featured Hidden Gem of the Week curated from the admin dashboard.

## Screenshots

![Homepage screenshot placeholder](https://via.placeholder.com/1200x700?text=Homepage+Screenshot)
![Posts listing screenshot placeholder](https://via.placeholder.com/1200x700?text=Posts+Listing+Screenshot)
![Admin dashboard screenshot placeholder](https://via.placeholder.com/1200x700?text=Admin+Dashboard+Screenshot)

## Features

- Anonymous post publishing with private editor tokens stored in `localStorage`
- Token-protected edit and delete routes for post owners
- Sanitized user input with a safe HTML whitelist to reduce XSS risk
- Cloudinary-based image hosting with Sharp optimization before upload
- Search by title and content with a friendly empty state
- Region and experience tags with tag-based filtering
- Pagination that works with search queries and tag filters
- Post excerpts and estimated read time on listing pages
- Helmet-powered security headers with a tailored Content Security Policy
- Password-protected admin dashboard with session-based authentication
- Hidden Gem of the Week featuring with automatic expiry after 7 days
- Jest and Supertest coverage for core post and admin flows

## Tech Stack

### Backend

- Node.js 18+
- Express.js
- MySQL 8+
- EJS
- express-session
- method-override
- multer
- mysql2
- sanitize-html
- helmet
- cloudinary
- multer-storage-cloudinary
- sharp

### Frontend

- Vanilla CSS
- Vanilla JavaScript
- Google Fonts

### Tooling and Testing

- Jest
- Supertest
- Nodemon

## Project Structure

- `config/`: app, database, uploads, Cloudinary, and environment configuration
- `controllers/`: route handlers for pages, posts, contact, and admin flows
- `middleware/`: reusable request middleware
- `models/`: MySQL data access logic
- `routes/`: route definitions
- `scripts/`: operational scripts such as database initialization
- `tests/`: Jest and Supertest route coverage
- `utils/`: formatting and helper utilities
- `views/`: EJS templates
- `public/`: static CSS, JavaScript, and images

## Environment Variables

Copy `.env.example` into `.env` and fill in your values.

```env
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=malawi_hidden_gems
MAX_UPLOAD_SIZE_BYTES=5242880
SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_PASSWORD=replace_with_a_secure_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=malawi-hidden-gems
```

## Local Setup

1. Install dependencies with `npm install`.
2. Create the MySQL database named in `DB_NAME`.
3. Copy `.env.example` to `.env` and add your credentials.
4. Run `npm run init-db` to create tables, columns, and seed tags.
5. Start the app with `npm run dev` or `npm start`.
6. Run `npm test` to execute the Jest suite.

## Contributor Guide

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup expectations, code style, testing guidance, and pull request steps.
