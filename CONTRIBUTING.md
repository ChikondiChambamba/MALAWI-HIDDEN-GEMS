# Contributing

## Prerequisites

- Node.js 18+
- MySQL 8+

## Local Setup

1. Fork or clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your MySQL, session, admin password, and Cloudinary values.
5. Create the database named in `DB_NAME`.
6. Run `npm run init-db`.
7. Start the app with `npm run dev`.

## Code Style Guide

- Use 2-space indentation.
- Use `camelCase` for variables and function names.
- Prefer `async`/`await` over raw callbacks.
- Match the existing MVC structure and keep logic in the appropriate layer.
- Sanitize and validate user input before saving it.

## Running Tests

Run the test suite with:

```bash
npm test
```

## Pull Requests

1. Create a focused feature branch.
2. Run `npm test` before opening the pull request.
3. Include a short summary of what changed and why.
4. Mention any schema or environment variable changes in the PR description.
5. Keep pull requests small enough to review comfortably when possible.
