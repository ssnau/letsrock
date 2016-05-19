var path = require('path');
var fs   = require('fs');
var opts = require('./config');
var cwd = process.cwd();
require("babel-register")(require('./babelQuery'));

var controllerPath = path.join(cwd, 'controller');
var app = require('rekoa')({
  isDevelopment: true,
  base: cwd,
  path: {
    middleware: path.join(cwd, 'middleware'),
    service: path.join(cwd, 'service'),
    controller: controllerPath 
  },
  port: 9898
});
require('./devserver')(opts)(app);
require('./builtin')(app);

app.start();

