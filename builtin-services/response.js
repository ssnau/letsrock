const co = require('co');
const safe = require('./_util').safe;
const empty_str = require('./_util').empty_str;
const fs = require('fs');
const path = require('path');
const opts = global.ROCK_CONFIG;
const hbs = require('handlebars');
const uglify = require('uglify-js');

require('./_hbs_helpers')(hbs, {
  js: function (p) {
    var serveFilePath = (!__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;
    return hashify(rr(serveFilePath + '/' + p));
  },
}, opts);

const hashify = str => {
  const hash = GLOBAL_HASH() + (__IS_DEV__ ? '' : '.min');
  return str.replace(/.js$/, `.${hash}.js`);
}

// stupid, but works.
function rr(src) {
  var R = "U^&*)%%VNMCL:$__YYY";
  var RS = "NHGI%#$%^&*(@____(BGW";
  return src
    .replace('http://',R)
    .replace('https://',RS)
    .replace('//', '/')
    .replace('//', '/')
    .replace('//', '/')
    .replace(R, '//')
    .replace(RS, '//')
}

const hbscache = {};
module.exports = function (context) {
  return {
    render: function (data, tpl) {
      const _path = (context.path === '/') ? 'index' : context.path;
      const tpl_path = tpl || _path;
      const page_meta = getMetaFromTpl(tpl_path) || {};
      const metas = empty_str(page_meta.merge_global_metas ? opts.metas : '') + empty_str(page_meta.metas);
      const serveFilePath = (!__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;

      context.type = 'text/html';
      context.body = template({
        src: hashify(rr(serveFilePath + '/' + (tpl_path) + '/index.js')),
        common: hashify(rr(serveFilePath + '/_commons.js')),
        appId: page_meta.appId || 'app',
        metas: metas,
        title: page_meta.title,
        data
      });
    },
    hbs: function (data, tpl) {
      var _path = (context.path === '/') ? 'index' : context.path;
      var tpl_path = path.join(opts.from, tpl || _path, 'index.hbs');
      var page_meta = getMetaFromTpl(path.join(tpl || _path)) || {};
      var metas = empty_str(page_meta.merge_global_metas ? opts.metas : '') + empty_str(page_meta.metas);
      var tplfn = hbscache[tpl_path];
      if (__IS_DEV__ || !tplfn) {
        var content = fs.readFileSync(tpl_path, 'utf8');
        tplfn = hbs.compile(content);
        hbscache[tpl_path] = tplfn;
      }
      // deal with inline resource (inline.js / inline.css)
      var inlineJS = getInlineJS(path.join(opts.from, tpl || _path, 'inline.js'));
      var inlineCSS = getInlineCss(path.join(opts.from, tpl || _path, 'inline.css'));
      context.type = 'text/html';
      context.body = template({
        title: page_meta.title,
        metas: metas,
        body: `<style>${inlineCSS}</style>` + tplfn(Object.assign({$context: context}, data)) + `<script>${inlineJS}</script>`
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

const meta_cache = {};
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

const js_cache = {};

function getMinifyJSfromPath(p) {
  let content = safe(() => fs.readFileSync(p, 'utf8'));
  if (!content) return '';
  try {
    return uglify.minify(content).code;
  } catch (e) {
    console.log('minify error on file: ' + p, e);
    return '';
  }
}
function getInlineJS(js_path) {
  if (js_cache[js_path] && !global.__IS_DEV__) return js_cache[js_path];
  js_cache[js_path] = getMinifyJSfromPath(js_path) || ' '; // make sure not empty
  return js_cache[js_path];
}

const css_cache = {};
function getInlineCss(css_path) {
  if (css_cache[css_path] && !global.__IS_DEV__) return css_cache[css_path];
  safe(() => css_cache[css_path] = fs.readFileSync(css_path, 'utf-8'));
  css_cache[css_path] = (css_cache[css_path] || ' ').replace(/\n/g, '');
  return css_cache[css_path];
}

function template(opts) {
  var body = opts.body || `
  <body>
    <div id=${opts.appId}></div>
    <script> window._STATE = ${JSON.stringify(opts.data || {})}; </script>
    <script src="${opts.common}"></script>
    <script src="${opts.src}"></script>
  </body>
  `;
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
  ${body}
</html>`
}

function GLOBAL_HASH() {
  return global.HASH || '';
}
