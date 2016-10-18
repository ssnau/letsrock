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

if (target == 'dev' || target == 'start') {
  var controllerPath = path.join(cwd, 'controller');
  var app = require('rekoa')({
    isDevelopment: target == 'dev',
    base: cwd,
    path: {
      middleware: path.join(cwd, 'middleware'),
      service: path.join(cwd, 'service'),
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
  app.use(kstatic(opts.to, {namespace: opts.resourcePath}));
  if (target == 'start' && !opts.getCDNLink) {
    // build file first
    console.info('building static files to ', opts.to);
    opts.babelQuery.plugins = [];
    getCompiler().run(function(err, stats) {
      if (!err) return console.log('success');
      return console.error(err);
    });
    // use koa-static-namespace
    app.use(kstatic(opts.to, {namespace: opts.serveFilePath}));
  }
  if (target == 'dev') require('./devserver')(opts)(app);
  if (fs.existsSync(path.join(cwd, '_startup.js'))) require(path.join(cwd, '_startup.js'));
  app.start();
}

function getCompiler() {
  var webpackConfig = require('./getWebpackConfig')(opts);
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
  execSync(`cd ${base} && npm init -f && npm i react react-dom --save`);
  console.log('done. please `cd '+ target2 + '` and run `letsrcok dev`');
}

if (!target) {
  console.log('please use at least one of the sub commands');
  console.log('- letsrock init project_name  : create a new project');
  console.log('- letsrock dev                : start a dev server');
  console.log('- letsrock build              : build jsx to dist folder');
  console.log('- letsrock watch              : build jsx to dist folder with watch feature enabled');
}
