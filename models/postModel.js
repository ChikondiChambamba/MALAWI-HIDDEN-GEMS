const crypto = require('crypto');

const { prisma } = require('../config/prisma');

const POSTS_INCLUDE = {
  postTags: {
    include: {
      tag: true,
    },
  },
};

function mapTag(tag) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

function mapPost(post) {
  if (!post) {
    return null;
  }

  const tags = (post.postTags || [])
    .map((postTag) => mapTag(postTag.tag))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    id: post.id,
    title: post.title,
    authorName: post.authorName,
    location: post.location,
    latitude: post.latitude,
    longitude: post.longitude,
    imagePath: post.imagePath,
    imagePublicId: post.imagePublicId,
    content: post.content,
    featured: post.featured,
    featuredUntil: post.featuredUntil,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags,
  };
}

function normalizePagination(page = 1, pageSize = 10) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePageSize = Math.max(1, Number.parseInt(pageSize, 10) || 10);

  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
  };
}

function buildWhereClause(filters = {}) {
  const conditions = [];

  if (filters.searchQuery) {
    conditions.push({
      OR: [
        {
          title: {
            contains: filters.searchQuery,
          },
        },
        {
          content: {
            contains: filters.searchQuery,
          },
        },
        {
          location: {
            contains: filters.searchQuery,
          },
        },
      ],
    });
  }

  if (filters.tagSlug) {
    conditions.push({
      postTags: {
        some: {
          tag: {
            slug: filters.tagSlug,
          },
        },
      },
    });
  }

  if (filters.onlyFeatured) {
    conditions.push({
      featured: true,
    });
    conditions.push({
      OR: [
        {
          featuredUntil: null,
        },
        {
          featuredUntil: {
            gte: new Date(),
          },
        },
      ],
    });
  }

  if (!conditions.length) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    AND: conditions,
  };
}

async function getTagsBySlugs(tagSlugs = []) {
  if (!tagSlugs.length) {
    return [];
  }

  return prisma.tag.findMany({
    where: {
      slug: {
        in: tagSlugs,
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

function buildTagWrites(tags) {
  return tags.map((tag) => ({
    tag: {
      connect: {
        id: tag.id,
      },
    },
  }));
}

async function getPostById(id) {
  const post = await prisma.post.findUnique({
    where: {
      id: Number(id),
    },
    include: POSTS_INCLUDE,
  });

  return mapPost(post);
}

async function getPosts(options = {}) {
  const { page, pageSize, skip } = normalizePagination(options.page, options.pageSize);
  const where = buildWhereClause(options);
  const [totalPosts, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: POSTS_INCLUDE,
      orderBy: [
        {
          featured: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    posts: posts.map(mapPost),
    totalPosts,
    currentPage: page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalPosts / pageSize)),
  };
}

async function getAllPosts() {
  const posts = await prisma.post.findMany({
    include: POSTS_INCLUDE,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return posts.map(mapPost);
}

async function getAllTags() {
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return tags.map(mapTag);
}

async function createPost(post) {
  const editorToken = crypto.randomBytes(32).toString('hex');
  const tags = await getTagsBySlugs(post.tagSlugs);
  const createdPost = await prisma.post.create({
    data: {
      title: post.title,
      authorName: post.authorName,
      location: post.location || null,
      latitude: typeof post.latitude === 'number' ? post.latitude : null,
      longitude: typeof post.longitude === 'number' ? post.longitude : null,
      imagePath: post.imagePath,
      imagePublicId: post.imagePublicId || null,
      editorToken,
      content: post.content,
      postTags: tags.length
        ? {
            create: buildTagWrites(tags),
          }
        : undefined,
    },
  });

  return {
    id: createdPost.id,
    editorToken,
  };
}

async function updatePost(id, post) {
  const tags = await getTagsBySlugs(post.tagSlugs);

  await prisma.post.update({
    where: {
      id: Number(id),
    },
    data: {
      title: post.title,
      authorName: post.authorName,
      location: post.location || null,
      latitude: typeof post.latitude === 'number' ? post.latitude : null,
      longitude: typeof post.longitude === 'number' ? post.longitude : null,
      imagePath: post.imagePath,
      imagePublicId: post.imagePublicId || null,
      content: post.content,
      postTags: {
        deleteMany: {},
        ...(tags.length
          ? {
              create: buildTagWrites(tags),
            }
          : {}),
      },
    },
  });
}

async function deletePost(id) {
  await prisma.post.delete({
    where: {
      id: Number(id),
    },
  });
}

async function validateEditorToken(id, editorToken) {
  const post = await prisma.post.findFirst({
    where: {
      id: Number(id),
      editorToken,
    },
    select: {
      id: true,
    },
  });

  return Boolean(post);
}

async function searchPosts(searchQuery, options = {}) {
  return getPosts({
    ...options,
    searchQuery,
  });
}

async function getFeaturedPost() {
  await prisma.post.updateMany({
    where: {
      featured: true,
      featuredUntil: {
        lt: new Date(),
      },
    },
    data: {
      featured: false,
      featuredUntil: null,
    },
  });

  const post = await prisma.post.findFirst({
    where: {
      featured: true,
      OR: [
        {
          featuredUntil: null,
        },
        {
          featuredUntil: {
            gte: new Date(),
          },
        },
      ],
    },
    include: POSTS_INCLUDE,
    orderBy: [
      {
        featuredUntil: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],
  });

  return mapPost(post);
}

async function featurePost(id) {
  await prisma.$transaction([
    prisma.post.updateMany({
      where: {
        featured: true,
      },
      data: {
        featured: false,
        featuredUntil: null,
      },
    }),
    prisma.post.update({
      where: {
        id: Number(id),
      },
      data: {
        featured: true,
        featuredUntil: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
      },
    }),
  ]);
}

async function getMapDestinations() {
  const posts = await prisma.post.findMany({
    where: {
      latitude: {
        not: null,
      },
      longitude: {
        not: null,
      },
    },
    include: POSTS_INCLUDE,
    orderBy: [
      {
        featured: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    take: 40,
  });

  return posts.map((post) => {
    const mappedPost = mapPost(post);

    return {
      id: mappedPost.id,
      title: mappedPost.title,
      location: mappedPost.location,
      latitude: mappedPost.latitude,
      longitude: mappedPost.longitude,
      imagePath: mappedPost.imagePath,
      tags: mappedPost.tags,
      featured: mappedPost.featured,
    };
  });
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
  getMapDestinations,
};
