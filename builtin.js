var opts = require('./config');
var co   = require('co');
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
    getBody: co.wrap(function* () {
      if (!parsed) {
        parsed = true;
        body = yield parse(context);
      }
      return body;
    })
  }
}
var responseService = function (context) {
  return {
    render: function (data, tpl, _opts) {
      var path = (context.path === '/') ? 'index' : context.path;
      _opts = Object.assign({}, _opts, opts);
      context.type = 'text/html';
      context.body = template({
        src: rr(_opts.serveFilePath + '/' + (tpl || path) + '/index.js')
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
