/** setup global variable **/
global.__IS_DEV__ = (target == 'dev');
global.APP_BASE = getCWD();
global.ROCK_CONFIG = opts;

var path = require('path');
var fs   = require('fs');
var argv = require( 'argv' );
var watch = require('xkit/fs/watch');
var spawn = require('xkit/process/spawn');
var execSync = require('child_process').execSync;
var readdir = require('xkit/fs/readdir');

function getCWD() {
  return process.env.ROCK_DIR || process.cwd();
};

global.getCWD = getCWD;

var opts = require('./config');
var cwd = getCWD();
var HASH_PATH = path.join(cwd, 'HASH');
try {
  global.HASH = fs.readFileSync(HASH_PATH, 'utf8').trim();
} catch (e) {
}

const r = name => require.resolve(name);
require("babel-register")({
  "presets": [ r("babel-preset-react") ],
  "plugins": [ r('babel-plugin-transform-es2015-modules-commonjs')],
});
var kstatic = require('koa-static-namespace');

var args = argv.option([]).run();
var target = args.targets[0];
var target2 = args.targets[1];

var controllerPath = path.join(cwd, 'controller');
var middlewarePath = path.join(cwd, 'middleware');
var servicePath = path.join(cwd, 'service');
var MAX_AGE = 3153600000;


if (target == 'debug') {
  console.log('node debug ' + __dirname + ' dev');
  return;
}

if (target == 'dev' || target == 'start') {
  let m;
  if (fs.existsSync(path.join(cwd, '_startup.js'))) m = require(path.join(cwd, '_startup.js'));
  let p = (m && m.then) ? m : Promise.resolve();
  p.then(function() {
    console.log('lib path is ' + __dirname);
    const app = require('rekoa')({
      isDevelopment: target == 'dev',
      base: cwd,
      path: {
        middleware: middlewarePath,
        service: servicePath,
        controller: controllerPath 
      },
      serviceLowerCasify: opts.serviceLowerCasify,
      port: opts.port
    });
    require('./builtin')(app);
    app.use(kstatic(path.join(cwd, "_res"), {namespace: "_res", maxage: MAX_AGE}));  // static resource folder
    // extra static folder
    Object.keys(opts.static || {}).forEach(key => {
      app.use(kstatic(path.join(cwd, key), {namespace: opts.static[key], maxage: MAX_AGE}));  // static resource folder
    });
    if (target == 'start' && !opts.cdnPrefix) {
      // build file first
      console.info('building static files to ', opts.to);
      opts.babelQuery.plugins = [];
      getCompiler().run(function(err, stats) {
        if (!err) return console.log('success');
        return console.error(err);
      });
    }
    // use koa-static-namespace
    app.use(kstatic(opts.to, {namespace: opts.serveFilePath, maxage: MAX_AGE}));
    if (target == 'dev') require('./devserver')(opts)(app);
    app.koa.keys = opts.keys || ['default key'];
    app.start();
  });
}

function getCompiler() {
  var webpackConfig = require('./getWebpackConfig')(opts, { isOnline: true });
  var compiler = require('webpack')(webpackConfig)
  return compiler;
}

if (target == 'build' || target == 'watch') {
  const compiler = getCompiler();
  compiler.plugin("done", stats => {
    var startTime = stats.startTime;
    var endTime = stats.endTime;
    console.log( (endTime - startTime) + 'ms - build done!')
  });
  if (target == 'build') {
    opts.babelQuery.plugins = [];
    return compiler.run(function(err, stats) {
      if (!err) {
        fs.writeFileSync(path.join(cwd, 'HASH'), stats.hash, 'utf8');
        return console.log('success');
      }
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
  execSync(`cd ${base} && npm init -f && npm i react react-dom co handlebars co-body --save`);
  execSync(`mkdir ${controllerPath} && mkdir ${middlewarePath} && mkdir ${servicePath}`);
  execSync(`cp ${path.join(__dirname, 'builtin-services') + '/* ' + servicePath }`);
  console.log('done. please `cd '+ target2 + '` and run `letsrcok dev`');
}

if (target == 'where') {
  console.log(__dirname);
}

if (target == 'test') {
  //const mochaBin = path.join(__dirname, 'node_modules/.bin/mocha');
  const appDir = global.APP_BASE;
  const files = readdir(appDir, {
    pattern: (absfile) => {
      // filter folders
      if (absfile.indexOf('node_modules') > -1) return false;
      if (absfile.indexOf('/.git/') > -1) return false;
      return true;
    }
  }).filter(s => s.indexOf('spec.js') > 0);
  const Mocha = require('mocha');
  var mocha = new Mocha();
	console.log('files' + files);
  files.forEach(f => {
console.log('add file' + f);
mocha.addFile(f)
});
console.log('run mocha');
	mocha.run(function(failures){
console.log('did run');
		process.on('exit', function () {
			process.exit(failures);  // exit with non-zero status if there were failures
		});
	});

}

var cpjs = () => execSync(`cp ${path.join(cwd, '*.js')} ${__dirname}`).toString();
var cpjson = () => execSync(`cp ${path.join(cwd, '*.json')} ${__dirname}`).toString();
var install = () => execSync(`cd ${__dirname} && npm i`);
var batch = () => {
  spawn('git diff --name-only HEAD')
    .then(res => {
      var out = res.out;
      var files = out.split('\n').map(x => x.trim()).filter(Boolean);
      console.log('\n******\nfiles are \n-----\n', files.join('\n'));
      cpjs();cpjson();
      if (files.some(f => /package.json/.test(f))) install();
    });
}
if (target == 'sync') {
  var pkgjson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  if (pkgjson.name != 'letsrock') return console.log('current folder not letsrock. stopped.');
  batch();
  watch({
    path: cwd,
    pattern: [/jsx$/, /js$/, /json$/],
    name: 'sync-watcher',
    callback: function (files) {
      batch();
    }
  });
}

if (!target) {
  console.log('please use at least one of the sub commands');
  console.log('- letsrock init project_name  : create a new project');
  console.log('- letsrock dev                : start a dev server');
  console.log('- letsrock build              : build jsx to dist folder');
  console.log('- letsrock watch              : build jsx to dist folder with watch feature enabled');
}
