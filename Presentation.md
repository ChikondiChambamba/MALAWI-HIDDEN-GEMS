# Presentation: Building a MySQL-Integrated Blog Application with User Registration in Express.js

## Slide 1: Title Slide
- **Title**: Integrating MySQL with Express.js: From Database Creation to CRUD Operations
- **Presenter**: Chikondi Chambamba, WOnagani Kamanga and Fredrick Nyirenda
- **Objective**: By the end of this presentation, you'll understand how to create a MySQL database connect connect it to an Express.js app

## Slide 2: Agenda Overview
- Section 1: Introduction to the Project
- Section 2: Creating the MySQL Database
- Section 3: Connecting MySQL to Express.js
- Section 4: Integrating Database Operations for Blog Posts (CRUD)


## Slide 3: Section 1 - Introduction to the Project
- **What We're Building**: A simple blog application using Express.js (Node.js web framework) integrated with MySQL for persistent data storage. 

- **Why MySQL + Express?**: MySQL is a reliable relational database for structured data like posts and users.

- **Key Features**:
  - Blog CRUD: Create, Read, Update, Delete posts.
- **Tools**: Express.js, Prisma ORM with the MariaDB adapter, and Multer (for file uploads in blogs).


## Slide 4: Section 2 - Creating the MySQL Database
- **Step 1: Install MySQL**
  - Download MySQL Community Server from mysql.com.
  - Install and start the server (e.g., via command line: `mysql -u root -p`).
  - Set a root password during installation.

- **Step 2: Create the Database**
  - Log in: `mysql -u root -p`
  - SQL Commands:
    ```sql
    CREATE DATABASE malawi_Tourism;
    USE malawi_Tourism;
    ```

- **Step 3: Create Tables**
  - For Blog Posts:
    ```sql
    CREATE TABLE posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image VARCHAR(255) DEFAULT 'default.jpg',
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ```

*(DEMOSTRATE)*

## Slide 5: Section 3 - Connecting MySQL to Express.js
- **Step 1: Set Up Your Express App**
  - Install dependencies: `npm init -y; npm install express prisma @prisma/client @prisma/adapter-mariadb mariadb dotenv multer method-override ejs`
  - Basic app structure: Folders for views (EJS templates), public (static files), routes.

- **Step 2: Configure Database Connection**
  - Use Prisma with the MariaDB adapter for a scalable, maintainable data layer.
  - Code Snippet (in app.js):
    ```javascript
    require('dotenv').config();  // For environment variables
    const { PrismaClient } = require('@prisma/client');
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'blog_app',
    });

    const prisma = new PrismaClient({ adapter });
    ```
  - Store credentials in a `.env` file (e.g., `DB_PASSWORD=yourpassword`) for security.


## Slide 6: Section 4 - Integrating Database Operations for Blog Posts (CRUD)

- **Create (POST /posts)**: Handle form submission, upload image, insert into DB.
  - Code: Use `prisma.post.create({ data: ... })` in an async route.

- **Read (GET /, GET /posts/:id)**: Fetch all or single post.
  - Code: `const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });`

- **Update (PUT /posts/:id)**: Edit form, update DB.
  - Code: `await prisma.post.update({ where: { id }, data: ... });`

- **Delete (DELETE /posts/:id)**: Remove from DB.
  - Code: `await prisma.post.delete({ where: { id } });`


## Thank You!

## Questions
