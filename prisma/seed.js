const { prisma } = require('../config/prisma');
const { slugify } = require('../utils/text');

const defaultTags = [
  'Northern Region',
  'Central Region',
  'Southern Region',
  'Beach',
  'Wildlife',
  'Culture',
  'Food',
  'Adventure',
];

async function seed() {
  for (const tagName of defaultTags) {
    await prisma.tag.upsert({
      where: {
        slug: slugify(tagName),
      },
      update: {
        name: tagName,
      },
      create: {
        name: tagName,
        slug: slugify(tagName),
      },
    });
  }
}

seed()
  .then(async () => {
    console.log('Prisma seed complete.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Prisma seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
