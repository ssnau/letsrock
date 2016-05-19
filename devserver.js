"use strict";

var getWebpackConfig = require('./getWebpackConfig');
var createEventStream = require('./createEventStream');
var MemoryFileSystem = require("memory-fs");
var path = require('path');
var co = require('co');

const FILE_PATH = '/__hmr_file';
const EVENT_PATH = '/__hmr_event';
var __id = 0;
var noop = function () {};
module.exports =  function (opts) {
  var templatePath = opts.from;
  var alias = opts.alias;
  var cssPath = opts.cssPath;
  var postProcessConfig = opts.postProcessConfig || noop;
  var keepAlive = !!opts.keepAlive;

  var serveFilePath = opts.serveFilePath || FILE_PATH;

  return function (app) {
    function getCompiler() {
      if (app._compiler) return app._compiler;
      var id = ++__id;
      var path = require('path');
      var webpack = require('webpack');
      var hotPrefix = [
        require.resolve('webpack-hot-middleware/client') + `?path=${EVENT_PATH}`,
      ];

      var webpackConfig = getWebpackConfig(opts);
      Object.keys(webpackConfig.entry).forEach(function (key) {
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
            IS_BROWSER: true
          }
        }),
        new webpack.HotModuleReplacementPlugin()
      ];

      postProcessConfig(webpackConfig);
      var compiler = webpack(webpackConfig);
      app._compiler = compiler;

      compiler.outputFileSystem = new MemoryFileSystem();

      compiler.__doneCallbacks = [];
      compiler.__compileCallbacks = [];
      compiler.plugin("done", stats => compiler.__doneCallbacks.forEach(cb => cb(stats)));
      compiler.plugin("compile", __ => compiler.__compileCallbacks.forEach(cb => cb()));

      var watching = compiler.watch({aggregateTimeout: 200}, function (err) {
        if (err) throw err;
      });
      compiler.__watching = watching;

      compiler.__doneCallbacks.push(_ => console.info(`webpack${id}: bundle is now VALID.`));
      compiler.__compileCallbacks.push(_ => {
        console.log(`webpack${id} building...`);
        eventStream.publish({action: "building"});
      });

      // event stream for hmr
      var eventStream = createEventStream(10 * 1000);
      compiler.__doneCallbacks.push(function (stats) {
        stats = stats.toJson();
        console.log(`webpack${id} built ${stats.hash} in ${stats.time}ms`);
        eventStream.publish({
          action: "built",
          time: stats.time,
          hash: stats.hash,
          warnings: stats.warnings || [],
          errors: stats.errors || [],
          modules: buildModuleMap(stats.modules)
        });
      });
      compiler.__eventStream = eventStream;

      return compiler;
    }

    // dumb init compiler first
    getCompiler();

    function tree(data) {
      function isDir(item) {
        if (typeof item !== "object") return false;
        return item[""] === true;
      }

      function isFile(item) {
        if (typeof item !== "object") return false;
        return !item[""];
      }

      var paths = [];

      function traverse(item, path) {
        path = path || [];
        if (isDir(item)) return Object.keys(item).forEach(k => traverse(item[k], path.concat(k)));
        if (isFile(item)) return paths.push(path);
      }

      Object.keys(data).forEach(k => traverse(data[k], ['', k]));
      return paths.map(p => p.join('/'));
    }

    function* serveFile(context, next) {
      var p = context.path.replace(serveFilePath, '');
      p = p.replace('//', '/').replace('//', '/'); // remove accidental '//'

      try {
        var compiler = getCompiler();
        var mfs = compiler.outputFileSystem;
        var tree_data = tree(mfs.data);

        if (p === '/' || p === '') {
          context.body = "<h1>File List:</h1>" + tree_data.map(x => `<a href="${serveFilePath + x}">${x}<a/>`).join('<br />');
          return;
        }

        var compiler = getCompiler();
        var content = mfs.readFileSync(p, 'utf8');
        context.set("Access-Control-Allow-Origin", "*"); // To support XHR, etc.
        context.set("Content-Type", 'application/x-javascript; char-set=utf-8');
        context.set("Content-Length", content.length);
        context.body = content;
      } catch (e) {
        if (p.indexOf('.json') > -1) return; // do not log for the json corner case
        console.log('[devserver] request file ' + p + ' meet error', e.stack);
      }
    }

    function* serveHot(context, next) {
      context.respond = true; // bypass koa
      getCompiler().__eventStream.handler(context.req, context.res);
    }

    function buildModuleMap(modules) {
      var map = {};
      modules.forEach(function (module) {
        map[module.id] = module.name;
      });
      return map;
    }
    app.use(function* (next) {
      if (this.path.indexOf(serveFilePath) > -1) return yield serveFile(this, next);
      if (this.path.indexOf(EVENT_PATH) > -1) return yield serveHot(this, next);
      yield next;
    });
    app.devserver = {
      getURL: function (tplPath) {
        return tplPath
          .replace(templatePath, serveFilePath)
          .replace(/(^\/^\/)/, '/')
          .replace(/(js|jsx)$/, 'js')
      }
    };

    watch({
      path: templatePath,
      name: 'devserver',
      pattern: /index\.jsx?$/,
      callback: function (file/*, info*/) {
        var rp = path.relative(templatePath, file).replace(/index\.jsx?$/, 'index.js');
        var compiler = getCompiler();
        if (!compiler.outputFileSystem.existsSync('/' + rp)) {
          compiler.__watching.close(noop); // stop watching
          compiler.__doneCallbacks = [];
          compiler.__compileCallbacks = [];
          compiler.__eventStream.close();  // close socket
          app._compiler = null;
          getCompiler();
        }
      }
    });
  }
}


function watch (opts) {
  console.log('watch is not avaible');
}
