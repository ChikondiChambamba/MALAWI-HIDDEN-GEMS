const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'public', 'css');
const entry = fs.readFileSync(path.join(cssDir, 'style.css'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'public', 'service-worker.js'), 'utf8');
const imports = [...entry.matchAll(/@import url\("([^"]+)"\)/g)].map((match) => match[1]);

describe('stylesheet partials', () => {
  test('style.css imports at least one partial', () => {
    expect(imports.length).toBeGreaterThan(0);
  });

  test.each(imports)('%s exists and is precached by the service worker', (file) => {
    expect(fs.existsSync(path.join(cssDir, file))).toBe(true);
    expect(serviceWorker).toContain(`'/css/${file}'`);
  });
});
