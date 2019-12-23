/* eslint-disable no-param-reassign, func-names, no-console, consistent-return, require-yield */

const webpack = require('webpack');
const getWebpackConfig = require('./getWebpackConfig');
const createEventStream = require('./createEventStream');
const MemoryFileSystem = require('memory-fs');
const path = require('path');

const FILE_PATH = '/__hmr_file';
const EVENT_PATH = '/__hmr_event';
let __id = 0;
const noop = function () { };
function watch() { console.log('watch is not avaible'); }
// NOTICE: hmr / hot-reload doesn't work quite well on webpack4
module.exports = function runDevServer(opts) {
  const templatePath = opts.from;
  const postProcessConfig = opts.postProcessConfig || noop;

  const serveFilePath = opts.serveFilePath || FILE_PATH;
  function buildModuleMap(modules) {
    const map = {};
    modules.forEach((module) => {
      map[module.id] = module.name;
    });
    return map;
  }

  return function (app) {
    function getCompiler() {
      if (app._compiler) return app._compiler;
      const id = ++__id;
      const hotPrefix = [
        `${require.resolve('webpack-hot-middleware/client')}?path=${EVENT_PATH}`,
      ];

      const webpackConfig = getWebpackConfig(opts);
      Object.keys(webpackConfig.entry).forEach((key) => {
        webpackConfig.entry[key] = hotPrefix.concat(webpackConfig.entry[key]);
      });
      webpackConfig.devtool = 'cheap-module-source-map';
      // prefix with "/" to make it as absolute path for memfs
      webpackConfig.output.path = '/';
      webpackConfig.output.publicPath = `${serveFilePath}/`; // webpackConfig.output.path;
      webpackConfig.plugins = [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"development"',
            IS_BROWSER: true,
          },
        }),
        new webpack.HotModuleReplacementPlugin(),
      ].concat(webpackConfig.plugins).filter(Boolean);

      postProcessConfig(webpackConfig);
      const compiler = webpack(webpackConfig);
      app._compiler = compiler;

      compiler.outputFileSystem = new MemoryFileSystem();

      compiler.__doneCallbacks = [];
      compiler.__compileCallbacks = [];

      compiler.plugin('compile', x => compiler.__compileCallbacks.forEach(cb => cb(x)));
      compiler.plugin('done', x => compiler.__doneCallbacks.forEach(cb => cb(x)));

      const watching = compiler.watch({ aggregateTimeout: 200 }, (err) => {
        if (err) throw err;
      });
      compiler.__watching = watching;

      compiler.__doneCallbacks.push((stats) => {
        if (stats.compilation.errors && stats.compilation.errors.length) {
          console.log(stats.compilation.errors);
        }
        console.info(`webpack${id}: bundle is now VALID.`);

        // output for debug only
        // compiler.outputFileSystem.writeFileSync('/_stats.json', JSON.stringify(stats.toJson()));
        global.HASH = stats.hash;
      });

      // event stream for hmr
      const eventStream = createEventStream(10 * 1000);
      compiler.__compileCallbacks.push(() => {
        console.log(`webpack${id} building...`);
        eventStream.publish({ action: 'building' });
      });

      compiler.__doneCallbacks.push((stats) => {
        stats = stats.toJson();
        console.log(`webpack${id} built ${stats.hash} in ${stats.time}ms`);
        eventStream.publish({
          action: 'built',
          time: stats.time,
          hash: stats.hash,
          warnings: stats.warnings || [],
          errors: stats.errors || [],
          modules: buildModuleMap(stats.modules),
        });
      });
      compiler.__eventStream = eventStream;

      return compiler;
    }

    // dumb init compiler first
    getCompiler();

    function tree(data) {
      function isDir(item) {
        if (typeof item !== 'object') return false;
        return item[''] === true;
      }

      function isFile(item) {
        if (typeof item !== 'object') return false;
        return !item[''];
      }

      const paths = [];

      function traverse(item, mpath) {
        mpath = mpath || [];
        if (isDir(item)) return Object.keys(item).forEach(k => traverse(item[k], mpath.concat(k)));
        if (isFile(item)) return paths.push(mpath);
      }

      Object.keys(data).forEach(k => traverse(data[k], ['', k]));
      return paths.map(p => p.join('/'));
    }

    function serveFile(context) {
      let p = context.path.replace(serveFilePath, '');
      p = p.replace('//', '/').replace('//', '/'); // remove accidental '//'

      try {
        const compiler = getCompiler();
        const mfs = compiler.outputFileSystem;
        const treeData = tree(mfs.data);

        if (p === '/' || p === '') {
          context.body = `<h1>File List:</h1>${treeData.map(x => `<a href="${serveFilePath + x}">${x}<a/>`).join('<br />')}`;
          return;
        }

        const content = mfs.readFileSync(p, 'utf8');
        context.set('Access-Control-Allow-Origin', '*'); // To support XHR, etc.
        context.set('Content-Type', 'application/x-javascript; char-set=utf-8');
        context.set('Content-Length', content.length);
        context.body = content;
      } catch (e) {
        if (p.indexOf('.json') > -1) return; // do not log for the json corner case
        console.log(`[devserver] request file ${p} meet error`, e.stack);
      }
    }

    async function serveHot(context) {
      context.respond = true; // bypass koa
      getCompiler().__eventStream.handler(context.req, context.res);
    }

    app.use(async (ctx, next) => {
      if (ctx.path.indexOf(serveFilePath) > -1) return serveFile(ctx, next);
      if (ctx.path.indexOf(EVENT_PATH) > -1) return serveHot(ctx, next);
      await next();
    });
    app.devserver = {
      getURL(tplPath) {
        return tplPath
          .replace(templatePath, serveFilePath)
          .replace(/(^\/^\/)/, '/')
          .replace(/(js|jsx)$/, 'js');
      },
    };

    console.log(`dev server is running. visit ${serveFilePath} to see file compiled`);

    watch({
      path: templatePath,
      name: 'devserver',
      pattern: /index\.jsx?$/,
      callback(file/* , info */) {
        const rp = path.relative(templatePath, file).replace(/index\.jsx?$/, 'index.js');
        const compiler = getCompiler();
        if (!compiler.outputFileSystem.existsSync(`/${rp}`)) {
          compiler.__watching.close(noop); // stop watching
          compiler.__doneCallbacks = [];
          compiler.__compileCallbacks = [];
          compiler.__eventStream.close(); // close socket
          app._compiler = null;
          getCompiler();
        }
      },
    });
  };
};

