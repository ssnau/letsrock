var opts = require('./config');
var co   = require('co');
var safe = require('./util').safe;
var empty_str = require('./util').empty_str;
var fs = require('fs');
var path = require('path');
function setup(app) {
  console.log("please refer to " + __filename + " to see what request & response injection is");
  app.use(function *(next) {
    this.pendingInjections = [
      (injector) => injector.register('request', requestService),
      (injector) => injector.register('response', responseService),
    ];
    yield next;
  });
  // deal with favicon
  var favicon = [
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.ico'))),
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.png'))),
    safe(() => fs.readFileSync(path.join(getCWD(), 'favicon.jpg'))),
    safe(() => fs.readFileSync(path.join(__dirname, 'rocking.jpg'))),
  ].filter(Boolean)[0];
  app.use(function *(next) {
    if (this.path === '/favicon.ico') {
      this.set('Cache-Control', 'public, max-age=' + 10000);
      this.type = 'image/x-icon';
      this.body = favicon;
      return;
    }
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

var meta_cache = {};
function getMetaFromTpl(tpl_path) {
  if (meta_cache[tpl_path] && !global.__IS_DEV__) return meta_cache[tpl_path];
  var meta_js_file_path = path.join(opts.from, tpl_path, 'meta.js');
  var meta_json_file_path = path.join(opts.from, tpl_path, 'meta.json');
  var j1 = {}, j2 = {};
  safe(() => {
    delete require.cache[meta_js_file_path];
    j1 = require(meta_js_file_path) || {};
  });
  safe(() => {
    delete require.cache[meta_json_file_path];
    j2 = require(meta_js_file_path) || {}
  });
  meta_cache[tpl_path] = Object.assign({}, j1, j2);
  return meta_cache[tpl_path]
}
var responseService = function (context) {
  return {
    // data is not used. (not support server side rendering..)
    render: function (data, tpl, _opts) {
      var _path = (context.path === '/') ? 'index' : context.path;
      var tpl_path = tpl || _path;
      var page_meta = getMetaFromTpl(tpl_path) || {};
      _opts = Object.assign({}, page_meta, _opts || {});
      var metas = empty_str(page_meta.merge_global_metas ? opts.metas : '') + empty_str(page_meta.metas);
      var cdnLink = opts.getCDNLink || (() => void 0);
      var hash = global.HASH + ((!__IS_DEV__ && context.query.debug != opts.debug_flag) ? '.min' : '');
      var hashify = str => str.replace(/.js$/, `.${hash}.js`);

      context.type = 'text/html';
      context.body = template({
        src: hashify(cdnLink(tpl_path) || rr(opts.serveFilePath + '/' + (tpl_path) + '/index.js')),
        common:  hashify(cdnLink('_commons.js') || rr(opts.serveFilePath + '/_commons.js')),
        appId: page_meta.appId || 'app',
        metas: metas,
        title: page_meta.title,
        data
      });
    },
    json: function (data) {
      context.body = data;
    },
    ok: function (data) {
      context.body = {
        status: 0,
        data
      }
    },
    fail: function (obj) {
      context.body = Object.assign({
        status: 1,
        msg: 'unknown error'
      }, obj || {});
    }
  };
};

function template(opts) {
  return `<!DOCTYPE html>
<html>
  <head>
  <title>${opts.title || ""}</title>
  <link rel="shortcut icon" href="/favicon.ico" />
  ${opts.metas || ''}
  <script>
  window.$res = function (path) {
    var p =  (path.indexOf('/') == 0) ? path.slice(1) : path;
    return ('PLACEHOLDER', ('/_res/')) + p;
  };
  </script>
  </head>
  <body>
    <div id=${opts.appId}></div>
    <script>
    window._STATE = ${JSON.stringify(opts.data || {})};
    </script>
    <script src="${opts.common}"></script>
    <script src="${opts.src}"></script>
  </body>
</html>
  `
}

function GLOBAL_HASH() {
  return global.HASH || '';
}

function rr(src) {
  return src
    .replace('//', '/')
    .replace('//', '/')
    .replace('//', '/');
}

module.exports = setup;
