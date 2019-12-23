/* eslint-disable global-require, no-param-reassign, no-console, func-names */

const fs = require('fs');
const path = require('path');
var helperPluginUtils = require("@babel/helper-plugin-utils");

var core = require("@babel/core");

function getNodeProjectRoot(cwd) {
  let count = 0;
  let found = false;
  // 最多查找18层
  while (count++ < 18 && cwd) {
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      found = true;
      break;
    }
    cwd = path.join(cwd, '..');
  }
  if (found) {
    return cwd;
  }
  throw new Error('没有在当前目录及上层目录找到package.json文件');
}

const getRoot = (function () {
  const cache = {};
  return function (filepath) {
    try {
      cache[filepath] = getNodeProjectRoot(filepath);
      return cache[filepath];
    } catch (e) {
      return null;
    }
  };
}());

module.exports = function (babel) {
  babel.assertVersion(7);
  function parseCodeToAST(code) {
    return babel.transform(code, { ast: true }).ast.program.body;
  }
  return {
    visitor: {
      Program: {
        exit(_path) {
          const { file } = _path.hub;
          const { body } = _path.node;
          const filepath = file.opts.filename;
          // fast check!! 必须是index.js或index.jsx文件
          // 或 check for ${name}/${name}.jsx pattern
          const pconfig = path.parse(filepath);
          const sections = pconfig.dir.split('/');
          const valid = (sections[sections.length - 1] === pconfig.name ||
            pconfig.base === 'index.jsx' || pconfig.base === 'index.js')
          if (!valid) return;

          // 只處理src下的
          if (filepath.indexOf(path.join(global.APP_BASE, 'src')) !== 0) return;

          const relname = path.relative(getRoot(filepath), filepath).replace(/\/index\.jsx?$/, '');

          const t = { babel, core };
          const appended = parseCodeToAST(`
var __$$rd = require('react-dom');
var __$$r = require('react');
var hasWindow = typeof window !== 'undefined';
if (hasWindow) {
 window.ReactDOM = __$$rd;
 window.React = __$$r;
}
if (typeof module["exports"] === "function") {
  module["exports"].rockName = "${relname}0";

  if (hasWindow) {
    window._rockClasses = window._rockClasses || {};
    window._rockClasses["${relname}0"] = module["exports"];
  }
}

if (typeof exports["default"] === "function") {
  exports["default"].rockName = "${relname}1";

  if (hasWindow) {
    window._rockClasses = window._rockClasses || {};
    window._rockClasses["${relname}1"] = exports["default"];
  }
}

if (module.hot && module.id && hasWindow) {
  window.__rockrender && window.__rockrender();
  // most tricky part! no need to do any thing inside the function.
  module.hot.accept(() => 0);
}
`);
          body.push(...appended)
        },
      },
    },
  };
};
