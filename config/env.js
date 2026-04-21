const { loadLocalEnvFile } = require('./loadEnv');

loadLocalEnvFile();

function buildEnvHelpMessage(name) {
  return [
    `Missing required environment variable: ${name}.`,
    'Create a local .env file in the project root or update the existing one.',
    'You can start from .env.example.',
  ].join(' ');
}

function required(name, options = {}) {
  const { allowEmpty = false } = options;
  const value = process.env[name];

  if (typeof value === 'undefined' || value === null || (!allowEmpty && value === '')) {
    throw new Error(buildEnvHelpMessage(name));
  }

  return value;
}

function optionalNumber(name, fallback) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return parsedValue;
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = encodeURIComponent(required('DB_USER'));
  const password = encodeURIComponent(required('DB_PASSWORD', { allowEmpty: true }));
  const host = required('DB_HOST');
  const port = optionalNumber('DB_PORT', 3306);
  const database = required('DB_NAME');

  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: optionalNumber('PORT', 3000),
  dbHost: required('DB_HOST'),
  dbPort: optionalNumber('DB_PORT', 3306),
  dbUser: required('DB_USER'),
  dbPassword: required('DB_PASSWORD', { allowEmpty: true }),
  dbName: required('DB_NAME'),
  databaseUrl: buildDatabaseUrl(),
  maxUploadSizeBytes: optionalNumber('MAX_UPLOAD_SIZE_BYTES', 5 * 1024 * 1024),
  sessionSecret: required('SESSION_SECRET'),
  adminPassword: required('ADMIN_PASSWORD'),
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'malawi-hidden-gems',
};

env.hasCloudinaryConfig = Boolean(
  env.cloudinaryCloudName
  && env.cloudinaryApiKey
  && env.cloudinaryApiSecret
);

module.exports = env;
