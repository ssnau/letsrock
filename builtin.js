const { safe } = require('./util');
const fs = require('fs');
const path = require('path');

function setup(app) {
  // deal with favicon
  const favicon = [
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.ico'))),
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.png'))),
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.jpg'))),
    safe(() => fs.readFileSync(path.join(__dirname, 'rocking.jpg'))),
  ].filter(Boolean)[0];
  app.use(function* serveFavicon(next) {
    if (this.path === '/favicon.ico') {
      this.set('Cache-Control', `public, max-age=${10000}`);
      this.type = 'image/x-icon';
      this.body = favicon;
      return;
    }
    yield next;
  });
}

module.exports = setup;
