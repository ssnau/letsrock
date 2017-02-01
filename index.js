var path = require('path');
var fs   = require('fs');
var argv = require( 'argv' );
var execSync = require('child_process').execSync;

function getCWD() {
  return process.env.ROCK_DIR || process.cwd();
};

global.getCWD = getCWD;

var opts = require('./config');
var cwd = getCWD();

require("babel-register")(require('./babelQuery'));
var kstatic = require('koa-static-namespace');

var args = argv.option([]).run();
var target = args.targets[0];
var target2 = args.targets[1];

var controllerPath = path.join(cwd, 'controller');
var middlewarePath = path.join(cwd, 'middleware');
var servicePath = path.join(cwd, 'service');
var MAX_AGE = 3153600000;

/** setup global variable **/
global.__IS_DEV__ = (target == 'dev');
global.APP_BASE = getCWD();

if (target == 'dev' || target == 'start') {
  console.log('lib path is ' + __dirname);
  var app = require('rekoa')({
    isDevelopment: target == 'dev',
    base: cwd,
    path: {
      middleware: middlewarePath,
      service: servicePath,
      controller: controllerPath 
    },
    port: opts.port
  });
  app.addMiddleware(function *(next) {
    yield next;
    if (!opts.autoMount) return;
    var response = yield this.$injector.get('response');
    response.render();
  });
  require('./builtin')(app);
  app.use(kstatic(path.join(cwd, "_res"), {namespace: "_res", maxage: MAX_AGE}));  // static resource folder
  if (target == 'start' && !opts.getCDNLink) {
    // build file first
    console.info('building static files to ', opts.to);
    opts.babelQuery.plugins = [];
    getCompiler().run(function(err, stats) {
      if (!err) return console.log('success');
      return console.error(err);
    });
    // use koa-static-namespace
    app.use(kstatic(opts.to, {namespace: opts.serveFilePath, maxage: MAX_AGE}));
  }
  if (target == 'dev') require('./devserver')(opts)(app);
  if (fs.existsSync(path.join(cwd, '_startup.js'))) require(path.join(cwd, '_startup.js'));
  app.start();
}

function getCompiler() {
  var webpackConfig = require('./getWebpackConfig')(opts, {isOnline: true});
  var compiler = require('webpack')(webpackConfig)
  return compiler;
}

if (target == 'build' || target == 'watch') {
  compiler.plugin("done", stats => {
    var startTime = stats.startTime;
    var endTime = stats.endTime;
    console.log( (endTime - startTime) + 'ms - build done!')
  });
  if (target == 'build') {
    opts.babelQuery.plugins = [];
    return compiler.run(function(err, stats) {
      if (!err) return console.log('success');
      return console.error(err);
    })
  }
  return compiler.watch({
      aggregateTimeout: 300
    }, function(err, stats) {
    if (err) return console.error(err);
  });
}

if (target == 'init') {
  if (!target2) return console.log('please specify you project name');
  var base = path.join(cwd, target2);
  console.log('create project directory');
  execSync('mkdir -p ' + path.join(base, 'src/index'));
  fs.createReadStream(path.join(__dirname, 'template/src/index/index.jsx')).pipe(fs.createWriteStream(path.join(base, 'src/index/index.jsx')));
  fs.createReadStream(path.join(__dirname, 'template/_d_rcrc')).pipe(fs.createWriteStream(path.join(base, '.rcrc')));
  console.log('setup project');
  controllerPath = path.join(base, 'controller');
  middlewarePath = path.join(base, 'middleware');
  servicePath = path.join(base, 'service');
  execSync(`cd ${base} && npm init -f && npm i react react-dom --save`);
  execSync(`mkdir ${controllerPath} && mkdir ${middlewarePath} && mkdir ${servicePath}`);
  console.log('done. please `cd '+ target2 + '` and run `letsrcok dev`');
}

if (target == 'where') {
  console.log(__dirname);
}

if (!target) {
  console.log('please use at least one of the sub commands');
  console.log('- letsrock init project_name  : create a new project');
  console.log('- letsrock dev                : start a dev server');
  console.log('- letsrock build              : build jsx to dist folder');
  console.log('- letsrock watch              : build jsx to dist folder with watch feature enabled');
}
