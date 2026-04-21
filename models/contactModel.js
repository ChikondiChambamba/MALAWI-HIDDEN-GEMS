const { query } = require('../config/database');

async function createContact(contact) {
  await query(`
    INSERT INTO contacts (name, email, message)
    VALUES (?, ?, ?)
  `, [contact.name, contact.email, contact.message]);
}

module.exports = {
  createContact,
};
