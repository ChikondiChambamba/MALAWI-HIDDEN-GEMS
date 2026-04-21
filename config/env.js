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

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: optionalNumber('PORT', 3000),
  dbHost: required('DB_HOST'),
  dbPort: optionalNumber('DB_PORT', 3306),
  dbUser: required('DB_USER'),
  dbPassword: required('DB_PASSWORD', { allowEmpty: true }),
  dbName: required('DB_NAME'),
  maxUploadSizeBytes: optionalNumber('MAX_UPLOAD_SIZE_BYTES', 5 * 1024 * 1024),
  sessionSecret: required('SESSION_SECRET'),
  adminUsername: required('ADMIN_USERNAME'),
  adminPassword: required('ADMIN_PASSWORD'),
};

module.exports = env;
