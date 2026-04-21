# Malawi Tourism Blog

Malawi Tourism Blog is an anonymous community travel blog where anyone can publish, edit, and share travel reviews about destinations across Malawi without creating an account.

## Features

- Anonymous post creation and editing
- MySQL-backed post and contact storage
- Public image uploads with validation and cleanup
- MVC-style Express structure
- Environment-based configuration
- Basic request rate limiting and security headers

## Project Structure

- `config/`: app, database, uploads, and environment configuration
- `controllers/`: route handlers for pages, posts, and contact
- `middleware/`: reusable request middleware
- `models/`: MySQL data access logic
- `routes/`: route definitions
- `scripts/`: operational scripts such as database initialization
- `utils/`: formatting and helper utilities
- `views/`: EJS templates
- `public/`: static CSS, JavaScript, and images

## Environment Variables

Copy `.env.example` into `.env` and fill in your MySQL credentials.

```env
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=malawi_tourism
MAX_UPLOAD_SIZE_BYTES=5242880
```

## Local Setup

1. Install dependencies with `npm install`.
2. Create the MySQL database named in `DB_NAME`.
3. Add your environment variables.
4. Run `npm run init-db`.
5. Start the app with `npm run dev` or `npm start`.

## Deployment Notes

- Set all environment variables in your hosting provider.
- Make sure the deployment platform provides a writable filesystem for `public/images/uploads`.
- If your host uses ephemeral storage, move uploads to object storage before going to production scale.
- The app initializes required tables on startup and can also be initialized manually with `npm run init-db`.

## Anonymous Editing Model

This app intentionally allows public editing and deletion without user accounts, based on the current product requirement. For a future hardening step, consider adding moderation or editor tokens without requiring full user registration.
