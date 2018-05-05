/* eslint-disable global-require, import/no-dynamic-require */
const { safe } = require('./_util');
const { emptyStr } = require('./_util');
const fs = require('fs');
const path = require('path');

const opts = global.ROCK_CONFIG;
const hbs = require('handlebars');
const uglify = require('uglify-js');
const { renderToString } = require('react-dom/server');
const React = require('react');

function GLOBAL_HASH() {
  return global.HASH || '';
}

const hashify = (str) => {
  const hash = GLOBAL_HASH() + (global.__IS_DEV__ ? '' : '.min');
  return str.replace(/.js$/, `.${hash}.js`);
};

// stupid, but works.
function rr(src) {
  const R = 'U^&*)%%VNMCL:$__YYY';
  const RS = 'NHGI%#$%^&*(@____(BGW';
  return src
    .replace('http://', R)
    .replace('https://', RS)
    .replace('//', '/')
    .replace('//', '/')
    .replace('//', '/')
    .replace(R, '//')
    .replace(RS, '//');
}

require('./_hbs_helpers')(hbs, {
  js(p) {
    const serveFilePath = (!global.__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;
    return hashify(rr(`${serveFilePath}/${p}`));
  },
}, opts);


const hbscache = {};

const metaCache = {};
function getMetaFromTpl(tplPath) {
  /* eslint-disable camelcase, global-require */
  if (metaCache[tplPath] && !global.__IS_DEV__) return metaCache[tplPath];
  const meta_js_file_path = path.join(opts.from, tplPath, 'meta.js');
  const meta_json_file_path = path.join(opts.from, tplPath, 'meta.json');
  let j1 = {};
  let j2 = {};
  safe(() => {
    delete require.cache[meta_js_file_path];
    j1 = require(meta_js_file_path) || {};
  });
  safe(() => {
    delete require.cache[meta_json_file_path];
    j2 = require(meta_js_file_path) || {};
  });
  metaCache[tplPath] = Object.assign({}, j1, j2);
  return metaCache[tplPath];
}

const js_cache = {};

function getMinifyJSfromPath(p) {
  /* eslint-disable no-console */
  const content = safe(() => fs.readFileSync(p, 'utf8'));
  if (!content) return '';
  try {
    return uglify.minify(content).code;
  } catch (e) {
    console.log(`minify error on file: ${p}`, e);
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

function template({
  reactClass,
  ssr,
  hydrate,
  src,
  common,
  appId,
  metas,
  title,
  data,
  body,
}) {
  const ssrString = (reactClass && ssr) ? renderToString(React.createElement(reactClass, data)) : '';

  const finalBody = body || `
  <body>
    <div id="${appId}">${ssrString}</div>
    <script> window._STATE = ${JSON.stringify(data || {})}; </script>
        ${common ? `<script src="${common}"></script>` : ''}
    ${src ? `<script src="${src}"></script>` : ''}
      ${reactClass && hydrate ? `<script>
          var clazz = window._rockClasses['${reactClass.rockName}'];
          window.ReactDOM.hydrate(React.createElement(clazz, window._STATE), document.getElementById('${appId}'));
          </script>` : ''}
  </body>
  `;
  return `<!DOCTYPE html>
<html>
  <head>
  <title>${title || ''}</title>
  <link rel="shortcut icon" href="/favicon.ico" />
  ${metas || ''}
  <script>
  window.$res = function (path) {
    var p =  (path.indexOf('/') == 0) ? path.slice(1) : path;
    return ('PLACEHOLDER', ('/_res/')) + p;
  };
  </script>
  </head>
  ${finalBody}
  </script>
</html>`;
}


const jsxCache = {};
function requireJSX(tpl_path) {
  const jsFile = path.join(opts.from, tpl_path, 'index.js');
  const jsxFile = path.join(opts.from, tpl_path, 'index.jsx');
  if (global.__IS_DEV__) {
    safe(() => delete require.cache[require.resolve(jsFile)]);
    safe(() => delete require.cache[require.resolve(jsxFile)]);
  }
  const clazz = safe(() => require(jsxFile)) || safe(() => require(jsFile));
  jsxCache[tpl_path] = (typeof clazz === 'function') ? clazz : clazz.default;
  return jsxCache[tpl_path];
}
class Response {
  constructor(context) {
    this.context = context;
  }

  render(data, tpl) {
    const { context } = this;
    const _path = (context.path === '/') ? 'index' : context.path;
    const tpl_path = tpl || _path;
    const page_meta = getMetaFromTpl(tpl_path) || {};
    const ssr = page_meta.ssr || false;
    const hydrate = !page_meta.skipHydrate;
    const metas = emptyStr(page_meta.merge_global_metas ? opts.metas : '') + emptyStr(page_meta.metas);
    const serveFilePath = (!__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;
    const reactClass = requireJSX(tpl_path);

    context.type = 'text/html';
    context.body = template({
      reactClass,
      ssr,
      hydrate,
      src: hashify(rr(`${serveFilePath}/${tpl_path}/index.js`)),
      common: hashify(rr(`${serveFilePath}/_commons.js`)),
      appId: page_meta.appId || 'app',
      metas,
      title: page_meta.title,
      data: data || {},
    });
  }

  hbs(data, tpl) {
    const { context } = this;
    const _path = (context.path === '/') ? 'index' : context.path;
    const tpl_path = path.join(opts.from, tpl || _path, 'index.hbs');
    const page_meta = getMetaFromTpl(path.join(tpl || _path)) || {};
    const metas = emptyStr(page_meta.merge_global_metas ? opts.metas : '') + emptyStr(page_meta.metas);
    let tplfn = hbscache[tpl_path];
    if (__IS_DEV__ || !tplfn) {
      const content = fs.readFileSync(tpl_path, 'utf8');
      tplfn = hbs.compile(content);
      hbscache[tpl_path] = tplfn;
    }
    // deal with inline resource (inline.js / inline.css)
    const inlineJS = getInlineJS(path.join(opts.from, tpl || _path, 'inline.js'));
    const inlineCSS = getInlineCss(path.join(opts.from, tpl || _path, 'inline.css'));
    context.type = 'text/html';
    context.body = template({
      title: page_meta.title,
      metas,
      body: `<style>${inlineCSS}</style>${tplfn(Object.assign({ $context: context }, data))}<script>${inlineJS}</script>`,
    });
  }

  json(data) {
    this.context.body = data;
  }

  ok(data) {
    this.context.body = {
      status: 0,
      data,
    };
  }

  fail(obj) {
    this.context.body = Object.assign({
      status: 1,
      msg: 'unknown error',
    }, obj || {});
  }
}

export default Response;
