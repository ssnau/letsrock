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
  app.use(async (ctx, next) => {
    if (ctx.path === '/favicon.ico') {
      ctx.set('Cache-Control', `public, max-age=${3600 * 24 * 7}`); // unit is 's'
      ctx.type = 'image/x-icon';
      ctx.body = favicon;
      return;
    }
    await next();
  });
}

module.exports = setup;
