var path = require('path');
var fs   = require('fs');
var opts = require('./config');
var cwd = process.cwd();

var controllerPath = path.join(cwd, 'controller');
var app = require('rekoa')({
  isDevelopment: true,
  base: cwd,
  path: {
    middleware: path.join(cwd, 'middleware'),
    controller: controllerPath 
  },
  port: 9898
});
require('./devserver')(opts)(app);
if (!fs.existsSync(controllerPath)) {
  app.use(function *(next) {
    if (this.body) return;
    var path = (this.path === '/') ? 'index' : this.path;
    this.body = template({
      src: rr(opts.serveFilePath + '/' + path + '/index.js')
    });
  });
}

app.start();

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
