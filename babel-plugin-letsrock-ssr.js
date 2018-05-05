var fs = require('fs');
var path = require('path');

function getPKG(root) {
  try {
    return require(path.join(root, 'package.json'));
  } catch (e) {
    return {};
  }
}

function getNodeProjectRoot (cwd) {
  var count = 0;
  var found = false;
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
  } else {
    throw new Error('没有在当前目录及上层目录找到package.json文件');
  }
}

var getRoot = function () {
  var cache = {};
  return function (filepath) {
    try {
      cache[filepath] = getNodeProjectRoot(filepath);
      return cache[filepath];
    } catch (e) {
      return null;
    }
  }
}();

module.exports = function (babel) {
	function parseCodeToAST(code) {
	   return babel.transform(code).ast.program.body;
	}
      return {
        visitor: {
          Program: {
            exit: function (_path) {
			  var node = _path.node;
			  var file = _path.hub.file;
              const body = _path.node.body;

			  var filepath = file.opts.filename;
			  // fast check!! 必须是index.js或index.jsx文件
			  if (!/index\.jsx?$/.test(filepath)) return;

			  var rootpath = getRoot(path.dirname(filepath));
			  if (!rootpath) throw new Error(`文件[${filepath}]往上查找不到package.json，您的项目可能没有根目录.`);
			  var pkg = getPKG(rootpath);
              // 只處理src下的
			  if (filepath.indexOf(path.join(global.APP_BASE, 'src')) !== 0) return;

			  var relname = path.relative(getRoot(filepath), filepath).replace(/\/index\.jsx?$/, '');

			  var count = 0;
              body.push.apply(body, parseCodeToAST(`
                var ReactDOM = require('react-dom');
                var React = require('react');
                if (typeof window !== 'undefined') {
					window.ReactDOM = ReactDOM;
					window.React = React;
				}
				if (typeof module["exports"] === "function") {
				  module["exports"].rockName = "${relname}0";

				  if (typeof window !== "undefined") {
					window._rockClasses = window._rockClasses || {};
					window._rockClasses["${relname}0"] = module["exports"];
				  }
				}

				if (typeof exports["default"] === "function") {
				  exports["default"].rockName = "${relname}1";

				  if (typeof window !== "undefined") {
					window._rockClasses = window._rockClasses || {};
					window._rockClasses["${relname}1"] = exports["default"];
				  }
				}`
            ));
            }
          }
        }
      }
    };
