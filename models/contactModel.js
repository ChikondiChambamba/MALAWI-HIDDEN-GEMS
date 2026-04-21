const { prisma } = require('../config/prisma');

async function createContact(contact) {
  await prisma.contact.create({
    data: {
      name: contact.name,
      email: contact.email,
      message: contact.message,
    },
  });
}

module.exports = {
  createContact,
};
