const Post = require('../models/postModel');
const {
  buildPostFormData,
  validatePostPayload,
  buildExcerpt,
  formatPostContent,
} = require('../utils/postFormatter');
const { removeImageIfManagedUpload } = require('../utils/fileManager');

function renderPostForm(req, res) {
  res.render('create', {
    title: 'Share a Malawi travel story',
    pageDescription: 'Create a new Malawi travel experience post.',
    form: buildPostFormData(),
  });
}

async function listPosts(req, res) {
  const posts = await Post.getAllPosts();

  res.render('index', {
    title: 'Malawi Tourism Blog',
    pageDescription: 'Discover travel stories, destination tips, and reviews from visitors exploring Malawi.',
    posts: posts.map((post) => ({
      ...post,
      excerpt: buildExcerpt(post.content),
    })),
  });
}

async function showPost(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  res.render('post', {
    title: `${post.title} | Malawi Tourism Blog`,
    pageDescription: buildExcerpt(post.content, 155),
    post: {
      ...post,
      formattedContent: formatPostContent(post.content),
    },
  });
}

async function createPost(req, res) {
  const form = buildPostFormData(req.body, req.file);
  const validation = validatePostPayload(form);

  if (!validation.isValid) {
    if (req.file) {
      await removeImageIfManagedUpload(req.file.filename);
    }

    return res.status(400).render('create', {
      title: 'Share a Malawi travel story',
      pageDescription: 'Create a new Malawi travel experience post.',
      error: validation.message,
      form,
    });
  }

  const newPost = await Post.createPost({
    title: form.title,
    authorName: form.authorName,
    location: form.location,
    content: form.content,
    imagePath: req.file ? `uploads/${req.file.filename}` : 'default.jpg',
  });

  res.redirect(`/posts/${newPost.id}`);
}

async function renderEditForm(req, res) {
  const post = await Post.getPostById(req.params.id);

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  res.render('edit', {
    title: `Edit ${post.title}`,
    pageDescription: `Update the travel story "${post.title}" on Malawi Tourism Blog.`,
    form: buildPostFormData(post),
    post,
  });
}

async function updatePost(req, res) {
  const existingPost = await Post.getPostById(req.params.id);

  if (!existingPost) {
    if (req.file) {
      await removeImageIfManagedUpload(req.file.filename);
    }

    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const form = buildPostFormData(req.body, req.file, existingPost);
  const validation = validatePostPayload(form);

  if (!validation.isValid) {
    if (req.file) {
      await removeImageIfManagedUpload(req.file.filename);
    }

    return res.status(400).render('edit', {
      title: `Edit ${existingPost.title}`,
      pageDescription: `Update the travel story "${existingPost.title}" on Malawi Tourism Blog.`,
      error: validation.message,
      form,
      post: {
        ...existingPost,
        ...form,
      },
    });
  }

  const nextImagePath = req.file ? `uploads/${req.file.filename}` : existingPost.imagePath;

  await Post.updatePost(req.params.id, {
    title: form.title,
    authorName: form.authorName,
    location: form.location,
    content: form.content,
    imagePath: nextImagePath,
  });

  if (req.file && existingPost.imagePath !== 'default.jpg') {
    await removeImageIfManagedUpload(existingPost.imagePath.replace(/^uploads\//, ''));
  }

  res.redirect(`/posts/${req.params.id}`);
}

async function deletePost(req, res) {
  const existingPost = await Post.getPostById(req.params.id);

  if (!existingPost) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  await Post.deletePost(req.params.id);

  if (existingPost.imagePath !== 'default.jpg') {
    await removeImageIfManagedUpload(existingPost.imagePath.replace(/^uploads\//, ''));
  }

  res.redirect('/posts');
}

module.exports = {
  renderPostForm,
  listPosts,
  showPost,
  createPost,
  renderEditForm,
  updatePost,
  deletePost,
};
