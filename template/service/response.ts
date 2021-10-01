import { Context, S2S, RockGlobal, Meta } from "../types/base";
const fs = require("fs");
const path = require("path");

const g: RockGlobal = global as any;
function emptyStr(v): string {
  return v || "";
}
function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return undefined;
  }
}
const opts = g.ROCK_CONFIG;
const hbs = require("handlebars");
const { renderToString } = require("react-dom/server");
const React = require("react");

function GLOBAL_HASH(): string {
  return g.HASH || "";
}

function hashify(str: string): string {
  const hash = GLOBAL_HASH() + (g.__IS_DEV__ ? "" : ".min");
  return str.replace(/.js$/, `.${hash}.js`);
}

// stupid, but works.
function rr(src: string): string {
  const R = "U^&*)%%VNMCL:$__YYY";
  const RS = "NHGI%#$%^&*(@____(BGW";
  return src
    .replace("http://", R)
    .replace("https://", RS)
    .replace("//", "/")
    .replace("//", "/")
    .replace("//", "/")
    .replace(R, "//")
    .replace(RS, "//");
}
function hbsjs(p: string) {
  const serveFilePath = (!g.__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;
  return hashify(rr(`${serveFilePath}/${p}`));
}

hbs.registerHelper("js", function(text, data) {
  const context = this.$context;
  // 判断query.debug是否等于debug_flag所指的字符
  const hash =
    global.HASH +
    (!g.__IS_DEV__ && String(context.query.debug) !== String(opts.debug_flag)
      ? ".min"
      : "");
  let url = hbsjs(text).replace(/.js$/, `.${hash}.js`);
  // 如果是第三方的url，不要替换
  if (text.indexOf("//") === 0 || /^http/.test(text)) {
    url = text;
  }
  const attrKeys = Object.keys(data.hash);
  const attrs = attrKeys.map(x => `${x}="${data.hash[x]}"`).join(" ");
  return new hbs.SafeString(`<script src="${url}" ${attrs}></script>`);
});

const hbscache: { [name: string]: Function } = {};

const metaCache: { [name: string]: any } = {};
function getMetaFromTpl(tplPath: string): Meta {
  /* eslint-disable camelcase, global-require */
  if (metaCache[tplPath] && !g.__IS_DEV__) return metaCache[tplPath];
  const meta_js_file_path = path.join(opts.from, tplPath, "meta.js");
  const meta_ts_file_path = path.join(opts.from, tplPath, "meta.ts");
  const meta_json_file_path = path.join(opts.from, tplPath, "meta.json");
  let j1 = {};
  let j2 = {};
  let j3 = {};
  safe(() => {
    delete require.cache[meta_js_file_path];
    j1 = require(meta_js_file_path) || {};
  });
  safe(() => {
    delete require.cache[meta_json_file_path];
    j2 = require(meta_js_file_path) || {};
  });
  safe(() => {
    delete require.cache[meta_ts_file_path];
    j3 = require(meta_ts_file_path) || {};
  });
  metaCache[tplPath] = Object.assign({}, j1, j2, j3);
  return metaCache[tplPath];
}

const js_cache: S2S = {};

function getMinifyJSfromPath(p: string): string {
  /* eslint-disable no-console */
  if (g.__IS_DEV__) {
    return safe(() => fs.readFileSync(p, "utf8"));
  }
  const minifiedPath = p.replace(/.js$/, ".min.js");
  return safe(() => fs.readFileSync(minifiedPath, "utf8"));
}

function getInlineJS(js_path: string): string {
  if (js_cache[js_path] && !g.__IS_DEV__) return js_cache[js_path];
  js_cache[js_path] = getMinifyJSfromPath(js_path) || " "; // make sure not empty
  return js_cache[js_path];
}

const css_cache: S2S = {};
function getInlineCss(css_path: string): string {
  if (css_cache[css_path] && !g.__IS_DEV__) return css_cache[css_path];
  if (g.__IS_DEV__) {
    safe(() => (css_cache[css_path] = fs.readFileSync(css_path, "utf-8")));
  } else {
    const minifiedPath = css_path.replace(/.css$/, ".min.css");
    safe(() => (css_cache[css_path] = fs.readFileSync(minifiedPath, "utf-8")));
  }
  return css_cache[css_path];
}

const code_cache: S2S = {};
function bootstrapReactCode(rockName: string, appId: string): string {
  const key = `${rockName}/${appId}`;
  if (code_cache[key] && !g.__IS_DEV__) return code_cache[key];

  const code = `
      window.__rockrender = function () {
          var clazz = window._rockClasses['${rockName}'];
          window.ReactDOM.hydrate(React.createElement(clazz, window._STATE), document.getElementById('${appId}'));
      }
      window.__rockrender();
  `;
  code_cache[key] = code;
  if (g.ROCKUTIL) {
    code_cache[key] = g.ROCKUTIL.minifyJS(code);
  }
  return code_cache[key];
}

function getLoadingDiv() {
  return `
<div id='app-loading' style='margin: 0 auto;height: 100vh;display: flex;background: #fff;align-items: center; justify-content: center;'>
  <style>.__app-loading{display:inline-block;position:relative;width:80px;height:80px}.__app-loading div{display:inline-block;position:absolute;left:8px;width:16px;background:#ccc;animation:__app-loading 1.2s cubic-bezier(0,.5,.5,1) infinite}.__app-loading div:nth-child(1){left:8px;animation-delay:-.24s}.__app-loading div:nth-child(2){left:32px;animation-delay:-.12s}.__app-loading div:nth-child(3){left:56px;animation-delay:0;}@keyframes __app-loading{0%{top:8px;height:64px}100%,50%{top:24px;height:32px}}</style>
  <div class="__app-loading"><div></div><div></div><div></div></div>
    </div>`;
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
  script
}: {
  reactClass?: any; // acutally ReactComponent
  ssr?: boolean;
  hydrate?: boolean;
  src?: string;
  common?: string;
  appId?: string;
  metas?: string;
  title: string;
  data?: object;
  body?: string;
  script?: string;
}): string {
  let ssrString =
    reactClass && ssr
      ? renderToString(React.createElement(reactClass, data))
      : "";
  ssrString = ssrString || getLoadingDiv();
  const finalBody =
    body ||
    `
<body>
  <div id="${appId}">${ssrString}</div>
  <script> window._STATE = ${JSON.stringify(data || {})}; </script>
  ${common ? `<script src="${common}"></script>` : ""}
  ${src ? `<script src="${src}"></script>` : ""}
  <script>_alo=document.getElementById("app-loading"),_alo&&_alo.parentNode&&_alo.parentNode.removeChild(_alo);</script>
  ${
    reactClass && hydrate
      ? `<script >${bootstrapReactCode(reactClass.rockName, appId)}</script>`
      : ""
  }
  <script>${script || ""}</script>
</body>
  `.trim();
  const LOCALHOST_BANNER = g.__IS_DEV__
    ? `<div id="__lhb" style="position:fixed;top:12px;background:rgba(0,0,0,0.6);color:white;padding:8px;z-index:999;"> LOCALHOST </div>
    <script>!function(){var e,t,n,o,i=document.getElementById("__lhb");function s(s){i.style.left=e+s.clientX-n+"px",i.style.top=t+s.clientY-o+"px"}i.addEventListener("mousedown",function(i){e=this.offsetLeft,t=this.offsetTop,n=i.clientX,o=i.clientY,window.addEventListener("mousemove",s,!1),window.addEventListener("mouseup",function e(){window.removeEventListener("mousemove",s,!1),window.removeEventListener("mouseup",e,!1)},!1)},!1)}();</script>    `
    : "";

  return `<!DOCTYPE html>
<html>
  <head>
  <title>${title || ""}</title>
  <link rel="shortcut icon" href="/favicon.ico" />
  ${metas || ""}
  <script> window.$res=function(e){return"/_res/"+(0==e.indexOf("/")?e.slice(1):e)}; </script>
  </head>
  ${finalBody}
  ${LOCALHOST_BANNER}
</html>`;
}

const tplCache: S2S = {};
function realTemplatePath(tpl_path: string): string {
  if (tplCache[tpl_path] && !g.__IS_DEV__) {
    return tplCache[tpl_path];
  }
  const { name } = path.parse(tpl_path);
  const attemptList = [
    path.join(opts.from, tpl_path, "index.js"),
    path.join(opts.from, tpl_path, "index.jsx"),
    path.join(opts.from, tpl_path, `${name}.js`),
    path.join(opts.from, tpl_path, `${name}.jsx`),
    path.join(opts.from, tpl_path, `${name}.tsx`)
  ];
  let realpath;
  for (let i = 0; i < attemptList.length; i++) {
    const p = attemptList[i];
    if (!fs.existsSync(p)) continue;
    realpath = p;
    break;
  }
  if (!realpath) {
    console.log("------- error ------");
    console.log(`[response] tried following path for ${tpl_path}:`);
    attemptList.forEach(p => console.log(`* ${p}`));
    console.log("[reponse] but none of them exists.");
    console.log("--------------------");
  }
  tplCache[tpl_path] = realpath;
  return realpath;
}

const jsxCache: S2S = {};
function requireJSX(tpl: string): any {
  if (g.__IS_DEV__) safe(() => delete require.cache[require.resolve(tpl)]);
  if (jsxCache[tpl] && !g.__IS_DEV__) return jsxCache[tpl];
  const clazz = require(tpl);
  jsxCache[tpl] = typeof clazz === "function" ? clazz : clazz.default;
  return jsxCache[tpl];
}

class Response {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  render(data: object, tpl?: string): void {
    const startTime = Date.now();
    const { context } = this;
    const _path = context.path === "/" ? "index" : context.path;
    const tpl_path = tpl || _path;
    const page_meta = getMetaFromTpl(tpl_path) || ({} as Meta);
    const ssr = page_meta.ssr || false;
    const hydrate = !page_meta.skipHydrate;
    const metas =
      emptyStr(page_meta.merge_global_metas ? opts.metas : "") +
      emptyStr(page_meta.metas);
    const serveFilePath =
      (!g.__IS_DEV__ && opts.cdnPrefix) || opts.serveFilePath;
    const realtemplatepath = realTemplatePath(tpl_path);
    const reactClass = requireJSX(realtemplatepath);
    const filename = path.parse(realtemplatepath).name;

    const inlineJS =
      getInlineJS(path.join(opts.from, tpl || _path, "inline.js")) || "";
    const inlineCSS =
      getInlineCss(path.join(opts.from, tpl || _path, "inline.css")) || "";

    context.type = "text/html";
    context.body = template({
      reactClass,
      ssr,
      hydrate,
      src: hashify(rr(`${serveFilePath}/${tpl_path}/${filename}.js`)),
      common: hashify(rr(`${serveFilePath}/_commons.js`)),
      appId: page_meta.appId || "app",
      metas: `${metas} <style>${inlineCSS}</style>`,
      title: page_meta.title,
      data: data || {},
      script: inlineJS
    });
    this.addServerTiming("render", "SSR", Date.now() - startTime);
  }

  hbs(data: any, tpl?: string): void {
    const startTime = Date.now();
    const { context } = this;
    const _path = context.path === "/" ? "index" : context.path;
    const tpl_path = path.join(opts.from, tpl || _path, "index.hbs");
    const page_meta = getMetaFromTpl(path.join(tpl || _path)) || ({} as Meta);
    const metas =
      emptyStr(page_meta.merge_global_metas ? opts.metas : "") +
      emptyStr(page_meta.metas);
    let tplfn = hbscache[tpl_path];
    if (g.__IS_DEV__ || !tplfn) {
      const content = fs.readFileSync(tpl_path, "utf8");
      tplfn = hbs.compile(content);
      hbscache[tpl_path] = tplfn;
    }
    // deal with inline resource (inline.js / inline.css)
    const inlineJS =
      getInlineJS(path.join(opts.from, tpl || _path, "inline.js")) || "";
    const inlineCSS =
      getInlineCss(path.join(opts.from, tpl || _path, "inline.css")) || "";
    context.type = "text/html";
    context.body = template({
      title: page_meta.title,
      metas,
      body: `<body><style>${inlineCSS}</style>${tplfn(
        Object.assign({ $context: context }, data)
      )}<script>${inlineJS}</script></body>`
    });
    this.addServerTiming("render", "hbs", Date.now() - startTime);
  }

  json(data: any): void {
    this.context.body = data;
  }

  ok(data: string | object | number): void {
    const isStr = typeof data === "string";
    const obj = isStr ? { msg: data } : data;
    this.context.body = {
      status: 0,
      data: obj
    };
  }

  fail(obj: string | object | number): void {
    const isStr = typeof obj === "string";
    this.context.body = Object.assign(
      {
        status: 1,
        msg: isStr ? obj : "unknown error"
      },
      (isStr ? null : obj) || {}
    );
  }

  addServerTiming(name: string, desc: string, ms: number): void {
    this.context.serverTimings = this.context.serverTimings || [];
    this.context.serverTimings.push({ name, desc, ms });
  }
}

export default Response;
