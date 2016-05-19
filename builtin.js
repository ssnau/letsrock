var opts = require('./config');
function setup(app) {
  app.use(function *(next) {
    this.pendingInjections = [
      (injector) => injector.register('request', requestService),
      (injector) => injector.register('response', responseService),
    ];
    yield next;
  });
}

var parse = require('co-body');
var requestService = function (context) {
  var parsed, body;
  return {
    getBody: function * () {
      if (!parsed) {
        body = yield parse(context.req);
        parsed = true;
      }
      return body;
    }
  }
}
var responseService = function (context) {
  return {
    render: function (data, tpl) {
      var path = (context.path === '/') ? 'index' : context.path;
      context.body = template({
        src: rr(opts.serveFilePath + '/' + (tpl || path) + '/index.js')
      });
    }
  };
};

function template(opts) {
  return `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <div id="app"></div>
    <script src="${opts.src}"></script>
  </body>
</html>
  `
}

function rr(src) {
  return src
    .replace('//', '/')
    .replace('//', '/')
    .replace('//', '/');
}

module.exports = setup;
