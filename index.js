var path = require('path');
var fs   = require('fs');
var argv = require( 'argv' );

var opts = require('./config');
var cwd = process.cwd();

require("babel-register")(require('./babelQuery'));

var args = argv.option([]).run();
var target = args.targets[0];

if (target == 'dev' || target == 'start') {
  var controllerPath = path.join(cwd, 'controller');
  var app = require('rekoa')({
    isDevelopment: true,
    base: cwd,
    path: {
      middleware: path.join(cwd, 'middleware'),
      service: path.join(cwd, 'service'),
      controller: controllerPath 
    },
    port: opts.port
  });
  require('./devserver')(opts)(app);
  require('./builtin')(app);
  app.start();
}

// TODO: FIX
if (target == 'build') {
  opts.babelQuery.plugins = [];
  var webpackConfig = require('./getWebpackConfig')(opts);
  var compiler = require('webpack')(opts);
  compiler.compile(function() {
    console.log(arguments);
  });
}
