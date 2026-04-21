const fs = require('fs');
const path = require('path');

function loadLocalEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContents = fs.readFileSync(envPath, 'utf8');
  const lines = fileContents.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  });
}

module.exports = {
  loadLocalEnvFile,
};
