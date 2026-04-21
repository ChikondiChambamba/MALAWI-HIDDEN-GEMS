# Contributing

## Prerequisites

- Node.js 18+
- MySQL 8+

## Local Setup

1. Fork or clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your MySQL, Prisma `DATABASE_URL`, `SITE_URL`, session, admin password, and Cloudinary values.
5. Create the database named in `DB_NAME`.
6. Run `npm run init-db`.
7. Run `npm run build:css`.
8. Start the app with `npm run dev`.

## Code Style Guide

- Use 2-space indentation.
- Use `camelCase` for variables and function names.
- Prefer `async`/`await` over raw callbacks.
- Match the existing MVC structure and keep logic in the appropriate layer.
- Prefer Prisma queries and schema updates over raw SQL for application code.
- Sanitize and validate user input before saving it.
- Keep the Tailwind design system clean, mobile-first, and accessibility-aware.

## Running Tests

Run the test suite with:

```bash
npm test
```

To rebuild the stylesheet after template or design changes:

```bash
npm run build:css
```

## Pull Requests

1. Create a focused feature branch.
2. Run `npm test` before opening the pull request.
3. Include a short summary of what changed and why.
4. Mention any schema or environment variable changes in the PR description.
5. Keep pull requests small enough to review comfortably when possible.
