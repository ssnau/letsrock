/* eslint-disable no-console, import/no-dynamic-require, global-require, consistent-return, no-param-reassign */

// require 3rd party libs
const path = require('path');
const fs = require('fs');
const watch = require('xkit/fs/watch');
const spawn = require('xkit/process/spawn');
const { execSync } = require('child_process');
const readdir = require('xkit/fs/readdir');

/** setup global variable * */
/** ***[ setup babel  ]****** */
const r = name => require.resolve(name);
require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [
    r('@babel/preset-flow'),
    r('@babel/preset-react'),
    r('@babel/preset-typescript'),
  ],
  plugins: [
    r('@babel/plugin-transform-modules-commonjs'),
    r('@babel/plugin-proposal-optional-chaining'),
    r('@babel/plugin-proposal-nullish-coalescing-operator'),
    r('./babel-plugin-letsrock-ssr'),
  ],
});
/** ************************* */

// START HERE: it is safe to require app files.


const kstatic = require('./kstatic');

function run(args, options) {
  const [target, target2] = args;
  options = options || {
    appBase: null,
    port: null,
  };

  global.__IS_DEV__ = (target === 'dev');
  global.ROCKUTIL = require('./util');
  global.getCWD = () => (options.appBase || process.env.ROCK_DIR || process.cwd());
  global.APP_BASE = options.appBase || getCWD();
  global.ROCK_CONFIG = require('./config');

  const rockOptions = global.ROCK_CONFIG;
  const cwd = global.getCWD();
  const HASH_PATH = path.join(cwd, 'HASH');
  try {
    global.HASH = fs.readFileSync(HASH_PATH, 'utf8').trim();
  } catch (e) {
    console.log(`${HASH_PATH}: file not exists`);
  }

  const getCompiler = function _getCompiler() {
    const webpackConfig = require('./getWebpackConfig')(rockOptions);
    const compiler = require('webpack')(webpackConfig);
    return compiler;
  };

  let controllerPath = path.join(cwd, 'controller');
  let middlewarePath = path.join(cwd, 'middleware');
  let servicePath = path.join(cwd, 'service');
  const MAX_AGE = 3153600000;

  // OUTPUT VERSION INFO
  const mypkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log(`letsrock@v${mypkg.version}`);

  if (target === 'debug') {
    console.log(`node debug ${__dirname}/bin/letsrock dev`);
    return;
  }

  if (target === 'dev' || target === 'start') {
    let m;
    if (fs.existsSync(path.join(cwd, '_startup.js'))) m = require(path.join(cwd, '_startup.js'));
    const p = (m && m.then) ? m : Promise.resolve();
    return p.then(() => {
      const app = require('rekoa')({
        isDevelopment: target === 'dev',
        base: cwd,
        path: {
          middleware: middlewarePath,
          service: servicePath,
          controller: controllerPath,
        },
        serviceLowerCasify: rockOptions.serviceLowerCasify,
        port: options.port || rockOptions.port,
      });
      require('./builtin')(app);
      app.use(kstatic(path.join(cwd, '_res'), { namespace: '_res', maxage: MAX_AGE })); // static resource folder
      // extra static folder
      // example of static:
      // {
      //   '_extra': 'extra',  // relative path
      //   '/some/where/tmp': 'tmp',  // absolute path
      // }
      Object.keys(rockOptions.static || {}).forEach((key) => {
        const mounted = key.indexOf('/') === 0 ? key : path.join(cwd, key);
        app.use(kstatic(
          mounted,
          { namespace: rockOptions.static[key], maxage: MAX_AGE },
        )); // static resource folder
      });
      if (target === 'start' && !rockOptions.skipBuildOnProduction) {
        // build file first
        console.info('building static files to ', rockOptions.to);
        getCompiler().run((err) => {
          if (!err) return console.log('success');
          return console.error(err);
        });
      }
      // use koa-static-namespace
      app.use(kstatic(rockOptions.to, { namespace: rockOptions.serveFilePath, maxage: MAX_AGE }));
      if (target === 'dev') require('./devserver')(rockOptions)(app);
      app.koa.keys = rockOptions.keys || ['default key'];
      app.start();
      return app;
    });
  }


  if (target === 'build' || target === 'watch') {
    const compiler = getCompiler();
    if (target === 'build') {
      require('./buildinline')(rockOptions.from || rockOptions.dir || rockOptions.directory || rockOptions.templatePath);
      return compiler.run((err, stats) => {
        if (!err) {
          fs.writeFileSync(path.join(cwd, 'HASH'), stats.hash, 'utf8');
          return console.log('success');
        }
        return console.error(err);
      });
    }
    return compiler.watch({
      aggregateTimeout: 300,
    }, (err) => {
      if (err) return console.error(err);
    });
  }

  if (target === 'init') {
    if (!target2) return console.log('please specify you project name');
    const base = path.join(cwd, target2);
    console.log('create project directory');
    execSync(`mkdir -p ${path.join(base, 'src/index')}`);
    execSync(`mkdir -p ${path.join(base, 'types')}`);
    fs.createReadStream(path.join(__dirname, 'template/src/index/index.jsx')).pipe(fs.createWriteStream(path.join(base, 'src/index/index.jsx')));
    fs.createReadStream(path.join(__dirname, 'template/types/builtin.js')).pipe(fs.createWriteStream(path.join(base, 'types/builtin.js')));
    fs.createReadStream(path.join(__dirname, 'template/_d_rcrc')).pipe(fs.createWriteStream(path.join(base, '.rcrc')));
    fs.createReadStream(path.join(__dirname, 'template/_d_flowconfig')).pipe(fs.createWriteStream(path.join(base, '.flowconfig')));
    fs.createReadStream(path.join(__dirname, 'template/_d_gitignore')).pipe(fs.createWriteStream(path.join(base, '.gitignore')));
    console.log('setup project');
    controllerPath = path.join(base, 'controller');
    middlewarePath = path.join(base, 'middleware');
    servicePath = path.join(base, 'service');
    execSync(`cd ${base} && npm init -f && npm i react react-dom co handlebars co-body --save && npm i --dev flow-bin`);
    execSync(`mkdir ${controllerPath} && mkdir ${middlewarePath} && mkdir ${servicePath}`);
    execSync(`cp ${`${path.join(__dirname, 'template/controller')}/* ${controllerPath}`}`);
    execSync(`cp ${`${path.join(__dirname, 'template/middleware')}/* ${middlewarePath}`}`);
    execSync(`cp ${`${path.join(__dirname, 'template/service')}/* ${servicePath}`}`);
    console.log(`done. please \`cd ${target2}\` and run \`letsrcok dev\``);
  }

  if (target === 'where') {
    console.log(__dirname);
  }

  if (target === 'test') {
    // const mochaBin = path.join(__dirname, 'node_modules/.bin/mocha');
    const appDir = global.APP_BASE;
    const files = readdir(appDir, {
      pattern: (absfile) => {
        // filter folders
        if (absfile.indexOf('node_modules') > -1) return false;
        if (absfile.indexOf('/.git/') > -1) return false;
        return true;
      },
    }).filter(s => s.indexOf('spec.js') > 0);
    const Mocha = require('mocha');
    const mocha = new Mocha();
    console.log(`files${files}`);
    files.forEach((f) => {
      console.log(`add file${f}`);
      mocha.addFile(f);
    });
    console.log('run mocha');
    mocha.run((failures) => {
      console.log('did run');
      process.on('exit', () => {
        process.exit(failures); // exit with non-zero status if there were failures
      });
    });
  }


  const cpjs = () => execSync(`cp ${path.join(cwd, '*.js')} ${__dirname}`).toString();
  const cpjson = () => execSync(`cp ${path.join(cwd, '*.json')} ${__dirname}`).toString();
  const install = () => execSync(`cd ${__dirname} && npm i`);
  const batch = () => {
    spawn('git diff --name-only HEAD')
      .then((res) => {
        const { out } = res;
        const files = out.split('\n').map(x => x.trim()).filter(Boolean);
        console.log('\n******\nfiles are \n-----\n', files.join('\n'));
        cpjs(); cpjson();
        if (files.some(f => /package.json/.test(f))) install();
      });
  };
  if (target === 'sync') {
    const pkgjson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    if (pkgjson.name !== 'letsrock') return console.log('current folder not letsrock. stopped.');
    batch();
    watch({
      path: cwd,
      pattern: [/jsx$/, /js$/, /json$/],
      name: 'sync-watcher',
      callback() {
        batch();
      },
    });
  }

  if (!target) {
    console.log('please use at least one of the sub commands');
    console.log('- letsrock init project_name  : create a new project');
    console.log('- letsrock start                : start a production server');
    console.log('- letsrock dev                : start a dev server');
    console.log('- letsrock build              : build jsx to dist folder');
    console.log('- letsrock watch              : build jsx to dist folder with watch feature enabled');
  }
}

module.exports = {
  run,
};
